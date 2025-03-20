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
import { phoneToNumber } from "@/services/formats"
import { useProperties } from "@/composables/useProperties"
import { useToast } from 'primevue/usetoast'

const MAX_DELTA = 30 * 24 * 60 * 60 * 1000 // up to 30 days ahead
const GRACE_PERIOD = 2 * 60 * 60 * 1000      // allow check-in within 2 hours

const user = auth.currentUser
const pathToUser = `users/${user.uid}`
const concurrentCheckInsPath = `${pathToUser}/ConcurrentCheckIns`
const checkInsPath = `${pathToUser}/CheckIns`
const dbRef = fbRef(db, checkInsPath)
const concurrentCheckInsRef = fbRef(db, concurrentCheckInsPath)

export function useCheckIns() {
  const { properties } = useProperties()
  const toast = useToast()
  
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
    limit: 5,
    minDate: new Date(Date.now() - GRACE_PERIOD),
    maxDate: new Date(Date.now() + MAX_DELTA),
    property: "",
  })

  // Returns a database reference for a given check-in ID
  const getCheckInRef = (cid) => fbRef(db, `${checkInsPath}/${cid}`)

  // Normalizes and formats a check-in entry from database to be displayed in
  const processCheckIn = (snapChild) => {
    const checkIn = snapChild.val()
    // Filter based on property if one is specified
    if (!queryFilters.value.property || checkIn.property === queryFilters.value.property) {
      //Normalize check-in data for displaying
      checkIn.id = snapChild.key
      checkIn.time = new Date(checkIn.time)
      checkIn.status = getStatus(checkIn.time)

      //Assign a property name to check-in, or undefined if none
      const foundProperty = [...properties].find(
        (obj) => phoneToNumber(obj.number) === checkIn.property
      )
      checkIn.property = foundProperty ? foundProperty.name : "undefined"

      //Push check-in to datatable values
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
      toast.add({
        severity: "error",
        summary: err,
        detail: "Failed updating rows",
        life: 3000
      })
    }
  }

  // Returns a firebase query based on paging direction and filter params
  const getQueryFilters = (direction) => {
    //Local values renamed for readability within function
    const { order, limit, minDate, maxDate } = queryFilters.value
    const minTime = minDate.valueOf() - GRACE_PERIOD
    const maxTime = maxDate.valueOf()

    /*Initialize query filter parameters.
      start      - unix timestamp of minimum time check-ins must begin at
      end        - unix timestamp of maximum time check-ins must end at
      limitQuery - numerical value representing how many check-ins to get
    */
    let start, end, limitQuery

    //Handles "first", "next", and "previous" directions.
    //Defines custom actions depending on sort order of filters
    //Switch statement for control flow
    switch (direction) {
      //If loading first page, restrict to min and max times
      case "first":
        start = startAt(minTime)
        end = endAt(maxTime)
        limitQuery = order === "oldest"
          ? limitToLast(limit)
          : limitToFirst(limit)
        break
      //If loading next page, restrict relative to position of end-cursor
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
      //If loading previous page, restrict relative to position of start-cursor
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
      default: //error if state is none of above
        throw new Error("Invalid paging state")
    }

    //return values as a firebase query object with parameters
    return fbQuery(dbRef, orderByChild("time"), start, end, limitQuery)
  }

  // Unified paging loader for all directions (first, next, and previous page)
  //Gets data from queries --> pre-processes data based on direction --> updates cursor
  const loadPage = async (direction, updatePageCounter) => {
    //Clears check-ins array to populate with new values
    checkIns.length = 0

    //Updates current page value based on direction
    updatePageCounter()

    //try block to catch errors
    try {
      //Dynamically update query filters based on direction of page load
      const dbQuery = getQueryFilters(direction)

      //Gets data from firebase, then organizes data based on queryFilters
      const snapshot = await get(dbQuery)
      snapshot.forEach(processCheckIn)

      // For next/previous pages, remove the extra check-in
      if (direction === "next" && checkIns.length) {
        queryFilters.value.order === "oldest" ? checkIns.pop() : checkIns.shift()
      } else if (direction === "previous" && checkIns.length) {
        queryFilters.value.order === "oldest" ? checkIns.shift() : checkIns.pop()
      }

      //guard clause to ensure that array is not empty
      if (!checkIns.length) return

      // Reverse the order if displaying oldest first
      if (queryFilters.value.order === "oldest") {
        checkIns.reverse()
      }

      //Updates a running "cursor" as refernece for future page requests
      //Tracks timestamps of first and last check-ins
      currentPageFirst = checkIns[0].time
      currentPageLast = checkIns[checkIns.length - 1].time
      
    } catch (err) { //ensures errors during fetching process are caught
      toast.add({
        severity: "error",
        summary: err,
        detail: "Failed loading page",
        life: 3000
      })   
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

  //removes check-in from database, in case guest cancels their booking
  const deleteCheckIn = async (checkIn) => {
    try {
      //removes check-in from database. if none, throw error
      await remove(getCheckInRef(checkIn.id))

      //refreshes the datatable on webpage
      await loadFirstPage()

      //Subtracts total row count by one
      await updateTotalRows(-1)
    } catch (err) { //catch errors during delete process and output to user
      toast.add({
        severity: "error",
        summary: err,
        detail: "Failed deleting check-in",
        life: 3000
      })
    }
  }

  //Creates a check in upon user submits a form
  //Asynchronous to allow multiple processes to run simultaneously
  const createCheckIn = async (checkIn) => {
    // Normalize time and property values for storage
    checkIn.time = checkIn.time.getTime()
    checkIn.property = checkIn.property.number

    //wrap in try block for error handling
    try {
      //Gets reference in database from path, generating a unique ID
      const newCheckInRef = push(fbRef(db, checkInsPath))
      await set(newCheckInRef, checkIn)
      
      //refreshes the datatable on webpage
      await loadFirstPage()
      //Increments total row count of datatable by one
      await updateTotalRows(1)
      
    } catch (err) { //catch errors during write process of database
      toast.add({
        severity: "error",
        summary: err,
        detail: "Failed creating check-in",
        life: 3000
      })    
    }
  }

  //Edits existing check-in and updates their values
  //takes in their unique ID and new values
  const editCheckIn = async (cid, checkIn) => {
    // Normalize time and property values for storage
    checkIn.time = checkIn.time.getTime()
    checkIn.property = checkIn.property.number

    try {
      //awaits to set new values into existing ID
      await set(getCheckInRef(cid), checkIn)

      //refreshes the datatable on webpage
      await loadFirstPage()
    } catch (err) { //try-catch block to catch exceptions
      toast.add({
        severity: "error",
        detail: `Failed editing check-in of id ${cid}. Please try again`,
        summary: err,
        life: 3000
      })
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
