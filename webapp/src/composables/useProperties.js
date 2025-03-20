import { reactive } from "vue"
import { auth, db, ref as fbRef, get } from "@/firebase"
import { useToast } from "primevue"
import {set, remove} from "firebase/database"
import { phoneToNumber, formatPhoneNumber } from "@/services/formats"

// Get current authenticated user
const user = auth.currentUser

// Define paths for easy reference to Firebase database
const pathToPhoneList = "permittedNumbers"
const pathToUser = `users/${user.uid}`
const propertiesPath = `${pathToUser}/Properties`
const dbRef = fbRef(db, propertiesPath)

// Composable function to manage properties
export function useProperties() {
  const toast = useToast()
  const properties = reactive([]) //reactive array - stores properties

  // Table columns config
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

  // Helper functions: gets firebase references
  const getPropertyRef = (pId) => fbRef(db,propertiesPath + "/" + phoneToNumber(pId))
  const getPhoneListRef = (pId) => fbRef(db, pathToPhoneList + "/" + phoneToNumber(pId))

  // Function to refresh properties from firebase
  const refreshProperties = async () => {
    properties.length = 0 //clears existing properties
    try {
      const snapshot = await get(dbRef)
  
      if (!snapshot.exists()) return //exit if no data
  
      // Processes each property, and then adds it to properties array
      snapshot.forEach((snapChild) => {
        const property = snapChild.val()  
        property.number = snapChild.key
        property.phoneString = formatPhoneNumber(property.number)
        properties.push(property)
      })
    } catch (err) {
      // Error toast if failed refresh
      toast.add({
        severity: "error",
        detail: err,
        summary: "Failed refreshing properties",
        life: 3000
      })
    }
  }

  // Function to submit a new OR updated property to Firebase
  const submitProperty = async (property) => {
    try {
      await set(getPropertyRef(property.number), property) // Saves property data
      await set(getPhoneListRef(property.number), user.uid) // Adds to permitted numbers
      await refreshProperties()
    } catch (err) {
      toast.add({
        severity: "error",
        detail: err,
        summary: "Failed submitting property",
        life: 3000
      })
    }
  }

  // Function to delete a property from Firebase
  const deleteProperty = async (property) => {
    try { 
      await remove(getPropertyRef(property.number)) // Removes property data
      await remove(getPhoneListRef(property.number)) // Removes from permitted numbers
      await refreshProperties()
    } catch (err) {
      toast.add({
        severity: "error",
        detail: err,
        summary: "Failed deleting property",
        life: 3000
      })
    }
  }

  refreshProperties() //initialize properties values on first load

  // Export properties + functions, for external use
  return { properties, columns, submitProperty, refreshProperties, deleteProperty }

}