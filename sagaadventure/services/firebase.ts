
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// Global variable declarations for environment-specific configs
declare global {
  var __firebase_config: string | undefined;
  var __app_id: string | undefined;
  var __initial_auth_token: string | undefined;
}

// Fixed: Using compat types for Firebase v8 style code
let auth: firebase.auth.Auth | null = null;
let db: firebase.firestore.Firestore | null = null;

// Your Firebase Web App config (hardcoded as requested)
// NOTE: This is safe to be public; the real security is handled by Firebase Security Rules.
const hardcodedFirebaseConfig = {
  apiKey: "AIzaSyAg13IhTcIa9589AIID4Rb5YZxbdFrh-h0",
  authDomain: "sagaadventure-dd638.firebaseapp.com",
  projectId: "sagaadventure-dd638",
  storageBucket: "sagaadventure-dd638.firebasestorage.app",
  messagingSenderId: "626572110187",
  appId: "1:626572110187:web:be01813f1eecd02387042e"
};

const configStr = typeof window !== 'undefined' ? (window as any).__firebase_config : undefined;

// Fallback for normal Vite/React deployments (no didn’t set __firebase_config)
const envConfig = typeof import.meta !== 'undefined' ? {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID,
} : null;

if (configStr && configStr !== "{}" && !configStr.includes("YOUR_FIREBASE_CONFIG")) {
  try {
    const firebaseConfig = JSON.parse(configStr);
    // Only initialize if we have a seemingly valid API Key
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "dummy") {
      const app = firebase.initializeApp(firebaseConfig);
      // Fixed: Using compat methods for Firebase v8 style code
      auth = app.auth();
      db = app.firestore();
    }
  } catch (error) {
    console.warn("Firebase config found but failed to parse or initialize:", error);
  }
} else {
  // No __firebase_config: try env vars, otherwise use the hardcoded config
  try {
    const cfg = (envConfig?.apiKey ? envConfig : hardcodedFirebaseConfig) as any;
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
    auth = app.auth();
    db = app.firestore();
  } catch (e) {
    console.info("Firebase configuration is missing or invalid. App will run in Demo Mode (Local Storage).", e);
  }
}

export { auth, db };
export const appId = typeof (window as any).__app_id !== 'undefined' ? (window as any).__app_id : 'default-app-id';
