
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Global variable declarations for environment-specific configs
declare global {
  var __firebase_config: string | undefined;
  var __app_id: string | undefined;
  var __initial_auth_token: string | undefined;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

const configStr = typeof window !== 'undefined' ? (window as any).__firebase_config : undefined;

if (configStr && configStr !== "{}" && !configStr.includes("YOUR_FIREBASE_CONFIG")) {
  try {
    const firebaseConfig = JSON.parse(configStr);
    // Only initialize if we have a seemingly valid API Key
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "dummy") {
      app = initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
    }
  } catch (error) {
    console.warn("Firebase config found but failed to parse or initialize:", error);
  }
} else {
  console.info("Firebase configuration is missing or invalid. App will run in Demo Mode (Local Storage).");
}

export { auth, db };
export const appId = typeof (window as any).__app_id !== 'undefined' ? (window as any).__app_id : 'default-app-id';
