<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import { auth, db, ref as fbRef, set } from "@/firebase"
import {
  GoogleAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
  browserLocalPersistence,
  setPersistence
} from "firebase/auth"

//Initialize Google Auth Provider
const provider = new GoogleAuthProvider()

//Reactive error message and router instance
const errMsg = ref()
const router = useRouter()

//Function to handle google login
const logInWithGoogle = async () => {
  try {
    //sets persistence to local
    await setPersistence(auth, browserLocalPersistence)
    const result = await signInWithPopup(auth, provider)
    const { isNewUser } = getAdditionalUserInfo(result)

    //Register new user if they don't exist
    if (isNewUser) {
      await register(result.user)
    }

    //Redirect user to homepage after successful login
    router.push("/")
  } catch (err) {
    //Handling specific authentication error cases
    switch (err.code) {
      case "auth/invalid-email":
        errMsg.value = "Invalid email"
        break
      case "auth/user-not-found":
        errMsg.value = "No account with that email was found"
        break
      case "auth/wrong-password":
        errMsg.value = "Incorrect password"
        break
      default:
        errMsg.value = "Email or password was incorrect"
        break
    }
  }
}

//Register a new user into Firebase
const register = async (user) => {
  const userRef = fbRef(db, "users/" + user.uid)
  set(userRef, {
    "ConcurrentCheckIns" : 0,
    "HistoricCallCount" : 0,
    "IgnoreAll" : false,
  })
}
</script>

<template>
  <div class="w-screen h-screen bg-gradient-to-t from-primary to-primary-200 flex justify-center items-center">
    <div
      class="w-[500px] h-[450px] flex flex-col justify-between items-center border-4 border-surface-200 bg-surface-0 mx-auto drop-shadow-xl">
      <h1 class="text-[30px] p-10">User Sign In and Registration</h1>
      <button
        class="mb-[200px] self-center inline-flex items-center bg-transparent text-black font-semibold hover:text-primary py-2 px-4 hover:border-primary border-2 border-surface-100 rounded"
        @click="logInWithGoogle">
        <img class="w-4 h-4 mr-2" src="@/assets/images/google-icon-logo.svg" />
        <span>With Google</span>
      </button>
    </div>
  </div>
</template>
