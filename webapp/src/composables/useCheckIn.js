import { reactive } from "vue"
import { auth, db, ref as fbRef, get, set } from "@/firebase"
import { limitToFirst, orderByChild, query as fbQuery, startAt, endAt, remove, push } from "firebase/database"
import { getStatus } from "@/services/getStatus"

const MAX_DELTA = 30 * 24 * 60 * 60 * 1000 //display all check ins before 30 days
const GRACE_PERIOD = 2 * 60 * 60 * 1000
//able to check in 2 hours away from check in time

const user = auth.currentUser
const pathToUser = `users/${user.uid}`
const dbRef = fbRef(db, pathToUser + "/CheckIns")

export function useCheckIns() {
  const checkIns = reactive([])
  const columns = [
    {
      field: "name",
      header: "Guest Name"
    },
    {
      field: "property",
      header: "Property"
    },
    {
      field: "time",
      header: "Check-In Time"
    },
  ]
  const orderOptions = ["oldest", "newest"]
  const queryFilters = reactive({
    order: "newest",
    limit: 25,
    minDate: new Date(Date.now() - GRACE_PERIOD),
    maxDate: new Date(Date.now() + MAX_DELTA),
    keywords: [],
  })

  const refreshQuery = async () => {
    checkIns.length = 0
    try {
      const query = fbQuery(dbRef, orderByChild("time"), limitToFirst(queryFilters.limit), startAt(queryFilters.minDate.valueOf() - GRACE_PERIOD), endAt(queryFilters.maxDate.valueOf()))
      const snapshot = await get(query)

      if (!snapshot.exists()) return

      snapshot.forEach((snapChild) => {
        const checkIn = snapChild.val()
        checkIn.id = snapChild.key
        if (queryFilters.keywords.length === 0 || queryFilters.keywords.some((keyword) => Object.values(checkIn).some((value) => value.includes(keyword)))) {
          checkIn.time = new Date(checkIn.time)
          checkIn.status = getStatus(checkIn.time)
          checkIns.push(checkIn)
        }
      })

      if (queryFilters.order === "oldest") {
        checkIns.sort((a, b) =>
          a["time"] < b["time"] ? -1 : a["time"] > b["time"] ? 1 : 0
        )
      }

    } catch (err) {
      console.error("Error fetching check-ins:", err)
    }
  }

  const deleteCheckIn = async (cid) => {
    const checkInRef = fbRef(db, pathToUser + "/CheckIns/" + cid)
    try {
      await remove(checkInRef)
      refreshQuery()
    } catch (err) {
      console.error("ERR: ", err)     
    }
  }

  const createCheckIn = (checkIn) => {
    const checkInRef = push(fbRef(db, pathToUser + "/CheckIns/" ))
    set(checkInRef, checkIn);
  }

  const editCheckIn = (cid, checkIn) => {
    const checkInRef = fbRef(db, pathToUser + "/CheckIns/" + cid)
    set(checkInRef, checkIn);
  }
  return {
    queryFilters, columns, orderOptions, checkIns, refreshQuery, deleteCheckIn, createCheckIn, editCheckIn
  }
}