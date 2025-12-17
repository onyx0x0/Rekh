// js/firebase.js

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCrIYFIee9nzmfyfBhjObtKSwNbpZ9cnZA",
  authDomain: "orionix-b1b4f.firebaseapp.com",
  projectId: "orionix-b1b4f",
  storageBucket: "orionix-b1b4f.firebasestorage.app",
  messagingSenderId: "1005662658299",
  appId: "1:1005662658299:web:d147adbe3b5dbdff451a5e",
  measurementId: "G-4WZ1SCP76R"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore and Auth
const db = firebase.firestore();
const auth = firebase.auth();