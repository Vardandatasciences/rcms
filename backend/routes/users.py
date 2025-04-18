from flask import Blueprint, jsonify, request
from models import db
from models.models import Users, EntityMaster, Privileges
from sqlalchemy import or_
import traceback
from services.email_service import send_email, get_email_template
import logging
from sqlalchemy.exc import SQLAlchemyError

users_bp = Blueprint('users', __name__)

# Helper function to log errors with traceback
def log_error(message, error, include_traceback=True):
    """Centralized error logging with optional traceback"""
    logging.error(f"{message}: {str(error)}")
    if include_traceback:
        logging.error(f"Traceback: {traceback.format_exc()}")


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
        log_error("Error fetching users", e)
        return jsonify({"error": str(e)}), 500


@users_bp.route('/add_user', methods=['POST'])
def add_user():
    try:
        data = request.json.copy() if request.json else {}
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
        
        # Validate email format
        if '@' not in data['email_id']:
            logging.error(f"Invalid email format: {data['email_id']}")
            return jsonify({
                'success': False,
                'message': f"Invalid email format: {data['email_id']}"
                }), 400
        
        # Extract privileges separately so they don't interfere with the Users model
        privileges = data.pop('privileges', []) if 'privileges' in data else []
        logging.info(f"Extracted privileges for user {data['user_id']}: {privileges}")
        
        # Check if user with this ID already exists
        existing_user = Users.query.filter_by(user_id=data['user_id']).first()
        if existing_user:
            logging.warning(f"User ID already exists: {data['user_id']}")
            return jsonify({
                'success': False,
                'message': f"User ID '{data['user_id']}' already exists. Please use a different ID."
            }), 409
        
        # Store for later use in email
        user_password = data['password']
        
        email_status = None
        user_created = False
        privilege_status = None
        
        try:
            # Create new user without privileges field
            user_data = {key: value for key, value in data.items() if key != 'privileges'}
            new_user = Users(**user_data)
            db.session.add(new_user)
            db.session.commit()
            logging.info(f"Successfully added user: {data['user_id']}")
            user_created = True
            
            # If user is admin and has privileges, add them to the privileges table
            if (data['role'] == 'Admin' or data['role'] == 'Global') and privileges:
                try:
                    # Create privilege entry
                    privilege_id = f"PRV-{data['user_id']}-{data['entity_id']}"
                    privileges_str = ','.join(privileges) if privileges else ''
                    
                    new_privilege = Privileges(
                        privilege_id=privilege_id,
                        user_id=data['user_id'],
                        entity_id=data['entity_id'],
                        privileges_list=privileges_str
                    )
                    db.session.add(new_privilege)
                    db.session.commit()
                    logging.info(f"Added privileges for user {data['user_id']}: {privileges}")
                    privilege_status = "success"
                except Exception as priv_error:
                    log_error(f"Error adding privileges", priv_error)
                    privilege_status = "failed"
                    # Continue with the user creation even if privileges fail
            else:
                privilege_status = "not_needed"
            
            # Send welcome email to the new user
            try:
                # If user is admin, pass privileges to include in the email
                if data['role'] == 'Admin' or data['role'] == 'Global':
                    email_status = send_welcome_email(new_user, user_password, data['entity_id'], privileges)
                else:
                    email_status = send_welcome_email(new_user, user_password, data['entity_id'])
                
                if email_status:
                    logging.info(f"Welcome email sent to user: {data['user_id']}")
                else:
                    logging.warning(f"Failed to send welcome email to user: {data['user_id']}")
            except Exception as email_error:
                log_error(f"Error sending welcome email", email_error)
                email_status = False
                # Don't fail the entire operation if email sending fails
            
            response_message = 'User added successfully'
            if email_status is False:
                response_message += ', but welcome email could not be sent. Please check the email address.'
            if privilege_status == "failed":
                response_message += ', but there was an issue setting privileges.'
            
            return jsonify({
                'success': True,
                'message': response_message,
                'user_id': data['user_id'],
                'email_sent': email_status,
                'privilege_status': privilege_status
            }), 201
        
        except SQLAlchemyError as db_error:
            db.session.rollback()
            log_error("Database error adding user", db_error)
            return jsonify({
                'success': False,
                'message': f'Database error: {str(db_error)}',
                'user_created': user_created,
                'email_sent': email_status,
                'privilege_status': privilege_status
            }), 500
    
    except Exception as e:
        db.session.rollback()
        log_error("Error adding user", e)
        return jsonify({
            'success': False,
            'message': f'Error adding user: {str(e)}'
        }), 500


def send_welcome_email(user, password, entity_id, privileges=None):
    """Send welcome email to newly added user"""
    try:
        logging.info(f"Preparing welcome email for user: {user.user_id} ({user.email_id})")
    
        # Get entity name from entity_id
        entity = EntityMaster.query.filter_by(entity_id=entity_id).first()
        entity_name = entity.entity_name if entity else entity_id
        
        # Define privilege descriptions for better readability in the email
        privilege_descriptions = {
            "user_add": "Add Users",
            "user_update": "Update/Modify Users",
            "user_delete": "Delete Users",
            "category_add": "Add Categories",
            "category_delete": "Delete Categories",
            "regulation_add": "Add Regulations",
            "regulation_manage": "Manage Regulations",
            "regulation_update": "Update/Modify Regulations",
            "regulation_delete": "Delete Regulations",
            "activity_add": "Add Activities",
            "activity_update": "Update/Modify Activities",
            "activity_delete": "Delete Activities",
            "activity_assign": "Assign Activities",
            "task_reassign": "Reassign Tasks",
            "holiday_add": "Add Holidays",
            "holiday_delete": "Delete Holidays",
            "analysis_access": "Access Analysis"
        }
        
        # Ensure privileges is a list
        if privileges is None:
            privileges = []
        elif not isinstance(privileges, list):
            logging.warning(f"Privileges was not a list, converting from: {type(privileges)}")
            try:
                if isinstance(privileges, str):
                    privileges = privileges.split(',')
                else:
                    privileges = list(privileges)
            except Exception as e:
                log_error("Error converting privileges to list", e, include_traceback=False)
                privileges = []
        
        logging.info(f"User {user.user_id} has role: {user.role} and privileges: {privileges}")
    
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
            """
        
        # Add privileges section if user is Admin or Global
        if user.role == 'Admin' or user.role == 'Global':
            logging.info(f"Adding privileges section for admin user: {user.user_id}")
            
            # Check if privileges list is empty
            if not privileges:
                content += f"""
                <div class="detail-row privilege-section">
                    <div class="detail-label">Privileges</div>
                    <div class="detail-value notice">
                        <p>No specific privileges assigned. You'll have access to all functionalities by default.</p>
                    </div>
                </div>
                """
            else:
                # Group privileges by category
                privilege_categories = {}
                for priv in privileges:
                    if not priv:  # Skip empty privileges
                        continue
                        
                    category = priv.split('_')[0].capitalize()
                    if category not in privilege_categories:
                        privilege_categories[category] = []
                    
                    # Get the readable description or use the ID if not found
                    description = privilege_descriptions.get(priv, priv)
                    privilege_categories[category].append(description)
                
                # Create the privileges section with categorized privileges
                if privilege_categories:
                    content += f"""
                    <div class="detail-row privilege-section">
                        <div class="detail-label">Your Privileges</div>
                        <div class="detail-value">
                            <p>You have been assigned the following privileges in the system:</p>
                    """
                    
                    for category, privs in privilege_categories.items():
                        content += f"""
                            <div class="privilege-category">
                                <h4>{category}</h4>
                                <ul>
                        """
                        for priv in privs:
                            content += f"""
                                    <li>{priv}</li>
                            """
                        content += f"""
                                </ul>
                            </div>
                        """
                    
                    content += f"""
                            <p class="privilege-note">These privileges determine what actions you can perform in the system.</p>
                        </div>
                    </div>
                    """
                else:
                    # Fallback if privileges parsing failed
                    content += f"""
                    <div class="detail-row privilege-section">
                        <div class="detail-label">Privileges</div>
                        <div class="detail-value notice">
                            <p>No specific privileges assigned. You'll have access to all functionalities by default.</p>
                        </div>
                    </div>
                    """
        
        content += f"""
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
        
        # Attempt to send the email
        email_sent = send_email(subject, email_body, user.email_id, sender_email)
        
        if email_sent:
            logging.info(f"Welcome email sent successfully to {user.email_id}")
            return True
        else:
            logging.error(f"Failed to send welcome email to {user.email_id}")
            return False
            
    except Exception as e:
        log_error(f"Error in send_welcome_email", e)
        return False


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
        log_error("Error updating user", e, include_traceback=True)
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
        log_error("Error deleting user", e)
        return jsonify({"error": str(e)}), 500


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
        log_error(f"Error fetching entity users", e)
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
        log_error(f"Error fetching entity users", e)
        return jsonify({"error": str(e)}), 500
