import { auth, db, ref as fbRef, get } from "@/firebase";

const user = auth.currentUser;
const pathToUser = `users/${user.uid}`;
const dbRef = fbRef(db, pathToUser + "/Properties");

const formatPhoneNumber = (number) => {
  let countryCode = number.substring(0, number.length - 10);
  const localNumber = number.substring(number.length - 10);
  return `+${countryCode} (${localNumber.substring(
    0,
    3
  )}) ${localNumber.substring(3, 6)}-${localNumber.substring(6)}`;
};

const getProperties = async () => {
  try {
    const snapshot = await get(dbRef);

    if (!snapshot.exists()) return [];

    let results = [];
    snapshot.forEach((snapChild) => {
      const property = snapChild.val();
      property.number = formatPhoneNumber(snapChild.key);

      results.push(property);
    });
    return results;
  } catch (err) {
    console.error("Error fetching properties:", err);
    return [];
  }
};

export { getProperties };
