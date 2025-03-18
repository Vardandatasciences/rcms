from flask import Blueprint, jsonify, request
from models import db
from models.models import Users, EntityMaster
from sqlalchemy import or_
import traceback

users_bp = Blueprint('users', __name__)

@users_bp.route('/users', methods=['GET'])
def get_users():
    try:
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
        return jsonify({"users": users_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@users_bp.route('/add_user', methods=['POST'])
def add_user():
    try:
        data = request.json
        print("Received Data:", data)  # Debugging

        # Ensure all required fields exist, including user_id
        required_fields = ["user_id", "entity_id", "user_name", "mobile_no", "email_id", "password", "role"]
        
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        # Check if user_id already exists
        existing_user = Users.query.get(data["user_id"])
        if existing_user:
            return jsonify({"error": "User ID already exists"}), 409  # Conflict error

        # Create a new user object
        new_user = Users(**data)

        # Add to the database
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "User added successfully"}), 201

    except Exception as e:
        print("Error:", traceback.format_exc())  # Debugging
        return jsonify({"error": str(e)}), 500

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

@users_bp.route('/entity_users/<string:entity_id>', methods=['GET'])
def get_entity_users(entity_id):
    try:
        # Use SQLAlchemy to query users for the specified entity
        users = Users.query.filter(
            Users.entity_id == entity_id,
            or_(Users.obsolete_current != "O", Users.obsolete_current.is_(None))
        ).all()
        
        # Convert to JSON response
        users_list = [
            {
                "user_id": user.user_id,
                "user_name": user.user_name,
                "email_id": user.email_id,
                "role": user.role
            }
            for user in users
        ]
        
        return jsonify({"users": users_list}), 200
    
    except Exception as e:
        print("Error:", str(e))
        print(traceback.format_exc())  # Print full traceback for debugging
        return jsonify({"error": str(e)}), 500 