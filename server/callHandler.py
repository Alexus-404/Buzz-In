from flask import request
from firebase_admin import db

from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse
import os

from datetime import datetime
import pytz

client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))

permittedNumbersRef = db.reference('/permittedNumbers')

GRACE_TIME = 2 * 3600  # hrs * secs
tz = pytz.timezone("UTC")

def inbound_call():
    incomingNumber = request.form.get("From", "")
    incomingNumber = incomingNumber[1:]
    if not incomingNumber:
        return "Error: Incoming number not provided.", 400

    permittedNumbers = permittedNumbersRef.get() or {}

    print(permittedNumbers, incomingNumber)
    
    response = VoiceResponse()

    if incomingNumber not in permittedNumbers:
        response.reject(reason="Not permitted.")
        return str(response)

    userId = permittedNumbers[incomingNumber]

    check_in = get_check_in(userId)
    response.say(f"You are {f'on time, ' + check_in['name'] if check_in else 'not on time'}.")
    response.say(f"You are {'not' if not check_in else ''} granted access.")

    if check_in:
        open_door(userId, response)

    record_call(userId, check_in is not None)

    return str(response)

def get_check_in(userId: str):
    now = datetime.now(tz)
    incomingNumber = request.form.get("From", "")

    checkIns = db.reference(f"/users/{userId}/CheckIns").get() or {}

    for check_in in checkIns.values():
        time = int(check_in.get("time", 0)) / 1000.0
        checkInTime = datetime.fromtimestamp(time, tz)
        diff_in_s = (now - checkInTime).total_seconds()

        if check_in.get("number") == incomingNumber and diff_in_s < GRACE_TIME:
            return check_in
    return None

def open_door(userId: str, response):
    properties = db.reference(f"/users/{userId}/Properties").get() or {}
    incomingNumber = request.form.get("From", "")

    property = properties.get(incomingNumber)
    if property:
        response.play(digits=property["dtmf"])
        response.say(f"Played {property['dtmf']} key.")

def record_call(userId: str, success: bool):
    properties = db.reference(f"/users/{userId}/Properties").get() or {}
    dt = round(datetime.now(tz).timestamp())

    caller_id = str(request.form.get("From", ""))[1:]
    property_info = properties.get(caller_id, {})

    callLogRef = db.reference(f"/users/{userId}/CallLog/{dt}")
    callLogRef.set({
        "property": property_info,
        "success": success
    })
