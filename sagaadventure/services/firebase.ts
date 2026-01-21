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
const APP_ID_OVERRIDE_KEY = 'saga_app_doc_id';

// IMPORTANT:
// Many earlier builds stored data under artifacts/{appId}/public/data/... where appId
// was commonly "sagaadventure" (not the Firebase project id).
// If appId changes, it will look like the database "disappeared" even though the data
// is still there under a different document id.
//
// We keep this backward-compatible by:
// 1) Using an override from localStorage if present.
// 2) Otherwise using window.__app_id if injected.
// 3) Defaulting to "sagaadventure" (legacy-friendly).
export const appId =
  (typeof window !== 'undefined' && localStorage.getItem(APP_ID_OVERRIDE_KEY)) ||
  (typeof (window as any).__app_id !== 'undefined' && (window as any).__app_id) ||
  'sagaadventure';

// Optional helper if you ever need to switch the data namespace intentionally.
export function setAppIdOverride(nextAppId: string) {
  try {
    localStorage.setItem(APP_ID_OVERRIDE_KEY, nextAppId);
  } catch {
    // ignore
  }
}
