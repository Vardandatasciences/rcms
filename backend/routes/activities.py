from flask import Blueprint, jsonify, request
from models import db
from models.models import ActivityMaster,RegulationMaster,EntityRegulationTasks,HolidayMaster,EntityRegulation
from sqlalchemy import func
import traceback
from dateutil.relativedelta import relativedelta
from datetime import datetime

activities_bp = Blueprint('activities', __name__)

@activities_bp.route("/activities", methods=["GET"])
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


# @activities_bp.route('/activities/entity/<string:entity_id>', methods=['GET'])
# def get_entity_activities(entity_id):
#     try:
#         print(f"Fetching activities for entity: {entity_id}")  # Debug log
        
#         # Query activities associated with the entity's regulations
#         activities = db.session.query(ActivityMaster).join(
#             EntityRegulation,
#             ActivityMaster.regulation_id == EntityRegulation.regulation_id
#         ).filter(
#             EntityRegulation.entity_id == entity_id
#         ).all()

#         activities_list = [{
#             "regulation_id": activity.regulation_id,
#             "activity_id": activity.activity_id,
#             "activity": activity.activity,
#             "activity_description": activity.activity_description,
#             "criticality": activity.criticality,
#             "mandatory_optional": activity.mandatory_optional,
#             "frequency": activity.frequency
#         } for activity in activities]
        
#         print(f"Found {len(activities_list)} activities")  # Debug log
        
#         return jsonify({"activities": activities_list}), 200

#     except Exception as e:
#         print(f"Error fetching activities: {str(e)}")  # Debug log
#         return jsonify({"error": str(e)}), 500


@activities_bp.route("/add_activity", methods=["POST"])
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
    
@activities_bp.route("/update_activity/<string:regulation_id>/<int:activity_id>", methods=["POST", "OPTIONS"])
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


@activities_bp.route("/delete_activity/<string:regulation_id>/<int:activity_id>", methods=["DELETE"])
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

@activities_bp.route('/activity_details/<string:regulation_id>/<string:activity_id>', methods=['GET'])
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

@activities_bp.route('/calculate_due_date/<string:regulation_id>/<string:activity_id>', methods=['GET'])
def calculate_due_date(regulation_id, activity_id):
    try:
        from datetime import datetime
        from dateutil.relativedelta import relativedelta
        from models.models import HolidayMaster
        
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
    
@activities_bp.route('/regulation_details/<string:regulation_id>', methods=['GET'])
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

@activities_bp.route('/check_task_exists/<string:entity_id>/<string:regulation_id>/<string:activity_id>', methods=['GET'])
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

@activities_bp.route('/assign_task', methods=['POST'])
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

