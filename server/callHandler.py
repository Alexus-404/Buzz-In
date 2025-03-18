"""
Purpose:
- Verify identity of incoming number and that it is permitted
- Verify that a valid check-in exists within the grace period
- Grant access through the door
- Record call into call log of database for client security

"""

from flask import request
from firebase_admin import db

from datetime import datetime
import pytz

import os

#Dependency Imports
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse

# Initialize Twilio client with custom authentication key, hidden with env variables
client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))

# Firebase reference for permitted numbers
permittedNumbersRef = db.reference('/permittedNumbers')

# Grace time in seconds (2 hours)
GRACE_TIME = 2 * 3600

# Ensure timezone is UTC -- which is the global standard.
# Simplifies timezone conversions rather than using local timezones
tz = pytz.timezone("UTC")

def get_incoming_number() -> str:
    """
    Extract and normalize the incoming phone number from the request.
    Removes any leading '+' and filters out non-digit characters.
    """
    raw_number = request.form.get("From", "")
    if raw_number.startswith('+'):
        raw_number = raw_number[1:]
    return ''.join(filter(str.isdigit, raw_number))

def inbound_call():
    """
    Handles an inbound call:
    - Normalizes the caller's number.
    - Checks if the number is permitted.
    - Verifies if a valid check-in exists within the grace period.
    - Opens the door (by playing DTMF tones) if the check-in is valid.
    - Records the call details in the user's call log.
    
    Returns:
        A TwiML (XML) string response.
    """
    # Gets the normalized incoming phone number.
    incoming_number = get_incoming_number()
    if not incoming_number:
        return "Error: Incoming number not provided.", 400

    # Retrieves list of permitted numbers in Firebase
    permitted_numbers = permittedNumbersRef.get() or {}

    # Create Twilio VoiceResponse object
    response = VoiceResponse()

    # Rejects call if number is not permitted

    if incoming_number not in permitted_numbers:
        response.say("You are not a registered property. Rejecting.")
        response.reject(reason="Not permitted.")
        return str(response)

    # Retrieve the user ID associated with incoming number
    user_id = permitted_numbers[incoming_number]

    # Check if user has valid check-in within the grace period
    check_in = get_check_in(user_id, incoming_number)

    if check_in:
        response.say(f"You are on time, {check_in.get('name', 'user')}.")
        response.say("Access granted.")
        open_door(user_id, incoming_number, response)
    else:
        response.say("You are not on time.")
        response.say("Access not granted.")

    # Record call details (if check-in is successful or exists)
    record_call(user_id, incoming_number, success=(check_in is not None))

    return str(response)


def get_check_in(user_id: str, incoming_number: str):
    """
    Retrieves the user's check-in record that corresponds to the given incoming number.
    
    A check-in is only valid if:
    - The check-in's 'property' field matches the incoming number.
    - The check-in time is within the defined GRACE_TIME window.
    """
    now = datetime.now(tz)
    check_ins = db.reference(f"/users/{user_id}/CheckIns").get() or {}

    for check_in in check_ins.values():
        # Convert timestamp from millis to seconds.
        time_ms = int(check_in.get("time", 0))
        check_in_time = datetime.fromtimestamp(time_ms / 1000.0, tz)
        diff_in_seconds = (now - check_in_time).total_seconds()

        # Only return check-in if it is a valid property and matches grace time
        if check_in.get("property") == incoming_number and diff_in_seconds < GRACE_TIME:
            return check_in

    return None


def open_door(user_id: str, incoming_number: str, response: VoiceResponse):
    """
    Opens the door for the user by playing the corresponding DTMF tones.
    """

    #Get dtmf tone for corresponding property
    properties = db.reference(f"/users/{user_id}/Properties").get() or {}
    property_data = properties.get(incoming_number)

    #If it exists, then play the dtmf and grant access to apartment
    if property_data:
        dtmf_digits = property_data.get("dtmf")
        if dtmf_digits:
            response.play(digits=dtmf_digits)

def increment_counter(current_value):
    if current_value is None:
        return 1
    return current_value + 1

def record_call(user_id: str, incoming_number: str, success: bool):
    """
    Records the call details in the user's call log in Firebase.
    
    Each log entry is stored under a timestamp key (in milliseconds).
    The record includes the caller's number and whether the call was successful.
    """
    # Current timestamp in milliseconds.    
    timestamp_ms = round(datetime.now(tz).timestamp()) * 1000
    call_log_ref = db.reference(f"/users/{user_id}/CallLog/{timestamp_ms}")
    call_log_ref.set({
        "caller": incoming_number,
        "success": success
    })
    historic_call_count_ref = db.reference(f"/users/{user_id}/HistoricCallCount")
    historic_call_count_ref.transaction(increment_counter)

