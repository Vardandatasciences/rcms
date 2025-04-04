from models import db
from datetime import datetime

# Activity Master Table
class ActivityMaster(db.Model):
    __tablename__ = "activity_master"

    regulation_id = db.Column(db.String(15), primary_key=True)  # Foreign Key Reference
    activity_id = db.Column(db.Integer, primary_key=True)  # No auto-increment
    activity_description = db.Column(db.String(1000), nullable=False)
    criticality = db.Column(db.String(45), nullable=True)
    documentupload_yes_no = db.Column(db.String(45), nullable=True)
    frequency = db.Column(db.Integer, nullable=True)
    frequency_timeline = db.Column(db.Date, nullable=True)
    activity = db.Column(db.String(250), nullable=True)
    mandatory_optional = db.Column(db.String(1), nullable=True, default="M")
    ews = db.Column(db.Integer, nullable=True)
    approver_required = db.Column(db.String(1), nullable=True)
    reviewer_required = db.Column(db.String(1), nullable=True)
    obsolete_current = db.Column(db.String(45), nullable=True)

    
    def __repr__(self):
        return f"<ActivityMaster {self.activity_id} - {self.activity}>"

# Category Table
class Category(db.Model):
    __tablename__ = "category"

    category_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    category_type = db.Column(db.String(45), nullable=False)
    Remarks = db.Column(db.String(256), nullable=True)
    obsolete_current = db.Column(db.String(45), nullable=True)

    def __repr__(self):
        return f"<Category {self.category_id} - {self.category_type}>"

# Country Codes Table
class CountryCodes(db.Model):
    __tablename__ = "country_codes"

    country = db.Column(db.String(100), primary_key=True)
    country_code = db.Column(db.String(10), nullable=False)

    def __repr__(self):
        return f"<CountryCodes {self.country} - {self.country_code}>"

# Display Messages Table
class DisplayMsg(db.Model):
    __tablename__ = "display_msg"

    code = db.Column(db.String(15), primary_key=True)
    english = db.Column(db.String(250), nullable=True)
    pc = db.Column(db.String(30), nullable=True)

    def __repr__(self):
        return f"<DisplayMsg {self.code} - {self.english}>"

# Entity Master Table
class EntityMaster(db.Model):
    __tablename__ = "entity_master"

    entity_id = db.Column(db.String(15), primary_key=True)
    entity_name = db.Column(db.String(45), nullable=False, unique=True)
    location = db.Column(db.String(100), nullable=False)
    contact_phno = db.Column(db.String(45), nullable=False)
    alternate_contact = db.Column(db.String(45), nullable=True)
    description = db.Column(db.String(250), nullable=False)
    country = db.Column(db.String(100), nullable=False)
    contact_name = db.Column(db.String(45), nullable=True)
    alternate_contact_name = db.Column(db.String(45), nullable=True)
    state = db.Column(db.String(100), nullable=True)
    pincode = db.Column(db.String(45), nullable=True)
    obsolete_current = db.Column(db.String(45), nullable=True)

    def __repr__(self):
        return f"<EntityMaster {self.entity_id} - {self.entity_name}>"

# Entity Regulation Table
class EntityRegulation(db.Model):
    __tablename__ = "entity_regulation"

    entity_id = db.Column(db.String(15), db.ForeignKey("entity_master.entity_id"), primary_key=True)
    regulation_id = db.Column(db.String(15), db.ForeignKey("regulation_master.regulation_id"), primary_key=True)
    mandatory_activities = db.Column(db.Integer, nullable=True)
    optional_activities = db.Column(db.Integer, nullable=True)
    obsolete_current = db.Column(db.String(45), nullable=True)

    def __repr__(self):
        return f"<EntityRegulation Entity: {self.entity_id}, Regulation: {self.regulation_id}>"

# Entity Regulation Tasks Table
class EntityRegulationTasks(db.Model):
    __tablename__ = "entity_regulation_tasks"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    entity_id = db.Column(db.String(15), db.ForeignKey("entity_master.entity_id"), nullable=False)
    regulation_id = db.Column(db.String(15), db.ForeignKey("regulation_master.regulation_id"), nullable=False)
    activity_id = db.Column(db.Integer, db.ForeignKey("activity_master.activity_id"), nullable=False)
    preparation_responsibility = db.Column(db.String(45), nullable=True)
    review_responsibility = db.Column(db.String(45), nullable=True)
    due_on = db.Column(db.Date, nullable=False)
    start_date = db.Column(db.Date, nullable=True)
    end_date = db.Column(db.Date, nullable=True)
    status = db.Column(db.String(45), nullable=True)
    ews = db.Column(db.Integer, nullable=True)
    remarks = db.Column(db.String(1060), nullable=True)
    upload = db.Column(db.String(250), nullable=True)
    review_remarks = db.Column(db.String(1060), nullable=True)
    review_start_date = db.Column(db.Date, nullable=True)
    review_end_date = db.Column(db.Date, nullable=True)
    review_upload = db.Column(db.String(250), nullable=True)
    mandatory_optional = db.Column(db.String(1), nullable=True)
    criticality = db.Column(db.String(45), nullable=True)
    internal_external = db.Column(db.String(1), nullable=True)
    documentupload_yes_no = db.Column(db.String(1), nullable=True)

    def __repr__(self):
        return f"<EntityRegulationTasks ID: {self.id}, Entity: {self.entity_id}, Regulation: {self.regulation_id}, Activity: {self.activity_id}>"

# Holiday Master Table
class HolidayMaster(db.Model):
    __tablename__ = "holiday_master"

    holiday_date = db.Column(db.Date, primary_key=True)
    description = db.Column(db.String(90), nullable=False)
    entity_id = db.Column(db.String(15), db.ForeignKey("entity_master.entity_id"), primary_key=True)
    obsolete_current = db.Column(db.String(1), nullable=True)

    def __repr__(self):
        return f"<HolidayMaster Date: {self.holiday_date}, Entity: {self.entity_id}, Description: {self.description}>"

# Log Files Table
class LogFiles(db.Model):
    __tablename__ = "log_files"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(45), nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    action = db.Column(db.String(255), nullable=False)
    remarks = db.Column(db.String(255), nullable=True)

    def __repr__(self):
        return f"<LogFiles ID: {self.id}, User: {self.user_id}, Action: {self.action}>"

# Message Queue Table
class MessageQueue(db.Model):
    __tablename__ = "message_queue"

    s_no = db.Column(db.Integer, primary_key=True, autoincrement=True)
    message_des = db.Column(db.String(500), nullable=False)
    date = db.Column(db.Date, nullable=True)
    time = db.Column(db.Time, nullable=True)
    email_id = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(50), nullable=True)

    def __repr__(self):
        return f"<MessageQueue S.No: {self.s_no}, Email: {self.email_id}, Status: {self.status}>"

# Regulation Master Table
class RegulationMaster(db.Model):
    __tablename__ = "regulation_master"

    regulation_id = db.Column(db.String(10), primary_key=True)
    regulation_name = db.Column(db.String(60), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("category.category_id"), nullable=False)
    regulatory_body = db.Column(db.String(45), nullable=True)
    internal_external = db.Column(db.String(1), nullable=False, default="I")
    national_international = db.Column(db.String(1), nullable=False, default="N")
    mandatory_optional = db.Column(db.String(1), nullable=False, default="M")
    effective_from = db.Column(db.Date, nullable=True)
    obsolete_current = db.Column(db.String(1), nullable=True, default="C")

    def __repr__(self):
        return f"<RegulationMaster ID: {self.regulation_id}, Name: {self.regulation_name}>"


# Users Table
class Users(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.String(15), primary_key=True)
    entity_id = db.Column(db.String(15), db.ForeignKey("entity_master.entity_id"), nullable=False)
    user_name = db.Column(db.String(100), nullable=False)
    address = db.Column(db.String(100), nullable=True)
    mobile_no = db.Column(db.String(10), nullable=False, unique=True)
    email_id = db.Column(db.String(45), nullable=False, unique=True)
    password = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(45), nullable=False)
    obsolete_current = db.Column(db.String(1), nullable=True)

    def __repr__(self):
        return f"<Users ID: {self.user_id}, Name: {self.user_name}, Role: {self.role}>"

# Privileges Table
class Privileges(db.Model):
    __tablename__ = 'privileges'
    
    privilege_id = db.Column(db.String(40), primary_key=True)
    entity_id = db.Column(db.String(15), db.ForeignKey('entity_master.entity_id'), nullable=False)
    user_id = db.Column(db.String(15), db.ForeignKey('users.user_id'), nullable=False)
    privileges_list = db.Column(db.Text, nullable=False)
    
    # Define relationships
    user = db.relationship('Users', backref=db.backref('privileges', lazy=True))
    entity = db.relationship('EntityMaster', backref=db.backref('entity_privileges', lazy=True))
    
    def __init__(self, privilege_id, entity_id, user_id, privileges_list):
        self.privilege_id = privilege_id
        self.entity_id = entity_id
        self.user_id = user_id
        self.privileges_list = privileges_list