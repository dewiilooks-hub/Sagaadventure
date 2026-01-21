import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// Auto-connect Firebase for internal staff use (no Cloud Settings UI).
// Auth is REQUIRED (email/password). No anonymous sign-in.

declare global {
  // Optional: If you later inject an app id from the hosting environment.
  // eslint-disable-next-line no-var
  var __app_id: string | undefined;
}

const firebaseConfig = {
  apiKey: "AIzaSyAg13IhTcIa9589AIID4Rb5YZxbdFrh-h0",
  authDomain: "sagaadventure-dd638.firebaseapp.com",
  projectId: "sagaadventure-dd638",
  storageBucket: "sagaadventure-dd638.firebasestorage.app",
  messagingSenderId: "626572110187",
  appId: "1:626572110187:web:be01813f1eecd02387042e",
};

let auth: firebase.auth.Auth | null = null;
let db: firebase.firestore.Firestore | null = null;
let isCloudEnabled = false;

try {
  const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
  auth = app.auth();
  db = app.firestore();
  isCloudEnabled = true;
} catch (e) {
  console.error("Firebase init failed:", e);
  auth = null;
  db = null;
  isCloudEnabled = false;
}

export { auth, db, isCloudEnabled };

// Used to namespace data paths in Firestore (keeps existing code compatible).
export const appId =
  typeof (window as any).__app_id !== "undefined" && (window as any).__app_id
    ? (window as any).__app_id
    : "sagaadventure-dd638";
