import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDocFromServer,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  authInstance?: Auth | null
) {
  const currentAuth = authInstance || auth;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid,
      email: currentAuth?.currentUser?.email,
      emailVerified: currentAuth?.currentUser?.emailVerified,
      isAnonymous: currentAuth?.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let isFirebaseOnline = false;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  // CRITICAL: The app must specify firestoreDatabaseId if provided in config
  db = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
  auth = getAuth(app);
  isFirebaseOnline = true;

  // Test server connection as per skill instructions
  async function testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      console.log('Firebase Firestore connection verified successfully.');
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.warn('Firestore offline status:', error.message);
      }
    }
  }
  testConnection();
} catch (e) {
  console.warn('Firebase initialization error, fallback ready:', e);
  isFirebaseOnline = false;
}

export { app, auth, db, isFirebaseOnline };

export async function ensureFirebaseAuth(): Promise<string | null> {
  if (!auth) return null;
  try {
    if (!auth.currentUser) {
      const userCred = await signInAnonymously(auth);
      return userCred.user.uid;
    }
    return auth.currentUser.uid;
  } catch (err) {
    console.warn('Anonymous auth note (continuing with client student ID):', err);
    return null;
  }
}
