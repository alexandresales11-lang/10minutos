import { Task, ExecutionLog, EvidenceItem, UserSettings, DaySummary } from '../types';
import { INITIAL_TASKS, DEFAULT_USER_SETTINGS } from '../data/initialTasks';

// Use a dedicated clean database name to guarantee all previous starter/mock logs are eliminated
const DB_NAME = '10MinutosPristineDB';
const DB_VERSION = 1;

// IndexedDB Helper
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('logs')) {
        const logStore = db.createObjectStore('logs', { keyPath: 'id' });
        logStore.createIndex('date', 'date', { unique: false });
        logStore.createIndex('taskId', 'taskId', { unique: false });
      }
      if (!db.objectStoreNames.contains('evidence')) {
        const evidenceStore = db.createObjectStore('evidence', { keyPath: 'id' });
        evidenceStore.createIndex('taskId', 'taskId', { unique: false });
        evidenceStore.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const StorageService = {
  async init(): Promise<void> {
    const db = await openDB();
    
    // Check if tasks exist
    const tx = db.transaction(['tasks', 'settings', 'logs', 'evidence'], 'readwrite');
    const taskStore = tx.objectStore('tasks');
    const countReq = taskStore.count();

    countReq.onsuccess = () => {
      if (countReq.result === 0) {
        // Populate the 25 handwritten tasks in pristine unexecuted state
        INITIAL_TASKS.forEach((t) => taskStore.add(t));
        
        // Add clean default settings with today as Day 1
        const settingsStore = tx.objectStore('settings');
        settingsStore.put({ id: 'app_settings', ...DEFAULT_USER_SETTINGS });

        // LOGS AND EVIDENCE ARE STRICTLY EMPTY (ZEROED OUT)
      }
    };

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getTasks(): Promise<Task[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tasks', 'readonly');
      const store = tx.objectStore('tasks');
      const req = store.getAll();
      req.onsuccess = () => {
        const tasks = (req.result as Task[]).sort((a, b) => a.order - b.order);
        resolve(tasks);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async saveTask(task: Task): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tasks', 'readwrite');
      const store = tx.objectStore('tasks');
      const req = store.put(task);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async saveAllTasks(tasks: Task[]): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tasks', 'readwrite');
      const store = tx.objectStore('tasks');
      tasks.forEach(t => store.put(t));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async deleteTask(taskId: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tasks', 'readwrite');
      const store = tx.objectStore('tasks');
      const req = store.delete(taskId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async getLogs(): Promise<ExecutionLog[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('logs', 'readonly');
      const store = tx.objectStore('logs');
      const req = store.getAll();
      req.onsuccess = () => {
        const logs = (req.result as ExecutionLog[]).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        resolve(logs);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async addLog(log: ExecutionLog): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('logs', 'readwrite');
      const store = tx.objectStore('logs');
      const req = store.add(log);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async getEvidence(): Promise<EvidenceItem[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('evidence', 'readonly');
      const store = tx.objectStore('evidence');
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as EvidenceItem[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async saveEvidence(evidence: EvidenceItem): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('evidence', 'readwrite');
      const store = tx.objectStore('evidence');
      const req = store.put(evidence);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async deleteEvidence(evidenceId: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('evidence', 'readwrite');
      const store = tx.objectStore('evidence');
      const req = store.delete(evidenceId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  async getSettings(): Promise<UserSettings> {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get('app_settings');
      req.onsuccess = () => {
        if (req.result) {
          resolve({ ...DEFAULT_USER_SETTINGS, ...req.result });
        } else {
          resolve(DEFAULT_USER_SETTINGS);
        }
      };
      req.onerror = () => resolve(DEFAULT_USER_SETTINGS);
    });
  },

  async saveSettings(settings: UserSettings): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const req = store.put({ id: 'app_settings', ...settings });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  // Completely wipe all logs, evidence and reset to zero
  async resetAllLogsAndEvidence(): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(['logs', 'evidence', 'settings'], 'readwrite');
    tx.objectStore('logs').clear();
    tx.objectStore('evidence').clear();
    tx.objectStore('settings').put({
      id: 'app_settings',
      ...DEFAULT_USER_SETTINGS,
      startDate: new Date().toISOString().split('T')[0],
      accumulatedFreeMinutes: 0,
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  // Export full backup JSON
  async exportFullBackup(): Promise<string> {
    const [tasks, logs, evidence, settings] = await Promise.all([
      this.getTasks(),
      this.getLogs(),
      this.getEvidence(),
      this.getSettings(),
    ]);

    const backupData = {
      version: 1,
      appName: '10 MINUTOS',
      exportedAt: new Date().toISOString(),
      tasks,
      logs,
      evidence,
      settings,
    };

    return JSON.stringify(backupData, null, 2);
  },

  // Import full backup JSON
  async importFullBackup(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (!data.tasks || !Array.isArray(data.tasks)) {
        throw new Error('Formato de backup inválido.');
      }

      const db = await openDB();
      const tx = db.transaction(['tasks', 'logs', 'evidence', 'settings'], 'readwrite');

      // Clear existing
      tx.objectStore('tasks').clear();
      tx.objectStore('logs').clear();
      tx.objectStore('evidence').clear();
      tx.objectStore('settings').clear();

      // Insert new
      data.tasks.forEach((t: Task) => tx.objectStore('tasks').put(t));
      if (Array.isArray(data.logs)) {
        data.logs.forEach((l: ExecutionLog) => tx.objectStore('logs').put(l));
      }
      if (Array.isArray(data.evidence)) {
        data.evidence.forEach((e: EvidenceItem) => tx.objectStore('evidence').put(e));
      }
      if (data.settings) {
        tx.objectStore('settings').put({ id: 'app_settings', ...data.settings });
      }

      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.error('Falha ao importar backup:', err);
      return false;
    }
  },

  // Reset to original factory state (Pristine, 0 logs, 0 evidence)
  async resetToOriginal(): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(['tasks', 'logs', 'evidence', 'settings'], 'readwrite');
    tx.objectStore('tasks').clear();
    tx.objectStore('logs').clear();
    tx.objectStore('evidence').clear();
    tx.objectStore('settings').clear();

    INITIAL_TASKS.forEach((t) => tx.objectStore('tasks').add(t));
    tx.objectStore('settings').put({
      id: 'app_settings',
      ...DEFAULT_USER_SETTINGS,
      startDate: new Date().toISOString().split('T')[0],
      accumulatedFreeMinutes: 0,
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
};
