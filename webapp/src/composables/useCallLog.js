import {reactive} from 'vue'
import { auth, db, ref as fbRef, get } from "@/firebase";
import { formatDate } from "../services/formats";

const user = auth.currentUser;
const pathToUser = `users/${user.uid}`;
const callLogPath = `${pathToUser}/CallLog`
const dbRef = fbRef(db, callLogPath);

export function useCallLogs() {
  const callLogs = reactive([])

  const columns = [
    { field: "time", header: "Time"},
    { field: "property", header: "Property"},
    { field: "status", header: "Status"},
  ]

  const refreshCalls = async () => {
    callLogs.length = 0
    try {
      const snapshot = await get(dbRef);
  
      if (!snapshot.exists()) return [];
  
      snapshot.forEach(async (snapChild) => {
        const callInfo = snapChild.val();
        const propertyRef = fbRef(
          db,
          pathToUser + "/Properties/" + callInfo.number
        );
        callInfo.property = (await get(propertyRef)).val().name;
        callInfo.time = formatDate(new Date(Number(snapChild.key)));
        switch (callInfo.status) {
          case true:
            callInfo.status = "✅";
            break;
          default:
            callInfo.status = "❌";
            break;
        }
  
        callLogs.push(callInfo);
      });
    } catch (err) {
      console.error("Error fetching call log:", err);
    }
  }

  refreshCalls() //init
  
  return {
    callLogs, columns, refreshCalls
  }
}