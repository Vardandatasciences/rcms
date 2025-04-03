from flask import Blueprint, request, jsonify
from services.email_service import send_admin_welcome_email

email_routes = Blueprint('email_routes', __name__)

@email_routes.route('/send_admin_welcome_email', methods=['POST'])
def handle_admin_welcome_email():
    data = request.json
    
    try:
        send_admin_welcome_email(
            admin_email=data['admin_email'],
            admin_name=data['admin_name'],
            entity_id=data['entity_id'],
            admin_password=data['admin_password'],
            entity_name=data['entity_name']
        )
        return jsonify({"message": "Welcome email sent successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500 