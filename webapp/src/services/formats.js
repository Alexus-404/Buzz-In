function phoneToNumber(phone) {
  return phone.replace(/\D/g, "")
}

function formatPhoneNumber(number) {
    let countryCode = number[0]
    const localNumber = number.substring(number.length - 10)
    return `+${countryCode} (${localNumber.substring(
        0,
        3
    )}) ${localNumber.substring(3, 6)}-${localNumber.substring(6)}`
}

const formatDate = (date) => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export { phoneToNumber, formatPhoneNumber, formatDate }