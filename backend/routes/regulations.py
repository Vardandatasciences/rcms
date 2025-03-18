from flask import Blueprint, jsonify, request
from models import db
from models.models import RegulationMaster
import traceback

regulations_bp = Blueprint('regulations', __name__)

@regulations_bp.route('/regulations', methods=['GET'])
def get_regulations():
    try:
        regulations = RegulationMaster.query.filter(RegulationMaster.obsolete_current != 'O').all()

        regulations_list = [
            {
                "regulation_id": regulation.regulation_id,
                "regulation_name": regulation.regulation_name,
                "category_id": regulation.category_id,
                "regulatory_body": regulation.regulatory_body,
                "internal_external": regulation.internal_external,
                "national_international": regulation.national_international,
                "mandatory_optional": regulation.mandatory_optional,
                "effective_from": regulation.effective_from.strftime('%Y-%m-%d') if regulation.effective_from else None
            }
            for regulation in regulations
        ]

        return jsonify({"regulations": regulations_list}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500
    
@regulations_bp.route('/add_regulation', methods=['POST'])
def add_regulation():
    try:
        data = request.json
        print("Received Data:", data)  # Debugging

        # Ensure required fields exist
        required_fields = ["regulation_name", "category_id"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        # Extract first 4 letters of regulation name
        regulation_prefix = data["regulation_name"][:4].upper()

        # Find the highest existing regulation ID with the same prefix
        last_regulation = RegulationMaster.query.filter(
            RegulationMaster.regulation_id.like(f"{regulation_prefix}%")
        ).order_by(RegulationMaster.regulation_id.desc()).first()

        if last_regulation:
            last_number = int(last_regulation.regulation_id[4:])  # Extract number part
            new_number = last_number + 1
        else:
            new_number = 1

        # Generate new regulation_id
        regulation_id = f"{regulation_prefix}{new_number:03d}"  # Ensure 3-digit format

        # Create a new regulation object
        new_regulation = RegulationMaster(
            regulation_id=regulation_id,
            regulation_name=data["regulation_name"],
            category_id=data["category_id"],
            regulatory_body=data.get("regulatory_body", None),
            internal_external=data.get("internal_external", "I"),
            national_international=data.get("national_international", "N"),
            mandatory_optional=data.get("mandatory_optional", "M"),
            effective_from=data.get("effective_from", None),
            obsolete_current="C",
        )

        # Add to the database
        db.session.add(new_regulation)
        db.session.commit()

        return jsonify({"message": "Regulation added successfully", "regulation_id": regulation_id}), 201

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

@regulations_bp.route('/edit_regulation/<string:regulation_id>', methods=['PUT'])
def edit_regulation(regulation_id):
    try:
        data = request.json
        regulation = RegulationMaster.query.get(regulation_id)
        if not regulation:
            return jsonify({"error": "Regulation not found"}), 404

        # Update fields (excluding regulation_id & effective_from)
        regulation.regulation_name = data["regulation_name"]
        regulation.category_id = data["category_id"]
        regulation.regulatory_body = data["regulatory_body"]
        regulation.internal_external = data["internal_external"]
        regulation.national_international = data["national_international"]
        regulation.mandatory_optional = data["mandatory_optional"]

        db.session.commit()
        return jsonify({"message": "Regulation updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@regulations_bp.route('/delete_regulation/<string:regulation_id>', methods=['DELETE'])
def delete_regulation(regulation_id):
    try:
        regulation = RegulationMaster.query.get(regulation_id)
        if not regulation:
            return jsonify({"error": "Regulation not found"}), 404

        # Instead of deleting, mark as obsolete
        regulation.obsolete_current = "O"
        db.session.commit()

        return jsonify({"message": "Regulation deleted successfully"}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

@regulations_bp.route('/regulation_details/<string:regulation_id>', methods=['GET'])
def get_regulation_details(regulation_id):
    try:
        # Query regulation details
        regulation = RegulationMaster.query.filter_by(regulation_id=regulation_id).first()
        
        if not regulation:
            return jsonify({"error": "Regulation not found"}), 404
        
        # Convert to JSON response
        regulation_data = {
            "regulation_id": regulation.regulation_id,
            "regulation_name": regulation.regulation_name,
            "category_id": regulation.category_id,
            "regulatory_body": regulation.regulatory_body,
            "internal_external": regulation.internal_external,
            "national_international": regulation.national_international,
            "mandatory_optional": regulation.mandatory_optional,
            "effective_from": regulation.effective_from.strftime('%Y-%m-%d') if regulation.effective_from else None
        }
        
        return jsonify({"regulation": regulation_data}), 200
    
    except Exception as e:
        print("Error:", str(e))
        print(traceback.format_exc())  # Print full traceback for debugging
        return jsonify({"error": str(e)}), 500 