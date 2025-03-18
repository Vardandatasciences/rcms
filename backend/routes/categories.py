from flask import Blueprint, jsonify, request
from models import db
from models.models import Category
import traceback

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/categories', methods=['GET'])
def get_categories():
    try:
        categories = Category.query.filter(
            (Category.obsolete_current != "O") | (Category.obsolete_current.is_(None))
        ).all()
        
        category_list = [
            {
                "category_id": category.category_id,
                "category_type": category.category_type,
                "remarks": category.Remarks,
            }
            for category in categories
        ]
        return jsonify({"categories": category_list}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

@categories_bp.route('/add_category', methods=['POST'])
def add_category():
    try:
        data = request.json
        print("Received Data:", data)  # Debugging

        # Ensure required field exists
        if "category_type" not in data:
            return jsonify({"error": "Missing field: category_type"}), 400

        # Create a new category object (ID is auto-incremented)
        new_category = Category(
            category_type=data["category_type"],
            Remarks=data.get("remarks", None),
            obsolete_current=None,  # New categories are active
        )

        # Add to the database
        db.session.add(new_category)
        db.session.commit()

        return jsonify({"message": "Category added successfully"}), 201

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500
    
@categories_bp.route('/delete_category/<int:category_id>', methods=['DELETE', 'OPTIONS'])
def delete_category(category_id):
    if request.method == "OPTIONS":
        return jsonify({"message": "Preflight request successful"}), 200

    try:
        category = Category.query.get(category_id)
        if not category:
            return jsonify({"error": "Category not found"}), 404

        # Instead of deleting, mark as obsolete
        category.obsolete_current = "O"
        db.session.commit()

        return jsonify({"message": "Category deleted successfully"}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500 