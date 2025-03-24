from flask import Flask, jsonify, render_template_string,send_file,request
import numpy as np
import mysql.connector
import pandas as pd
from datetime import datetime, timedelta
from flask_cors import CORS
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Database Connection Function
def connect_to_database():
    try:
        conn = mysql.connector.connect(
            host="202.53.78.150",
            user="Praharshitha",
            password="vardaa@123",
            database="pil_group",
            port=3306
        )
        cursor = conn.cursor(dictionary=True)
        return conn, cursor
    except mysql.connector.Error as err:
        print(f"Error connecting to MySQL: {err}")
        return None, None
    



def apply_time_filter(df, time_period):
    """
    Apply time-based filtering to the DataFrame
    
    Parameters:
    - df: Input DataFrame with task data
    - time_period: String indicating the time filter
    
    Returns:
    - Filtered DataFrame
    """
    current_date = pd.Timestamp.today().date()
    
    if time_period == 'Current Month':
        # Current month's range
        first_day_of_month = current_date.replace(day=1)
        last_day_of_month = (first_day_of_month + pd.offsets.MonthEnd(0)).date()
        
        filtered_df = df[
            (df['duedate'] >= first_day_of_month) & 
            (df['duedate'] <= last_day_of_month)
        ]
    
    elif time_period == 'Previous Month':
        # Previous full calendar month
        first_day_of_current_month = current_date.replace(day=1)
        last_day_of_previous_month = first_day_of_current_month - timedelta(days=1)
        first_day_of_previous_month = last_day_of_previous_month.replace(day=1)
        
        filtered_df = df[
            (df['duedate'] >= first_day_of_previous_month) & 
            (df['duedate'] <= last_day_of_previous_month)
        ]
    
    elif time_period == 'Next Month':
        # Next full calendar month
        first_day_of_next_month = (current_date.replace(day=1) + timedelta(days=32)).replace(day=1)
        last_day_of_next_month = (first_day_of_next_month + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        filtered_df = df[
            (df['duedate'] >= first_day_of_next_month) & 
            (df['duedate'] <= last_day_of_next_month)
        ]
    
    elif time_period == 'Previous 3 Months':
        # Previous 3 months from current date
        three_months_ago = current_date - timedelta(days=90)
        
        filtered_df = df[
            (df['duedate'] >= three_months_ago) & 
            (df['duedate'] <= current_date)
        ]
    
    else:
        # Default: return entire DataFrame
        filtered_df = df
    
    return filtered_df


def apply_internal_external_filter(df, internal_external):
    """
    Filter DataFrame based on the specified type in the 'internal_external' column.
    
    Parameters:
    -----------
    df : pandas.DataFrame
        Input DataFrame to be filtered
    type : str
        The type to filter by (e.g., 'internal' or 'external')
    
    Returns:
    --------
    pandas.DataFrame
        Filtered DataFrame containing only rows matching the specified type
    """
    if internal_external == 'External':
        df = df[df['internal_external'] == "E"]
        return df
    elif internal_external == 'Internal':
        df = df[df['internal_external'] == "I"]
        return df
    else:
        return df
    
def apply_mandatory_optional_filter(df, mandatory_optional):
    """
    Filter DataFrame based on the specified type in the 'mandatory_optional' column.
    
    Parameters:
    -----------
    df : pandas.DataFrame
        Input DataFrame to be filtered
    type : str
        The type to filter by (e.g., 'mandatory' or 'optional')
    
    Returns:
    --------
    pandas.DataFrame
        Filtered DataFrame containing only rows matching the specified type
    """
    if mandatory_optional == 'Mandatory':
        df = df[df['mandatory_optional'] == "M"]
        return df
    elif mandatory_optional == 'Optional':
        df = df[df['mandatory_optional'] == "O"]
        return df
    else:
        return df


# API to Fetch Task Summary Data
@app.route('/api/task-summary/<factory_id>', methods=['GET'])
def get_task_summary(factory_id):
    
    """Fetch categorized task counts for the task summary."""
    conn, cursor = connect_to_database()
    if not conn or not cursor:
        return jsonify({"error": "Database connection failed"}), 500
    
    user_id = request.args.get('user_id', 'All Users')
    # First check if the factory_id exists in the database
    verify_query = "SELECT entity_id FROM entity_master WHERE entity_id = %s"
    cursor.execute(verify_query, (factory_id,))
    if cursor.fetchone() is None:
        # If factory doesn't exist, return a helpful error
        return jsonify({"error": f"Factory ID '{factory_id}' not found in database"}), 404

    # Modified query to ensure distinct task counts
    # Added GROUP BY to prevent duplicate counting
    query = f"""
    SELECT 
        ert.id, 
        ert.entity_id, 
        ert.status, 
        ert.due_on AS duedate, 
        ert.end_date AS actual_date,
        ert.regulation_id, 
        ert.activity_id, 
        rm.category_id, 
        c.category_type AS category,
        rm.regulation_name,
        ert.criticality, 
        em.entity_name,
        ert.internal_external,
        ert.mandatory_optional,
        a.activity,
        ert.preparation_responsibility
    FROM 
        entity_regulation_tasks ert
    JOIN 
        regulation_master rm ON ert.regulation_id = rm.regulation_id
    JOIN 
        category c ON rm.category_id = c.category_id
    LEFT JOIN 
        entity_master em ON ert.entity_id = em.entity_id
    LEFT JOIN 
        activity_master a ON ert.activity_id = a.activity_id
    WHERE 
        ert.entity_id = %s
    """
    
    # Add User Filter if Selected
    if user_id != 'All Users':
        print("Filtering by user_id:", user_id)
        query += " AND ert.preparation_responsibility = %s"
        cursor.execute(query, (factory_id, user_id))
    else:
        
        cursor.execute(query, (factory_id,))
    
    records = cursor.fetchall()
    conn.close()

    if not records:
        # Return an empty response structure when no tasks are found
        empty_response = {
            "total_tasks": 0,
            "completed": 0,
            "completed_with_delay": 0,
            "ongoing": 0,
            "ongoing_with_delay": 0,
            "due": 0,
            "due_with_delay": 0,
            "category_data": {},
            "category_totals": {},
            "criticality_data": {},
            "detailed_data": []
        }
        return jsonify(empty_response)

    # Convert to DataFrame for easier manipulation
    df = pd.DataFrame(records)

    # Remove any duplicates based on the id column
    df = df.drop_duplicates(subset=['id'])

    # Ensure date conversion
    current_date = pd.Timestamp.today().date()
    df['duedate'] = pd.to_datetime(df['duedate'], errors='coerce').dt.date
    df['actual_date'] = pd.to_datetime(df['actual_date'], errors='coerce').dt.date

    # Categorizing the task status
    df['task_status'] = np.select(
        [
            (df['status'] == 'WIP') & (df['duedate'] >= current_date),
            (df['status'] == 'WIP') & (df['duedate'] < current_date),
            (df['status'] == 'Completed') & (df['actual_date'] <= df['duedate']),
            (df['status'] == 'Completed') & (df['actual_date'] > df['duedate']),
            (df['status'] == 'Yet to Start') & (df['duedate'] >= current_date),
            (df['status'] == 'Yet to Start') & (df['duedate'] < current_date)
        ],
        [
            'Ongoing', 'Ongoing with Delay', 'Completed', 'Completed with Delay', 'Due', 'Due with Delay'
        ],
        default='Unknown'
    )
    
    # Get time period from query parameters
    time_period = request.args.get('time_period', 'All')
    
    internal_external=request.args.get('internal_external', 'All')
    
    mandatory_optional=request.args.get('mandatory_optional', 'All')
    
    
    
    
    

    # Apply time filtering
    df = apply_time_filter(df, time_period)
    
    # print(df.columns,'---------------------------------------------------')
    df=apply_internal_external_filter(df,internal_external)
    
    df=apply_mandatory_optional_filter(df,mandatory_optional)

    # Handle missing criticality values
    if 'criticality' not in df.columns:
        df['criticality'] = 'Not Specified'
    else:
        df['criticality'] = df['criticality'].fillna('Not Specified')

    # Counting each category - using value_counts to ensure correct counting
    status_counts = df['task_status'].value_counts().to_dict()

    # Generate category-wise status counts
    category_status_df = df.groupby(['category', 'task_status']).size().reset_index(name='count')
    
    # Convert to a format suitable for the frontend
    category_data = {}
    for _, row in category_status_df.iterrows():
        category = row['category']
        status = row['task_status']
        count = int(row['count'])
        
        if category not in category_data:
            category_data[category] = {}
        
        category_data[category][status] = count

    # Calculate total tasks in each category
    category_totals = df.groupby('category').size().to_dict()

    # Generate criticality counts
    criticality_counts = df.groupby(['criticality', 'task_status']).size().reset_index(name='count')
    
    # Convert to a format suitable for the frontend
    criticality_data = {}
    for _, row in criticality_counts.iterrows():
        criticality = row['criticality']
        status = row['task_status']
        count = int(row['count'])
        
        if criticality not in criticality_data:
            criticality_data[criticality] = {}
        
        criticality_data[criticality][status] = count

    # Generate detailed records for the table
    detailed_data = []
    for _, row in df.iterrows():
        detailed_data.append({
            "Entity": row.get('entity_name', row.get('entity_id', 'Un   known')),
            "criticality": row['criticality'],
            "Task": row.get('activity', row.get('regulation_name', 'Unknown Task')),
            "calculated_status": row['task_status'],
            "category": row['category'],
            "regulation": row.get('regulation_name', 'Unknown')
        })

    task_summary = {
        "total_tasks": len(df),
        "completed": status_counts.get("Completed", 0),
        "completed_with_delay": status_counts.get("Completed with Delay", 0),
        "ongoing": status_counts.get("Ongoing", 0),
        "ongoing_with_delay": status_counts.get("Ongoing with Delay", 0),
        "due": status_counts.get("Due", 0),
        "due_with_delay": status_counts.get("Due with Delay", 0),
        "category_data": category_data,
        "category_totals": category_totals,
        "criticality_data": criticality_data,
        "detailed_data": detailed_data
    }

    return jsonify(task_summary)

@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        # Establish database connection
        conn, cursor = connect_to_database()
        if not conn or not cursor:
            return jsonify({"error": "Database connection failed"}), 500

        # Query to fetch non-obsolete users
        query = """
            SELECT user_id, user_name
            FROM users
            WHERE obsolete_current = 'Y'
            ORDER BY user_name
        """
        
        cursor.execute(query)
        users = [{"id": row["user_id"], "name": row["user_name"]} for row in cursor.fetchall()]
        
        # Close database connection
        cursor.close()
        conn.close()
        
        return jsonify(users)
    
    except Exception as e:
        print(f"Detailed error: {str(e)}")  # Log the full error
        import traceback
        traceback.print_exc()  # Print full traceback for debugging
        return jsonify({"error": str(e)}), 500  # Return full error message to client

# Flask Route Serving HTML with Embedded React
@app.route('/')
def serve_react():
    return send_file("templates/index.html")

if __name__ == '__main__':
    app.run(debug=True)
