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