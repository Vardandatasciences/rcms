from flask import Blueprint, request, jsonify
from models.models import Privileges, db
from sqlalchemy.exc import SQLAlchemyError
import logging
import uuid
import traceback

privileges_bp = Blueprint('privileges', __name__)

@privileges_bp.route('/add_user_privileges', methods=['POST'])
def add_user_privileges():
    try:
        data = request.json
        user_id = data.get('user_id')
        entity_id = data.get('entity_id')
        privileges_list = data.get('privileges', [])
        
        # Convert list to comma-separated string
        privileges_str = ','.join(privileges_list) if privileges_list else ''
        
        # Generate a more meaningful privilege_id based on user_id and entity_id
        # Format: PRV-{user_id}-{entity_id}
        privilege_id = f"PRV-{user_id}-{entity_id}"
        logging.info(f"Generated privilege_id: {privilege_id}")
        
        # Check if privileges already exist for this user and entity
        existing_privileges = Privileges.query.filter_by(
            user_id=user_id, 
            entity_id=entity_id
        ).first()
        
        if existing_privileges:
            # Update existing privileges
            existing_privileges.privileges_list = privileges_str
            db.session.commit()
            logging.info(f"Updated privileges for user {user_id} in entity {entity_id}")
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
            logging.info(f"Added new privileges for user {user_id} in entity {entity_id}")
            
            return jsonify({
                'success': True,
                'message': 'Privileges added successfully'
            }), 201
    
    except SQLAlchemyError as e:
        db.session.rollback()
        logging.error(f"Database error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Database error: {str(e)}'
        }), 500
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error saving privileges: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error saving privileges: {str(e)}'
        }), 500

@privileges_bp.route('/update_user_privileges', methods=['POST'])
def update_user_privileges():
    try:
        data = request.json
        user_id = data.get('user_id')
        entity_id = data.get('entity_id')
        privileges_list = data.get('privileges', [])
        
        # Convert list to comma-separated string
        privileges_str = ','.join(privileges_list) if privileges_list else ''
        
        # Check if privileges exist for this user and entity
        existing_privileges = Privileges.query.filter_by(
            user_id=user_id, 
            entity_id=entity_id
        ).first()
        
        if existing_privileges:
            # Update existing privileges
            existing_privileges.privileges_list = privileges_str
            db.session.commit()
            logging.info(f"Updated privileges for user {user_id} in entity {entity_id}")
            return jsonify({
                'success': True,
                'message': 'Privileges updated successfully'
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
            logging.info(f"Added new privileges for user {user_id} in entity {entity_id}")
            
            return jsonify({
                'success': True,
                'message': 'Privileges added successfully'
            }), 201
    
    except SQLAlchemyError as e:
        db.session.rollback()
        logging.error(f"Database error: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Database error: {str(e)}'
        }), 500
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error updating privileges: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error updating privileges: {str(e)}'
        }), 500

@privileges_bp.route('/user_privileges/<user_id>', methods=['GET'])
def get_user_privileges(user_id):
    try:
        # Get entity_id from query parameters (optional)
        entity_id = request.args.get('entity_id')
        
        logging.info(f"Fetching privileges for user_id: {user_id}, entity_id: {entity_id}")
        
        if entity_id:
            # If entity_id is provided, get privileges for specific entity
            logging.info(f"Looking for privileges with user_id={user_id} and entity_id={entity_id}")
            privileges = Privileges.query.filter_by(
                user_id=user_id,
                entity_id=entity_id
            ).first()
        else:
            # Otherwise, get privileges for any entity (first found)
            logging.info(f"Looking for privileges with user_id={user_id} (any entity)")
            privileges = Privileges.query.filter_by(user_id=user_id).first()
        
        if privileges:
            logging.info(f"Found privileges: {privileges.privileges_list}")
            # Convert comma-separated string back to list
            privileges_list = privileges.privileges_list.split(',') if privileges.privileges_list else []
            
            return jsonify({
                'success': True,
                'privileges': privileges_list,
                'entity_id': privileges.entity_id
            }), 200
        
        # No privileges found
        logging.info(f"No privileges found for user_id: {user_id}")
        return jsonify({
            'success': True,
            'privileges': [],
            'entity_id': entity_id
        }), 200
    
    except Exception as e:
        logging.error(f"Error fetching privileges: {str(e)}")
        logging.error(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'message': f'Error fetching privileges: {str(e)}',
            'privileges': []
        }), 500

@privileges_bp.route('/delete_user_privileges/<user_id>', methods=['DELETE'])
def delete_user_privileges(user_id):
    try:
        # Get entity_id from query parameters (optional)
        entity_id = request.args.get('entity_id')
        
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
        logging.error(f"Error deleting privileges: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error deleting privileges: {str(e)}'
        }), 500 