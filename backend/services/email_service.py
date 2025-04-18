import os
import requests
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from msal import ConfidentialClientApplication
from datetime import datetime
import logging
from models import db
from models.models import MessageQueue, Users
import traceback

# Microsoft App configurations
CLIENT_ID = '1a9a4d27-4a49-400d-9bfb-a6cfa08f1b15'
CLIENT_SECRET = 'YUI8Q~svY7gzjgY6uGqpVKV1gTtbiYhj5fLPEdms'
TENANT_ID = 'aa7c8c45-41a3-4453-bc9a-3adfe8ff5fb6'
AUTHORITY = f'https://login.microsoftonline.com/{TENANT_ID}'
REDIRECT_URI = 'http://localhost:5000/getAToken'
SCOPES = ['https://graph.microsoft.com/.default']

# Microsoft Graph API Base URL
GRAPH_API_ENDPOINT = 'https://graph.microsoft.com/v1.0'

# SMTP Configuration - Office 365 settings
SMTP_SERVER = "smtp.office365.com"  # Office 365 SMTP server
SMTP_PORT = 587
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "preethi.b@vardaanglobal.com")  # Use environment variable if available
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")  # Should be loaded from environment variables
DEFAULT_SENDER = "preethi.b@vardaanglobal.com"

# MSAL Client Application
app_msal = ConfidentialClientApplication(
    CLIENT_ID,
    authority=AUTHORITY,
    client_credential=CLIENT_SECRET,
)

# Helper function to get access token
def get_access_token():
    """
    Get access token for Microsoft Graph API
    
    Returns:
        str: Access token if successful, None otherwise
    """
    try:
        logging.info("Attempting to acquire access token from Microsoft Graph API")
        result = app_msal.acquire_token_for_client(scopes=SCOPES)
        
        if 'access_token' in result:
            logging.info("Successfully acquired access token for Microsoft Graph API")
            return result['access_token']
        else:
            error = result.get('error', 'unknown_error')
            error_desc = result.get('error_description', 'No description available')
            corr_id = result.get('correlation_id', 'No correlation ID')
            error_codes = result.get('error_codes', [])
            
            logging.error(f"Token retrieval failed: {error}, {error_desc}")
            logging.error(f"Correlation ID: {corr_id}")
            logging.error(f"Error Codes: {error_codes}")
            
            # Log more details about each error code
            if error_codes:
                for code in error_codes:
                    logging.error(f"Error code {code} details: {get_error_code_details(code)}")
            
            return None
    except Exception as e:
        logging.error(f"Exception during token retrieval: {str(e)}")
        logging.error(f"Exception type: {type(e).__name__}")
        logging.error(f"Traceback: {traceback.format_exc()}")
    return None

def get_error_code_details(error_code):
    """
    Get details about Microsoft Graph API error codes
    
    Args:
        error_code: The error code
        
    Returns:
        str: Description of the error code
    """
    error_details = {
        # Authentication errors
        "7000215": "Invalid client secret provided",
        "7000222": "The provided client secret keys are expired",
        "90002": "Tenant is not allowed to access this application",
        "50076": "Due to a configuration change made by your administrator, or because you moved to a new location, you must use multi-factor authentication to access",
        "700016": "The application wasn't found in the directory",
        "700082": "The refresh token has expired due to inactivity",
        
        # Authorization errors
        "65001": "The user or administrator has not consented to use the application",
        "500011": "The resource principal named was not found in the tenant",
        "500021": "The user account doesn't exist in the directory",
        
        # Rate limiting
        "700020": "Rate limit exceeded",
        "700016": "Application not found in directory"
    }
    
    return error_details.get(str(error_code), "Unknown error code")

def create_calendar_event(subject, start_datetime, end_datetime, attendees, description):
    access_token = get_access_token()
    if not access_token:
        logging.error("Could not retrieve access token.")
        return

    url = f"{GRAPH_API_ENDPOINT}/users/{attendees[0]}/events"  # Use the email address of the user
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }

    event = {
        "subject": subject,
        "start": {
            "dateTime": start_datetime,
            "timeZone": "UTC"
        },
        "end": {
            "dateTime": end_datetime,
            "timeZone": "UTC"
        },
        "attendees": [
            {
                "emailAddress": {
                    "address": email
                },
                "type": "required"
            } for email in attendees
        ],
        "body": {
            "contentType": "HTML",
            "content": description
        }
    }

    response = requests.post(url, json=event, headers=headers)
    if response.status_code == 201:
        logging.info("Calendar event created successfully!")
    else:
        logging.error(f"Error creating event: {response.status_code}, {response.text}")

def send_smtp_email(subject, html_body, recipient_email, sender_email=None):
    """
    Send an email using SMTP
    
    Args:
        subject: Email subject
        html_body: HTML email body
        recipient_email: Recipient's email address
        sender_email: Sender's email address (optional)
    
    Returns:
        bool: True if successful, False otherwise
    """
    if not sender_email:
        sender_email = DEFAULT_SENDER
        
    try:
        logging.info(f"Attempting to send email via SMTP to {recipient_email}")
        
        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = subject
        
        # Attach HTML body
        msg.attach(MIMEText(html_body, 'html'))
        
        # Try to connect to the server using environment variables or defaults
        smtp_server = os.environ.get("SMTP_SERVER", SMTP_SERVER)
        smtp_port = int(os.environ.get("SMTP_PORT", SMTP_PORT))
        smtp_username = os.environ.get("SMTP_USERNAME", SMTP_USERNAME)
        smtp_password = os.environ.get("SMTP_PASSWORD", SMTP_PASSWORD)
        
        logging.info(f"Connecting to SMTP server: {smtp_server}:{smtp_port}")
        
        # Connect to server and send
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        
        logging.info(f"Email sent successfully to {recipient_email} via SMTP!")
        return True
        
    except Exception as e:
        logging.error(f"SMTP email sending failed: {str(e)}")
        return False

def log_email_to_file(subject, body, recipient_email, sender_email):
    """
    Save email content to a file for debugging when actual sending fails
    
    Args:
        subject: Email subject
        body: HTML email body
        recipient_email: Recipient's email address
        sender_email: Sender's email address
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Create logs directory if it doesn't exist
        log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'logs')
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
        
        # Create a unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"email_{timestamp}_{recipient_email.replace('@', '_at_').replace('.', '_')}.html"
        file_path = os.path.join(log_dir, filename)
        
        # Create a log entry with all the email details
        log_content = f"""
        <!--
        TO: {recipient_email}
        FROM: {sender_email}
        SUBJECT: {subject}
        DATE: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        -->
        
        {body}
        """
        
        # Write to file
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(log_content)
            
        logging.info(f"Email content saved to file: {file_path}")
        return True
    
    except Exception as e:
        logging.error(f"Failed to save email to file: {str(e)}")
        return False

def send_email(subject, body, recipient_email, sender_email=None):
    """
    Send an email using Microsoft Graph API with SMTP fallback
    
    Args:
        subject: Email subject
        body: HTML email body
        recipient_email: Recipient's email address
        sender_email: Sender's email address (optional)
    
    Returns:
        bool: True if successful, False otherwise
    """
    if not sender_email:
        sender_email = DEFAULT_SENDER
        
    # Detailed logging
    logging.info(f"Attempting to send email to {recipient_email}")
    logging.info(f"Email subject: {subject}")
    
    # First try direct SMTP as the most reliable method
    smtp_success = send_smtp_email(subject, body, recipient_email, sender_email)
    if smtp_success:
        return True
        
    # If SMTP fails, try Microsoft Graph API
    try:
        # Get access token
        access_token = get_access_token()
        if not access_token:
            logging.error("Could not retrieve access token for Microsoft Graph API.")
            raise Exception("Failed to get access token")

        url = f"{GRAPH_API_ENDPOINT}/users/{sender_email}/sendMail"
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }

        email_message = {
            "message": {
                "subject": subject,
                "body": {
                    "contentType": "HTML",
                    "content": body
                },
                "toRecipients": [
                    {
                        "emailAddress": {
                            "address": recipient_email
                        }
                    }
                ]
                },
                "saveToSentItems": "true"
        }

        logging.info(f"Sending email via Microsoft Graph API to {recipient_email}")
        response = requests.post(url, json=email_message, headers=headers)
            
        if response.status_code == 202:
            logging.info(f"Email sent successfully to {recipient_email} via Microsoft Graph API!")
            return True
        else:
            logging.error(f"Error sending email via Microsoft Graph API: {response.status_code}")
            logging.error(f"Response: {response.text}")
            raise Exception(f"Microsoft Graph API returned status code {response.status_code}")
            
    except Exception as e:
        logging.error(f"Microsoft Graph API email sending failed: {str(e)}")
        
        # If all methods fail, save email to file as a last resort for testing
        file_save_success = log_email_to_file(subject, body, recipient_email, sender_email)
        if file_save_success:
            logging.warning(f"Email could not be sent, but content was saved to a log file for review")
            # In development environments, we could consider this a "success" for testing
            # but in production, should be clearly marked as a failure
            # return True
        
        # All methods failed
        logging.error("All email sending methods failed. Email was not sent.")
        return False
    
    return False

def get_email_template(title, content, footer_text):
    """Generate a professional HTML email template."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333333;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
            }}
            .header {{
                background-color: #2c3e50;
                color: #ffffff;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }}
            .header h1 {{
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }}
            .content {{
                padding: 20px;
                background-color: #f9f9f9;
                border: 1px solid #e0e0e0;
                border-top: none;
                border-radius: 0 0 5px 5px;
            }}
            .detail-row {{
                margin-bottom: 15px;
                padding: 10px;
                background-color: #ffffff;
                border-radius: 4px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }}
            .detail-label {{
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 5px;
            }}
            .detail-value {{
                color: #666666;
            }}
            .footer {{
                text-align: center;
                padding: 20px;
                color: #666666;
                font-size: 12px;
                margin-top: 20px;
                border-top: 1px solid #e0e0e0;
            }}
            .button {{
                display: inline-block;
                padding: 10px 20px;
                background-color: #3498db;
                color: #ffffff;
                text-decoration: none;
                border-radius: 4px;
                margin-top: 20px;
            }}
            .warning {{
                background-color: #fff3cd;
                border: 1px solid #ffeeba;
                color: #856404;
                padding: 10px;
                border-radius: 4px;
                margin: 10px 0;
            }}
            .critical {{
                background-color: #f8d7da;
                border: 1px solid #f5c6cb;
                color: #721c24;
                padding: 10px;
                border-radius: 4px;
                margin: 10px 0;
            }}
            .privilege-section {{
                border-left: 4px solid #3498db;
            }}
            .privilege-category {{
                margin-bottom: 15px;
            }}
            .privilege-category h4 {{
                margin: 0 0 8px 0;
                color: #2c3e50;
                font-size: 16px;
                border-bottom: 1px solid #e0e0e0;
                padding-bottom: 5px;
            }}
            .privilege-category ul {{
                margin: 0;
                padding-left: 20px;
            }}
            .privilege-category li {{
                margin-bottom: 5px;
            }}
            .privilege-note {{
                font-style: italic;
                font-size: 12px;
                color: #666;
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px dashed #e0e0e0;
            }}
            .notice {{
                padding: 10px;
                background-color: #e8f4f8;
                border-radius: 4px;
            }}
            .notice p {{
                margin: 0;
                font-style: italic;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>{title}</h1>
            </div>
            <div class="content">
                {content}
            </div>
            <div class="footer">
                {footer_text}
            </div>
        </div>
    </body>
    </html>
    """

def schedule_calendar_events(subject, due_date, assignee_email, reviewer_email):
    start_time = due_date.strftime('%Y-%m-%dT09:00:00')
    end_time = due_date.strftime('%Y-%m-%dT10:00:00')
    attendees = [assignee_email, reviewer_email]

    try:
        create_calendar_event(subject, start_time, end_time, attendees, f"Task {subject} is due on {due_date.strftime('%Y-%m-%d')}")
        logging.info(f"Scheduled calendar event for {assignee_email} and {reviewer_email}")
    except Exception as e:
        logging.error(f"Failed to schedule event: {str(e)}")

def send_scheduled_emails_from_queue():
    """Fetches scheduled messages from DB and sends emails."""
    try:
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        messages = MessageQueue.query.filter(
            MessageQueue.date <= current_time[:10],
            MessageQueue.status.in_(['Scheduled', 'Added to Calendar'])
        ).all()

        sender_email = "preethi.b@vardaanglobal.com"  # You can change this to the actual sender

        for msg in messages:
            try:
                send_email("Scheduled Reminder", msg.message_des, msg.email_id, sender_email)
                msg.status = 'Sent'
                db.session.commit()
            except Exception as e:
                logging.error(f"Failed to send email: {str(e)}")
    except Exception as e:
        logging.error(f"Error processing message queue: {str(e)}")

def add_calendar_events_from_queue():
    """Fetches scheduled messages from the database and adds them to Microsoft Calendar."""
    try:
        messages = MessageQueue.query.filter_by(status='Scheduled').all()

        if not messages:
            logging.info("No scheduled messages found in the queue.")
            return

        for msg in messages:
            try:
                if not msg.email_id or '@' not in msg.email_id:
                    logging.error(f"Invalid or empty email address for message {msg.s_no}: {msg.email_id}")
                    continue

                if not msg.date:
                    logging.error(f"Invalid or missing date for message {msg.s_no}: {msg.date}")
                    continue

                # Convert date to datetime if it's a date
                if isinstance(msg.date, datetime.date):
                    msg.date = datetime.combine(msg.date, datetime.min.time())

                # Prepare start and end times for the event
                start_time = msg.date.strftime('%Y-%m-%dT09:00:00')
                end_time = msg.date.strftime('%Y-%m-%dT10:00:00')

                # Create the calendar event
                create_calendar_event(msg.message_des, start_time, end_time, [msg.email_id], msg.message_des)

                # Update the status in the database
                msg.status = 'Added to Calendar'
                db.session.commit()
                logging.info(f"Successfully added event for message {msg.s_no} to the calendar.")
            except Exception as e:
                logging.error(f"Failed to create calendar event for message {msg.s_no}: {str(e)}")
                continue

    except Exception as e:
        logging.error(f"Error fetching messages from the database: {str(e)}")

def send_activity_assignment_emails(activity_details, regulation_details, preparation_user, review_user, due_date):
    """Send emails to both preparation and review responsibilities when an activity is assigned."""
    try:
        # Get user details
        prep_user = Users.query.get(preparation_user)
        review_user = Users.query.get(review_user)

        if not prep_user or not review_user:
            logging.error("Could not find user details for email sending")
            return

        # Prepare email content for preparation responsibility
        prep_title = f"New Activity Assignment: {activity_details.activity}"
        prep_content = f"""
            <p>Dear {prep_user.user_name},</p>
            
            <p>You have been assigned a new activity that requires your attention. Please review the details below:</p>
            
            <div class="detail-row">
                <div class="detail-label">Activity Name</div>
                <div class="detail-value">{activity_details.activity}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Regulation</div>
                <div class="detail-value">{regulation_details.regulation_name}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Due Date</div>
                <div class="detail-value">{due_date.strftime('%Y-%m-%d')}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Criticality Level</div>
                <div class="detail-value">{activity_details.criticality}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Document Upload Required</div>
                <div class="detail-value">{'Yes' if activity_details.documentupload_yes_no == 'Y' else 'No'}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Reviewer</div>
                <div class="detail-value">{review_user.user_name}</div>
            </div>
            
            {f'<div class="warning">This activity requires document upload. Please ensure all necessary documents are prepared.</div>' if activity_details.documentupload_yes_no == 'Y' else ''}
            
            {f'<div class="critical">This is a high-criticality activity. Please prioritize accordingly.</div>' if activity_details.criticality == 'High' else ''}
            
            <p>Please ensure to complete this activity before the due date. A calendar invitation has been sent to your inbox.</p>
            
            <p>Best regards,<br>RCMS Team</p>
        """
        prep_footer = "This is an automated message from RCMS. Please do not reply to this email."

        # Send email to preparation responsibility
        send_email(
            prep_title,
            get_email_template(prep_title, prep_content, prep_footer),
            prep_user.email_id,
            "preethi.b@vardaanglobal.com"
        )

        # Prepare email content for reviewer
        review_title = f"Review Assignment: {activity_details.activity}"
        review_content = f"""
            <p>Dear {review_user.user_name},</p>
            
            <p>You have been assigned as a reviewer for the following activity. Please review the details below:</p>
            
            <div class="detail-row">
                <div class="detail-label">Activity Name</div>
                <div class="detail-value">{activity_details.activity}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Regulation</div>
                <div class="detail-value">{regulation_details.regulation_name}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Due Date</div>
                <div class="detail-value">{due_date.strftime('%Y-%m-%d')}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Criticality Level</div>
                <div class="detail-value">{activity_details.criticality}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Document Upload Required</div>
                <div class="detail-value">{'Yes' if activity_details.documentupload_yes_no == 'Y' else 'No'}</div>
            </div>
            
            <div class="detail-row">
                <div class="detail-label">Preparer</div>
                <div class="detail-value">{prep_user.user_name}</div>
            </div>
            
            {f'<div class="warning">This activity requires document upload. Please ensure to review all submitted documents.</div>' if activity_details.documentupload_yes_no == 'Y' else ''}
            
            {f'<div class="critical">This is a high-criticality activity. Please prioritize the review accordingly.</div>' if activity_details.criticality == 'High' else ''}
            
            <p>Please review the activity when it is completed by {prep_user.user_name}. A calendar invitation has been sent to your inbox.</p>
            
            <p>Best regards,<br>RCMS Team</p>
        """
        review_footer = "This is an automated message from RCMS. Please do not reply to this email."

        # Send email to review responsibility
        send_email(
            review_title,
            get_email_template(review_title, review_content, review_footer),
            review_user.email_id,
            "preethi.b@vardaanglobal.com"
        )

        # Schedule calendar events
        schedule_calendar_events(
            activity_details.activity,
            due_date,
            prep_user.email_id,
            review_user.email_id
        )

        # Add reminder messages to queue
        reminder_dates = [
            due_date,  # Due date reminder
            due_date - datetime.timedelta(days=activity_details.ews)  # Early warning reminder
        ]

        for reminder_date in reminder_dates:
            if reminder_date > datetime.now().date():
                reminder_title = f"Reminder: {activity_details.activity} Due Soon"
                reminder_content = f"""
                    <p>Dear {prep_user.user_name},</p>
                    
                    <p>This is a reminder that the following activity is due soon:</p>
                    
                    <div class="detail-row">
                        <div class="detail-label">Activity Name</div>
                        <div class="detail-value">{activity_details.activity}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-label">Regulation</div>
                        <div class="detail-value">{regulation_details.regulation_name}</div>
                    </div>
                    
                    <div class="detail-row">
                        <div class="detail-label">Due Date</div>
                        <div class="detail-value">{reminder_date.strftime('%Y-%m-%d')}</div>
                    </div>
                    
                    {f'<div class="warning">This activity requires document upload. Please ensure all necessary documents are prepared.</div>' if activity_details.documentupload_yes_no == 'Y' else ''}
                    
                    {f'<div class="critical">This is a high-criticality activity. Please prioritize accordingly.</div>' if activity_details.criticality == 'High' else ''}
                    
                    <p>Please ensure to complete this activity before the due date.</p>
                    
                    <p>Best regards,<br>RCMS Team</p>
                """
                reminder_footer = "This is an automated reminder from RCMS. Please do not reply to this email."
                
                # Add message for preparation responsibility
                prep_reminder = MessageQueue(
                    message_des=get_email_template(reminder_title, reminder_content, reminder_footer),
                    date=reminder_date,
                    email_id=prep_user.email_id,
                    status='Scheduled'
                )
                db.session.add(prep_reminder)

                # Add message for review responsibility
                review_reminder = MessageQueue(
                    message_des=get_email_template(reminder_title, reminder_content, reminder_footer),
                    date=reminder_date,
                    email_id=review_user.email_id,
                    status='Scheduled'
                )
                db.session.add(review_reminder)

        db.session.commit()
        logging.info("Successfully sent assignment emails and scheduled reminders")

    except Exception as e:
        logging.error(f"Error sending activity assignment emails: {str(e)}")
        db.session.rollback() 