from flask import Blueprint, jsonify, request
from models import db
from models.models import EntityMaster, Users,CountryCodes,EntityRegulation,RegulationMaster,ActivityMaster
import traceback
import bcrypt

entities_bp = Blueprint('entities', __name__)

@entities_bp.route('/entities', methods=['GET'])
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

@entities_bp.route('/add_entity', methods=['POST'])
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

@entities_bp.route('/update_entity/<entity_id>', methods=['PUT'])
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

@entities_bp.route('/delete_entity/<entity_id>', methods=['DELETE'])
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
    
@entities_bp.route('/country_codes', methods=['GET'])
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