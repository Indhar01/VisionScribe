import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
let app: any;
let auth: any;
let db: Firestore | any;
let isFirebaseAvailable = false;

try {
  const isPlaceholder = !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('Placeholder');
  if (!isPlaceholder && !getApps().length) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
    isFirebaseAvailable = true;
  } else if (!isPlaceholder) {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
    isFirebaseAvailable = true;
  }
} catch (e) {
  console.warn('Firebase initialization notice: Running with local sandbox persistence fallback.', e);
  isFirebaseAvailable = false;
}

export { app, auth, db, isFirebaseAvailable };

// Connection test
export async function testFirestoreConnection(): Promise<boolean> {
  if (!isFirebaseAvailable || !db) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently offline or unreachable.');
    }
    return false;
  }
}

// Error handling conforming to Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || 'anonymous-or-local',
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error Encountered: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Google Sign-In helper with popup & demo fallback
export async function signInWithGoogle(): Promise<User | null> {
  if (isFirebaseAvailable && auth) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    return result.user;
  }
  return null;
}

export async function logOut(): Promise<void> {
  if (isFirebaseAvailable && auth) {
    await signOut(auth);
  }
}
