from flask import Blueprint, jsonify, request, session
from models import db
from models.models import EntityRegulationTasks, RegulationMaster, ActivityMaster, Users, HolidayMaster ,EntityMaster
from sqlalchemy import or_
from datetime import datetime
from dateutil.relativedelta import relativedelta
import traceback,os

tasks_bp = Blueprint('tasks', __name__)

# @tasks_bp.route('/entity_regulation_tasks/<string:entity_id>', methods=['GET'])
# def get_entity_regulation_tasks(entity_id):
#     try:
#         # Use SQLAlchemy to query tasks for the specified entity
#         tasks_query = db.session.query(
#             EntityRegulationTasks,
#             RegulationMaster.regulation_name,
#             ActivityMaster.activity.label('activity_name')
#         ).join(
#             RegulationMaster,
#             EntityRegulationTasks.regulation_id == RegulationMaster.regulation_id
#         ).join(
#             ActivityMaster,
#             (EntityRegulationTasks.regulation_id == ActivityMaster.regulation_id) &
#             (EntityRegulationTasks.activity_id == ActivityMaster.activity_id)
#         ).filter(
#             EntityRegulationTasks.entity_id == entity_id
#         )
        
#         tasks = tasks_query.all()
        
#         # Convert to JSON response
#         tasks_list = [
#             {
#                 "id": task.EntityRegulationTasks.id,
#                 "entity_id": task.EntityRegulationTasks.entity_id,
#                 "regulation_id": task.EntityRegulationTasks.regulation_id,
#                 "regulation_name": task.regulation_name,
#                 "activity_id": task.EntityRegulationTasks.activity_id,
#                 "activity_name": task.activity_name,
#                 "activity": task.activity_name,  # For backward compatibility
#                 "preparation_responsibility": task.EntityRegulationTasks.preparation_responsibility,
#                 "review_responsibility": task.EntityRegulationTasks.review_responsibility,
#                 "due_on": task.EntityRegulationTasks.due_on.strftime('%Y-%m-%d') if task.EntityRegulationTasks.due_on else None,
#                 "start_date": task.EntityRegulationTasks.start_date.strftime('%Y-%m-%d') if task.EntityRegulationTasks.start_date else None,
#                 "end_date": task.EntityRegulationTasks.end_date.strftime('%Y-%m-%d') if task.EntityRegulationTasks.end_date else None,
#                 "status": task.EntityRegulationTasks.status,
#                 "ews": task.EntityRegulationTasks.ews,
#                 "remarks": task.EntityRegulationTasks.remarks,
#                 "upload": task.EntityRegulationTasks.upload,
#                 "review_remarks": task.EntityRegulationTasks.review_remarks,
#                 "review_start_date": task.EntityRegulationTasks.review_start_date.strftime('%Y-%m-%d') if task.EntityRegulationTasks.review_start_date else None,
#                 "review_end_date": task.EntityRegulationTasks.review_end_date.strftime('%Y-%m-%d') if task.EntityRegulationTasks.review_end_date else None,
#                 "review_upload": task.EntityRegulationTasks.review_upload,
#                 "mandatory_optional": task.EntityRegulationTasks.mandatory_optional,
#                 "criticality": task.EntityRegulationTasks.criticality,
#                 "internal_external": task.EntityRegulationTasks.internal_external,
#                 "documentupload_yes_no": task.EntityRegulationTasks.documentupload_yes_no
#             }
#             for task in tasks
#         ]
        
#         return jsonify({"tasks": tasks_list}), 200
    
#     except Exception as e:
#         print("Error:", str(e))
#         print(traceback.format_exc())  # Print full traceback for debugging
#         return jsonify({"error": str(e)}), 500

@tasks_bp.route('/check_task_exists/<string:entity_id>/<string:regulation_id>/<string:activity_id>', methods=['GET'])
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

@tasks_bp.route('/assign_task', methods=['POST'])
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

@tasks_bp.route('/reassign_task', methods=['POST'])
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

@tasks_bp.route('/task/<int:task_id>', methods=['GET'])
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

@tasks_bp.route('/update_task_status', methods=['POST'])
def update_task_status():
    try:
        data = request.json
        
        # Extract data from request
        task_id = data.get('task_id')
        status = data.get('status')
        remarks = data.get('remarks')
        upload = data.get('upload')
        
        # Validate required fields
        if not all([task_id, status]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Get user ID from session or use a default value
        user_id = session.get('user_id', 'SYSTEM')
        
        # Find the task
        task = EntityRegulationTasks.query.get(task_id)
        
        if not task:
            return jsonify({'error': 'Task not found'}), 404
        
        # Update task fields based on status
        if status == "In Progress":
            # If task is starting
            if task.status == "Yet to Start":
                task.start_date = datetime.now().date()
            task.status = status
            task.remarks = remarks
            task.upload = upload
            
        elif status == "Completed":
            # If task is being completed
            task.status = status
            task.end_date = datetime.now().date()
            task.remarks = remarks
            task.upload = upload
            
        elif status == "Review In Progress":
            # If review is starting
            task.status = status
            task.review_start_date = datetime.now().date()
            task.review_remarks = remarks
            task.review_upload = upload
            
        elif status == "Review Completed":
            # If review is completed
            task.status = status
            task.review_end_date = datetime.now().date()
            task.review_remarks = remarks
            task.review_upload = upload
            
        else:
            # For any other status
            task.status = status
        
        # Update last modified info
        task.last_updated_by = user_id
        task.last_updated_on = datetime.now()
        
        db.session.commit()
        
        return jsonify({'message': 'Task status updated successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in update_task_status: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': 'An error occurred while updating task status'}), 500 
    


@tasks_bp.route('/all_regulation_tasks', methods=['GET'])
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

@tasks_bp.route('/entity_regulation_tasks/<string:entity_id>', methods=['GET'])
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

@tasks_bp.route('/update_task', methods=['POST'])
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