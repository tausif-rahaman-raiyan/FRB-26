import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCNTSiVxlLr1Ipjp8MGA5A3mpKN370cStA",
  authDomain: "mystudytracker-693d3.firebaseapp.com",
  projectId: "mystudytracker-693d3",
  storageBucket: "mystudytracker-693d3.firebasestorage.app",
  messagingSenderId: "172652188741",
  appId: "1:172652188741:web:f100cff62dd097b2763f2c",
  measurementId: "G-QG3PTZF7EQ"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  type User
};
