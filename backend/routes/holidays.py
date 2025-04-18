from flask import Blueprint, jsonify, request
from models import db
from models.models import HolidayMaster
import traceback
from datetime import datetime
from sqlalchemy import text

holidays_bp = Blueprint('holidays', __name__)

@holidays_bp.route("/holidays/<string:entity_id>", methods=["GET"])
def get_holidays(entity_id):
    try:
        # Check authorization
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Authorization header missing"}), 401
            
        # In a real app, verify the token and check permissions
        # For now, we'll continue with the request
        
        # Only get holidays that are not marked as obsolete (O)
        holidays = HolidayMaster.query.filter(
            HolidayMaster.entity_id == entity_id,
            HolidayMaster.obsolete_current != 'O'
        ).all()

        holidays_list = []
        for holiday in holidays:
            # Ensure consistent date formatting
            holiday_date = holiday.holiday_date
            
            # Convert to datetime if it's a string
            if isinstance(holiday_date, str):
                try:
                    holiday_date = datetime.strptime(holiday_date, '%Y-%m-%d')
                except ValueError:
                    # If parsing fails, use the date as is
                    formatted_date = holiday_date
                    holidays_list.append({
                        "holiday_date": formatted_date,
                        "description": holiday.description,
                        "entity_id": holiday.entity_id,
                    })
                    continue
            
            # Format the date to YYYY-MM-DD string
            formatted_date = holiday_date.strftime('%Y-%m-%d') if hasattr(holiday_date, 'strftime') else str(holiday_date)
            
            holidays_list.append({
                "holiday_date": formatted_date,
                "description": holiday.description,
                "entity_id": holiday.entity_id,
            })

        print(f"Found {len(holidays_list)} active holidays for entity {entity_id}")
        return jsonify({"holidays": holidays_list}), 200

    except Exception as e:
        print("Error fetching holidays:", str(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@holidays_bp.route("/add_holiday", methods=["POST"])
def add_holiday():
    try:
        data = request.get_json()
        print("Received holiday data:", data)  # Debug log

        # Ensure all required fields are present
        if not data.get("holiday_date") or not data.get("description") or not data.get("entity_id"):
            return jsonify({"error": "Missing required fields"}), 400

        # Check if holiday already exists for this entity and date
        existing_holiday = HolidayMaster.query.filter_by(
            holiday_date=data["holiday_date"],
            entity_id=data["entity_id"],
            obsolete_current=''
        ).first()

        if existing_holiday:
            return jsonify({"error": "Holiday already exists for this date and entity"}), 400

        # Parse date if it's a string (from frontend)
        holiday_date = data["holiday_date"]
        if isinstance(holiday_date, str):
            try:
                holiday_date = datetime.strptime(holiday_date, '%Y-%m-%d')
            except ValueError:
                return jsonify({"error": f"Invalid date format: {holiday_date}. Use YYYY-MM-DD."}), 400

        new_holiday = HolidayMaster(
            holiday_date=holiday_date,
            description=data["description"],
            entity_id=data["entity_id"],
            obsolete_current="",  # Mark as current by default
        )

        db.session.add(new_holiday)
        db.session.commit()

        return jsonify({"message": "Holiday added successfully"}), 201

    except Exception as e:
        print("Error adding holiday:", str(e))
        traceback.print_exc()  # Print the full stack trace
        return jsonify({"error": str(e)}), 500
    
@holidays_bp.route("/delete_holiday/<string:holiday_date>/<string:entity_id>", methods=["DELETE"])
def delete_holiday(holiday_date, entity_id):
    try:
        print(f"Attempting to delete holiday: date={holiday_date}, entity={entity_id}")
        
        # Get user info from request
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Authorization header missing"}), 401
            
        # Check user privileges (typically would verify token and extract user info)
        # This is a simplified check - in a real app, you'd verify the token
        # and extract the user's role and privileges
        
        # Try multiple query approaches to find the holiday
        holiday = None
        
        # First attempt: Try to find the holiday using direct date filtering
        try:
            parsed_date = datetime.strptime(holiday_date, '%Y-%m-%d').date()
            holiday = HolidayMaster.query.filter(
                HolidayMaster.holiday_date == parsed_date,
                HolidayMaster.entity_id == entity_id,
            ).first()
            
            if holiday:
                print(f"Found holiday with parsed date: {parsed_date}")
        except Exception as e:
            print(f"First attempt error: {str(e)}")
        
        # Second attempt: Try SQL with a more flexible date comparison
        if not holiday:
            try:
                sql = text("""
                    SELECT * FROM holiday_master 
                    WHERE entity_id = :entity_id 
                    AND DATE(holiday_date) = DATE(:holiday_date)
                """)
                
                result = db.session.execute(sql, {"entity_id": entity_id, "holiday_date": holiday_date})
                record = result.fetchone()
                
                if record:
                    print(f"Found holiday with raw SQL: {record}")
                    # Get the actual HolidayMaster object
                    date_from_result = record[0]  # Assuming holiday_date is the first column
                    holiday = HolidayMaster.query.filter_by(
                        holiday_date=date_from_result,
                        entity_id=entity_id
                    ).first()
            except Exception as sql_error:
                print(f"Second attempt error: {str(sql_error)}")
                traceback.print_exc()
        
        # Third attempt: Try parsing with different date formats
        if not holiday:
            try:
                # Try various date formats
                date_formats = ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d']
                for fmt in date_formats:
                    try:
                        parsed_date = datetime.strptime(holiday_date, fmt).date()
                        holiday = HolidayMaster.query.filter(
                            HolidayMaster.holiday_date == parsed_date,
                            HolidayMaster.entity_id == entity_id,
                        ).first()
                        if holiday:
                            print(f"Found holiday with alternative format: {parsed_date}")
                            break
                    except ValueError:
                        continue
            except Exception as e:
                print(f"Third attempt error: {str(e)}")
        
        if not holiday:
            print(f"Holiday not found: date={holiday_date}, entity={entity_id}")
            return jsonify({"error": "Holiday not found"}), 404

        print(f"Found holiday to delete: {holiday.holiday_date} - {holiday.description}")
        
        # Mark as obsolete
        holiday.obsolete_current = "O"
        db.session.commit()
        print("Holiday marked as obsolete successfully")

        return jsonify({"message": "Holiday deleted successfully"}), 200

    except Exception as e:
        print("Error deleting holiday:", str(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500 