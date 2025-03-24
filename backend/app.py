from flask import Flask
from flask_cors import CORS
# from models import db
from config import Config
from routes.auth import auth_bp
from routes.entities import entities_bp
from routes.users import users_bp
from routes.regulations import regulations_bp
from routes.activities import activities_bp
from routes.categories import categories_bp
from routes.holidays import holidays_bp
from routes.tasks import tasks_bp
from routes.analysis import analysis_bp
from models.models import *
from routes.global_dash import analysis_global_dash

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    
    # Enable CORS with specific options
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True, methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(entities_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(regulations_bp)
    app.register_blueprint(activities_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(holidays_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(analysis_bp)
    # app.register_blueprint(analysis_global_dash)
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
    
    # Register blueprint with proper debugging
    print("Registering analysis_global_dash blueprint")
    app.register_blueprint(analysis_global_dash)
    print(f"Registered routes: {[str(rule) for rule in app.url_map.iter_rules()]}")
    
    return app

# Create the application instance
app = create_app()

if __name__ == '__main__':
    app.run(debug=True, port=5000) 