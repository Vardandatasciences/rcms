from flask import Blueprint, jsonify, request, session
from models import db
from models.models import EntityRegulationTasks, RegulationMaster, ActivityMaster, Users, HolidayMaster
from sqlalchemy import or_
from datetime import datetime
from dateutil.relativedelta import relativedelta
import traceback

analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/api/task-summary', methods=['GET'])
def get_task_summary():
    try:
        # Get user from session
        user_data = session.get('user')
        if not user_data or user_data.get('role') != 'Admin':
            return jsonify({"error": "Unauthorized access"}), 403

        entity_id = user_data.get('entity_id')
        if not entity_id:
            return jsonify({"error": "Entity ID not found"}), 400

        # Rest of your existing task summary logic from entity_dashboard.py
        # But using the entity_id from session instead of hardcoding
        # ...

    except Exception as e:
        print(f"Error in get_task_summary: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# Add other necessary routes from entity_dashboard.py 