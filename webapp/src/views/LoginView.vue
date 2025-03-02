<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserData } from "@/composables/useUserData";
import {
  auth,
  db,
  ref as fbRef,
  set,
} from "@/firebase";
import { GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from "firebase/auth";

const provider = new GoogleAuthProvider();
const {initializeUserData} = useUserData();

const errMsg = ref();
const router = useRouter();

const logInWithGoogle = async () => {
  signInWithPopup(auth, provider)
    .then((result) => {
      const { isNewUser } = getAdditionalUserInfo(result);
      if (isNewUser) {
        register(result.user);
      }
      initializeUserData();
      router.push("/"); 
    })
    .catch((err) => {
      switch (err.code) {
        case "auth/invalid-email":
          errMsg.value = "Invalid email";
          break;
        case "auth/user-not-found":
          errMsg.value = "No account with that email was found";
          break;
        case "auth/wrong-password":
          errMsg.value = "Incorrect password";
          break;
        default:
          console.log(err)
          errMsg.value = "Email or password was incorrect";
          break;
      }
    });

  const register = async (user) => {
    const userRef = fbRef(db, "users/" + user.uid);
    set(userRef, {
      email: user.email,
    });
  };
};
</script>

<template>
  <div class="w-screen h-screen bg-gradient-to-t from-primary to-primary-200 flex justify-center items-center">

    <div class="w-[500px] h-[450px] flex flex-col justify-between items-center border-4 border-surface-200 bg-surface-0 mx-auto drop-shadow-xl">
      <h1 class="text-[30px] p-10">User Sign In and Registration</h1>
      <button class="mb-[200px] self-center inline-flex items-center bg-transparent text-black font-semibold hover:text-primary py-2 px-4 hover:border-primary border-2 border-surface-100 rounded" @click="logInWithGoogle">
        <img class="w-4 h-4 mr-2" src="@/assets/images/google-icon-logo.svg"/>
        <span>With Google</span>
      </button>
    </div>
  </div>
</template>
