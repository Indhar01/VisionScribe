import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App singleton safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

// Initialize Cloud Firestore targeting the provisioned custom database ID
const customDbId = (firebaseConfig as any).firestoreDatabaseId;
export const db =
  customDbId && customDbId !== "(default)"
    ? getFirestore(app, customDbId)
    : getFirestore(app);

export default app;
