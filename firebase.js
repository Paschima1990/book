// firebase.js (use type="module" in script tag)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDNcwoxGzY07vethlvxhf5a2SfiuT9Gkjw",
  authDomain: "bookmanager-e95c2.firebaseapp.com",
  projectId: "bookmanager-e95c2",
  storageBucket: "bookmanager-e95c2.firebasestorage.app",
  messagingSenderId: "495339451421",
  appId: "1:495339451421:web:dca324b11c99dd41ebc2f4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, signInWithEmailAndPassword, signOut, onAuthStateChanged };
