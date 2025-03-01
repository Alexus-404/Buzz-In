from firebase_admin import db

from datetime import datetime, timedelta
import pytz

ref = db.reference('users')

tz = pytz.timezone('UTC')

HRS_TIL_EXPIRE = 2

def isExpired(date):
    return date+timedelta(hours=HRS_TIL_EXPIRE) < datetime.now(tz)

#go thru all of all user's check ins
def invalidate_expired():
    users = ref.get()
    if not users:
        return
    
    for uid, userData in users.items():
        if "CheckIns" not in userData:
            continue

        for cid, checkIn in userData["CheckIns"].items():
            date = datetime.fromtimestamp(int(int(checkIn['time']) / 1000), tz)
            if isExpired(date): #remove if expired
                db.reference(f'users/{uid}/CheckIns/{cid}').delete()
    return "success"