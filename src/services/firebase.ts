import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  deleteDoc, 
  onSnapshot, 
  query,
  orderBy,
  Unsubscribe 
} from 'firebase/firestore';
import { Task, ExecutionLog, EvidenceItem, UserSettings } from '../types';
import { 
  auth, 
  db, 
  cleanForFirestore, 
  handleFirestoreError, 
  OperationType,
  testFirebaseConnection 
} from '../lib/firebase';

export { auth, db, cleanForFirestore, testFirebaseConnection };

export const FirebaseService = {
  auth,
  db,

  // Listen to Auth State
  onAuthChange(callback: (user: User | null) => void): Unsubscribe {
    return onAuthStateChanged(auth, callback);
  },

  // Google Login (Popup with fallback)
  async loginWithGoogle(): Promise<User | null> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (err: any) {
      console.warn('Popup login fallback to redirect:', err);
      try {
        await signInWithRedirect(auth, provider);
        const redirectRes = await getRedirectResult(auth);
        return redirectRes?.user || null;
      } catch (redirectErr) {
        handleFirestoreError(redirectErr, OperationType.GET, 'auth/google');
        throw redirectErr;
      }
    }
  },

  // Email / Password Login
  async loginWithEmail(email: string, pass: string): Promise<User> {
    try {
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      return res.user;
    } catch (err: any) {
      if (
        err.code === 'auth/user-not-found' || 
        err.code === 'auth/invalid-credential' || 
        err.code === 'auth/invalid-login-credentials'
      ) {
        // Create account on first attempt
        try {
          const createRes = await createUserWithEmailAndPassword(auth, email.trim(), pass);
          return createRes.user;
        } catch (createErr: any) {
          throw createErr;
        }
      }
      throw err;
    }
  },

  // Logout
  async logout(): Promise<void> {
    await signOut(auth);
  },

  // -------------------------------------------------------------
  // REAL-TIME CLOUD SUBSCRIPTIONS (Rule 4)
  // -------------------------------------------------------------

  // 1. Sync User Tasks in Realtime
  subscribeUserTasks(userId: string, onUpdate: (tasks: Task[]) => void): Unsubscribe {
    const tasksRef = collection(db, 'users', userId, 'tasks');
    return onSnapshot(
      tasksRef,
      (snapshot) => {
        const tasks: Task[] = [];
        snapshot.forEach((docSnap) => {
          tasks.push(docSnap.data() as Task);
        });
        tasks.sort((a, b) => a.order - b.order);
        onUpdate(tasks);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/tasks`);
      }
    );
  },

  // 2. Sync User Execution Logs in Realtime
  subscribeUserLogs(userId: string, onUpdate: (logs: ExecutionLog[]) => void): Unsubscribe {
    const logsRef = collection(db, 'users', userId, 'logs');
    return onSnapshot(
      logsRef,
      (snapshot) => {
        const logs: ExecutionLog[] = [];
        snapshot.forEach((docSnap) => {
          logs.push(docSnap.data() as ExecutionLog);
        });
        logs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        onUpdate(logs);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/logs`);
      }
    );
  },

  // 3. Sync User Evidence in Realtime
  subscribeUserEvidence(userId: string, onUpdate: (evidence: EvidenceItem[]) => void): Unsubscribe {
    const evidenceRef = collection(db, 'users', userId, 'evidence');
    return onSnapshot(
      evidenceRef,
      (snapshot) => {
        const evidenceList: EvidenceItem[] = [];
        snapshot.forEach((docSnap) => {
          evidenceList.push(docSnap.data() as EvidenceItem);
        });
        evidenceList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(evidenceList);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/evidence`);
      }
    );
  },

  // 4. Sync User Settings in Realtime (CRITICAL - Rule 4)
  subscribeUserSettings(userId: string, onUpdate: (settings: UserSettings) => void): Unsubscribe {
    const settingsDocRef = doc(db, 'users', userId, 'settings', 'app_settings');
    return onSnapshot(
      settingsDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data() as UserSettings);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${userId}/settings/app_settings`);
      }
    );
  },

  // -------------------------------------------------------------
  // DIRECT & EXPLICIT MUTATIONS (Rule 2 & Rule 3)
  // -------------------------------------------------------------

  // Save or update task in cloud with cleanForFirestore
  async saveTask(userId: string, task: Task): Promise<void> {
    const path = `users/${userId}/tasks/${task.id}`;
    try {
      const taskRef = doc(db, 'users', userId, 'tasks', task.id);
      const payload = cleanForFirestore({
        ...task,
        userId,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(taskRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  // Delete task in cloud
  async deleteTask(userId: string, taskId: string): Promise<void> {
    const path = `users/${userId}/tasks/${taskId}`;
    try {
      const taskRef = doc(db, 'users', userId, 'tasks', taskId);
      await deleteDoc(taskRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    }
  },

  // Save new completed block log in cloud
  async addLog(userId: string, log: ExecutionLog): Promise<void> {
    const path = `users/${userId}/logs/${log.id}`;
    try {
      const logRef = doc(db, 'users', userId, 'logs', log.id);
      const payload = cleanForFirestore({
        ...log,
        userId,
      });
      await setDoc(logRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  // Delete log in cloud
  async deleteLog(userId: string, logId: string): Promise<void> {
    const path = `users/${userId}/logs/${logId}`;
    try {
      const logRef = doc(db, 'users', userId, 'logs', logId);
      await deleteDoc(logRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    }
  },

  // Save evidence in cloud
  async saveEvidence(userId: string, evidence: EvidenceItem): Promise<void> {
    const path = `users/${userId}/evidence/${evidence.id}`;
    try {
      const evidenceRef = doc(db, 'users', userId, 'evidence', evidence.id);
      const payload = cleanForFirestore({
        ...evidence,
        userId,
      });
      await setDoc(evidenceRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  // Delete evidence in cloud
  async deleteEvidence(userId: string, evidenceId: string): Promise<void> {
    const path = `users/${userId}/evidence/${evidenceId}`;
    try {
      const evidenceRef = doc(db, 'users', userId, 'evidence', evidenceId);
      await deleteDoc(evidenceRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    }
  },

  // Save user settings in cloud (CRITICAL - Rule 2)
  async saveSettings(userId: string, settings: UserSettings): Promise<void> {
    const path = `users/${userId}/settings/app_settings`;
    try {
      const settingsRef = doc(db, 'users', userId, 'settings', 'app_settings');
      const payload = cleanForFirestore({
        ...settings,
        id: 'app_settings',
        userId,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(settingsRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  // Fetch user settings from cloud
  async getSettings(userId: string): Promise<UserSettings | null> {
    const path = `users/${userId}/settings/app_settings`;
    try {
      const settingsRef = doc(db, 'users', userId, 'settings', 'app_settings');
      const docSnap = await getDoc(settingsRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserSettings;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  // -------------------------------------------------------------
  // SAFE SEEDING (Rule 5: NUNCA SOBRESCREVER DADOS EXISTENTES)
  // -------------------------------------------------------------

  // Save all initial tasks if and ONLY if user has 0 tasks in cloud
  async seedInitialTasks(userId: string, initialTasks: Task[]): Promise<boolean> {
    const path = `users/${userId}/tasks`;
    try {
      const tasksRef = collection(db, 'users', userId, 'tasks');
      const existing = await getDocs(tasksRef);
      
      // If collection is NOT empty, NEVER overwrite or touch existing user tasks
      if (!existing.empty) {
        return false;
      }

      // Populate only if 100% empty
      for (const t of initialTasks) {
        const payload = cleanForFirestore({
          ...t,
          userId,
        });
        await setDoc(doc(db, 'users', userId, 'tasks', t.id), payload, { merge: true });
      }
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return false;
    }
  },

  // Save default settings if and ONLY if user has no settings document in cloud
  async seedInitialSettings(userId: string, defaultSettings: UserSettings): Promise<boolean> {
    const path = `users/${userId}/settings/app_settings`;
    try {
      const settingsRef = doc(db, 'users', userId, 'settings', 'app_settings');
      const existing = await getDoc(settingsRef);

      // If settings already exist, NEVER overwrite
      if (existing.exists()) {
        return false;
      }

      const payload = cleanForFirestore({
        ...defaultSettings,
        id: 'app_settings',
        userId,
      });
      await setDoc(settingsRef, payload, { merge: true });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return false;
    }
  },

  // Clear all logs and evidence for user in cloud (for intentional reset to zero)
  async resetUserData(userId: string): Promise<void> {
    const logsRef = collection(db, 'users', userId, 'logs');
    const evidenceRef = collection(db, 'users', userId, 'evidence');

    try {
      const [logsSnap, evidenceSnap] = await Promise.all([
        getDocs(logsRef),
        getDocs(evidenceRef),
      ]);

      const deletes = [
        ...logsSnap.docs.map((d) => deleteDoc(d.ref)),
        ...evidenceSnap.docs.map((d) => deleteDoc(d.ref)),
      ];

      await Promise.all(deletes);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}/reset`);
      throw error;
    }
  }
};
