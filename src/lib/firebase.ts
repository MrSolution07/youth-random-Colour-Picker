import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  type Firestore,
  serverTimestamp,
} from "firebase/firestore";

const requiredEnv = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

function envOrThrow(key: string): string {
  const v = import.meta.env[key as keyof ImportMetaEnv];
  if (!v) throw new Error(`Missing ${key} in .env.local`);
  return String(v);
}

// App initialization can throw if env isn't present; the UI will remain blank
// until you set up your Firebase credentials.
export const appReady = (() => {
  try {
    for (const k of requiredEnv) envOrThrow(k);
    return true;
  } catch {
    return false;
  }
})();

const firebaseConfig = appReady
  ? {
      apiKey: envOrThrow("VITE_FIREBASE_API_KEY"),
      authDomain: envOrThrow("VITE_FIREBASE_AUTH_DOMAIN"),
      projectId: envOrThrow("VITE_FIREBASE_PROJECT_ID"),
      storageBucket: envOrThrow("VITE_FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: envOrThrow(
        "VITE_FIREBASE_MESSAGING_SENDER_ID",
      ),
      appId: envOrThrow("VITE_FIREBASE_APP_ID"),
    }
  : ({} as never);

export const app = appReady ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;

export { serverTimestamp };

