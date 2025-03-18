from flask import Blueprint, jsonify, request, session
from models import db
from models.models import Users, EntityMaster
import traceback
import bcrypt

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
        
    try:
        data = request.json
        user_id = data.get('user_id')
        password = data.get('password')

        if not user_id or not password:
            return jsonify({"error": "User ID and password are required"}), 400

        # Find the user
        user = Users.query.filter_by(user_id=user_id).first()

        if not user:
            return jsonify({"error": "Invalid credentials"}), 401

        # Check if user is obsolete
        if user.obsolete_current == 'O':
            return jsonify({"error": "This user account is inactive"}), 401

        # For testing purposes - print the stored password
        print(f"Stored password: {user.password}")
        print(f"Provided password: {password}")
        
        # Check if the password is stored in plain text (for backward compatibility)
        if user.password == password:
            # Password matches directly - this is for backward compatibility
            pass
        else:
            # Check if it's a bcrypt hash (starts with $2b$)
            password_match = False
            
            try:
                if user.password.startswith('$2b$'):
                    # It's a bcrypt hash
                    password_match = bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8'))
                else:
                    # Try other hashing methods
                    import hashlib
                    # Method 1: Check if it's a simple MD5 hash
                    md5_hash = hashlib.md5(password.encode()).hexdigest()
                    if user.password == md5_hash:
                        password_match = True
                    else:
                        # Method 2: Check if it's a SHA-256 hash
                        sha256_hash = hashlib.sha256(password.encode()).hexdigest()
                        if user.password == sha256_hash:
                            password_match = True
            except Exception as e:
                print(f"Error checking password: {str(e)}")
                password_match = False
                
            if not password_match:
                return jsonify({"error": "Invalid credentials"}), 401

        # Get entity name
        entity = EntityMaster.query.get(user.entity_id)
        entity_name = entity.entity_name if entity else "Unknown Entity"

        # Return user data
        return jsonify({
            "user_id": user.user_id,
            "entity_id": user.entity_id,
            "entity_name": entity_name,
            "user_name": user.user_name,
            "role": user.role,
            "message": "Login successful"
        }), 200

    except Exception as e:
        print("Login error:", str(e))
        print(traceback.format_exc())  # Print full traceback for debugging
        return jsonify({"error": "An error occurred during login"}), 500 