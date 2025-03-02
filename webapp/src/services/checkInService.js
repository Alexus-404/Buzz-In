import { auth, db, ref as fbRef, get } from "@/firebase";
import {
  limitToFirst,
  orderByChild,
  query as fbQuery,
  startAt,
  endAt,
} from "firebase/database";

const GRACE_PERIOD = 2 * 60 * 60 * 1000; //able to check in 2 hours away from check in time

const user = auth.currentUser;
const pathToUser = `users/${user.uid}`;
const dbRef = fbRef(db, pathToUser + "/CheckIns");

function formatDate(targetDate) {
  const now = new Date();
  const diff = +targetDate - (+now + GRACE_PERIOD); //different in miliseconds before check in opens
  const diffEnd = +now - (+targetDate + GRACE_PERIOD); // difference before check in close

  const minBeforeClose = Math.round(diffEnd / (1000 * 60));
  const minBeforeOpen = Math.round(diff / (1000 * 60));
  const hourBeforeOpen = Math.round(diff / (1000 * 60 * 60));
  const dayBeforeOpen = Math.round(diff / (1000 * 60 * 60 * 24));

  if (minBeforeClose < 60 && minBeforeClose > -1) {
    return `closing in ${minBeforeClose} minute${
      minBeforeClose != 1 ? "s" : ""
    }`;
  } else if (minBeforeOpen < 0) {
    return "open";
  } else if (minBeforeOpen < 1) {
    return "less than a minute";
  } else if (minBeforeOpen < 60) {
    return `in ${minBeforeOpen} minute${minBeforeOpen > 1 ? "s" : ""}`;
  } else if (hourBeforeOpen < 24) {
    return `in ${hourBeforeOpen} hour${hourBeforeOpen > 1 ? "s" : ""}`;
  } else if (dayBeforeOpen < 7) {
    return `in ${dayBeforeOpen} day${dayBeforeOpen > 1 ? "s" : ""}`;
  } else {
    return targetDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}

const queryCheckIns = async ({
  order,
  limit,
  minDate,
  maxDate,
  keywords = [],
}) => {
  minDate -= GRACE_PERIOD;
  try {
    const query = fbQuery(
      dbRef,
      orderByChild("time"),
      limitToFirst(limit),
      startAt(minDate.valueOf()),
      endAt(maxDate.valueOf())
    );
    const snapshot = await get(query);

    if (!snapshot.exists()) return [];

    let results = [];
    snapshot.forEach((snapChild) => {
      const checkIn = snapChild.val();
      checkIn.id = snapChild.key;
      if (
        keywords.length === 0 ||
        keywords.some((keyword) =>
          Object.values(checkIn).some((value) => value.includes(keyword))
        )
      ) {
        results.push(checkIn);
      }
    });

    if (order === "oldest") {
      results.sort((a, b) =>
        a[order] < b[order] ? -1 : a[order] > b[order] ? 1 : 0
      );
    }

    //preprocess results
    results.forEach((checkIn) => {
      checkIn.time = new Date(checkIn.time);
      checkIn.status = formatDate(checkIn.time);
    });

    return results;
  } catch (err) {
    console.error("Error fetching check-ins:", err);
    return [];
  }
};

export { queryCheckIns };
