import { reactive } from "vue"
import { auth, db, ref as fbRef, get } from "@/firebase"
import {set, remove} from "firebase/database"

const user = auth.currentUser
const pathToUser = `users/${user.uid}`
const dbRef = fbRef(db, pathToUser + "/Properties")

const formatPhoneNumber = (number) => {
  let countryCode = number.substring(0, number.length - 10)
  const localNumber = number.substring(number.length - 10)
  return `+${countryCode} (${localNumber.substring(
    0,
    3
  )}) ${localNumber.substring(3, 6)}-${localNumber.substring(6)}`
}

export function useProperties() {
  const properties = reactive([])
  const columns = [
    {
      field: "name",
      header: "Property Name"
    },

    {
      field: "number",
      header: "Phone Number"
    },
    {
      field: "dtmf",
      header: "Dial Tone"
    },
    {
      field: "address",
      header: "Address"
    },
  ]

  const refreshProperties = async () => {
    properties.length = 0
    try {
      const snapshot = await get(dbRef)
  
      if (!snapshot.exists()) return
  
      snapshot.forEach((snapChild) => {
        const property = snapChild.val()
        property.number = formatPhoneNumber(snapChild.key)
  
        properties.push(property)
      })
    } catch (err) {
      console.error("Error fetching properties:", err)
      return
    }
  }

  const submitProperty = (pNumber, property) => {
    const propertyRef = fbRef(db,pathToUser + "/Properties/" + pNumber)
    set(propertyRef, property)
  }

  const deleteProperty = (pNumber) => {
    const propertyRef = fbRef(db,pathToUser + "/Properties/" + formatPhoneNumber(pNumber))
    remove(propertyRef)
  }

  refreshProperties() //initialize properties value

  return { properties, columns, submitProperty, refreshProperties, deleteProperty }

}