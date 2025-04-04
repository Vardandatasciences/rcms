from flask import Blueprint, jsonify, request
from models import db
from models.models import Users, EntityMaster,CountryCodes
from sqlalchemy import or_
import traceback
from services.email_service import send_email, get_email_template
import logging
from sqlalchemy.exc import SQLAlchemyError

users_bp = Blueprint('users', __name__)

@users_bp.route('/users', methods=['GET'])
def get_users():
    try:
        logging.info("Fetching users list")
        
        # Fetch non-obsolete users and join with entity_master to get entity_name
        users = db.session.query(
            Users.user_id,
            Users.entity_id,
            EntityMaster.entity_name,  # Join to get entity_name
            Users.user_name,
            Users.address,
            Users.mobile_no,
            Users.email_id,
            Users.role
        ).join(EntityMaster, Users.entity_id == EntityMaster.entity_id) \
         .filter((Users.obsolete_current != "O") | (Users.obsolete_current.is_(None))) \
         .all()

        users_list = [
            {
                "user_id": user.user_id,
                "entity_id": user.entity_id,
                "entity_name": user.entity_name,  # Include entity_name
                "user_name": user.user_name,
                "address": user.address,
                "mobile_no": user.mobile_no,
                "email_id": user.email_id,
                "role": user.role
            }
            for user in users
        ]
        
        logging.info(f"Found {len(users_list)} users")
        return jsonify({"users": users_list}), 200

    except Exception as e:
        logging.error(f"Error fetching users: {str(e)}")
        logging.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500

@users_bp.route('/add_user', methods=['POST'])
def add_user():
    try:
        data = request.json
        logging.info(f"Received add_user request with data: {data}")
        
        # Basic validation
        required_fields = ['user_id', 'entity_id', 'user_name', 'email_id', 'password', 'role']
        for field in required_fields:
            if field not in data or not data[field]:
                logging.error(f"Missing required field: {field}")
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # Extract privileges separately so they don't interfere with the Users model
        privileges = data.pop('privileges', []) if 'privileges' in data else []
        
        # Check if user with this ID already exists
        existing_user = Users.query.filter_by(user_id=data['user_id']).first()
        if existing_user:
            logging.warning(f"User ID already exists: {data['user_id']}")
            return jsonify({
                'success': False,
                'message': f"User ID '{data['user_id']}' already exists. Please use a different ID."
            }), 409
        
        try:
            # Create new user
            new_user = Users(**data)
            db.session.add(new_user)
            db.session.commit()
            logging.info(f"Successfully added user: {data['user_id']}")
            
            # Send welcome email to the new user
            try:
                send_welcome_email(new_user, data['password'], data['entity_id'])
                logging.info(f"Welcome email sent to user: {data['user_id']}")
            except Exception as email_error:
                logging.error(f"Error sending welcome email: {str(email_error)}")
                logging.error(traceback.format_exc())
                # Don't fail the entire operation if email sending fails
            
            return jsonify({
                'success': True,
                'message': 'User added successfully',
                'user_id': data['user_id']
            }), 201
        
        except SQLAlchemyError as db_error:
            db.session.rollback()
            logging.error(f"Database error adding user: {str(db_error)}")
            logging.error(traceback.format_exc())
            return jsonify({
                'success': False,
                'message': f'Database error: {str(db_error)}'
            }), 500
    
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error adding user: {str(e)}")
        logging.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Error adding user: {str(e)}'
        }), 500

def send_welcome_email(user, password, entity_id):
    """Send welcome email to newly added user"""
    
    # Get entity name from entity_id
    entity = EntityMaster.query.filter_by(entity_id=entity_id).first()
    entity_name = entity.entity_name if entity else entity_id
    
    # Prepare email content
    subject = f"Welcome to RCMS - Your Account Details"
    
    content = f"""
        <p>Dear {user.user_name},</p>
        
        <p>Welcome to the Regulatory Compliance Management System (RCMS). Your account has been created successfully.</p>
        
        <div class="detail-row">
            <div class="detail-label">Entity</div>
            <div class="detail-value">{entity_name} ({entity_id})</div>
        </div>
        
        <div class="detail-row">
            <div class="detail-label">User ID</div>
            <div class="detail-value">{user.user_id}</div>
        </div>
        
        <div class="detail-row">
            <div class="detail-label">Role</div>
            <div class="detail-value">{user.role}</div>
        </div>
        
        <div class="detail-row">
            <div class="detail-label">Password</div>
            <div class="detail-value">{password}</div>
        </div>
        
        <p>For security reasons, we recommend changing your password after your first login.</p>
        
        <p>You can access the system using your User ID and Password.</p>
        
        <p>If you have any questions or need assistance, please contact your administrator.</p>
        
        <p>Best regards,<br>RCMS Admin Team</p>
    """
    
    footer_text = "This is an automated message from RCMS. Please do not reply to this email."
    
    # Format email with template
    email_body = get_email_template(subject, content, footer_text)
    
    # Send email - using the system default sender
    sender_email = "preethi.b@vardaanglobal.com"  # Configure this in your system settings
    send_email(subject, email_body, user.email_id, sender_email)
    logging.info(f"Welcome email sent to {user.email_id}")

@users_bp.route('/update_user/<user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        user = Users.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.json

        # Update only provided fields
        for key, value in data.items():
            setattr(user, key, value)

        db.session.commit()
        return jsonify({"message": "User updated successfully"}), 200

    except Exception as e:
        print("Error:", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@users_bp.route('/delete_user/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    try:
        user = Users.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Instead of deleting, mark as obsolete
        user.obsolete_current = "O"
        db.session.commit()

        return jsonify({"message": "User marked as obsolete"}), 200

    except Exception as e:
        print("Error:", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

# @users_bp.route('/entity_users/<string:entity_id>', methods=['GET'])
@users_bp.route('/entity_users_admin/<string:entity_id>', methods=['GET'])
def get_entity_users_admin(entity_id):
    try:
        # Fetch non-obsolete users and join with entity_master to get entity_name
        # Filter by the specified entity_id
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
            Users.entity_id == entity_id,
            (Users.obsolete_current != "O") | (Users.obsolete_current.is_(None))
        ).all()

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
        print(f"Error fetching entity users: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    


@users_bp.route('/entity_users/<string:entity_id>', methods=['GET'])
def get_entity_users(entity_id):
    try:
        # Fetch non-obsolete users and join with entity_master to get entity_name
        # Filter by the specified entity_id
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
            Users.entity_id == entity_id,
            (Users.obsolete_current != "O") | (Users.obsolete_current.is_(None))
        ).all()

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
        print(f"Error fetching entity users: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
