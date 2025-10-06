// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAmMJu0aAaGbUauMSySnZPgfSuapVsZBUk",
  authDomain: "test-b2eed.firebaseapp.com",
  databaseURL: "https://test-b2eed-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "test-b2eed",
  storageBucket: "test-b2eed.firebasestorage.app",
  messagingSenderId: "465881884894",
  appId: "1:465881884894:web:231d381f667b472be23a4f",
  measurementId: "G-T0NNX0EMQ2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app);

export default app;