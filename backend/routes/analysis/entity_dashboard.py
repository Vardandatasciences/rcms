from flask import Blueprint, jsonify, request
from flask_login import login_required
from ... import db
from ...models import EntityRegulationTasks, RegulationMaster, Category, EntityMaster, ActivityMaster, Users

analysis = Blueprint('analysis', __name__)

@analysis.route('/task-summary/<factory_id>', methods=['GET'])
@login_required
def get_task_summary(factory_id):
    try:
        # Base query
        query = db.session.query(
            EntityRegulationTasks,
            RegulationMaster,
            Category
        ).join(
            RegulationMaster,
            EntityRegulationTasks.regulation_id == RegulationMaster.regulation_id
        ).join(
            Category,
            RegulationMaster.category_id == Category.category_id
        ).filter(
            EntityRegulationTasks.entity_id == factory_id
        )

        records = query.all()
        
        # Process category data
        category_data = {}
        for record in records:
            category = record.Category.category_name
            status = record.EntityRegulationTasks.status
            
            if category not in category_data:
                category_data[category] = {
                    'Completed': 0,
                    'Completed with Delay': 0,
                    'Ongoing': 0,
                    'Ongoing with Delay': 0,
                    'Due': 0,
                    'Due with Delay': 0
                }
            category_data[category][status] += 1

        # Process criticality data
        criticality_data = {}
        for record in records:
            criticality = record.RegulationMaster.criticality
            status = record.EntityRegulationTasks.status
            
            if criticality not in criticality_data:
                criticality_data[criticality] = {
                    'Completed': 0,
                    'Completed with Delay': 0,
                    'Ongoing': 0,
                    'Ongoing with Delay': 0,
                    'Due': 0,
                    'Due with Delay': 0
                }
            criticality_data[criticality][status] += 1

        task_summary = {
            "total_tasks": len(records),
            "completed": len([r for r in records if r.EntityRegulationTasks.status == 'Completed']),
            "completed_with_delay": len([r for r in records if r.EntityRegulationTasks.status == 'Completed with Delay']),
            "ongoing": len([r for r in records if r.EntityRegulationTasks.status == 'Ongoing']),
            "ongoing_with_delay": len([r for r in records if r.EntityRegulationTasks.status == 'Ongoing with Delay']),
            "due": len([r for r in records if r.EntityRegulationTasks.status == 'Due']),
            "due_with_delay": len([r for r in records if r.EntityRegulationTasks.status == 'Due with Delay']),
            "category_data": category_data,
            "criticality_data": criticality_data,
            "detailed_data": [{
                'id': record.EntityRegulationTasks.id,
                'category': record.Category.category_name,
                'description': record.RegulationMaster.regulation_description,
                'due_date': record.EntityRegulationTasks.due_on.strftime('%Y-%m-%d'),
                'status': record.EntityRegulationTasks.status,
                'assigned_to': record.EntityRegulationTasks.preparation_responsibility,
                'criticality': record.RegulationMaster.criticality
            } for record in records]
        }
        
        return jsonify(task_summary)

    except Exception as e:
        print(f"Error in get_task_summary: {str(e)}")
        return jsonify({"error": str(e)}), 500

@analysis.route('/users', methods=['GET'])
@login_required
def get_users():
    try:
        users = Users.query.filter_by(obsolete_current='Y').all()
        return jsonify([{
            "id": user.user_id,
            "name": user.user_name
        } for user in users])
    except Exception as e:
        return jsonify({"error": str(e)}), 500 