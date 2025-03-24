import schedule
import time
from services.email_service import send_scheduled_emails_from_queue, add_calendar_events_from_queue
import logging

def process_message_queue():
    """Process scheduled messages from the queue."""
    try:
        # First, add any pending calendar events
        add_calendar_events_from_queue()
        
        # Then, send any pending emails
        send_scheduled_emails_from_queue()
        
        logging.info("Successfully processed message queue")
    except Exception as e:
        logging.error(f"Error processing message queue: {str(e)}")

def start_message_queue_processor():
    """Start the message queue processor."""
    # Schedule the job to run every hour
    schedule.every(1).hours.do(process_message_queue)
    
    while True:
        try:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
        except Exception as e:
            logging.error(f"Error in message queue processor: {str(e)}")
            time.sleep(60)  # Wait a minute before retrying

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    start_message_queue_processor() 