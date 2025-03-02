"""
Purpose of the app file:
- Account login auth with client side of firebase
- Reroute twilio calls + handle call logging and authorized access
"""

import firebase_admin, os, json
from flask import Flask, request
from firebase_admin import credentials
from dotenv import load_dotenv

load_dotenv()

flsk_app = Flask(__name__)
flsk_app.secret_key = os.getenv('SECRET_KEY')

# Firebase Admin SDK setup
firebase_credentials = json.loads(os.getenv('FIREBASE_CREDENTIALS'))
cred = credentials.Certificate(firebase_credentials)
fb_app = firebase_admin.initialize_app(cred, {'databaseURL' : os.getenv('FIREBASE_DATABASE_URL')})

from server.callHandler import inbound_call
from server.invalidateExpired import invalidate_expired

#inbound calls
@flsk_app.route('/call', methods=["POST"])
def handle_call():
    return inbound_call()

#remove expired
@flsk_app.route('/invalidate-expired', methods=["POST"])
def handle_expired():
    return invalidate_expired()

if __name__ == '__main__':
    flsk_app.run(debug=True)