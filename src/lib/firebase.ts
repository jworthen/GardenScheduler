import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBQiEQEegnLBCZlWc1nB3xCx_IC4PG_M4o",
  authDomain: "gardenscheduler-a34df.firebaseapp.com",
  projectId: "gardenscheduler-a34df",
  storageBucket: "gardenscheduler-a34df.firebasestorage.app",
  messagingSenderId: "751588654100",
  appId: "1:751588654100:web:5172e4edb2c91f473c3b01",
  measurementId: "G-GH2BNZH90V",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
