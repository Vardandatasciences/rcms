from flask import Blueprint, jsonify, request
from models import db
from models.models import RegulationMaster, EntityRegulation, Category,ActivityMaster
import traceback
from sqlalchemy.orm import aliased


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
    



@regulations_bp.route('/entity_regulations/<string:entity_id>', methods=['GET'])
def get_entity_regulations(entity_id):
    try:
        if not entity_id:
            return jsonify({"error": "Entity ID is required"}), 400
            
        # Query regulations assigned to the entity
        EntityRegulationAlias = aliased(EntityRegulation)
        RegulationMasterAlias = aliased(RegulationMaster)
        CategoryAlias = aliased(Category)

        entity_regulations = db.session.query(
                RegulationMasterAlias.regulation_id,
                RegulationMasterAlias.regulation_name,
                RegulationMasterAlias.regulatory_body,
                CategoryAlias.category_type,
                RegulationMasterAlias.internal_external,  # Fetch internal/external
                RegulationMasterAlias.national_international,  # Fetch national/international
                RegulationMasterAlias.mandatory_optional  # Fetch mandatory/optional
            )\
            .join(EntityRegulationAlias, RegulationMasterAlias.regulation_id == EntityRegulationAlias.regulation_id)\
            .join(CategoryAlias, RegulationMasterAlias.category_id == CategoryAlias.category_id)\
            .filter(
                EntityRegulationAlias.entity_id == entity_id,
                (EntityRegulationAlias.obsolete_current != 'O') | (EntityRegulationAlias.obsolete_current.is_(None))
            )\
            .all()

        print(entity_regulations)
        
        # Mapping the abbreviations to full text
        def map_values(value, mapping):
            return mapping.get(value, "Unknown")  # Default to "Unknown" if value not found
        
        internal_external_map = {"I": "Internal", "E": "External"}
        national_international_map = {"N": "National", "I": "International"}
        mandatory_optional_map = {"M": "Mandatory", "O": "Optional"}

        regulations_list = [{
            "regulation_id": reg_id,
            "regulation_name": reg_name,
            "regulatory_body": regulatory_body,
            "category_type": category_type,
            "internal_external": map_values(internal_external, internal_external_map),  # Convert abbreviation
            "national_international": map_values(national_international, national_international_map),  # Convert abbreviation
            "mandatory_optional": map_values(mandatory_optional, mandatory_optional_map)  # Convert abbreviation
        } for reg_id, reg_name, regulatory_body, category_type, internal_external, national_international, mandatory_optional in entity_regulations]

        print(regulations_list)
        
        return jsonify({"entity_regulations": regulations_list}), 200
        
    except Exception as e:
        print(f"Error fetching entity regulations: {str(e)}")
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
    
@regulations_bp.route('/add_entity_regulations', methods=['POST', 'OPTIONS'])
def add_entity_regulations():
    if request.method == 'OPTIONS':
        # Handle preflight request
        response = jsonify({'message': 'OK'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response
        
    try:
        data = request.json
        entity_id = data.get('entity_id')
        regulation_ids = data.get('regulation_ids', [])
        
        if not entity_id:
            return jsonify({"error": "Entity ID is required"}), 400
        
        if not regulation_ids:
            return jsonify({"error": "At least one regulation ID is required"}), 400
        
        # First, get all existing entity regulations
        existing_regulations = EntityRegulation.query.filter_by(entity_id=entity_id).all()
        existing_regulation_ids = [reg.regulation_id for reg in existing_regulations]
        
        # Identify regulations to add and remove
        regulations_to_add = [reg_id for reg_id in regulation_ids if reg_id not in existing_regulation_ids]
        regulations_to_remove = [reg_id for reg_id in existing_regulation_ids if reg_id not in regulation_ids]
        
        # Add new regulations
        for regulation_id in regulations_to_add:
            # Count mandatory and optional activities
            mandatory_count = ActivityMaster.query.filter(
                ActivityMaster.regulation_id == regulation_id,
                ActivityMaster.mandatory_optional == "M",
                (ActivityMaster.obsolete_current != "O") | (ActivityMaster.obsolete_current.is_(None))
            ).count()
            
            optional_count = ActivityMaster.query.filter(
                ActivityMaster.regulation_id == regulation_id,
                ActivityMaster.mandatory_optional == "O",
                (ActivityMaster.obsolete_current != "O") | (ActivityMaster.obsolete_current.is_(None))
            ).count()
            
            # Create new entity regulation
            new_entity_regulation = EntityRegulation(
                entity_id=entity_id,
                regulation_id=regulation_id,
                mandatory_activities=mandatory_count,
                optional_activities=optional_count,
                obsolete_current=None
            )
            db.session.add(new_entity_regulation)
        
        # Mark removed regulations as obsolete
        for regulation_id in regulations_to_remove:
            entity_regulation = EntityRegulation.query.filter_by(
                entity_id=entity_id,
                regulation_id=regulation_id
            ).first()
            
            if entity_regulation:
                entity_regulation.obsolete_current = 'O'
        
        db.session.commit()
        
        return jsonify({
            "message": "Entity regulations updated successfully",
            "added": len(regulations_to_add),
            "removed": len(regulations_to_remove)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print("Error:", str(e))
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500