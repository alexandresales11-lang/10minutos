export type TaskCategory =
  | 'ESPIRITUAL'
  | 'FÍSICO'
  | 'MUSICAL'
  | 'MENTAL'
  | 'COMUNICAÇÃO'
  | 'CUIDADOS PESSOAIS'
  | 'ORGANIZAÇÃO'
  | 'OUTROS'
  | 'DINHEIRO';

export type Priority = 'ESSENCIAL' | 'ALTA' | 'MÉDIA' | 'BAIXA';

export interface Task {
  id: string;
  order: number;
  name: string;
  description?: string;
  category: TaskCategory;
  defaultDurationMinutes: number; // default 10
  priority: Priority;
  isEssential: boolean;
  frequency: 'ALL' | number[]; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  requiresEvidence: boolean;
  evidenceTypePrompt?: 'audio' | 'video' | 'photo' | 'observation' | 'metric';
  metricUnit?: string;
  isOriginalUncertain?: boolean; // When handwritten note wasn't 100% legible
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionLog {
  id: string;
  taskId: string;
  taskName: string;
  category: TaskCategory;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationMinutes: number;
  completed: boolean;
  daySequenceNumber: number; // 1st, 2nd, 3rd block of the day
  globalSequenceNumber: number; // Total completed block count
  evidenceId?: string;
  notes?: string;
}

export interface EvidenceItem {
  id: string;
  taskId: string;
  taskName: string;
  category: TaskCategory;
  logId?: string;
  date: string; // YYYY-MM-DD
  dayNumber: number; // Sequential day count since start (e.g. Day 1, Day 17, Day 30)
  milestone?: 1 | 7 | 30 | 90 | 180 | 365;
  type: 'photo' | 'audio' | 'video' | 'metric' | 'observation';
  metricValue?: number;
  metricUnit?: string;
  mediaDataUrl?: string; // Stored in IndexedDB
  mediaName?: string;
  observation?: string;
  driveSyncStatus?: 'synced' | 'pending' | 'local_only';
  drivePath?: string;
  createdAt: string;
}

export interface UserSettings {
  minDailyGoalBlocks: number; // default: 3 (minimum to consider day accomplished)
  idealDailyGoalBlocks: number; // default: 24 (or total tasks)
  startDate: string; // YYYY-MM-DD
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  antiDistractionStrictMode: boolean;
  blocksRequiredForFreeTime: number; // e.g. 3 blocks = 15 free min
  freeMinutesPerBatch: number; // e.g. 15 minutes
  accumulatedFreeMinutes: number;
  rewardApps?: string[]; // e.g. ['Instagram', 'TikTok', 'WhatsApp', 'YouTube', 'Jogos']
  usedTicketsCountToday?: number;
  lastTicketsDate?: string; // YYYY-MM-DD
  unlockedAllDayOnceTargetMet?: boolean;
  googleDriveConfig: {
    enabled: boolean;
    connected: boolean;
    accountEmail: string;
    rootFolderName: string;
    lastSyncTime?: string;
  };
}

export interface DaySummary {
  date: string; // YYYY-MM-DD
  blocksCompleted: number;
  totalMinutes: number;
  status: 'completed' | 'partial' | 'empty';
  categories: Record<TaskCategory, number>;
  completedTaskIds: string[];
}
