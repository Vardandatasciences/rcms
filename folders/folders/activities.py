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