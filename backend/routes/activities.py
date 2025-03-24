from flask import Blueprint, jsonify, request
from models import db
from models.models import ActivityMaster,RegulationMaster,EntityRegulationTasks,HolidayMaster,EntityRegulation, Users
from sqlalchemy import func
import traceback
from dateutil.relativedelta import relativedelta
from datetime import datetime, timedelta
from services.email_service import send_activity_assignment_emails
import logging

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
        data = request.get_json()
        logging.info(f"Received task assignment data: {data}")
        
        # Extract required fields
        entity_id = data.get('entity_id')
        regulation_id = data.get('regulation_id')
        activity_id = data.get('activity_id')
        preparation_responsibility = data.get('preparation_responsibility')
        review_responsibility = data.get('review_responsibility')
        due_on = data.get('due_on')
        
        if not all([entity_id, regulation_id, activity_id, preparation_responsibility, review_responsibility, due_on]):
            logging.error("Missing required fields in request")
            return jsonify({'error': 'Missing required fields'}), 400
            
        # Check if task already exists
        existing_task = EntityRegulationTasks.query.filter_by(
            entity_id=entity_id,
            regulation_id=regulation_id,
            activity_id=activity_id
        ).first()
        
        if existing_task:
            logging.info(f"Task already exists for entity {entity_id}, regulation {regulation_id}, activity {activity_id}")
            return jsonify({
                'error': 'This activity has already been assigned',
                'existing_task': {
                    'task_id': existing_task.task_id,
                    'due_date': existing_task.due_on.strftime('%Y-%m-%d'),
                    'status': existing_task.status,
                    'preparation_responsibility': existing_task.preparation_responsibility,
                    'review_responsibility': existing_task.review_responsibility
                }
            }), 409
            
        # Get activity and regulation details using composite primary key
        activity = ActivityMaster.query.filter_by(
            regulation_id=regulation_id, 
            activity_id=activity_id
        ).first()
        
        regulation = RegulationMaster.query.filter_by(
            regulation_id=regulation_id
        ).first()
        
        if not activity or not regulation:
            logging.error(f"Activity or regulation not found. Activity: {activity}, Regulation: {regulation}")
            return jsonify({'error': 'Activity or regulation not found'}), 404
            
        # Convert due_on to datetime
        try:
            due_date = datetime.strptime(due_on, '%Y-%m-%d').date()
        except ValueError as e:
            logging.error(f"Invalid date format: {due_on}")
            return jsonify({'error': 'Invalid date format'}), 400
        
        # Calculate next due date based on frequency
        try:
            if activity.frequency == 12:  # Monthly
                next_due_date = due_date + relativedelta(months=1)
            elif activity.frequency == 4:  # Quarterly
                next_due_date = due_date + relativedelta(months=3)
            elif activity.frequency == 2:  # Half Yearly
                next_due_date = due_date + relativedelta(months=6)
            elif activity.frequency == 1:  # Yearly
                next_due_date = due_date + relativedelta(years=1)
            else:
                next_due_date = due_date
        except Exception as e:
            logging.error(f"Error calculating next due date: {str(e)}")
            next_due_date = due_date
            
        # Get user details first
        prep_user = Users.query.get(preparation_responsibility)
        review_user = Users.query.get(review_responsibility)
        
        if not prep_user or not review_user:
            logging.error(f"User details not found. Prep user: {prep_user}, Review user: {review_user}")
            return jsonify({'error': 'User details not found'}), 404
            
        # Create task record
        task = EntityRegulationTasks(
                entity_id=entity_id,
                regulation_id=regulation_id,
                activity_id=activity_id,
            due_on=due_date,
                preparation_responsibility=preparation_responsibility,
                review_responsibility=review_responsibility,
                status="Yet to Start",
            ews=activity.ews,
            criticality=activity.criticality,
            internal_external=regulation.internal_external,
            mandatory_optional=activity.mandatory_optional,
            documentupload_yes_no=activity.documentupload_yes_no
        )
        
        db.session.add(task)
        db.session.commit()
        
        # Send emails and create calendar events
        try:
            send_activity_assignment_emails(
                activity_details=activity,
                regulation_details=regulation,
                preparation_user=preparation_responsibility,
                review_user=review_responsibility,
                due_date=due_date
            )
        except Exception as e:
            logging.error(f"Error sending emails: {str(e)}")
            # Continue with the response even if email sending fails
        
        return jsonify({
            'message': 'Task assigned successfully',
            'task_id': task.task_id,
            'due_date': due_date.strftime('%Y-%m-%d'),
            'next_due_date': next_due_date.strftime('%Y-%m-%d'),
            'preparation_user': {
                'name': prep_user.user_name,
                'email': prep_user.email_id
            },
            'review_user': {
                'name': review_user.user_name,
                'email': review_user.email_id
            },
            'activity_name': activity.activity,
            'regulation_name': regulation.regulation_name
        }), 201
    
    except Exception as e:
        logging.error(f"Error assigning task: {str(e)}")
        logging.error(traceback.format_exc())
        db.session.rollback()
        return jsonify({'error': f'Failed to assign task: {str(e)}'}), 500
    

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

@activities_bp.route('/entity_tasks/<string:entity_id>', methods=['GET'])
def get_entity_tasks(entity_id):
    try:
        # Validate entity_id
        if not entity_id:
            logging.error("Entity ID is missing")
            return jsonify({'error': 'Entity ID is required'}), 400

        # Check if entity exists
        entity_exists = EntityRegulation.query.filter_by(entity_id=entity_id).first()
        if not entity_exists:
            logging.error(f"Entity {entity_id} not found")
            return jsonify({'error': 'Entity not found', 'tasks': []}), 404
        
        # Query tasks for the given entity
        tasks = EntityRegulationTasks.query.filter_by(
            entity_id=entity_id
        ).all()
        
        # Convert to JSON response
        tasks_list = [{
            # 'task_id': task.task_id,
            'regulation_id': task.regulation_id,
            'activity_id': task.activity_id,
            'due_on': task.due_on.strftime('%Y-%m-%d') if task.due_on else None,
            'status': task.status,
            'preparation_responsibility': task.preparation_responsibility,
            'review_responsibility': task.review_responsibility
        } for task in tasks]
        
        return jsonify({'tasks': tasks_list}), 200
        
    except Exception as e:
        logging.error(f"Error fetching entity tasks: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({'error': f'Failed to fetch tasks: {str(e)}', 'tasks': []}), 500

@activities_bp.route('/entity_regulation_tasks/<string:entity_id>', methods=['GET'])
def get_entity_regulation_tasks(entity_id):
    try:
        # Add debug logging
        print(f"Fetching tasks for entity: {entity_id}")
        print(f"Query parameters: {request.args}")
        
        # Get query parameters
        time_period = request.args.get('time_period', 'All')
        internal_external = request.args.get('internal_external')
        mandatory_optional = request.args.get('mandatory_optional')
        user_id = request.args.get('user_id')
        
        # Base query
        query = EntityRegulationTasks.query.filter_by(entity_id=entity_id)
        
        # Apply filters
        if internal_external and internal_external != 'All':
            query = query.filter_by(internal_external=internal_external)
            
        if mandatory_optional and mandatory_optional != 'All':
            query = query.filter_by(mandatory_optional=mandatory_optional)
            
        if user_id:
            query = query.filter(
                (EntityRegulationTasks.preparation_responsibility == user_id) |
                (EntityRegulationTasks.review_responsibility == user_id)
            )
            
        # Apply time period filter
        today = datetime.now().date()
        if time_period == 'Current Month':
            start_date = today.replace(day=1)
            next_month = today.replace(day=28) + timedelta(days=4)
            end_date = next_month - timedelta(days=next_month.day)
            query = query.filter(EntityRegulationTasks.due_on.between(start_date, end_date))
        # Add other time period filters as needed
        
        # Add logging for the query results
        tasks = query.all()
        print(f"Found {len(tasks)} tasks")
        
        # Convert to response format with additional logging
        tasks_list = []
        for task in tasks:
            task_data = {
                'entity_id': task.entity_id,
                'regulation_id': task.regulation_id,
                'activity_id': task.activity_id,
                'status': task.status,
                'criticality': task.criticality,
                'due_on': task.due_on.strftime('%Y-%m-%d') if task.due_on else None,
                'internal_external': task.internal_external,
                'mandatory_optional': task.mandatory_optional
            }
            tasks_list.append(task_data)
            print(f"Processed task: {task_data}")
        
        print(f"Returning {len(tasks_list)} tasks")
        return jsonify({'tasks': tasks_list}), 200
        
    except Exception as e:
        print(f"Error in get_entity_regulation_tasks: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e), 'tasks': []}), 500

