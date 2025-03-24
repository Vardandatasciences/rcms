from flask import Blueprint, jsonify, render_template
from models.models import Users, EntityMaster, db
from flask_cors import cross_origin

# Create a Blueprint for analysis routes
analysis_bp = Blueprint('analysis', __name__)

@analysis_bp.route('/analysis/users', methods=['GET'])
@cross_origin()
def get_users_for_analysis():
    """
    Get all users data for analysis dashboard
    """
    try:
        # Fetch non-obsolete users and join with entity_master to get entity_name
        users = db.session.query(
            Users.user_id,
            Users.entity_id,
            EntityMaster.entity_name,
            Users.user_name,
            Users.address,
            Users.mobile_no,
            Users.email_id,
            Users.role
        ).join(EntityMaster, Users.entity_id == EntityMaster.entity_id, isouter=True) \
         .filter((Users.obsolete_current != "O") | (Users.obsolete_current.is_(None))) \
         .all()

        users_list = [
            {
                "user_id": user.user_id,
                "entity_id": user.entity_id,
                "entity_name": user.entity_name if user.entity_name else "Not Assigned",
                "user_name": user.user_name,
                "address": user.address,
                "mobile_no": user.mobile_no,
                "email_id": user.email_id,
                "role": user.role
            }
            for user in users
        ]
        return jsonify({"success": True, "users": users_list}), 200

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500

@analysis_bp.route('/analysis')
def analysis_page():
    """
    Serve the analysis HTML page
    """
    # Return JSON response for the API
    return jsonify({
        'success': True,
        'message': 'Analysis API is working'
    }) 