import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getDatabase, ref, set, get, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyByMdBps-tzircRFPDZjPpYdwnZJ9sn-Uw",
  authDomain: "buzz-in-328b3.firebaseapp.com",
  databaseURL: "https://buzz-in-328b3-default-rtdb.firebaseio.com",
  projectId: "buzz-in-328b3",
  storageBucket: "buzz-in-328b3.firebasestorage.app",
  messagingSenderId: "82528431162",
  appId: "1:82528431162:web:dc1ee123bfa412aaaf1903",
  measurementId: "G-QQ6R93RL14",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export {
  app,
  auth,
  db,
  ref,
  set,
  get,
  onValue,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
};
