import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// AUTO CONNECT (hardcoded)
export const firebaseConfig = {
  apiKey: "AIzaSyAg13IhTcIa9589AIID4Rb5YZxbdFrh-h0",
  authDomain: "sagaadventure-dd638.firebaseapp.com",
  projectId: "sagaadventure-dd638",
  storageBucket: "sagaadventure-dd638.firebasestorage.app",
  messagingSenderId: "626572110187",
  appId: "1:626572110187:web:be01813f1eecd02387042e",
};

let auth: firebase.auth.Auth;
let db: firebase.firestore.Firestore;

try {
  const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
  auth = app.auth();
  db = app.firestore();
} catch (e) {
  // If something goes wrong, keep references null-ish.
  // But for this project we expect Firebase to be available.
  // eslint-disable-next-line no-console
  console.error("Firebase init error:", e);
  // @ts-expect-error fallback
  auth = null;
  // @ts-expect-error fallback
  db = null;
}

export { auth, db };

// Keep legacy collections path compatible with older data
// NOTE: artifacts/{appId}/public/data/... uses the Firebase Web App ID historically.
export const appId = firebaseConfig.appId;

export const isCloudEnabled = true;
