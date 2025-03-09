import { reactive } from "vue";
import { auth, db, ref as fbRef, get, set } from "@/firebase";
import { limitToFirst, orderByChild, query as fbQuery, startAt, endAt, remove, push } from "firebase/database";
import { getStatus } from "@/services/getStatus";

const MAX_DELTA = 30 * 24 * 60 * 60 * 1000; // Display check-ins up to 30 days ahead
const GRACE_PERIOD = 2 * 60 * 60 * 1000;      // Allow check-in within 2 hours of check in time

const user = auth.currentUser;
const pathToUser = `users/${user.uid}`;
const checkInsPath = `${pathToUser}/CheckIns`;
const dbRef = fbRef(db, checkInsPath);

export function useCheckIns() {
  const checkIns = reactive([]);
  
  const columns = [
    { field: "name", header: "Guest Name" },
    { field: "property", header: "Property" },
    { field: "time", header: "Check-In Time" },
  ];

  const orderOptions = ["oldest", "newest"];
  
  const queryFilters = reactive({
    order: "newest",
    limit: 25,
    minDate: new Date(Date.now() - GRACE_PERIOD),
    maxDate: new Date(Date.now() + MAX_DELTA),
    keywords: [],
  });

  // Helper to generate a reference for a given check-in ID
  const getCheckInRef = (cid) => fbRef(db, `${checkInsPath}/${cid}`);

  const refreshQuery = async () => {
    // Clear the existing checkIns array
    checkIns.length = 0;
    try {
      const startTime = queryFilters.minDate.valueOf() - GRACE_PERIOD;
      const endTime = queryFilters.maxDate.valueOf();
      const dbQuery = fbQuery(
        dbRef,
        orderByChild("time"),
        limitToFirst(queryFilters.limit),
        startAt(startTime),
        endAt(endTime)
      );
      const snapshot = await get(dbQuery);

      if (!snapshot.exists()) return;

      snapshot.forEach((snapChild) => {
        const checkIn = snapChild.val();
        checkIn.id = snapChild.key;
        // Filter based on keywords (if provided)
        const matchesKeywords =
          queryFilters.keywords.length === 0 ||
          queryFilters.keywords.some((keyword) =>
            Object.values(checkIn).some((value) =>
              value?.toString().includes(keyword)
            )
          );
        if (matchesKeywords) {
          checkIn.time = new Date(checkIn.time);
          checkIn.status = getStatus(checkIn.time);
          checkIns.push(checkIn);
        }
      });

      // Sort check-ins based on the selected order
      if (queryFilters.order === "oldest") {
        checkIns.sort((a, b) => a.time - b.time);
      } else {
        checkIns.sort((a, b) => b.time - a.time);
      }
    } catch (err) {
      console.error("Error fetching check-ins:", err);
    }
  };

  const deleteCheckIn = async (cid) => {
    try {
      await remove(getCheckInRef(cid));
      await refreshQuery();
    } catch (err) {
      console.error("Error deleting check-in:", err);
    }
  };

  const createCheckIn = async (checkIn) => {
    try {
      const newCheckInRef = push(fbRef(db, checkInsPath));
      await set(newCheckInRef, checkIn);
    } catch (err) {
      console.error("Error creating check-in:", err);
    }
  };

  const editCheckIn = async (cid, checkIn) => {
    try {
      await set(getCheckInRef(cid), checkIn);
    } catch (err) {
      console.error("Error editing check-in:", err);
    }
  };

  return {
    queryFilters,
    columns,
    orderOptions,
    checkIns,
    refreshQuery,
    deleteCheckIn,
    createCheckIn,
    editCheckIn,
  };
}
