import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// Global variable declarations for environment-specific configs
declare global {
  var __firebase_config: string | undefined;
  var __app_id: string | undefined;
  var __initial_auth_token: string | undefined;
}

let auth: firebase.auth.Auth | null = null;
let db: firebase.firestore.Firestore | null = null;
let isCloudEnabled = false;

// Default Firebase config (embedded) — enables Auth/Firestore without requiring users to paste JSON.
// This does NOT change the UI; it only removes the need for manual setup.
const defaultFirebaseConfig = {
  apiKey: "AIzaSyAg13IhTcIa9589AIID4Rb5YZxbdFrh-h0",
  authDomain: "sagaadventure-dd638.firebaseapp.com",
  projectId: "sagaadventure-dd638",
  storageBucket: "sagaadventure-dd638.firebasestorage.app",
  messagingSenderId: "626572110187",
  appId: "1:626572110187:web:be01813f1eecd02387042e",
};

// Function to safely initialize Firebase
const initializeFirebase = (config: any) => {
  if (config && config.apiKey && config.apiKey !== "dummy") {
    try {
      // Use existing app if already initialized, or create new one
      const app = !firebase.apps.length ? firebase.initializeApp(config) : firebase.app();
      auth = app.auth();
      db = app.firestore();
      isCloudEnabled = true;
      return true;
    } catch (e) {
      console.error("Firebase Init Error:", e);
      return false;
    }
  }
  return false;
};

// 1. Check for user-defined config in localStorage first (for cross-device manual setup)
if (typeof window !== 'undefined') {
  const savedConfig = localStorage.getItem('saga_user_firebase_config');
  if (savedConfig) {
    try {
      initializeFirebase(JSON.parse(savedConfig));
    } catch (e) {
      console.warn("Saved Firebase config is invalid, clearing...");
      localStorage.removeItem('saga_user_firebase_config');
    }
  }
}

// 2. Fallback to global config if not yet enabled
if (!isCloudEnabled) {
  const configStr = typeof window !== 'undefined' ? (window as any).__firebase_config : undefined;
  if (configStr && configStr !== "{}" && !configStr.includes("YOUR_FIREBASE_CONFIG")) {
    try {
      initializeFirebase(JSON.parse(configStr));
    } catch (error) {
      console.warn("Global Firebase config failed to initialize");
    }
  }
}

// 3. Final fallback: use embedded default config
if (!isCloudEnabled) {
  initializeFirebase(defaultFirebaseConfig);
}

export { auth, db, isCloudEnabled };
export const appId = typeof (window as any).__app_id !== 'undefined' ? (window as any).__app_id : 'default-app-id';

/**
 * Returns a per-user, per-app collection reference.
 * Data will live under: users/{uid}/apps/{appId}/{collectionName}
 */
export const getUserCollection = (collectionName: string): firebase.firestore.CollectionReference | null => {
  if (!db || !auth || !auth.currentUser) return null;
  const uid = auth.currentUser.uid;
  return db
    .collection('users')
    .doc(uid)
    .collection('apps')
    .doc(appId)
    .collection(collectionName);
};

/** Legacy public path used by older builds (kept for backward compatibility) */
export const getLegacyPublicCollection = (collectionName: string): firebase.firestore.CollectionReference | null => {
  if (!db) return null;
  return db
    .collection('artifacts')
    .doc(appId)
    .collection('public')
    .doc('data')
    .collection(collectionName);
};

/** Prefer per-user collection; fallback to legacy path if needed */
export const getBestCollection = (collectionName: string): firebase.firestore.CollectionReference | null => {
  return getUserCollection(collectionName) ?? getLegacyPublicCollection(collectionName);
};