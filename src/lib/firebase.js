// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase config (get this from Firebase Console > Project Settings)
const firebaseConfig = {
  apiKey: "AIzaSyBI-1mHzryFJTbAzqoTS-py3Icfx6vvHZY",
  authDomain: "internship-job-tracker.firebaseapp.com",
  projectId: "internship-job-tracker",
  storageBucket: "internship-job-tracker.firebasestorage.app",
  messagingSenderId: "893022464025",
  appId: "1:893022464025:web:efaf32adb3046abb45a288",
  measurementId: "G-994DWP1HX0",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
