const GRACE_PERIOD = 2 * 60 * 60 * 1000; 

export function getStatus(targetDate) {
  const now = new Date();
  const diff = +targetDate - (+now + GRACE_PERIOD); //different in miliseconds before check in opens
  const diffEnd = +now - (+targetDate + GRACE_PERIOD); // difference before check in close

  const minBeforeClose = Math.round(diffEnd / (1000 * 60));
  const minBeforeOpen = Math.round(diff / (1000 * 60));
  const hourBeforeOpen = Math.round(diff / (1000 * 60 * 60));
  const dayBeforeOpen = Math.round(diff / (1000 * 60 * 60 * 24));

  if (minBeforeClose < 60 && minBeforeClose > -1) {
    return `closing in ${minBeforeClose} minute${minBeforeClose != 1 ? "s" : ""
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