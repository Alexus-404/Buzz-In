import { reactive, ref } from "vue"
import { auth, db, ref as fbRef, get, set } from "@/firebase"
import {
  remove,
  push,
  limitToFirst,
  limitToLast,
  orderByChild,
  query as fbQuery,
  startAt,
  endAt,
} from "firebase/database"
import { getStatus } from "@/services/getStatus"
import { useProperties } from "@/composables/useProperties"
import { phoneToNumber } from "@/services/formats"

const { properties } = useProperties()

const MAX_DELTA = 30 * 24 * 60 * 60 * 1000 // up to 30 days ahead
const GRACE_PERIOD = 2 * 60 * 60 * 1000      // allow check-in within 2 hours

const user = auth.currentUser
const pathToUser = `users/${user.uid}`
const concurrentCheckInsPath = `${pathToUser}/ConcurrentCheckIns`
const checkInsPath = `${pathToUser}/CheckIns`
const dbRef = fbRef(db, checkInsPath)
const concurrentCheckInsRef = fbRef(db, concurrentCheckInsPath)

export function useCheckIns() {
  const checkIns = reactive([])
  const totalRows = ref(0)
  const currentPage = ref(0)
  let currentPageFirst = null
  let currentPageLast = null

  const columns = [
    { field: "name", header: "Guest Name" },
    { field: "property", header: "Property" },
    { field: "status", header: "Status" },
  ]
  const orderOptions = ["oldest", "newest"]

  const queryFilters = ref({
    order: "newest",
    limit: 3,
    minDate: new Date(Date.now() - GRACE_PERIOD),
    maxDate: new Date(Date.now() + MAX_DELTA),
    property: "",
  })

  // Returns a database reference for a given check-in ID
  const getCheckInRef = (cid) => fbRef(db, `${checkInsPath}/${cid}`)

  // Process and push a single check-in from a snapshot
  const processCheckIn = (snapChild) => {
    const checkIn = snapChild.val()
    // Filter based on property if one is specified
    if (!queryFilters.value.property || checkIn.property === queryFilters.value.property) {
      checkIn.id = snapChild.key
      checkIn.time = new Date(checkIn.time)
      checkIn.status = getStatus(checkIn.time)
      const foundProperty = [...properties].find(
        (obj) => phoneToNumber(obj.number) === checkIn.property
      )
      checkIn.property = foundProperty ? foundProperty.name : "undefined"
      checkIns.push(checkIn)
    }
  }

  // Update the total number of rows
  const updateTotalRows = async (delta = 0) => {
    try {
      const snapshot = await get(concurrentCheckInsRef)
      const rowCount = snapshot.val() || 0
      if (delta !== 0) {
        await set(concurrentCheckInsRef, delta + rowCount)
      }
      totalRows.value = delta + rowCount
    } catch (err) {
      console.error("Error updating rows:", err)
    }
  }

  // Create a firebase query based on the paging state
  const getQueryFilters = (state) => {
    const { order, limit, minDate, maxDate } = queryFilters.value
    const minTime = minDate.valueOf() - GRACE_PERIOD
    const maxTime = maxDate.valueOf()
    let start, end, limitQuery

    switch (state) {
      case "first":
        start = startAt(minTime)
        end = endAt(maxTime)
        limitQuery = order === "oldest"
          ? limitToLast(limit)
          : limitToFirst(limit)
        break
      case "next":
        if (order === "oldest") {
          start = startAt(minTime)
          end = endAt(currentPageLast.valueOf())
          limitQuery = limitToLast(limit + 1)
        } else {
          start = startAt(currentPageLast.valueOf())
          end = endAt(maxTime)
          limitQuery = limitToFirst(limit + 1)
        }
        break
      case "previous":
        if (order === "oldest") {
          start = startAt(currentPageFirst.valueOf())
          end = endAt(maxTime)
          limitQuery = limitToFirst(limit + 1)
        } else {
          start = startAt(minTime)
          end = endAt(currentPageFirst.valueOf())
          limitQuery = limitToLast(limit + 1)
        }
        break
      default:
        throw new Error("Invalid paging state")
    }

    return fbQuery(dbRef, orderByChild("time"), start, end, limitQuery)
  }

  // Unified paging loader
  const loadPage = async (direction, updatePageCounter) => {
    checkIns.length = 0
    updatePageCounter()

    try {
      const dbQuery = getQueryFilters(direction)
      const snapshot = await get(dbQuery)
      snapshot.forEach(processCheckIn)

      // For next/previous pages, remove the extra check-in
      if (direction === "next" && checkIns.length) {
        queryFilters.value.order === "oldest" ? checkIns.pop() : checkIns.shift()
      } else if (direction === "previous" && checkIns.length) {
        queryFilters.value.order === "oldest" ? checkIns.shift() : checkIns.pop()
      }

      // Reverse the order if displaying oldest first
      if (queryFilters.value.order === "oldest") {
        checkIns.reverse()
      }

      if (checkIns.length) {
        currentPageFirst = checkIns[0].time
        currentPageLast = checkIns[checkIns.length - 1].time
      }
      
    } catch (err) {
      console.error("Error fetching check-ins:", err)
    }
  }

  const loadFirstPage = async () => {
    await loadPage("first", () => {
      currentPage.value = 0
    })
  }

  const loadNextPage = async () => {
    await loadPage("next", () => {
      currentPage.value++
    })
  }

  const loadPrevPage = async () => {
    await loadPage("previous", () => {
      currentPage.value--
    })
  }

  const deleteCheckIn = async (checkIn) => {
    try {
      await remove(getCheckInRef(checkIn.id))
      await loadFirstPage()
      await updateTotalRows(-1)
    } catch (err) {
      console.error("Error deleting check-in:", err)
    }
  }

  const createCheckIn = async (checkIn) => {
    // Normalize time and property values for storage
    checkIn.time = checkIn.time.getTime()
    checkIn.property = checkIn.property.number

    try {
      const newCheckInRef = push(fbRef(db, checkInsPath))
      await set(newCheckInRef, checkIn)
      await loadFirstPage()
      await updateTotalRows(1)
    } catch (err) {
      console.error("Error creating check-in:", err)
    }
  }

  const editCheckIn = async (cid, checkIn) => {
    // Normalize time and property values for storage
    checkIn.time = checkIn.time.getTime()
    checkIn.property = checkIn.property.number

    try {
      await set(getCheckInRef(cid), checkIn)
      await loadFirstPage()
    } catch (err) {
      console.error("Error editing check-in:", err)
    }
  }

  // Initialize total row count
  updateTotalRows()

  return {
    queryFilters,
    columns,
    orderOptions,
    checkIns,
    currentPage,
    totalRows,
    loadFirstPage,
    loadNextPage,
    loadPrevPage,
    deleteCheckIn,
    createCheckIn,
    editCheckIn,
  }
}
