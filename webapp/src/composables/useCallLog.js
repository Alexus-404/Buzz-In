import {reactive} from 'vue'
import { auth, db, ref as fbRef, get } from "@/firebase"
import { orderByKey, query } from 'firebase/database'
import { formatDate } from "../services/formats"
import { useProperties } from "@/composables/useProperties"
import { useToast } from 'primevue/usetoast'

const user = auth.currentUser
const pathToUser = `users/${user.uid}`
const callLogPath = `${pathToUser}/CallLog`
const dbRef = fbRef(db, callLogPath) // Firebase reference to user's call logs

export function useCallLogs() {
  const {properties} = useProperties()
  const toast = useToast()
  const callLogs = reactive([]) // Reactive array to store call logs

  const columns = [
    { field: "time", header: "Time"},
    { field: "property", header: "Property"},
    { field: "status", header: "Status"},
  ]

  const refreshCalls = async () => {
    callLogs.length = 0 // Clear existing logs before fetching new data
    try {
      const snapshot = await get(query(dbRef, orderByKey())) // Fetch call logs from Firebase
  
      if (!snapshot.exists()) return []
  
      snapshot.forEach((snapChild) => {
        const callInfo = snapChild.val()
        
        // Find corresponding property by caller number
        const foundProperty = properties.find(property => {
          return property.number == callInfo.caller
        })
        
        callInfo.property = foundProperty ? foundProperty.name : "undefined"
        callInfo.time = formatDate(new Date(Number(snapChild.key))) // Convert timestamp to formatted date
        
        // Assign status icon based on success
        switch (callInfo.success) {
          case true:
            callInfo.status = "✅"
            break
          default:
            callInfo.status = "❌"
            break
        }
        
        callLogs.push(callInfo) // Add processed call info to callLogs array
      })

      callLogs.reverse() // Reverse logs for chronological order
    } catch (err) {
      // Display error message using toast
      toast.add({
        severity: "error",
        detail: err,
        summary: "Failed refreshing call log",
        life: 3000
      })
    }
  }

  refreshCalls() // Initial call to populate logs on component load
  
  return {
    callLogs, columns, refreshCalls
  }
}
