from flask import Flask, jsonify, request, session  # <-- Add session import
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import traceback,os
from sqlalchemy import func, text
from models import *
from datetime import datetime
import bcrypt
from dateutil.relativedelta import relativedelta
from sqlalchemy import or_
from sqlalchemy.orm import aliased


@app.route('/entity_users_admin/<string:entity_id>', methods=['GET'])
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
    

    # API Route to Fetch All Entities
@app.route('/entities', methods=['GET'])
def get_entities():
    try:
        # Ensure filtering out entities where obsolete_current = 'O'
        entities = EntityMaster.query.filter((EntityMaster.obsolete_current != "O") | (EntityMaster.obsolete_current.is_(None))).all()
        
        entity_list = [
            {
                "entity_id": entity.entity_id,
                "entity_name": entity.entity_name,
                "location": entity.location,
                "contact_phno": entity.contact_phno,
                "alternate_contact": entity.alternate_contact,
                "description": entity.description,
                "country": entity.country,
                "contact_name": entity.contact_name,
                "alternate_contact_name": entity.alternate_contact_name,
                "state": entity.state,
                "pincode": entity.pincode
            }
            for entity in entities
        ]
        return jsonify({"entities": entity_list}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/country_codes', methods=['GET'])
def get_country_codes():
    try:
        # Fetch all country codes
        countries = CountryCodes.query.all()
        
        # Convert to JSON response
        countries_list = [
            {
                "country": country.country,
                "country_code": country.country_code
            }
            for country in countries
        ]
        
        # Sort by country name, but put India first
        countries_list.sort(key=lambda x: (0 if x["country"].lower() == "india" else 1, x["country"]))
        
        return jsonify({"countries": countries_list}), 200
    
    except Exception as e:
        print("Error:", str(e))
        print(traceback.format_exc())  # Print full traceback for debugging
        return jsonify({"error": str(e)}), 500

@app.route('/add_user', methods=['POST'])
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

        # If password is not already hashed, hash it with bcrypt
        if not data["password"].startswith('$2b$'):
            hashed_password = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt())
            data["password"] = hashed_password.decode('utf-8')

        # Create a new user object
        new_user = Users(**data)

        # Add to the database
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "User added successfully"}), 201

    except Exception as e:
        print("Error:", traceback.format_exc())  # Debugging
        return jsonify({"error": str(e)}), 500

@app.route('/update_user/<user_id>', methods=['PUT'])
def update_user(user_id):
    try:
        user = Users.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.json

        # If password is being updated and not already hashed, hash it with bcrypt
        if "password" in data and data["password"] and not data["password"].startswith('$2b$'):
            hashed_password = bcrypt.hashpw(data["password"].encode('utf-8'), bcrypt.gensalt())
            data["password"] = hashed_password.decode('utf-8')

        # Update only provided fields
        for key, value in data.items():
            setattr(user, key, value)

        db.session.commit()
        return jsonify({"message": "User updated successfully"}), 200

    except Exception as e:
        print("Error:", traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/delete_user/<user_id>', methods=['DELETE'])
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