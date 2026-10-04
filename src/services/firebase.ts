import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  deleteDoc, 
  onSnapshot, 
  getDocFromServer,
  query,
  orderBy,
  Firestore 
} from 'firebase/firestore';
import { Task, ExecutionLog, EvidenceItem, UserSettings } from '../types';
import firebaseConfigData from '../../firebase-applet-config.json';

function getValidConfigValue(envVal: string | undefined, fallback: string): string {
  if (!envVal || envVal === 'Ok' || envVal.trim() === '' || envVal.startsWith('YOUR_') || envVal.toLowerCase().includes('secret')) {
    return fallback;
  }
  return envVal;
}

const firebaseConfig = {
  apiKey: getValidConfigValue(import.meta.env.VITE_FIREBASE_API_KEY, firebaseConfigData.apiKey),
  authDomain: getValidConfigValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, firebaseConfigData.authDomain),
  projectId: getValidConfigValue(import.meta.env.VITE_FIREBASE_PROJECT_ID, firebaseConfigData.projectId),
  storageBucket: getValidConfigValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, firebaseConfigData.storageBucket),
  messagingSenderId: getValidConfigValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, firebaseConfigData.messagingSenderId),
  appId: getValidConfigValue(import.meta.env.VITE_FIREBASE_APP_ID, firebaseConfigData.appId),
};

const databaseId = firebaseConfigData.firestoreDatabaseId || '(default)';

// Initialize Firebase App
const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db: Firestore = getFirestore(app, databaseId);

// Test connection on boot
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    // Attempt to ping the database server
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network restricted.');
      return false;
    }
    // permission-denied or document not found still means connection reached server
    return true;
  }
}

export const FirebaseService = {
  auth,
  db,

  // Listen to Auth State
  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  // Google Login
  async loginWithGoogle(): Promise<User | null> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (err: any) {
      console.warn('Popup login blocked or closed, trying redirect...', err);
      try {
        await signInWithRedirect(auth, provider);
        const redirectRes = await getRedirectResult(auth);
        return redirectRes?.user || null;
      } catch (redirectErr) {
        console.error('Login error:', redirectErr);
        throw redirectErr;
      }
    }
  },

  // Logout
  async logout(): Promise<void> {
    await signOut(auth);
  },

  // Sync / Listen to user tasks in real-time
  subscribeUserTasks(userId: string, onUpdate: (tasks: Task[]) => void) {
    const tasksRef = collection(db, 'users', userId, 'tasks');
    return onSnapshot(tasksRef, (snapshot) => {
      const tasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        tasks.push(docSnap.data() as Task);
      });
      tasks.sort((a, b) => a.order - b.order);
      onUpdate(tasks);
    }, (error) => {
      console.error('Error listening to tasks:', error);
    });
  },

  // Sync / Listen to user execution logs in real-time
  subscribeUserLogs(userId: string, onUpdate: (logs: ExecutionLog[]) => void) {
    const logsRef = collection(db, 'users', userId, 'logs');
    return onSnapshot(logsRef, (snapshot) => {
      const logs: ExecutionLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push(docSnap.data() as ExecutionLog);
      });
      logs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      onUpdate(logs);
    }, (error) => {
      console.error('Error listening to logs:', error);
    });
  },

  // Sync / Listen to evidence items in real-time
  subscribeUserEvidence(userId: string, onUpdate: (evidence: EvidenceItem[]) => void) {
    const evidenceRef = collection(db, 'users', userId, 'evidence');
    return onSnapshot(evidenceRef, (snapshot) => {
      const evidenceList: EvidenceItem[] = [];
      snapshot.forEach((docSnap) => {
        evidenceList.push(docSnap.data() as EvidenceItem);
      });
      evidenceList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(evidenceList);
    }, (error) => {
      console.error('Error listening to evidence:', error);
    });
  },

  // Save or update task in cloud
  async saveTask(userId: string, task: Task): Promise<void> {
    const taskRef = doc(db, 'users', userId, 'tasks', task.id);
    await setDoc(taskRef, {
      ...task,
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  },

  // Save all initial tasks if user has 0 tasks in cloud
  async seedInitialTasks(userId: string, initialTasks: Task[]): Promise<void> {
    const tasksRef = collection(db, 'users', userId, 'tasks');
    const existing = await getDocs(tasksRef);
    if (existing.empty) {
      for (const t of initialTasks) {
        await setDoc(doc(db, 'users', userId, 'tasks', t.id), {
          ...t,
          userId,
        });
      }
    }
  },

  // Delete task in cloud
  async deleteTask(userId: string, taskId: string): Promise<void> {
    const taskRef = doc(db, 'users', userId, 'tasks', taskId);
    await deleteDoc(taskRef);
  },

  // Save new completed block log in cloud
  async addLog(userId: string, log: ExecutionLog): Promise<void> {
    const logRef = doc(db, 'users', userId, 'logs', log.id);
    await setDoc(logRef, {
      ...log,
      userId,
    });
  },

  // Save evidence in cloud
  async saveEvidence(userId: string, evidence: EvidenceItem): Promise<void> {
    const evidenceRef = doc(db, 'users', userId, 'evidence', evidence.id);
    await setDoc(evidenceRef, {
      ...evidence,
      userId,
    });
  },

  // Delete evidence in cloud
  async deleteEvidence(userId: string, evidenceId: string): Promise<void> {
    const evidenceRef = doc(db, 'users', userId, 'evidence', evidenceId);
    await deleteDoc(evidenceRef);
  },

  // Clear all logs and evidence for user in cloud (for reset to zero)
  async resetUserData(userId: string): Promise<void> {
    const logsRef = collection(db, 'users', userId, 'logs');
    const evidenceRef = collection(db, 'users', userId, 'evidence');

    const [logsSnap, evidenceSnap] = await Promise.all([
      getDocs(logsRef),
      getDocs(evidenceRef),
    ]);

    const deletes = [
      ...logsSnap.docs.map((d) => deleteDoc(d.ref)),
      ...evidenceSnap.docs.map((d) => deleteDoc(d.ref)),
    ];

    await Promise.all(deletes);
  }
};
