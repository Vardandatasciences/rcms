from flask import jsonify
from models import UserPrivileges, db

@app.route('/api/privileges/<user_id>', methods=['GET'])
def get_user_privileges(user_id):
    try:
        # Get user's privileges
        user_privileges = UserPrivileges.query.filter_by(user_id=user_id).all()
        
        if not user_privileges:
            # If no privileges found, return 'All' access
            return jsonify({
                'status': 'success',
                'privileges': ['All'],
                'entityPrivileges': {}
            })
        
        # Organize privileges by entity
        entity_privileges = {}
        global_privileges = []
        
        for priv in user_privileges:
            if priv.entity_id:
                if priv.entity_id not in entity_privileges:
                    entity_privileges[priv.entity_id] = []
                entity_privileges[priv.entity_id].append(priv.privilege_id)
            else:
                global_privileges.append(priv.privilege_id)
        
        return jsonify({
            'status': 'success',
            'privileges': global_privileges,
            'entityPrivileges': entity_privileges
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500 