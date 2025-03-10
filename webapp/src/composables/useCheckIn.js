import { reactive, ref } from "vue"
import { auth, db, ref as fbRef, get, set } from "@/firebase"
import { limitToFirst, orderByChild, query as fbQuery, startAt, endAt, remove, push } from "firebase/database"
import { getStatus } from "@/services/getStatus"
import { useProperties } from "@/composables/useProperties"
import { phoneToNumber } from "@/services/formats"

const {properties} = useProperties()

const MAX_DELTA = 30 * 24 * 60 * 60 * 1000 // Display check-ins up to 30 days ahead
const GRACE_PERIOD = 2 * 60 * 60 * 1000      // Allow check-in within 2 hours of check in time

const user = auth.currentUser
const pathToUser = `users/${user.uid}`
const checkInsPath = `${pathToUser}/CheckIns`
const dbRef = fbRef(db, checkInsPath)

export function useCheckIns() {
  const checkIns = reactive([])
  
  const columns = [
    { field: "name", header: "Guest Name" },
    { field: "property", header: "Property" },
    { field : "status", header: "Status"}
  ]

  const orderOptions = ["oldest", "newest"]
  
  const queryFilters = ref({
    order: "newest",
    limit: 25,
    minDate: new Date(Date.now() - GRACE_PERIOD),
    maxDate: new Date(Date.now() + MAX_DELTA),
    property: "",
  })

  // Helper to generate a reference for a given check-in ID
  const getCheckInRef = (cid) => fbRef(db, `${checkInsPath}/${cid}`)

  const refreshQuery = async () => {
    // Clear the existing checkIns array
    checkIns.length = 0
    try {
      const startTime = queryFilters.value.minDate.valueOf() - GRACE_PERIOD
      const endTime = queryFilters.value.maxDate.valueOf()
      const dbQuery = fbQuery(
        dbRef,
        orderByChild("time"),
        limitToFirst(queryFilters.value.limit),
        startAt(startTime),
        endAt(endTime)
      )
      const snapshot = await get(dbQuery)

      if (!snapshot.exists()) return
      snapshot.forEach((snapChild) => {
        const checkIn = snapChild.val()
        // Filter based on properties (if provided)
        const matchesProperty =
          !queryFilters.value.property ||
          checkIn.property === queryFilters.value.property
        if (matchesProperty) {
          checkIn.id = snapChild.key
          checkIn.time = new Date(checkIn.time)
          checkIn.status = getStatus(checkIn.time)
          const foundProperty = [...properties].find(obj => phoneToNumber(obj.number) === checkIn.property);
          checkIn.property = foundProperty ? foundProperty.name : "undefined";
          checkIns.push(checkIn)
        }
      })

      // Sort check-ins based on the selected order
      if (queryFilters.value.order === "oldest") {
        checkIns.sort((a, b) => a.time - b.time)
      }

    } catch (err) {
      console.error("Error fetching check-ins:", err)
    }
  }

  const deleteCheckIn = async (checkIn) => {
    try {
      await remove(getCheckInRef(checkIn.id))
      await refreshQuery()
    } catch (err) {
      console.error("Error deleting check-in:", err)
    }
  }

  const createCheckIn = async (checkIn) => {
    checkIn.time = checkIn.time.getTime()
    checkIn.property = checkIn.property.number

    try {
      const newCheckInRef = push(fbRef(db, checkInsPath))
      await set(newCheckInRef, checkIn)
      await refreshQuery()
    } catch (err) {
      console.error("Error creating check-in:", err)
    }
  }

  const editCheckIn = async (cid, checkIn) => {
    checkIn.time = checkIn.time.getTime()
    checkIn.property = checkIn.property.number
    
    try {
      await set(getCheckInRef(cid), checkIn)
      await refreshQuery()
    } catch (err) {
      console.error("Error editing check-in:", err)
    }
  }

  return {
    queryFilters,
    columns,
    orderOptions,
    checkIns,
    refreshQuery,
    deleteCheckIn,
    createCheckIn,
    editCheckIn,
  }
}
