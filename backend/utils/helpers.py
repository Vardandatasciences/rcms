from datetime import datetime
from dateutil.relativedelta import relativedelta
from models.models import HolidayMaster

def adjust_due_date_for_holidays(due_date):
    """
    Adjust a due date if it falls on a weekend or holiday.
    
    Args:
        due_date: The date to check and adjust
        
    Returns:
        Adjusted date that doesn't fall on a weekend or holiday
    """
    while True:
        # Check if due_date falls on a weekend (Saturday or Sunday)
        if due_date.weekday() == 5:  # Saturday
            due_date -= relativedelta(days=1)  # Move to Friday
        elif due_date.weekday() == 6:  # Sunday
            due_date -= relativedelta(days=2)  # Move to Friday
        else:
            # Check if due_date is a holiday
            holiday = HolidayMaster.query.filter_by(holiday_date=due_date).first()
            if holiday:
                due_date -= relativedelta(days=1)  # Move to the previous day if it's a holiday
            else:
                break  # If it's not a holiday or weekend, exit the loop
    
    return due_date

def calculate_next_due_date(frequency_timeline, frequency):
    """
    Calculate the next due date based on frequency and timeline.
    
    Args:
        frequency_timeline: The base date to calculate from
        frequency: The frequency code (52=weekly, 12=monthly, etc.)
        
    Returns:
        The next due date
    """
    current_date = datetime.now().date()
    
    # If the frequency_timeline is in the future, return it as is
    if frequency_timeline >= current_date:
        return frequency_timeline
    
    # If frequency_timeline is in the past, calculate the next due date
    due_on = frequency_timeline
    while due_on < current_date:
        # Increment due_on based on the frequency
        if frequency == 52:  # Weekly
            due_on += relativedelta(weeks=1)
        elif frequency == 26:  # fortnightly
            due_on += relativedelta(weeks=2)
        elif frequency == 12:  # Monthly
            due_on += relativedelta(months=1)
        elif frequency == 3:  # Every 4 months
            due_on += relativedelta(months=4)
        elif frequency == 4:  # Quarterly
            due_on += relativedelta(months=3)
        elif frequency == 2:  # Half-yearly
            due_on += relativedelta(months=6)
        elif frequency == 6:  # Every 2 months
            due_on += relativedelta(months=2)
        elif frequency == 1:  # Annually
            due_on += relativedelta(years=1)
        elif frequency == 0:  # One-time
            break
        else:
            # Default fallback if no valid frequency is set
            break
    
    # Adjust for weekends and holidays
    return adjust_due_date_for_holidays(due_on) 