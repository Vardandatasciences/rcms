from flask import Blueprint, request, jsonify
from services.email_service import send_admin_welcome_email
from models import db
from models.models import Entity, Users  # Make sure to import your models

entity_routes = Blueprint('entity_routes', __name__)

@entity_routes.route('/add_entity', methods=['POST'])
def add_entity():
    try:
        data = request.json
        
        # Create new entity
        new_entity = Entity(
            entity_name=data['entity_name'],
            location=data['location'],
            contact_name=data['contact_name'],
            contact_phno=data['contact_phno'],
            alternate_contact_name=data['alternate_contact_name'],
            alternate_contact=data['alternate_contact'],
            description=data['description'],
            country=data['country'],
            state=data['state'],
            pincode=data['pincode']
        )
        
        db.session.add(new_entity)
        db.session.flush()  # This will generate the entity_id
        
        # Create admin user for the entity
        admin_user = Users(
            user_name=data['contact_name'],
            email_id=data['admin_email'],
            password=data['admin_password'],
            role='Admin',
            entity_id=new_entity.entity_id
        )
        
        db.session.add(admin_user)
        db.session.commit()
        
        # Send welcome email
        try:
            send_admin_welcome_email(
                admin_email=data['admin_email'],
                admin_name=data['contact_name'],
                entity_id=new_entity.entity_id,
                admin_password=data['admin_password'],
                entity_name=data['entity_name']
            )
        except Exception as email_error:
            # Log email error but don't fail the entity creation
            print(f"Email sending failed: {str(email_error)}")
        
        return jsonify({
            "message": "Entity added successfully",
            "entity_id": new_entity.entity_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error adding entity: {str(e)}")
        return jsonify({"error": str(e)}), 500 