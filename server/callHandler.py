from flask import request
from firebase_admin import db

from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse
import os

from datetime import datetime
import pytz

client = Client(os.getenv('TWILIO_ACCOUNT_SID'), os.getenv('TWILIO_AUTH_TOKEN'))

permittedNumbersRef = db.reference('/permittedNumbers')

GRACE_TIME = 2 * 3600 #hrs * secs
tz = pytz.timezone("UTC")

def inbound_call():
    # identify caller
    incomingNumber = request.form["From"]

    permittedNumbers = permittedNumbersRef.get()

    response = VoiceResponse()

    if not (incomingNumber in permittedNumbers):
        response.reject(reason="not permitted.")
        return
        
    userId = permittedNumbers[incomingNumber]
    #TODO: optimize algo later
    check_in = get_check_in(userId)
    response.say(f"You are {f'on time, ' + check_in['name'] if check_in else 'not on time'}.")
    response.say(f"You are {'not' if (not check_in) else ''} granted access")

    if (check_in):
        open_door(userId, response)

    record_call(userId, check_in != None)
        
    return str(response)

def get_check_in(userId : str):
    now = datetime.now(tz) #set to universal standard time

    incomingNumber = request.form["From"]

    checkIns = db.reference(f"/users/{userId}/CheckIns").get()

    for check_in in checkIns.values():
        time = int(check_in["time"]) / 1000.0
        
        checkInTime = datetime.fromtimestamp(time, tz)
        diff_in_s = (now - checkInTime).total_seconds()

        if (check_in['number'] == incomingNumber
        and diff_in_s < GRACE_TIME):
            return check_in
        
def open_door(userId : str, response):
    properties = db.reference(f"/users/{userId}/Properties").get()
    incomingNumber = request.form["From"]

    property = properties[incomingNumber]
    if (property): #allow access by inputting corresponding dial tone
        response.play(digits=property["dtmf"])
        response.say(f"Played {property["dtmf"]} key.")


def record_call(userId : str, success : bool):
    properties = db.reference(f"/users/{userId}/Properties").get()
    dt = round(datetime.now(tz).timestamp())

    callLogRef = db.reference(f"/users/{userId}/CallLog/{dt}")
    callLogRef.set({
        "property": properties[str(request.form["From"])[1:]],
        "success" : success
    })

