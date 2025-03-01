"""
Purpose of the app file:
- Account login auth with client side of firebase
- Reroute twilio calls + handle call logging and authorized access
"""

from flask import Flask, request
import firebase_admin
from firebase_admin import credentials
from dotenv import load_dotenv
import os

load_dotenv('./.flaskenv')
load_dotenv()

flsk_app = Flask(__name__)
flsk_app.secret_key = os.getenv('SECRET_KEY')

# Firebase Admin SDK setup
cred = credentials.Certificate("firebase-auth.json")
fb_app = firebase_admin.initialize_app(cred, {'databaseURL' : "https://buzz-in-328b3-default-rtdb.firebaseio.com/"})

from callHandler import inbound_call
from invalidateExpired import invalidate_expired

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