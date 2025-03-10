"""
Description:
- Handle account login authentication with Firebase (client-side).
- Reroute Twilio calls, manage call logging, and enforce authorized access.
"""

import os, json, firebase_admin
from flask import Flask, request
from firebase_admin import credentials
from dotenv import load_dotenv

# Load environment variables from .env file.
load_dotenv()

# Initialize Flask app and set the secret key for session management.
app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY')

# Firebase Admin SDK setup:
# Parse the Firebase credentials from the environment variables,
# create a certificate, and initialize the Firebase app with the database URL.
firebase_credentials = json.loads(os.getenv('FIREBASE_CREDENTIALS'))
cred = credentials.Certificate(firebase_credentials)
firebase_app = firebase_admin.initialize_app(cred, {
    'databaseURL': os.getenv('FIREBASE_DATABASE_URL')
})

# Import route handlers from other modules.
from server.callHandler import inbound_call
from server.invalidateExpired import invalidate_expired

@app.route('/call', methods=["POST"])
def handle_call():
    """
    Route to handle inbound Twilio calls.
    
    Delegates call processing to callHandler,
    which identifies, validates, and authorizes callers
    """
    return inbound_call()

@app.route('/invalidate-expired')
def handle_expired():
    """
    Route to remove or invalidate expired entries.
    
    Calls 'invalidate_expired' from the corresponding module,
    which processes and cleans up expired data entries.
    """
    return invalidate_expired()

if __name__ == '__main__':
    app.run(debug=True)
