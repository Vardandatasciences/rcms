from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import traceback
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# Import config
from config import Config

# Import models
from models.models import Privileges, Users, EntityMaster, db

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.config.from_object(Config)
CORS(app)  # Enable CORS for all routes

# Initialize database
db.init_app(app)

# Define all available privileges
ALL_PRIVILEGES = [
    "user_add", "user_update", "user_delete",
    "category_add", "category_delete",
    "regulation_add", "regulation_manage", "regulation_update", "regulation_delete",
    "activity_add", "activity_update", "activity_delete", "activity_assign",
    "task_reassign",
    "holiday_add", "holiday_delete",
    "entity_add", "entity_update", "entity_delete",
    "analysis_access"
]

# Define privilege descriptions
PRIVILEGE_DESCRIPTIONS = {
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

# Email service functions
def get_email_template(subject, content, footer_text):
    return f"""
    <html>
    <head>
        <title>{subject}</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .email-container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #f5f5f5; padding: 15px; border-bottom: 2px solid #ddd; }}
            .content {{ padding: 20px 0; }}
            .footer {{ font-size: 12px; color: #777; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; }}
            .detail-row {{ margin-bottom: 15px; }}
            .detail-label {{ font-weight: bold; margin-bottom: 5px; }}
            .detail-value {{ padding-left: 10px; }}
            .privilege-section {{ margin-top: 20px; }}
            .privilege-category {{ margin-bottom: 15px; }}
            .privilege-category h4 {{ margin-bottom: 5px; }}
            .privilege-note {{ font-style: italic; margin-top: 15px; }}
            .notice {{ font-style: italic; color: #555; }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h2>{subject}</h2>
            </div>
            <div class="content">
                {content}
            </div>
            <div class="footer">
                {footer_text}
            </div>
        </div>
    </body>
    </html>
    """

def send_email(subject, body, recipient_email, sender_email, smtp_server='smtp.office365.com', smtp_port=587):
    try:
        # Create message container
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = sender_email
        msg['To'] = recipient_email

        # Create the HTML part
        part = MIMEText(body, 'html')
        msg.attach(part)

        # Send the message
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        # In production, use environment variables for credentials
        server.login(os.environ.get('EMAIL_USER', 'your_email@example.com'), 
                     os.environ.get('EMAIL_PASSWORD', 'your_password'))
        server.sendmail(sender_email, recipient_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        logger.error(f"Email sending failed: {str(e)}")
        logger.error(traceback.format_exc())
        return False

def send_privilege_update_email(user, entity_id, privileges_list):
    try:
        if user.role != 'Admin':
            logger.info(f"User {user.user_id} is not an admin, skipping privilege update email")
            return True
            
        logger.info(f"Preparing privilege update email for admin: {user.user_id} ({user.email_id})")
        
        # Get entity name from entity_id
        entity = EntityMaster.query.filter_by(entity_id=entity_id).first()
        entity_name = entity.entity_name if entity else entity_id
        
        # Ensure privileges is a list
        if privileges_list is None:
            privileges_list = []
        elif not isinstance(privileges_list, list):
            logger.warning(f"Privileges was not a list, converting from: {type(privileges_list)}")
            try:
                if isinstance(privileges_list, str):
                    privileges_list = privileges_list.split(',')
                else:
                    privileges_list = list(privileges_list)
            except Exception as e:
                logger.error(f"Error converting privileges to list: {str(e)}")
                privileges_list = []
        
        # Prepare email content
        subject = f"RCMS - Your Admin Privileges Have Been Updated"
        
        content = f"""
            <p>Dear {user.user_name},</p>
            
            <p>Your privileges in the Regulatory Compliance Management System (RCMS) have been updated.</p>
            
            <div class="detail-row">
                <div class="detail-label">Entity</div>
                <div class="detail-value">{entity_name} ({entity_id})</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">User ID</div>
                <div class="detail-value">{user.user_id}</div>
            </div>
        """
        
        # Check if privileges list is empty
        if not privileges_list:
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
            for priv in privileges_list:
                if not priv:  # Skip empty privileges
                    continue
                    
                category = priv.split('_')[0].capitalize()
                if category not in privilege_categories:
                    privilege_categories[category] = []
                
                # Get the readable description or use the ID if not found
                description = PRIVILEGE_DESCRIPTIONS.get(priv, priv)
                privilege_categories[category].append(description)
            
            # Create the privileges section with categorized privileges
            if privilege_categories:
                content += f"""
                <div class="detail-row privilege-section">
                    <div class="detail-label">Your Updated Privileges</div>
                    <div class="detail-value">
                        <p>Your privileges have been updated to the following:</p>
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
            <p>If you have any questions about your updated privileges, please contact your system administrator.</p>
            
            <p>Best regards,<br>RCMS Admin Team</p>
        """
        
        footer_text = "This is an automated message from RCMS. Please do not reply to this email."
        
        # Format email with template
        email_body = get_email_template(subject, content, footer_text)
        
        # Send email - using the system default sender
        sender_email = os.environ.get('EMAIL_SENDER', "preethi.b@vardaanglobal.com")
        
        # Attempt to send the email
        email_sent = send_email(subject, email_body, user.email_id, sender_email)
        
        if email_sent:
            logger.info(f"Privilege update email sent successfully to {user.email_id}")
            return True
        else:
            logger.error(f"Failed to send privilege update email to {user.email_id}")
            return False
            
    except Exception as e:
        logger.error(f"Error in send_privilege_update_email: {str(e)}")
        logger.error(traceback.format_exc())
        return False

# API Routes
@app.route('/api/privileges/add_user_privileges', methods=['POST'])
def add_user_privileges():
    try:
        data = request.json
        user_id = data.get('user_id')
        entity_id = data.get('entity_id')
        privileges_list = data.get('privileges', [])
        
        if not user_id or not entity_id:
            return jsonify({
                'success': False,
                'message': 'Missing required parameters: user_id and entity_id'
            }), 400
        
        # Check if user is Global - they automatically have all privileges
        user = Users.query.get(user_id)
        if user and user.role == 'Global':
            return jsonify({
                'success': True,
                'message': 'Global users have all privileges by default'
            }), 200
        
        # Convert list to comma-separated string
        privileges_str = ','.join(privileges_list) if privileges_list else ''
        
        # Generate a more meaningful privilege_id based on user_id and entity_id
        # Format: PRV-{user_id}-{entity_id}
        privilege_id = f"PRV-{user_id}-{entity_id}"
        logger.info(f"Generated privilege_id: {privilege_id}")
        
        # Check if privileges already exist for this user and entity
        existing_privileges = Privileges.query.filter_by(
            user_id=user_id, 
            entity_id=entity_id
        ).first()
        
        if existing_privileges:
            # Update existing privileges
            existing_privileges.privileges_list = privileges_str
            db.session.commit()
            logger.info(f"Updated privileges for user {user_id} in entity {entity_id}")
            return jsonify({
                'success': True,
                'message': 'Privileges updated successfully'
            }), 200
        else:
            # Create new privileges entry
            new_privileges = Privileges(
                privilege_id=privilege_id,
                user_id=user_id,
                entity_id=entity_id,
                privileges_list=privileges_str
            )
            db.session.add(new_privileges)
            db.session.commit()
            logger.info(f"Added new privileges for user {user_id} in entity {entity_id}")
            
            return jsonify({
                'success': True,
                'message': 'Privileges added successfully'
            }), 201
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error saving privileges: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Error saving privileges: {str(e)}'
        }), 500

@app.route('/api/privileges/update_user_privileges', methods=['POST'])
def update_user_privileges():
    try:
        data = request.json
        user_id = data.get('user_id')
        entity_id = data.get('entity_id')
        privileges_list = data.get('privileges', [])
        
        if not user_id or not entity_id:
            return jsonify({
                'success': False,
                'message': 'Missing required parameters: user_id and entity_id'
            }), 400
        
        # Convert list to comma-separated string
        privileges_str = ','.join(privileges_list) if privileges_list else ''
        
        # Get user details to check role
        user = Users.query.get(user_id)
        if not user:
            return jsonify({
                'success': False,
                'message': f'User with ID {user_id} not found'
            }), 404
        
        # Check if user is Global - they automatically have all privileges
        if user.role == 'Global':
            return jsonify({
                'success': True,
                'message': 'Global users have all privileges by default'
            }), 200
        
        email_sent = False
        old_privileges = []
        
        # Check if privileges exist for this user and entity
        existing_privileges = Privileges.query.filter_by(
            user_id=user_id, 
            entity_id=entity_id
        ).first()
        
        if existing_privileges:
            # Store the old privileges for comparison
            old_privileges = existing_privileges.privileges_list.split(',') if existing_privileges.privileges_list else []
            
            # Update existing privileges
            existing_privileges.privileges_list = privileges_str
            db.session.commit()
            logger.info(f"Updated privileges for user {user_id} in entity {entity_id}")
            
            # Send email notification if user is admin and privileges changed
            if user.role == 'Admin' and set(old_privileges) != set(privileges_list):
                email_sent = send_privilege_update_email(user, entity_id, privileges_list)
                logger.info(f"Privilege update email status: {email_sent}")
            
            return jsonify({
                'success': True,
                'message': 'Privileges updated successfully',
                'email_sent': email_sent
            }), 200
        else:
            # Create new privileges entry with a meaningful ID
            privilege_id = f"PRV-{user_id}-{entity_id}"
            new_privileges = Privileges(
                privilege_id=privilege_id,
                user_id=user_id,
                entity_id=entity_id,
                privileges_list=privileges_str
            )
            db.session.add(new_privileges)
            db.session.commit()
            logger.info(f"Added new privileges for user {user_id} in entity {entity_id}")
            
            # Send email notification if user is admin
            if user.role == 'Admin':
                email_sent = send_privilege_update_email(user, entity_id, privileges_list)
                logger.info(f"Privilege update email status: {email_sent}")
            
            return jsonify({
                'success': True,
                'message': 'Privileges added successfully',
                'email_sent': email_sent
            }), 201
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating privileges: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Error updating privileges: {str(e)}'
        }), 500

@app.route('/api/privileges/user_privileges/<user_id>', methods=['GET'])
def get_user_privileges(user_id):
    try:
        # Get entity_id from query parameters (optional)
        entity_id = request.args.get('entity_id')
        
        # Get user role first to check if they're Global
        user = Users.query.get(user_id)
        if user and user.role == 'Global':
            # Global users have all privileges by default
            return jsonify({
                'success': True,
                'privileges': ALL_PRIVILEGES,
                'entity_id': entity_id
            }), 200
        
        # For non-Global users, proceed with the regular privilege check
        if entity_id:
            # If entity_id is provided, get privileges for specific entity
            privileges = Privileges.query.filter_by(
                user_id=user_id,
                entity_id=entity_id
            ).first()
        else:
            # Otherwise, get privileges for any entity (first found)
            privileges = Privileges.query.filter_by(user_id=user_id).first()
        
        if privileges:
            # Convert comma-separated string back to list
            privileges_list = privileges.privileges_list.split(',') if privileges.privileges_list else []
            
            return jsonify({
                'success': True,
                'privileges': privileges_list,
                'entity_id': privileges.entity_id
            }), 200
        
        # No privileges found
        return jsonify({
            'success': True,
            'message': 'No privileges found',
            'privileges': [],
            'entity_id': entity_id
        }), 200
    
    except Exception as e:
        logger.error(f"Error fetching privileges: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': f'Error fetching privileges: {str(e)}',
            'privileges': []
        }), 500

@app.route('/api/privileges/delete_user_privileges/<user_id>', methods=['DELETE'])
def delete_user_privileges(user_id):
    try:
        # Get entity_id from query parameters (optional)
        entity_id = request.args.get('entity_id')
        
        # Check if user is Global - they automatically have all privileges
        user = Users.query.get(user_id)
        if user and user.role == 'Global':
            return jsonify({
                'success': True,
                'message': 'Global users have all privileges by default. No privileges were deleted.'
            }), 200
        
        if entity_id:
            # If entity_id is provided, delete privileges for specific entity
            privileges = Privileges.query.filter_by(
                user_id=user_id,
                entity_id=entity_id
            ).first()
        else:
            # Otherwise, delete privileges for any entity (first found)
            privileges = Privileges.query.filter_by(user_id=user_id).first()
        
        if privileges:
            db.session.delete(privileges)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Privileges deleted successfully'
            }), 200
        
        # No privileges found
        return jsonify({
            'success': False,
            'message': 'No privileges found for this user'
        }), 404
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error deleting privileges: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'message': f'Error deleting privileges: {str(e)}'
        }), 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'privileges-microservice',
        'version': '1.0.0'
    })

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

