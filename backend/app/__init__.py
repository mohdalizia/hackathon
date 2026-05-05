import os
from dotenv import load_dotenv
from flask import Flask
from flask_socketio import SocketIO

load_dotenv()

socketio = SocketIO()

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default_fallback_secret')
    app.config['GOOGLE_MAPS_API_KEY'] = os.environ.get('GOOGLE_MAPS_API_KEY', '')
    app.config['FIREBASE_API_KEY'] = os.environ.get('FIREBASE_API_KEY', '')
    
    # Initialize SocketIO
    socketio.init_app(app, cors_allowed_origins="*")
    
    # Register blueprints
    from .routes import main
    app.register_blueprint(main)
    
    return app