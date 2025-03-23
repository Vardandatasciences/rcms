from flask import Flask, jsonify, request, session  # <-- Add session import
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import traceback,os
from sqlalchemy import func, text
from models import *
from datetime import datetime
import bcrypt
from dateutil.relativedelta import relativedelta
from sqlalchemy import or_
from sqlalchemy.orm import aliased

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all frontend requests
app.secret_key = 'rcms_secret_key'  # Add a secret key for session

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:root@localhost/rcms'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)  # Initialize SQLAlchemy with app



# API Route to Fetch All Entities
@app.route('/entities', methods=['GET'])
def get_entities():
    try:
        # Ensure filtering out entities where obsolete_current = 'O'
        entities = EntityMaster.query.filter((EntityMaster.obsolete_current != "O") | (EntityMaster.obsolete_current.is_(None))).all()
        
        entity_list = [
            {
                "entity_id": entity.entity_id,
                "entity_name": entity.entity_name,
                "location": entity.location,
                "contact_phno": entity.contact_phno,
                "alternate_contact": entity.alternate_contact,
                "description": entity.description,
                "country": entity.country,
                "contact_name": entity.contact_name,
                "alternate_contact_name": entity.alternate_contact_name,
                "state": entity.state,
                "pincode": entity.pincode
            }
            for entity in entities
        ]
        return jsonify({"entities": entity_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/add_entity', methods=['POST'])
def add_entity():
    try:
        data = request.json
        print("Received Data:", data)  # Debugging

        # Remove `obsolete_current` if it's being sent
        data.pop("obsolete_current", None)  # Ensure it's removed
        
        # Extract admin data
        admin_email = data.pop("admin_email", None)
        admin_password = data.pop("admin_password", None)
        
        # Extract selected regulations
        selected_regulations = data.pop("selected_regulations", [])

        # Ensure all required fields exist (except entity_id, which is auto-generated)
        required_fields = [
            "entity_name", "location", "contact_phno", 
            "alternate_contact", "description", "country", 
            "contact_name", "alternate_contact_name", "state", "pincode"
        ]

        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        # Generate Entity ID
        entity_prefix = data["entity_name"][:4].upper()  # First 4 letters in uppercase
        last_entity = EntityMaster.query.filter(EntityMaster.entity_id.like(f"{entity_prefix}%")) \
                                        .order_by(EntityMaster.entity_id.desc()) \
                                        .first()

        if last_entity:
            last_number = int(last_entity.entity_id[4:])  # Extract number part
            new_number = last_number + 1
        else:
            new_number = 1

        new_entity_id = f"{entity_prefix}{str(new_number).zfill(3)}"  # Format as 3-digit number
        data["entity_id"] = new_entity_id  # Assign generated ID

        # Create a new entity object
        new_entity = EntityMaster(**data)

        # Add to the database
        db.session.add(new_entity)
        
        # Create admin user for this entity
        if admin_email and admin_password:
            # Generate user_id from contact_name
            user_id = data["contact_name"].replace(" ", "")[:8]
            
            # Check if user_id already exists
            existing_user = Users.query.filter_by(user_id=user_id).first()
            if existing_user:
                # Append a number to make it unique
                count = 1
                while Users.query.filter_by(user_id=f"{user_id}{count}").first():
                    count += 1
                user_id = f"{user_id}{count}"
            
            # Hash the password with bcrypt
            hashed_password = bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt())
            
            # Create new admin user
            new_admin = Users(
                user_id=user_id,
                entity_id=new_entity_id,
                user_name=data["contact_name"],
                address=data.get("location", ""),
                mobile_no=data["contact_phno"],  # This now includes country code
                email_id=admin_email,
                password=hashed_password.decode('utf-8'),  # Store the hashed password
                role="Admin",
                obsolete_current=None
            )
            
            db.session.add(new_admin)
        
        # Add selected regulations to entity_regulation table
        for regulation_id in selected_regulations:
            # Get regulation details to determine mandatory/optional activities
            regulation = RegulationMaster.query.get(regulation_id)
            if regulation:
                # Count mandatory and optional activities where obsolete_current is NOT 'O' or is NULL
                mandatory_count = ActivityMaster.query.filter(
                    ActivityMaster.regulation_id == regulation_id,
                    ActivityMaster.mandatory_optional == "M",
                    (ActivityMaster.obsolete_current != "O") | (ActivityMaster.obsolete_current.is_(None))
                ).count()
                
                optional_count = ActivityMaster.query.filter(
                    ActivityMaster.regulation_id == regulation_id,
                    ActivityMaster.mandatory_optional == "O",
                    (ActivityMaster.obsolete_current != "O") | (ActivityMaster.obsolete_current.is_(None))
                ).count()

                # Create entity_regulation record with obsolete_current as NULL
                entity_regulation = EntityRegulation(
                    entity_id=new_entity_id,
                    regulation_id=regulation_id,
                    mandatory_activities=mandatory_count,
                    optional_activities=optional_count,
                    obsolete_current=None  # Keeping NULL instead of 'C'
                )
                db.session.add(entity_regulation)

        # Commit the session after adding all records
        db.session.commit()

        return jsonify({"message": "Entity added successfully", "entity_id": new_entity_id}), 201

    except Exception as e:
        db.session.rollback()
        print("Error:", traceback.format_exc())  # Debugging
        return jsonify({"error": str(e)}), 500



@app.route('/update_entity/<entity_id>', methods=['PUT'])
def update_entity(entity_id):
    try:
        data = request.json
        print("Updating Entity Data:", data)

        entity = EntityMaster.query.get(entity_id)
        if not entity:
            return jsonify({"error": "Entity not found"}), 404

        # Update fields
        entity.entity_name = data["entity_name"]
        entity.location = data["location"]
        entity.contact_phno = data["contact_phno"]
        entity.alternate_contact = data["alternate_contact"]
        entity.description = data["description"]
        entity.country = data["country"]
        entity.contact_name = data["contact_name"]
        entity.alternate_contact_name = data["alternate_contact_name"]
        entity.state = data["state"]
        entity.pincode = data["pincode"]

        db.session.commit()
        return jsonify({"message": "Entity updated successfully"}), 200

    except Exception as e:
        print("Error:", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/delete_entity/<entity_id>', methods=['DELETE'])
def delete_entity(entity_id):
    try:
        entity = EntityMaster.query.get(entity_id)
        if not entity:
            return jsonify({"error": "Entity not found"}), 404

        # Set obsolete_current to 'O' instead of deleting
        entity.obsolete_current = "O"
        db.session.commit()

        return jsonify({"message": "Entity marked as obsolete"}), 200

    except Exception as e:
        print("Error:", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/users', methods=['GET'])
def get_users():
    try:
        # Fetch non-obsolete users and join with entity_master to get entity_name
        users = db.session.query(
            Users.user_id,
            Users.entity_id,
            EntityMaster.entity_name,  # Join to get entity_name
            Users.user_name,
            Users.address,
            Users.mobile_no,
            Users.email_id,
            Users.role
        ).join(EntityMaster, Users.entity_id == EntityMaster.entity_id) \
         .filter((Users.obsolete_current != "O") | (Users.obsolete_current.is_(None))) \
         .all()

        users_list = [
            {
                "user_id": user.user_id,
                "entity_id": user.entity_id,
                "entity_name": user.entity_name,  # Include entity_name
                "user_name": user.user_name,
                "address": user.address,
                "mobile_no": user.mobile_no,
                "email_id": user.email_id,
                "role": user.role
            }
            for user in users
        ]
        return jsonify({"users": users_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/add_user', methods=['POST'])
def add_user():
    try:
        data = request.json
        print("Received Data:", data)  # Debugging

        # Ensure all required fields exist, including user_id
        required_fields = ["user_id", "entity_id", "user_name", "mobile_no", "email_id", "password", "role"]
        
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        # Check if user_id already exists
        existing_user = Users.query.get(data["user_id"])
        if existing_user:
            return jsonify({"error": "User ID already exists"}), 409  # Conflict error

        # If password is not already hashed, hash it with bcrypt
        if not data["password"].startswith('$2b$'):
            hashed_password = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt())
            data["password"] = hashed_password.decode('utf-8')

        # Create a new user object
        new_user = Users(**data)

        # Add to the database
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "User added successfully"}), 201

    except Exception as e:
        print("Error:", traceback.format_exc())  # Debugging
        return jsonify({"error": str(e)}), 500

@app.route('/update_user/<user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        user = Users.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.json

        # If password is being updated and not already hashed, hash it with bcrypt
        if "password" in data and data["password"] and not data["password"].startswith('$2b$'):
            hashed_password = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt())
            data["password"] = hashed_password.decode('utf-8')

        # Update only provided fields
        for key, value in data.items():
            setattr(user, key, value)

        db.session.commit()
        return jsonify({"message": "User updated successfully"}), 200

    except Exception as e:
        print("Error:", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/delete_user/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        user = Users.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Instead of deleting, mark as obsolete
        user.obsolete_current = "O"
        db.session.commit()

        return jsonify({"message": "User marked as obsolete"}), 200

    except Exception as e:
        print("Error:", traceback.format_exc())
        return jsonify({"error": str(e)}), 500
    
@app.route('/categories', methods=['GET'])
def get_categories():
    try:
        categories = Category.query.filter(
            (Category.obsolete_current != "O") | (Category.obsolete_current.is_(None))
        ).all()
        
        category_list = [
            {
                "category_id": category.category_id,
                "category_type": category.category_type,
                "remarks": category.Remarks,
            }
            for category in categories
        ]
        return jsonify({"categories": category_list}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/add_category', methods=['POST'])
def add_category():
    try:
        data = request.json
        print("Received Data:", data)  # Debugging

        # Ensure required field exists
        if "category_type" not in data:
            return jsonify({"error": "Missing field: category_type"}), 400

        # Create a new category object (ID is auto-incremented)
        new_category = Category(
            category_type=data["category_type"],
            Remarks=data.get("remarks", None),
            obsolete_current=None,  # New categories are active
        )

        # Add to the database
        db.session.add(new_category)
        db.session.commit()

        return jsonify({"message": "Category added successfully"}), 201

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500
    
@app.route('/delete_category/<int:category_id>', methods=['DELETE', 'OPTIONS'])
def delete_category(category_id):
    if request.method == "OPTIONS":
        return jsonify({"message": "Preflight request successful"}), 200

    try:
        category = Category.query.get(category_id)
        if not category:
            return jsonify({"error": "Category not found"}), 404

        # Instead of deleting, mark as obsolete
        category.obsolete_current = "O"
        db.session.commit()

        return jsonify({"message": "Category deleted successfully"}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/regulations', methods=['GET'])
def get_regulations():
    try:
        regulations = RegulationMaster.query.filter(RegulationMaster.obsolete_current != 'O').all()

        regulations_list = [
            {
                "regulation_id": regulation.regulation_id,
                "regulation_name": regulation.regulation_name,
                "category_id": regulation.category_id,
                "regulatory_body": regulation.regulatory_body,
                "internal_external": regulation.internal_external,
                "national_international": regulation.national_international,
                "mandatory_optional": regulation.mandatory_optional,
                "effective_from": regulation.effective_from.strftime('%Y-%m-%d') if regulation.effective_from else None
            }
            for regulation in regulations
        ]

        return jsonify({"regulations": regulations_list}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500
    
@app.route('/add_regulation', methods=['POST'])
def add_regulation():
    try:
        data = request.json
        print("Received Data:", data)  # Debugging

        # Ensure required fields exist
        required_fields = ["regulation_name", "category_id"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        # Extract first 4 letters of regulation name
        regulation_prefix = data["regulation_name"][:4].upper()

        # Find the highest existing regulation ID with the same prefix
        last_regulation = RegulationMaster.query.filter(
            RegulationMaster.regulation_id.like(f"{regulation_prefix}%")
        ).order_by(RegulationMaster.regulation_id.desc()).first()

        if last_regulation:
            last_number = int(last_regulation.regulation_id[4:])  # Extract number part
            new_number = last_number + 1
        else:
            new_number = 1

        # Generate new regulation_id
        regulation_id = f"{regulation_prefix}{new_number:03d}"  # Ensure 3-digit format

        # Create a new regulation object
        new_regulation = RegulationMaster(
            regulation_id=regulation_id,
            regulation_name=data["regulation_name"],
            category_id=data["category_id"],
            regulatory_body=data.get("regulatory_body", None),
            internal_external=data.get("internal_external", "I"),
            national_international=data.get("national_international", "N"),
            mandatory_optional=data.get("mandatory_optional", "M"),
            effective_from=data.get("effective_from", None),
            obsolete_current="C",
        )

        # Add to the database
        db.session.add(new_regulation)
        db.session.commit()

        return jsonify({"message": "Regulation added successfully", "regulation_id": regulation_id}), 201

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/edit_regulation/<string:regulation_id>', methods=['PUT'])
def edit_regulation(regulation_id):
    try:
        data = request.json
        regulation = RegulationMaster.query.get(regulation_id)
        if not regulation:
            return jsonify({"error": "Regulation not found"}), 404

        # Update fields (excluding regulation_id & effective_from)
        regulation.regulation_name = data["regulation_name"]
        regulation.category_id = data["category_id"]
        regulation.regulatory_body = data["regulatory_body"]
        regulation.internal_external = data["internal_external"]
        regulation.national_international = data["national_international"]
        regulation.mandatory_optional = data["mandatory_optional"]

        db.session.commit()
        return jsonify({"message": "Regulation updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/delete_regulation/<string:regulation_id>', methods=['DELETE'])
def delete_regulation(regulation_id):
    try:
        regulation = RegulationMaster.query.get(regulation_id)
        if not regulation:
            return jsonify({"error": "Regulation not found"}), 404

        # Instead of deleting, mark as obsolete
        regulation.obsolete_current = "O"
        db.session.commit()

        return jsonify({"message": "Regulation deleted successfully"}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500
    

@app.route("/activities", methods=["GET"])
def get_activities():
    # Query to filter activities where obsolete_current is NOT "O" or is NULL
    activities = ActivityMaster.query.filter(
        (ActivityMaster.obsolete_current != "O") | (ActivityMaster.obsolete_current.is_(None))
    ).all()

    # Convert query result to JSON
    activities_list = [
        {
            "regulation_id": activity.regulation_id,
            "activity_id": activity.activity_id,
            "activity_description": activity.activity_description,
            "criticality": activity.criticality,
            "documentupload_yes_no": activity.documentupload_yes_no,
            "frequency": activity.frequency,
            "frequency_timeline": activity.frequency_timeline.strftime('%Y-%m-%d') if activity.frequency_timeline else None,
            "activity": activity.activity,
            "mandatory_optional": activity.mandatory_optional,
            "ews": activity.ews,
            "approver_required": activity.approver_required,
            "reviewer_required": activity.reviewer_required,
            "obsolete_current": activity.obsolete_current
        }
        for activity in activities
    ]
    
    return jsonify({"activities": activities_list})

@app.route("/add_activity", methods=["POST"])
def add_activity():
    try:
        data = request.json
        regulation_id = data.get("regulation_id", "").strip()

        if not regulation_id:
            return jsonify({"error": "Missing regulation_id"}), 400

        #  Find the last used activity_id for the given regulation_id
        last_activity_id = (
            db.session.query(func.max(ActivityMaster.activity_id))
            .filter(ActivityMaster.regulation_id == regulation_id)
            .scalar()
        )

        #  If no previous activity exists, start from 1, else increment last ID
        new_activity_id = 1 if last_activity_id is None else last_activity_id + 1

        new_activity = ActivityMaster(
            regulation_id=regulation_id,
            activity_id=new_activity_id,  #  Unique activity_id
            activity=data.get("activity", "Unnamed Activity").strip(),
            mandatory_optional=data.get("mandatory_optional", "M"),
            documentupload_yes_no=data.get("documentupload_yes_no", "N"),
            frequency=data.get("frequency", 12),
            frequency_timeline=data.get("frequency_timeline", None),
            criticality=data.get("criticality", "Medium"),
            ews=data.get("ews", 1),
            activity_description=data.get("activity_description", "No Description").strip(),
            obsolete_current="C",
        )

        db.session.add(new_activity)
        db.session.commit()

        return jsonify({"message": "Activity added successfully"}), 201

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500
    
@app.route("/update_activity/<string:regulation_id>/<int:activity_id>", methods=["POST", "OPTIONS"])
def update_activity(regulation_id, activity_id):
    if request.method == "OPTIONS":  # Handle preflight requests
        return jsonify({"message": "OK"}), 200

    try:
        if request.content_type != "application/json":
            return jsonify({"error": "Content-Type must be application/json"}), 415

        data = request.get_json()

        activity = ActivityMaster.query.filter_by(regulation_id=regulation_id, activity_id=activity_id).first()

        if not activity:
            return jsonify({"error": "Activity not found"}), 404

        # Update all fields except `regulation_id` and `activity_id`
        for key, value in data.items():
            if key not in ["regulation_id", "activity_id"]:  # Prevent updating these fields
                setattr(activity, key, value if value is not None else getattr(activity, key))

        db.session.commit()

        return jsonify({"message": "Activity updated successfully"}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/delete_activity/<string:regulation_id>/<int:activity_id>", methods=["DELETE"])
def delete_activity(regulation_id, activity_id):
    try:
        activity = ActivityMaster.query.filter_by(regulation_id=regulation_id, activity_id=activity_id).first()

        if not activity:
            return jsonify({"error": "Activity not found"}), 404

        #  Instead of deleting, mark activity as obsolete
        activity.obsolete_current = "O"
        db.session.commit()

        return jsonify({"message": "Activity marked as obsolete successfully"}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500


@app.route("/holidays", methods=["GET"])
def get_holidays():
    try:
        holidays = HolidayMaster.query.filter(
            (HolidayMaster.obsolete_current != 'O') | (HolidayMaster.obsolete_current.is_(None))
        ).all()

        holidays_list = [
            {
                "holiday_date": holiday.holiday_date.strftime('%Y-%m-%d'),
                "description": holiday.description,
                "entity_id": holiday.entity_id,
            }
            for holiday in holidays
        ]

        return jsonify({"holidays": holidays_list}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route("/add_holiday", methods=["POST"])
def add_holiday():
    try:
        data = request.get_json()

        # Ensure all required fields are present
        if not data.get("holiday_date") or not data.get("description") or not data.get("entity_id"):
            return jsonify({"error": "Missing required fields"}), 400

        new_holiday = HolidayMaster(
            holiday_date=data["holiday_date"],
            description=data["description"],
            entity_id=data["entity_id"],
            obsolete_current="C",  # Mark as current by default
        )

        db.session.add(new_holiday)
        db.session.commit()

        return jsonify({"message": "Holiday added successfully"}), 201

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500
    

@app.route("/delete_holiday/<string:holiday_date>/<string:entity_id>", methods=["DELETE"])
def delete_holiday(holiday_date, entity_id):
    try:
        holiday = HolidayMaster.query.filter_by(holiday_date=holiday_date, entity_id=entity_id).first()

        if not holiday:
            return jsonify({"error": "Holiday not found"}), 404

        # Instead of deleting, mark as obsolete
        holiday.obsolete_current = "O"
        db.session.commit()

        return jsonify({"message": "Holiday deleted successfully"}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    try:
        data = request.json
        # Change User to Users to match your model name
        user = Users.query.filter_by(user_id=data['user_id']).first()
        
        if user:
            # Add proper password checking
            stored_password = user.password
            provided_password = data['password']
            
            # Check if the password is already hashed
            if stored_password.startswith('$2b$'):
                # Use bcrypt to check hashed password
                is_valid = bcrypt.checkpw(provided_password.encode('utf-8'), stored_password.encode('utf-8'))
            else:
                # For plain text passwords (legacy support)
                is_valid = (provided_password == stored_password)
            
            if is_valid:
                # Get entity name if entity exists
                entity_name = None
                if user.entity_id:
                    entity = EntityMaster.query.get(user.entity_id)
                    if entity:
                        entity_name = entity.entity_name

                response_data = {
                    "user_id": user.user_id,
                    "name": user.user_name,  # Changed from name to user_name to match Users model
                    "role": user.role,
                    "entity_id": user.entity_id,
                    "entity_name": entity_name
                }
                return jsonify(response_data), 200
            
        return jsonify({"error": "Invalid credentials"}), 401
        
    except Exception as e:
        print(f"Login error: {str(e)}")  # Add error logging
        return jsonify({"error": "Login failed. Please try again."}), 500

# Add helper function for password checking
def check_password(provided_password, stored_password):
    if stored_password.startswith('$2b$'):
        return bcrypt.checkpw(provided_password.encode('utf-8'), stored_password.encode('utf-8'))
    return provided_password == stored_password

@app.route('/entity_regulation_tasks/<string:entity_id>', methods=['GET'])
def get_entity_regulation_tasks(entity_id):
    try:
        # Use SQLAlchemy to query tasks for the specified entity
        tasks_query = db.session.query(
            EntityRegulationTasks,
            RegulationMaster.regulation_name,
            ActivityMaster.activity.label('activity_name')
        ).join(
            RegulationMaster,
            EntityRegulationTasks.regulation_id == RegulationMaster.regulation_id
        ).join(
            ActivityMaster,
            (EntityRegulationTasks.regulation_id == ActivityMaster.regulation_id) &
            (EntityRegulationTasks.activity_id == ActivityMaster.activity_id)
        ).filter(
            EntityRegulationTasks.entity_id == entity_id
        )
        
        tasks = tasks_query.all()
        
        # Convert to JSON response
        tasks_list = [
            {
                "id": task.EntityRegulationTasks.id,
                "entity_id": task.EntityRegulationTasks.entity_id,
                "regulation_id": task.EntityRegulationTasks.regulation_id,
                "regulation_name": task.regulation_name,
                "activity_id": task.EntityRegulationTasks.activity_id,
                "activity_name": task.activity_name,
                "activity": task.activity_name,  # For backward compatibility
                "preparation_responsibility": task.EntityRegulationTasks.preparation_responsibility,
                "review_responsibility": task.EntityRegulationTasks.review_responsibility,
                "due_on": task.EntityRegulationTasks.due_on.strftime('%Y-%m-%d') if task.EntityRegulationTasks.due_on else None,
                "start_date": task.EntityRegulationTasks.start_date.strftime('%Y-%m-%d') if task.EntityRegulationTasks.start_date else None,
                "end_date": task.EntityRegulationTasks.end_date.strftime('%Y-%m-%d') if task.EntityRegulationTasks.end_date else None,
                "status": task.EntityRegulationTasks.status,
                "ews": task.EntityRegulationTasks.ews,
                "remarks": task.EntityRegulationTasks.remarks,
                "upload": task.EntityRegulationTasks.upload,
                "review_remarks": task.EntityRegulationTasks.review_remarks,
                "review_start_date": task.EntityRegulationTasks.review_start_date.strftime('%Y-%m-%d') if task.EntityRegulationTasks.review_start_date else None,
                "review_end_date": task.EntityRegulationTasks.review_end_date.strftime('%Y-%m-%d') if task.EntityRegulationTasks.review_end_date else None,
                "review_upload": task.EntityRegulationTasks.review_upload,
                "mandatory_optional": task.EntityRegulationTasks.mandatory_optional,
                "criticality": task.EntityRegulationTasks.criticality,
                "internal_external": task.EntityRegulationTasks.internal_external,
                "documentupload_yes_no": task.EntityRegulationTasks.documentupload_yes_no
            }
            for task in tasks
        ]
        
        return jsonify({"tasks": tasks_list}), 200
    
    except Exception as e:
        print("Error:", str(e))
        print(traceback.format_exc())  # Print full traceback for debugging
        return jsonify({"error": str(e)}), 500

# Helper function to get activity name
def get_activity_name(regulation_id, activity_id):
    try:
        activity = ActivityMaster.query.filter_by(
            regulation_id=regulation_id, 
            activity_id=activity_id
        ).first()
        
        if activity:
            return activity.activity
        return f"Activity {activity_id}"
    except:
        return f"Activity {activity_id}"

@app.route('/entity_users/<string:entity_id>', methods=['GET'])
def get_entity_users(entity_id):
    try:
        # Use SQLAlchemy to query users for the specified entity
        users = Users.query.filter(
            Users.entity_id == entity_id,
            or_(Users.obsolete_current != "O", Users.obsolete_current.is_(None))
        ).all()
        
        # Convert to JSON response
        users_list = [
            {
                "user_id": user.user_id,
                "user_name": user.user_name,
                "email_id": user.email_id,
                "role": user.role
            }
            for user in users
        ]
        
        return jsonify({"users": users_list}), 200
    
    except Exception as e:
        print("Error:", str(e))
        print(traceback.format_exc())  # Print full traceback for debugging
        return jsonify({"error": str(e)}), 500

@app.route('/activity_details/<string:regulation_id>/<string:activity_id>', methods=['GET'])
def get_activity_details(regulation_id, activity_id):
    try:
        # Query activity details
        activity = ActivityMaster.query.filter_by(
            regulation_id=regulation_id, 
            activity_id=activity_id
        ).first()
        
        if not activity:
            return jsonify({"error": "Activity not found"}), 404
        
        # Convert to JSON response
        activity_data = {
            "regulation_id": activity.regulation_id,
            "activity_id": activity.activity_id,
            "activity": activity.activity,
            "mandatory_optional": activity.mandatory_optional,
            "documentupload_yes_no": activity.documentupload_yes_no,
            "frequency": activity.frequency,
            "frequency_timeline": activity.frequency_timeline.strftime('%Y-%m-%d') if activity.frequency_timeline else None,
            "criticality": activity.criticality,
            "ews": activity.ews,
            "activity_description": activity.activity_description
        }
        
        return jsonify({"activity": activity_data}), 200
    
    except Exception as e:
        print("Error:", str(e))
        print(traceback.format_exc())  # Print full traceback for debugging
        return jsonify({"error": str(e)}), 500

# @app.route('/regulation_details/<string:regulation_id>', methods=['GET'])
# def get_regulation_details(regulation_id):
#     try:
#         # Query regulation details
#         regulation = RegulationMaster.query.filter_by(regulation_id=regulation_id).first()
        
#         if not regulation:
#             return jsonify({"error": "Regulation not found"}), 404
        
#         # Convert to JSON response
#         regulation_data = {
#             "regulation_id": regulation.regulation_id,
#             "regulation_name": regulation.regulation_name,
#             "category_id": regulation.category_id,
#             "regulatory_body": regulation.regulatory_body,
#             "internal_external": regulation.internal_external,
#             "national_international": regulation.national_international,
#             "mandatory_optional": regulation.mandatory_optional,
#             "effective_from": regulation.effective_from.strftime('%Y-%m-%d') if regulation.effective_from else None
#         }
        
#         return jsonify({"regulation": regulation_data}), 200
    
#     except Exception as e:
#         print("Error:", str(e))
#         print(traceback.format_exc())  # Print full traceback for debugging
#         return jsonify({"error": str(e)}), 500

@app.route('/calculate_due_date/<string:regulation_id>/<string:activity_id>', methods=['GET'])
def calculate_due_date(regulation_id, activity_id):
    try:
        # Query to get the frequency and timeline information
        activity = ActivityMaster.query.filter_by(
            regulation_id=regulation_id, 
            activity_id=activity_id
        ).first()
        
        if not activity:
            return jsonify({"error": "Activity not found"}), 404
        
        frequency_timeline = activity.frequency_timeline
        frequency = activity.frequency
        
        # If the frequency_timeline is in the future, set the due_on date as the frequency_timeline itself
        current_date = datetime.now().date()
        if frequency_timeline >= current_date:
            due_on = frequency_timeline
            print(f"Future frequency timeline, first due date: {due_on}")
        else:
            # If frequency_timeline is in the past, calculate the next due date based on the frequency
            due_on = frequency_timeline
            while due_on < current_date:
                # Increment due_on based on the frequency
                if frequency == 52:  # Weekly
                    due_on += relativedelta(weeks=1)
                elif frequency == 26:  # fortnightly
                    due_on += relativedelta(weeks=2)
                elif frequency == 12:  # Monthly
                    due_on += relativedelta(months=1)
                elif frequency == 3:  # Every 4 months
                    due_on += relativedelta(months=4)
                elif frequency == 4:  # Quarterly
                    due_on += relativedelta(months=3)
                elif frequency == 2:  # Half-yearly
                    due_on += relativedelta(months=6)
                elif frequency == 6:  # Every 2 months
                    due_on += relativedelta(months=2)
                elif frequency == 1:  # Annually
                    due_on += relativedelta(years=1)
                elif frequency == 0:  # One-time
                    break
                else:
                    # Default fallback if no valid frequency is set
                    break
        
        # Adjust the due_on date if it falls on a weekend or holiday
        while True:
            # Check if due_on falls on a weekend (Saturday or Sunday)
            if due_on.weekday() == 5:  # Saturday
                due_on -= relativedelta(days=1)  # Move to Friday
            elif due_on.weekday() == 6:  # Sunday
                due_on -= relativedelta(days=2)  # Move to Friday
            else:
                # Check if due_on is a holiday
                holiday = HolidayMaster.query.filter_by(holiday_date=due_on).first()
                if holiday:
                    due_on -= relativedelta(days=1)  # Move to the previous day if it's a holiday
                else:
                    break  # If it's not a holiday or weekend, exit the loop
        
        return jsonify({"due_on": due_on.strftime('%Y-%m-%d')}), 200
    
    except Exception as e:
        print("Error:", str(e))
        print(traceback.format_exc())  # Print full traceback for debugging
        return jsonify({"error": str(e)}), 500

@app.route('/check_task_exists/<string:entity_id>/<string:regulation_id>/<string:activity_id>', methods=['GET'])
def check_task_exists(entity_id, regulation_id, activity_id):
    try:
        # Check if the task already exists for the given entity_id, regulation_id, and activity_id
        task_count = EntityRegulationTasks.query.filter_by(
            entity_id=entity_id,
            regulation_id=regulation_id,
            activity_id=activity_id
        ).count()
        
        return jsonify({"exists": task_count > 0}), 200
    
    except Exception as e:
        print("Error:", str(e))
        print(traceback.format_exc())  # Print full traceback for debugging
        return jsonify({"error": str(e)}), 500

@app.route('/assign_task', methods=['POST'])
def assign_task():
    try:
        data = request.json
        
        # Extract data from request
        entity_id = data.get('entity_id')
        regulation_id = data.get('regulation_id')
        activity_id = data.get('activity_id')
        preparation_responsibility = data.get('preparation_responsibility')
        review_responsibility = data.get('review_responsibility')
        due_on_str = data.get('due_on')
        
        # Validate required fields
        if not all([entity_id, regulation_id, activity_id, preparation_responsibility, review_responsibility, due_on_str]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Convert due_on string to date
        due_on = datetime.strptime(due_on_str, '%Y-%m-%d').date()
        
        # Fetch activity details
        activity = ActivityMaster.query.filter_by(
            regulation_id=regulation_id, 
            activity_id=activity_id
        ).first()
        
        if not activity:
            return jsonify({"error": "Activity not found"}), 404
        
        # Fetch regulation details
        regulation = RegulationMaster.query.filter_by(regulation_id=regulation_id).first()
        
        if not regulation:
            return jsonify({"error": "Regulation not found"}), 404
        
        # Extract necessary fields from activity and regulation
        frequency = activity.frequency
        frequency_timeline = activity.frequency_timeline
        ews = activity.ews
        criticality = activity.criticality
        mandatory_optional = activity.mandatory_optional
        documentupload_yes_no = activity.documentupload_yes_no
        internal_external = regulation.internal_external
        
        # Calculate all due dates up to the end of next year
        current_date = datetime.now().date()
        end_of_next_year = datetime(datetime.now().year + 1, 12, 31).date()
        
        # List to hold valid due dates
        due_dates = []
        current_due_on = due_on
        
        # Case 1: If the frequency is 0 (one-time task)
        if frequency == 0:
            # If frequency is 0, we only need the due date to be the first calculated due date
            due_dates.append(current_due_on)
            print(f"Frequency is 0, one-time task. Due date is {current_due_on}")
        
        # Case 2: If the first due date is in the future and frequency > 0
        elif current_due_on >= current_date and frequency > 0:
            due_dates.append(current_due_on)
            print(f"First due date based on future frequency timeline: {current_due_on}")
            
            # Generate subsequent due dates
            iteration_count = 0
            temp_due_on = current_due_on
            while temp_due_on <= end_of_next_year:
                if frequency == 52:  # Weekly
                    temp_due_on += relativedelta(weeks=1)
                elif frequency == 26:  # fortnightly
                    temp_due_on += relativedelta(weeks=2)
                elif frequency == 12:  # Monthly
                    temp_due_on += relativedelta(months=1)
                elif frequency == 3:  # Every 4 months
                    temp_due_on += relativedelta(months=4)
                elif frequency == 4:  # Quarterly
                    temp_due_on += relativedelta(months=3)
                elif frequency == 2:  # Half-yearly
                    temp_due_on += relativedelta(months=6)
                elif frequency == 6:  # Every 2 months
                    temp_due_on += relativedelta(months=2)
                elif frequency == 1:  # Annually
                    temp_due_on += relativedelta(years=1)
                else:
                    break
                
                if temp_due_on <= end_of_next_year:
                    # Adjust for weekends and holidays
                    adjusted_due_on = adjust_due_date_for_holidays(temp_due_on)
                    due_dates.append(adjusted_due_on)
                    print(f"Generated subsequent due date: {adjusted_due_on}")
                
                iteration_count += 1
                if iteration_count > 100:  # Safety limit
                    break
        
        # Insert tasks for each due date
        for task_due_on in due_dates:
            new_task = EntityRegulationTasks(
                entity_id=entity_id,
                regulation_id=regulation_id,
                activity_id=activity_id,
                due_on=task_due_on,
                preparation_responsibility=preparation_responsibility,
                review_responsibility=review_responsibility,
                status="Yet to Start",
                ews=ews,
                criticality=criticality,
                internal_external=internal_external,
                mandatory_optional=mandatory_optional,
                documentupload_yes_no=documentupload_yes_no
            )
            db.session.add(new_task)
        
        db.session.commit()
        
        return jsonify({"message": "Task assigned successfully", "due_dates": [d.strftime('%Y-%m-%d') for d in due_dates]}), 201
    
    except Exception as e:
        db.session.rollback()
        print("Error:", str(e))
        print(traceback.format_exc())  # Print full traceback for debugging
        return jsonify({"error": str(e)}), 500

# Helper function to adjust due date for holidays and weekends
def adjust_due_date_for_holidays(due_date):
    while True:
        # Check if due_date falls on a weekend (Saturday or Sunday)
        if due_date.weekday() == 5:  # Saturday
            due_date -= relativedelta(days=1)  # Move to Friday
        elif due_date.weekday() == 6:  # Sunday
            due_date -= relativedelta(days=2)  # Move to Friday
        else:
            # Check if due_date is a holiday
            holiday = HolidayMaster.query.filter_by(holiday_date=due_date).first()
            if holiday:
                due_date -= relativedelta(days=1)  # Move to the previous day if it's a holiday
            else:
                break  # If it's not a holiday or weekend, exit the loop
    
    return due_date

@app.route('/reassign_task', methods=['POST'])
def reassign_task():
    try:
        data = request.json
        
        # Extract data from request
        task_id = data.get('task_id')
        entity_id = data.get('entity_id')
        regulation_id = data.get('regulation_id')
        activity_id = data.get('activity_id')
        preparation_responsibility = data.get('preparation_responsibility')
        review_responsibility = data.get('review_responsibility')
        
        # Validate required fields
        if not all([task_id, entity_id, regulation_id, activity_id, preparation_responsibility, review_responsibility]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Get user ID from session or use a default value
        user_id = session.get('user_id', 'SYSTEM')
        
        # Find the task using SQLAlchemy ORM
        task = EntityRegulationTasks.query.filter_by(
            id=task_id, 
            entity_id=entity_id,
            regulation_id=regulation_id,
            activity_id=activity_id
        ).first()
        
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        # Check if the task status is "Completed" - prevent reassignment
        if task.status == "Completed":
            return jsonify({'error': 'Completed tasks cannot be reassigned'}), 403
        
        # Update the task
        task.preparation_responsibility = preparation_responsibility
        task.review_responsibility = review_responsibility
        task.last_updated_by = user_id
        task.last_updated_on = datetime.now()
        
        db.session.commit()
        
        # Get user details for email notification (optional)
        prep_user = Users.query.filter_by(user_id=preparation_responsibility).first()
        review_user = Users.query.filter_by(user_id=review_responsibility).first()
        
        # Get task details for email (optional)
        task_details = db.session.query(
            RegulationMaster.regulation_name,
            ActivityMaster.activity,
            EntityRegulationTasks.due_on
        ).join(
            RegulationMaster, 
            EntityRegulationTasks.regulation_id == RegulationMaster.regulation_id
        ).join(
            ActivityMaster, 
            (EntityRegulationTasks.regulation_id == ActivityMaster.regulation_id) & 
            (EntityRegulationTasks.activity_id == ActivityMaster.activity_id)
        ).filter(
            EntityRegulationTasks.id == task_id
        ).first()
        
        # Send email notifications (implement your email sending logic here)
        # This is a placeholder for email notification logic
        
        return jsonify({'message': 'Task reassigned successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in reassign_task: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': 'An error occurred while reassigning the task'}), 500

@app.route('/task/<int:task_id>', methods=['GET'])
def get_task_details(task_id):
    try:
        # Use SQLAlchemy ORM to fetch task details
        task_query = db.session.query(
            EntityRegulationTasks,
            RegulationMaster.regulation_name,
            ActivityMaster.activity.label('activity_name'),
            Users.user_name.label('preparation_responsibility_name'),
            db.aliased(Users, name='reviewer').user_name.label('review_responsibility_name')
        ).join(
            RegulationMaster, 
            EntityRegulationTasks.regulation_id == RegulationMaster.regulation_id
        ).join(
            ActivityMaster, 
            (EntityRegulationTasks.regulation_id == ActivityMaster.regulation_id) & 
            (EntityRegulationTasks.activity_id == ActivityMaster.activity_id)
        ).outerjoin(
            Users, 
            EntityRegulationTasks.preparation_responsibility == Users.user_id
        ).outerjoin(
            db.aliased(Users, name='reviewer'), 
            EntityRegulationTasks.review_responsibility == db.aliased(Users, name='reviewer').user_id
        ).filter(
            EntityRegulationTasks.id == task_id
        )
        
        task = task_query.first()
        
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        # Convert task to dictionary
        task_dict = {
            'id': task.EntityRegulationTasks.id,
            'entity_id': task.EntityRegulationTasks.entity_id,
            'regulation_id': task.EntityRegulationTasks.regulation_id,
            'regulation_name': task.regulation_name,
            'activity_id': task.EntityRegulationTasks.activity_id,
            'activity_name': task.activity_name,
            'preparation_responsibility': task.EntityRegulationTasks.preparation_responsibility,
            'preparation_responsibility_name': task.preparation_responsibility_name,
            'review_responsibility': task.EntityRegulationTasks.review_responsibility,
            'review_responsibility_name': task.review_responsibility_name,
            'due_on': task.EntityRegulationTasks.due_on.strftime('%Y-%m-%d') if task.EntityRegulationTasks.due_on else None,
            'status': task.EntityRegulationTasks.status,
            'criticality': task.EntityRegulationTasks.criticality
        }
        
        return jsonify({'task': task_dict}), 200
        
    except Exception as e:
        print(f"Error in get_task_details: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': 'An error occurred while fetching task details'}), 500

@app.route('/country_codes', methods=['GET'])
def get_country_codes():
    try:
        # Fetch all country codes
        countries = CountryCodes.query.all()
        
        # Convert to JSON response
        countries_list = [
            {
                "country": country.country,
                "country_code": country.country_code
            }
            for country in countries
        ]
        
        # Sort by country name, but put India first
        countries_list.sort(key=lambda x: (0 if x["country"].lower() == "india" else 1, x["country"]))
        
        return jsonify({"countries": countries_list}), 200
    
    except Exception as e:
        print("Error:", str(e))
        print(traceback.format_exc())  # Print full traceback for debugging
        return jsonify({"error": str(e)}), 500

@app.route('/entity_regulations/<string:entity_id>', methods=['GET'])
def get_entity_regulations(entity_id):
    try:
        if not entity_id:
            return jsonify({"error": "Entity ID is required"}), 400
            
        # Query regulations assigned to the entity
        EntityRegulationAlias = aliased(EntityRegulation)
        RegulationMasterAlias = aliased(RegulationMaster)
        CategoryAlias = aliased(Category)

        entity_regulations = db.session.query(
                RegulationMasterAlias.regulation_id,
                RegulationMasterAlias.regulation_name,
                RegulationMasterAlias.regulatory_body,
                CategoryAlias.category_type,
                RegulationMasterAlias.internal_external,  # Fetch internal/external
                RegulationMasterAlias.national_international,  # Fetch national/international
                RegulationMasterAlias.mandatory_optional  # Fetch mandatory/optional
            )\
            .join(EntityRegulationAlias, RegulationMasterAlias.regulation_id == EntityRegulationAlias.regulation_id)\
            .join(CategoryAlias, RegulationMasterAlias.category_id == CategoryAlias.category_id)\
            .filter(
                EntityRegulationAlias.entity_id == entity_id,
                (EntityRegulationAlias.obsolete_current != 'O') | (EntityRegulationAlias.obsolete_current.is_(None))
            )\
            .all()

        print(entity_regulations)
        
        # Mapping the abbreviations to full text
        def map_values(value, mapping):
            return mapping.get(value, "Unknown")  # Default to "Unknown" if value not found
        
        internal_external_map = {"I": "Internal", "E": "External"}
        national_international_map = {"N": "National", "I": "International"}
        mandatory_optional_map = {"M": "Mandatory", "O": "Optional"}

        regulations_list = [{
            "regulation_id": reg_id,
            "regulation_name": reg_name,
            "regulatory_body": regulatory_body,
            "category_type": category_type,
            "internal_external": map_values(internal_external, internal_external_map),  # Convert abbreviation
            "national_international": map_values(national_international, national_international_map),  # Convert abbreviation
            "mandatory_optional": map_values(mandatory_optional, mandatory_optional_map)  # Convert abbreviation
        } for reg_id, reg_name, regulatory_body, category_type, internal_external, national_international, mandatory_optional in entity_regulations]

        print(regulations_list)
        
        return jsonify({"entity_regulations": regulations_list}), 200
        
    except Exception as e:
        print(f"Error fetching entity regulations: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/add_entity_regulations', methods=['POST', 'OPTIONS'])
def add_entity_regulations():
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
        
    try:
        data = request.json
        entity_id = data.get('entity_id')
        regulation_ids = data.get('regulation_ids', [])
        
        if not entity_id:
            return jsonify({"error": "Entity ID is required"}), 400
        
        if not regulation_ids:
            return jsonify({"error": "At least one regulation ID is required"}), 400
        
        # First, get all existing entity regulations
        existing_regulations = EntityRegulation.query.filter_by(entity_id=entity_id).all()
        existing_regulation_ids = [reg.regulation_id for reg in existing_regulations]
        
        # Identify regulations to add and remove
        regulations_to_add = [reg_id for reg_id in regulation_ids if reg_id not in existing_regulation_ids]
        regulations_to_remove = [reg_id for reg_id in existing_regulation_ids if reg_id not in regulation_ids]
        
        # Add new regulations
        for regulation_id in regulations_to_add:
            # Count mandatory and optional activities
            mandatory_count = ActivityMaster.query.filter(
                ActivityMaster.regulation_id == regulation_id,
                ActivityMaster.mandatory_optional == "M",
                (ActivityMaster.obsolete_current != "O") | (ActivityMaster.obsolete_current.is_(None))
            ).count()
            
            optional_count = ActivityMaster.query.filter(
                ActivityMaster.regulation_id == regulation_id,
                ActivityMaster.mandatory_optional == "O",
                (ActivityMaster.obsolete_current != "O") | (ActivityMaster.obsolete_current.is_(None))
            ).count()
            
            # Create new entity regulation
            new_entity_regulation = EntityRegulation(
                entity_id=entity_id,
                regulation_id=regulation_id,
                mandatory_activities=mandatory_count,
                optional_activities=optional_count,
                obsolete_current=None
            )
            db.session.add(new_entity_regulation)
        
        # Mark removed regulations as obsolete
        for regulation_id in regulations_to_remove:
            entity_regulation = EntityRegulation.query.filter_by(
                entity_id=entity_id,
                regulation_id=regulation_id
            ).first()
            
            if entity_regulation:
                entity_regulation.obsolete_current = 'O'
        
        db.session.commit()
        
        return jsonify({
            "message": "Entity regulations updated successfully",
            "added": len(regulations_to_add),
            "removed": len(regulations_to_remove)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print("Error:", str(e))
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/activities/entity/<string:entity_id>', methods=['GET'])
def get_entity_activities(entity_id):
    try:
        print(f"Fetching activities for entity: {entity_id}")  # Debug log
        
        # Query activities associated with the entity's regulations
        activities = db.session.query(ActivityMaster).join(
            EntityRegulation,
            ActivityMaster.regulation_id == EntityRegulation.regulation_id
        ).filter(
            EntityRegulation.entity_id == entity_id
        ).all()

        activities_list = [{
            "regulation_id": activity.regulation_id,
            "activity_id": activity.activity_id,
            "activity": activity.activity,
            "activity_description": activity.activity_description,
            "criticality": activity.criticality,
            "mandatory_optional": activity.mandatory_optional,
            "frequency": activity.frequency
        } for activity in activities]
        
        print(f"Found {len(activities_list)} activities")  # Debug log
        
        return jsonify({"activities": activities_list}), 200

    except Exception as e:
        print(f"Error fetching activities: {str(e)}")  # Debug log
        return jsonify({"error": str(e)}), 500

@app.route('/entity_users_admin/<string:entity_id>', methods=['GET'])
def get_entity_users_admin(entity_id):
    try:
        # Fetch non-obsolete users and join with entity_master to get entity_name
        # Filter by the specified entity_id
        users = db.session.query(
            Users.user_id,
            Users.entity_id,
            EntityMaster.entity_name,
            Users.user_name,
            Users.address,
            Users.mobile_no,
            Users.email_id,
            Users.role
        ).join(
            EntityMaster, Users.entity_id == EntityMaster.entity_id
        ).filter(
            Users.entity_id == entity_id,
            (Users.obsolete_current != "O") | (Users.obsolete_current.is_(None))
        ).all()

        users_list = [
            {
                "user_id": user.user_id,
                "entity_id": user.entity_id,
                "entity_name": user.entity_name,
                "user_name": user.user_name,
                "address": user.address,
                "mobile_no": user.mobile_no,
                "email_id": user.email_id,
                "role": user.role
            }
            for user in users
        ]
        
        return jsonify({"users": users_list}), 200

    except Exception as e:
        print(f"Error fetching entity users: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/all_regulation_tasks', methods=['GET'])
def get_all_regulation_tasks():
    try:
        # Use SQLAlchemy to query all tasks across all entities
        tasks_query = db.session.query(
            EntityRegulationTasks,
            RegulationMaster.regulation_name,
            ActivityMaster.activity.label('activity_name'),
            EntityMaster.entity_name  # Add entity_name to provide context
        ).join(
            RegulationMaster,
            EntityRegulationTasks.regulation_id == RegulationMaster.regulation_id
        ).join(
            ActivityMaster,
            (EntityRegulationTasks.regulation_id == ActivityMaster.regulation_id) &
            (EntityRegulationTasks.activity_id == ActivityMaster.activity_id)
        ).join(
            EntityMaster,
            EntityRegulationTasks.entity_id == EntityMaster.entity_id
        )
        
        tasks = tasks_query.all()
        
        # Convert to JSON response
        tasks_list = [
            {
                "id": task.EntityRegulationTasks.id,
                "entity_id": task.EntityRegulationTasks.entity_id,
                "entity_name": task.entity_name,  # Include entity name for Global users
                "regulation_id": task.EntityRegulationTasks.regulation_id,
                "regulation_name": task.regulation_name,
                "activity_id": task.EntityRegulationTasks.activity_id,
                "activity_name": task.activity_name,
                "activity": task.activity_name,  # For backward compatibility
                "preparation_responsibility": task.EntityRegulationTasks.preparation_responsibility,
                "review_responsibility": task.EntityRegulationTasks.review_responsibility,
                "due_on": task.EntityRegulationTasks.due_on.strftime('%Y-%m-%d') if task.EntityRegulationTasks.due_on else None,
                "start_date": task.EntityRegulationTasks.start_date.strftime('%Y-%m-%d') if task.EntityRegulationTasks.start_date else None,
                "end_date": task.EntityRegulationTasks.end_date.strftime('%Y-%m-%d') if task.EntityRegulationTasks.end_date else None,
                "status": task.EntityRegulationTasks.status,
                "ews": task.EntityRegulationTasks.ews,
                "remarks": task.EntityRegulationTasks.remarks,
                "upload": task.EntityRegulationTasks.upload,
                "review_remarks": task.EntityRegulationTasks.review_remarks,
                "review_start_date": task.EntityRegulationTasks.review_start_date.strftime('%Y-%m-%d') if task.EntityRegulationTasks.review_start_date else None,
                "review_end_date": task.EntityRegulationTasks.review_end_date.strftime('%Y-%m-%d') if task.EntityRegulationTasks.review_end_date else None,
                "review_upload": task.EntityRegulationTasks.review_upload,
                "mandatory_optional": task.EntityRegulationTasks.mandatory_optional,
                "criticality": task.EntityRegulationTasks.criticality,
                "internal_external": task.EntityRegulationTasks.internal_external,
                "documentupload_yes_no": task.EntityRegulationTasks.documentupload_yes_no
            }
            for task in tasks
        ]
        
        return jsonify({"tasks": tasks_list}), 200
    
    except Exception as e:
        print("Error:", str(e))
        print(traceback.format_exc())  # Print full traceback for debugging
        return jsonify({"error": str(e)}), 500

@app.route('/all_users', methods=['GET'])
def get_all_users():
    try:
        # Fetch all non-obsolete users and join with entity_master to get entity_name
        users = db.session.query(
            Users.user_id,
            Users.entity_id,
            EntityMaster.entity_name,
            Users.user_name,
            Users.address,
            Users.mobile_no,
            Users.email_id,
            Users.role
        ).join(
            EntityMaster, Users.entity_id == EntityMaster.entity_id
        ).filter(
            (Users.obsolete_current != "O") | (Users.obsolete_current.is_(None))
        ).all()
        
        # Convert to JSON response
        users_list = [
            {
                "user_id": user.user_id,
                "entity_id": user.entity_id,
                "entity_name": user.entity_name,
                "user_name": user.user_name,
                "address": user.address,
                "mobile_no": user.mobile_no,
                "email_id": user.email_id,
                "role": user.role
            }
            for user in users
        ]
        
        return jsonify({"users": users_list}), 200
    
    except Exception as e:
        print("Error:", str(e))
        print(traceback.format_exc())  # Print full traceback for debugging
        return jsonify({"error": str(e)}), 500
    


@app.route('/update_task', methods=['POST'])
def update_task():
    try:
        # Check if the request contains form data
        if 'id' not in request.form:
            return jsonify({"error": "Missing task ID"}), 400
       
        task_id = request.form.get('id')
       
        # Find the task
        task = EntityRegulationTasks.query.get(task_id)
        if not task:
            return jsonify({"error": "Task not found"}), 404
 
        # Update assigner fields
        if 'status' in request.form:
            status = request.form.get('status')
            remarks = request.form.get('remarks')
           
            task.status = status
            if remarks is not None:
                task.remarks = remarks
           
            # Set dates based on status
            if status == 'WIP' and not task.start_date:
                task.start_date = datetime.now().date()
            elif status == 'Completed' and not task.end_date:
                task.end_date = datetime.now().date()
 
            # Handle assigner file upload
            if 'upload' in request.files:
                file = request.files['upload']
                if file and file.filename:
                    filename = f"{task.entity_id}_{task.regulation_id}_{task.activity_id}_task_{datetime.now().strftime('%Y%m%d%H%M%S')}"
                    if not os.path.exists('uploads'):
                        os.makedirs('uploads')
                    file_path = os.path.join('uploads', filename)
                    file.save(file_path)
                    task.upload = file_path
 
        # Update reviewer fields
        if 'review_status' in request.form:
            review_status = request.form.get('review_status')
            review_remarks = request.form.get('review_remarks')
           
            # Add review_status column if it doesn't exist
            try:
                from sqlalchemy import text
                with db.engine.connect() as connection:
                    connection.execute(text("ALTER TABLE entity_regulation_tasks ADD COLUMN IF NOT EXISTS review_status VARCHAR(20)"))
                    connection.commit()
            except Exception as e:
                print("Error adding review_status column:", str(e))
                # Continue even if column already exists
           
            # Set review status using setattr to handle potential missing column
            setattr(task, 'review_status', review_status)
            if review_remarks is not None:
                task.review_remarks = review_remarks
           
            # Set review dates based on status
            if review_status == 'WIP' and not task.review_start_date:
                task.review_start_date = datetime.now().date()
            elif review_status == 'Completed' and not task.review_end_date:
                task.review_end_date = datetime.now().date()
 
            # Handle reviewer file upload
            if 'review_upload' in request.files:
                review_file = request.files['review_upload']
                if review_file and review_file.filename:
                    review_filename = f"{task.entity_id}_{task.regulation_id}_{task.activity_id}_review_{datetime.now().strftime('%Y%m%d%H%M%S')}"
                    if not os.path.exists('uploads'):
                        os.makedirs('uploads')
                    review_file_path = os.path.join('uploads', review_filename)
                    review_file.save(review_file_path)
                    task.review_upload = review_file_path
       
        db.session.commit()
       
        # Get review_status safely using getattr with default value
        review_status_value = getattr(task, 'review_status', None)
       
        return jsonify({
            "message": "Task updated successfully",
            "task": {
                "id": task.id,
                "status": task.status,
                "remarks": task.remarks,
                "review_status": review_status_value,
                "review_remarks": task.review_remarks,
                "upload": task.upload,
                "review_upload": task.review_upload,
                "start_date": task.start_date.strftime('%Y-%m-%d') if task.start_date else None,
                "end_date": task.end_date.strftime('%Y-%m-%d') if task.end_date else None,
                "review_start_date": task.review_start_date.strftime('%Y-%m-%d') if task.review_start_date else None,
                "review_end_date": task.review_end_date.strftime('%Y-%m-%d') if task.review_end_date else None
            }
        }), 200
   
    except Exception as e:
        print("Error:", str(e))
        print(traceback.format_exc())
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
@app.route('/user_tasks/<string:user_id>', methods=['GET'])
def get_user_tasks(user_id):
    try:
        # Query tasks where the user_id matches the preparation_responsibility
        tasks = EntityRegulationTasks.query.filter_by(preparation_responsibility=user_id).all()
       
        # If no tasks are found, return an empty list
        if not tasks:
            return jsonify({"tasks": []}), 200
       
        # Convert to JSON response
        tasks_list = [
            {
                "id": task.id,
                "entity_id": task.entity_id,
                "regulation_id": task.regulation_id,
                "activity_id": task.activity_id,
                "activity": get_activity_name(task.regulation_id, task.activity_id),
                "preparation_responsibility": task.preparation_responsibility,
                "review_responsibility": task.review_responsibility,
                "due_on": task.due_on.strftime('%Y-%m-%d') if task.due_on else None,
                "start_date": task.start_date.strftime('%Y-%m-%d') if task.start_date else None,
                "end_date": task.end_date.strftime('%Y-%m-%d') if task.end_date else None,
                "status": task.status,
                "ews": task.ews,
                "remarks": task.remarks,
                "upload": task.upload,
                "review_remarks": task.review_remarks,
                "review_start_date": task.review_start_date.strftime('%Y-%m-%d') if task.review_start_date else None,
                "review_end_date": task.review_end_date.strftime('%Y-%m-%d') if task.review_end_date else None,
                "review_upload": task.review_upload,
                "mandatory_optional": task.mandatory_optional,
                "criticality": task.criticality,
                "internal_external": task.internal_external,
                "documentupload_yes_no": task.documentupload_yes_no
            }
            for task in tasks
        ]
       
        return jsonify({"tasks": tasks_list}), 200
   
    except Exception as e:
        print("Error:", str(e))
        print(traceback.format_exc())  # Print full traceback for debugging
        return jsonify({"error": str(e)}), 500
    
@app.route('/regulation_details/<string:regulation_id>', methods=['GET'])
def get_regulation_details(regulation_id):
    try:
        # Query regulation details
        regulation = RegulationMaster.query.filter_by(regulation_id=regulation_id).first()
       
        if not regulation:
            return jsonify({"error": "Regulation not found"}), 404
       
        # Convert to JSON response
        regulation_data = {
            "regulation_id": regulation.regulation_id,
            "regulation_name": regulation.regulation_name,
            "category_id": regulation.category_id,
            "regulatory_body": regulation.regulatory_body,
            "internal_external": regulation.internal_external,
            "national_international": regulation.national_international,
            "mandatory_optional": regulation.mandatory_optional,
            "effective_from": regulation.effective_from.strftime('%Y-%m-%d') if regulation.effective_from else None
        }
       
        return jsonify({"regulation": regulation_data}), 200
   
    except Exception as e:
        print("Error:", str(e))
        print(traceback.format_exc())  # Print full traceback for debugging
        return jsonify({"error": str(e)}), 500

# Run Flask Application
if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Ensure all tables exist before running
    app.run(debug=True)
