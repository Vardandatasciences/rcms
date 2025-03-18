from flask import Blueprint, jsonify, request
from models import db
from models.models import HolidayMaster
import traceback

holidays_bp = Blueprint('holidays', __name__)

@holidays_bp.route("/holidays", methods=["GET"])
def get_holidays():
    try:
        holidays = HolidayMaster.query.filter(
            (HolidayMaster.obsolete_current != 'O') | (HolidayMaster.obsolete_current.is_(None))
        ).all()

        holidays_list = [
            {
                "holiday_date": holiday.holiday_date.strftime('%Y-%m-%d'),
                "description": holiday.description,
                "entity_id": holiday.entity_id,
            }
            for holiday in holidays
        ]

        return jsonify({"holidays": holidays_list}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500

@holidays_bp.route("/add_holiday", methods=["POST"])
def add_holiday():
    try:
        data = request.get_json()

        # Ensure all required fields are present
        if not data.get("holiday_date") or not data.get("description") or not data.get("entity_id"):
            return jsonify({"error": "Missing required fields"}), 400

        new_holiday = HolidayMaster(
            holiday_date=data["holiday_date"],
            description=data["description"],
            entity_id=data["entity_id"],
            obsolete_current="C",  # Mark as current by default
        )

        db.session.add(new_holiday)
        db.session.commit()

        return jsonify({"message": "Holiday added successfully"}), 201

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500
    
@holidays_bp.route("/delete_holiday/<string:holiday_date>/<string:entity_id>", methods=["DELETE"])
def delete_holiday(holiday_date, entity_id):
    try:
        holiday = HolidayMaster.query.filter_by(holiday_date=holiday_date, entity_id=entity_id).first()

        if not holiday:
            return jsonify({"error": "Holiday not found"}), 404

        # Instead of deleting, mark as obsolete
        holiday.obsolete_current = "O"
        db.session.commit()

        return jsonify({"message": "Holiday deleted successfully"}), 200

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": str(e)}), 500 