import { auth, db, ref as fbRef, get } from "@/firebase";

const user = auth.currentUser;
const pathToUser = `users/${user.uid}`;
const dbRef = fbRef(db, pathToUser + "/CallLog");

const formatDate = (date) => {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, // 24-hour format
  });
};

const getCalls = async () => {
  try {
    const snapshot = await get(dbRef);

    if (!snapshot.exists()) return [];

    let results = [];
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

      results.push(callInfo);
    });
    return results;
  } catch (err) {
    console.error("Error fetching call log:", err);
    return [];
  }
};

export { getCalls };
