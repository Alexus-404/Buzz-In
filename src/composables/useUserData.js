import { reactive, ref } from 'vue';
import { auth, db, ref as fbRef, get } from '@/firebase'
import {onChildAdded,onChildChanged,onChildRemoved} from "firebase/database";

const userData = reactive({
    CallLog: null,
})
const loading = ref(true);

const setupUpdater = (userId) => {
    const pathToUser = `users/${userId}`;
    const ref = fbRef(db, pathToUser);
  
    onChildAdded(ref, (data) => {
      userData[data.key] = data.val();
    });
  
    onChildChanged(ref, (data) => {
      userData[data.key] = data.val();
    });
  
    onChildRemoved(ref, (data) => {
      delete userData[data.key];
    });
  };

const loadUserData = async (userId) => {
    try {
        const pathToUser = `users/${userId}`;
        const snapshot = await get(fbRef(db, pathToUser));

        if (snapshot.exists()) {
            const data = snapshot.val()

            userData.CallLog = data.CallLog || {};
        } else {
            console.log("No user data found!");
        }
    } catch (err) {
        console.error("Error fetching data:", err);
    } finally {
        loading.value = false;
        setupUpdater(userId);
    }
}

const initializeUserData = async() => {
    const user = auth.currentUser;
    if (user) {
        await loadUserData(user.uid)
    }
};

export const useUserData = () => ({
    userData,
    loading,
    initializeUserData
})
