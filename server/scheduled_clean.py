from firebase_admin import db

from datetime import datetime, timedelta
import pytz

ref = db.reference('users')
tz = pytz.timezone('UTC')

HRS_TIL_EXPIRE = 2

def isExpired(date):
    return date+timedelta(hours=HRS_TIL_EXPIRE) < datetime.now(tz)

#Iterates through all of user's check-ins and removes expired ones
def clean_entries():
    #get all users in database, if none exit process
    users = ref.get()
    if not users:
        return
    
    #Iterate through every user
    for uid, userData in users.items():
        counter = 0
        userPath = "users/{uid}"

        #Guard clause to exit program if there are no concurrent checkins
        if "CheckIns" not in userData:
            #Set concurrent check-in counter to 0
            db.reference(f'{userPath}/ConcurrentCheckIns').set(0)
            continue
        
        #Check if check-ins are expired
        for cid, checkIn in userData["CheckIns"].items():
            #Get date (must divide by 1000 ms because python datetime formats)
            date = datetime.fromtimestamp(int(int(checkIn['time']) / 1000), tz)
            if isExpired(date): #remove if expired
                db.reference(f'{userPath}/CheckIns/{cid}').delete()
            else:
                counter += 1
        
        #Set concurrent check-in counter to value
        db.reference(f'{userPath}/ConcurrentCheckIns').set(counter)
    
    #If no errors thrown, return success to program
    return "success"