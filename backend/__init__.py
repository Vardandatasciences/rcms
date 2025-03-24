from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from .config import Config

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')
    
    CORS(app, 
         resources={r"/api/*": {
             "origins": "http://localhost:3000",
             "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
             "allow_headers": ["Content-Type", "Authorization"],
             "supports_credentials": True
         }},
         supports_credentials=True)
    
    db.init_app(app)
    
    from .routes.analysis.entity_dashboard import analysis
    app.register_blueprint(analysis, url_prefix='/api/analysis')
    
    return app 