from flask import Flask
from flask_cors import CORS
from backend.routes.global_dash import analysis_global_dash

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
# ... other app configuration ...

# Register the blueprint
app.register_blueprint(analysis_global_dash)

# ... rest of your app ... 