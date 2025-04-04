@login_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.json
        user_id = data.get("user_id")
        password = data.get("password")

        # Find user by user_id
        user = Users.query.filter_by(user_id=user_id).first()

        if not user:
            return jsonify({"error": "Invalid user ID or password"}), 401

        # Check if password matches
        if user.password == password:  # In a real app, use proper password hashing
            # Get entity name
            entity = EntityMaster.query.filter_by(entity_id=user.entity_id).first()
            entity_name = entity.entity_name if entity else None

            # Check if user is a global admin based on role being "Global"
            is_global_admin = user.role == "Global"

            return jsonify({
                "success": True,
                "user_id": user.user_id,
                "user_name": user.user_name,
                "role": user.role,
                "entity_id": user.entity_id,
                "entity_name": entity_name,
                "is_global_admin": is_global_admin
            }), 200
        else:
            return jsonify({"error": "Invalid user ID or password"}), 401

    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({"error": "An error occurred during login"}), 500 