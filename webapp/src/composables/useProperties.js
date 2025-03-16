import { reactive } from "vue"
import { auth, db, ref as fbRef, get } from "@/firebase"
import {set, remove} from "firebase/database"
import { phoneToNumber, formatPhoneNumber } from "@/services/formats"

const user = auth.currentUser
const pathToPhoneList = "permittedNumbers"
const pathToUser = `users/${user.uid}`
const propertiesPath = `${pathToUser}/Properties`
const dbRef = fbRef(db, propertiesPath)

export function useProperties() {
  const properties = reactive([])
  const columns = [
    {
      field: "name",
      header: "Property Name"
    },

    {
      field: "phoneString",
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

  const getPropertyRef = (pId) => fbRef(db,propertiesPath + "/" + phoneToNumber(pId))
  const getPhoneListRef = (pId) => fbRef(db, pathToPhoneList + "/" + phoneToNumber(pId))

  const refreshProperties = async () => {
    properties.length = 0
    try {
      const snapshot = await get(dbRef)
  
      if (!snapshot.exists()) return
  
      snapshot.forEach((snapChild) => {
        const property = snapChild.val()  
        property.number = snapChild.key
        property.phoneString = formatPhoneNumber(property.number)
        properties.push(property)
      })
    } catch (err) {
      console.error("Error fetching properties:", err)
      return
    }
  }

  const submitProperty = async (property) => {
    try {
      await set(getPropertyRef(property.number), property)
      await set(getPhoneListRef(property.number), auth.uid)
      await refreshProperties()
    } catch (err) {
      console.error("Error submitting property:", err)
    }
  }

  const deleteProperty = async (property) => {
    try {
      await remove(getPropertyRef(property.number))
      await remove(getPhoneListRef(property.number))
      await refreshProperties()
    } catch (err) {
      console.error("Error deleting property:", err)
    }
  }

  refreshProperties() //initialize properties value

  return { properties, columns, submitProperty, refreshProperties, deleteProperty }

}