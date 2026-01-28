import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyAg13IhTcIa9589AIID4Rb5YZxbdFrh-h0",
  authDomain: "sagaadventure-dd638.firebaseapp.com",
  projectId: "sagaadventure-dd638",
  storageBucket: "sagaadventure-dd638.firebasestorage.app",
  messagingSenderId: "626572110187",
  appId: "1:626572110187:web:be01813f1eecd02387042e"
};

// Firestore doc id used by the existing app data (artifacts/{appId}/public/data/...)
export const appId = firebaseConfig.appId;

let _auth: firebase.auth.Auth;
let _db: firebase.firestore.Firestore;

export const initFirebase = () => {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  _auth = firebase.auth();
  _db = firebase.firestore();
  return { auth: _auth, db: _db };
};

// Initialize immediately for the whole app
initFirebase();

export const auth = _auth;
export const db = _db;

// Cloud is always enabled in this build
export const isCloudEnabled = true;
