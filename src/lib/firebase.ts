import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore, 
  Firestore,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

function getValidConfigValue(envVal: string | undefined, fallback: string): string {
  if (!envVal || envVal === 'Ok' || envVal.trim() === '' || envVal.startsWith('YOUR_') || envVal.toLowerCase().includes('secret')) {
    return fallback;
  }
  return envVal;
}

export const firebaseConfig = {
  apiKey: getValidConfigValue(import.meta.env.VITE_FIREBASE_API_KEY, firebaseConfigData.apiKey),
  authDomain: getValidConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, firebaseConfigData.authDomain),
  projectId: getValidConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID, firebaseConfigData.projectId),
  storageBucket: getValidConfigValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, firebaseConfigData.storageBucket),
  messagingSenderId: getValidConfigValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, firebaseConfigData.messagingSenderId),
  appId: getValidConfigValue(import.meta.env.VITE_FIREBASE_APP_ID, firebaseConfigData.appId),
};

export const DATABASE_ID: string = firebaseConfigData.firestoreDatabaseId || '(default)';

// 1. Initialize Firebase App
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Initialize Auth
export const auth: Auth = getAuth(app);

// 3. Initialize Firestore with Native Offline Persistence (IndexedDB) and Correct DATABASE_ID
let firestoreInstance: Firestore;

try {
  firestoreInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    },
    DATABASE_ID
  );
} catch (e) {
  // If already initialized or cache setup fails in specific environment, fallback cleanly
  firestoreInstance = getFirestore(app, DATABASE_ID);
}

export const db: Firestore = firestoreInstance;

// 4. Recursive utility to strip any 'undefined' fields before writing to Firestore
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    // Preserve Date objects, Firestore timestamps or special types
    if (data instanceof Date) {
      return data;
    }

    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }

  return data;
}

// 5. Standardized Firestore Error Logging
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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
    },
    operationType,
    path,
  };
  console.warn('Firestore Warning/Error:', JSON.stringify(errInfo));
  return errInfo;
}

// 6. Test connection on boot
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline persistent mode.');
      return false;
    }
    return true;
  }
}
