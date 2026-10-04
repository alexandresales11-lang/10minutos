import React, { useState, useEffect } from 'react';
import { Task, ExecutionLog, EvidenceItem, UserSettings } from './types';
import { StorageService } from './services/storage';
import { FirebaseService, testFirebaseConnection } from './services/firebase';
import { User } from 'firebase/auth';
import { MainDashboard } from './components/MainDashboard';
import { TaskList } from './components/TaskList';
import { ExecutionTimer } from './components/ExecutionTimer';
import { EvidenceModal } from './components/EvidenceModal';
import { EvidenceComparison } from './components/EvidenceComparison';
import { CalendarView } from './components/CalendarView';
import { HistoryView } from './components/HistoryView';
import { TransformationDashboard } from './components/TransformationDashboard';
import { TaskEditModal } from './components/TaskEditModal';
import { SessionPlannerModal } from './components/SessionPlannerModal';
import { DriveArchitectureModal } from './components/DriveArchitectureModal';
import { FutureModulesModal } from './components/FutureModulesModal';
import { AuthSyncModal } from './components/AuthSyncModal';
import { 
  Zap, 
  ListTodo, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Dna, 
  ShieldCheck, 
  HardDrive, 
  Sparkles, 
  Settings,
  Flame,
  CheckCircle2,
  RefreshCw,
  Cloud,
  User as UserIcon
} from 'lucide-react';
import { DEFAULT_USER_SETTINGS, INITIAL_TASKS } from './data/initialTasks';

type ActiveTab = 'dashboard' | 'tasks' | 'calendar' | 'history' | 'evolution' | 'transformation';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Firebase Auth & Cloud Sync
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Execution flow state
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [sessionQueue, setSessionQueue] = useState<Task[]>([]);
  
  // Modals state
  const [evidenceTarget, setEvidenceTarget] = useState<{ task: Task; milestone?: 1 | 7 | 30 | 90 | 180 | 365 } | null>(null);
  const [editTaskTarget, setEditTaskTarget] = useState<Task | null | 'new'>(null);
  const [isSessionPlannerOpen, setIsSessionPlannerOpen] = useState<boolean>(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);
  const [isFutureModulesOpen, setIsFutureModulesOpen] = useState<boolean>(false);

  // Initialize DB and load data
  const loadData = async () => {
    try {
      if (typeof window !== 'undefined' && 'indexedDB' in window) {
        try {
          indexedDB.deleteDatabase('10MinutosDB'); // remove old test database if present
        } catch {}
      }
      await StorageService.init();
      const [storedTasks, storedLogs, storedEvidence, storedSettings] = await Promise.all([
        StorageService.getTasks(),
        StorageService.getLogs(),
        StorageService.getEvidence(),
        StorageService.getSettings(),
      ]);
      setTasks(storedTasks);
      setLogs(storedLogs);
      setEvidenceList(storedEvidence);
      setSettings(storedSettings);

      // Validate connection to Firestore
      testFirebaseConnection();
    } catch (err) {
      console.error('Falha ao inicializar banco de dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen to Firebase auth state & setup realtime listener
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubscribeAuth = FirebaseService.onAuthChange(async (user) => {
      // Clean up previous listeners
      unsubs.forEach((u) => u());
      unsubs = [];

      setCurrentUser(user);

      if (user) {
        // Clear in-memory state before loading new user data to ensure 100% isolation
        setLogs([]);
        setEvidenceList([]);

        // Seed initial 25 tasks for this new user if their cloud profile has none
        await FirebaseService.seedInitialTasks(user.uid, INITIAL_TASKS);

        // Realtime sync from cloud specifically for this user
        const unsubTasks = FirebaseService.subscribeUserTasks(user.uid, (cloudTasks) => {
          if (cloudTasks && cloudTasks.length > 0) {
            setTasks(cloudTasks);
            StorageService.saveAllTasks(cloudTasks);
          }
        });

        const unsubLogs = FirebaseService.subscribeUserLogs(user.uid, (cloudLogs) => {
          if (cloudLogs) {
            setLogs(cloudLogs);
          }
        });

        const unsubEvidence = FirebaseService.subscribeUserEvidence(user.uid, (cloudEvidence) => {
          if (cloudEvidence) {
            setEvidenceList(cloudEvidence);
          }
        });

        unsubs = [unsubTasks, unsubLogs, unsubEvidence];
      } else {
        // When logged out, reload local database
        loadData();
      }
    });

    return () => {
      unsubscribeAuth();
      unsubs.forEach((u) => u());
    };
  }, []);

  const handleResetToZero = async () => {
    if (confirm('Deseja zerar todos os registros de execução? As 25 tarefas serão preservadas, mas todo o histórico, blocos e evidências começarão do zero absoluto.')) {
      await StorageService.resetAllLogsAndEvidence();
      if (currentUser) {
        await FirebaseService.resetUserData(currentUser.uid);
      }
      setLogs([]);
      setEvidenceList([]);
      const updatedSettings = await StorageService.getSettings();
      setSettings(updatedSettings);
      alert('Aplicativo 100% zerado e pronto para o primeiro bloco de 10 minutos!');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter((l) => l.date === todayStr);
  const todayCompletedTaskIds = new Set(todayLogs.map((l) => l.taskId));

  // Compute Streak
  const computeStreaks = () => {
    const datesWithLogs = new Set(logs.map((l) => l.date));
    let currentStreak = 0;
    let maxStreak = 0;
    
    // Check backwards from today or yesterday
    const checkDate = new Date();
    const todayHasLog = datesWithLogs.has(todayStr);
    
    // If today hasn't happened yet, start checking from yesterday for streak continuity
    let runner = new Date(checkDate);
    if (!todayHasLog) {
      runner.setDate(runner.getDate() - 1);
    }

    while (true) {
      const dStr = runner.toISOString().split('T')[0];
      if (datesWithLogs.has(dStr)) {
        currentStreak++;
        runner.setDate(runner.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate max streak across all logs
    const sortedDates = Array.from(datesWithLogs).sort();
    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (const d of sortedDates) {
      const cur = new Date(d + 'T00:00:00');
      if (prevDate) {
        const diffDays = Math.round((cur.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      if (tempStreak > maxStreak) {
        maxStreak = tempStreak;
      }
      prevDate = cur;
    }

    return {
      currentStreak: Math.max(currentStreak, todayHasLog ? 1 : 0),
      maxStreak: Math.max(maxStreak, currentStreak),
    };
  };

  const { currentStreak, maxStreak } = computeStreaks();

  // Execution Handlers
  const handleStartTask = (task: Task) => {
    setActiveTask(task);
  };

  const handleStartSession = (selectedTasks: Task[]) => {
    if (selectedTasks.length === 0) return;
    const [first, ...rest] = selectedTasks;
    setSessionQueue(rest);
    setActiveTask(first);
  };

  const handleStartFullList = () => {
    if (tasks.length === 0) return;
    const [first, ...rest] = tasks;
    setSessionQueue(rest);
    setActiveTask(first);
  };

  const handleFinishTask = async (
    logData: Omit<ExecutionLog, 'id' | 'globalSequenceNumber'>,
    shouldOpenEvidence = false
  ) => {
    const newLog: ExecutionLog = {
      ...logData,
      id: `log-${Date.now()}`,
      globalSequenceNumber: logs.length + 1,
    };

    await StorageService.addLog(newLog);
    if (currentUser) {
      FirebaseService.addLog(currentUser.uid, newLog).catch(console.error);
    }
    const updatedLogs = [newLog, ...logs];
    setLogs(updatedLogs);

    const finishedTask = activeTask;
    setActiveTask(null);

    // If task requires evidence or user explicitly pressed "Registrar Evidência"
    if (shouldOpenEvidence && finishedTask) {
      const startDate = new Date(settings.startDate);
      const today = new Date();
      const diffDays = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      setEvidenceTarget({ task: finishedTask, milestone: undefined });
    }

    // Auto-advance session queue if exists
    if (sessionQueue.length > 0) {
      const [next, ...remaining] = sessionQueue;
      setSessionQueue(remaining);
      setActiveTask(next);
    }
  };

  const handleSaveEvidence = async (newEvidenceData: Omit<EvidenceItem, 'id' | 'createdAt'>) => {
    const newEvidence: EvidenceItem = {
      ...newEvidenceData,
      id: `evi-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    await StorageService.saveEvidence(newEvidence);
    if (currentUser) {
      FirebaseService.saveEvidence(currentUser.uid, newEvidence).catch(console.error);
    }
    setEvidenceList([newEvidence, ...evidenceList]);
    setEvidenceTarget(null);
  };

  const handleSaveTask = async (updatedTask: Task) => {
    await StorageService.saveTask(updatedTask);
    if (currentUser) {
      FirebaseService.saveTask(currentUser.uid, updatedTask).catch(console.error);
    }
    const exists = tasks.some((t) => t.id === updatedTask.id);
    if (exists) {
      setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    } else {
      setTasks([...tasks, updatedTask]);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    await StorageService.deleteTask(taskId);
    if (currentUser) {
      FirebaseService.deleteTask(currentUser.uid, taskId).catch(console.error);
    }
    setTasks(tasks.filter((t) => t.id !== taskId));
  };

  const handleSaveSettings = async (newSettings: UserSettings) => {
    await StorageService.saveSettings(newSettings);
    setSettings(newSettings);
  };

  // Calculate day number since start
  const startDate = new Date(settings.startDate);
  const today = new Date();
  const currentDayNumber = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400 font-mono-numeric">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-4" />
        <span className="text-xs uppercase tracking-widest text-zinc-500">Iniciando 10 Minutos...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-30 bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-900 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black font-mono-numeric text-emerald-400 text-sm">
            10
          </div>
          <div>
            <div className="text-sm font-black tracking-tight text-white flex items-center space-x-1.5">
              <span>10 MINUTOS</span>
              <span className="text-[10px] text-zinc-500 font-mono-numeric font-normal">• EXECUÇÃO</span>
            </div>
          </div>
        </div>

        {/* Quick Utilities: Cloud Sync, Drive, Future Modules, & Zerar */}
        <div className="flex items-center space-x-2">
          {/* Cloud Sync Status Button */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono-numeric transition border ${
              currentUser
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-950/60'
                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white'
            }`}
            title="Sincronização em Nuvem (Celular & Computador)"
          >
            <Cloud className={`w-3.5 h-3.5 ${currentUser ? 'text-emerald-400' : 'text-zinc-400'}`} />
            <span className="hidden sm:inline">
              {currentUser ? (currentUser.displayName?.split(' ')[0] || 'Nuvem Conectada') : 'Sincronizar Nuvem'}
            </span>
          </button>

          <button
            onClick={() => setIsDriveModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono-numeric bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
            title="Google Drive e Backup"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Drive & Backup</span>
          </button>

          <button
            onClick={() => setIsFutureModulesOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono-numeric bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition"
            title="Módulos Dinheiro & Bloqueio"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Dinheiro & Foco</span>
          </button>

          <button
            onClick={handleResetToZero}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold font-mono-numeric bg-zinc-900 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-zinc-800 transition"
            title="Zerar registros e começar do zero absoluto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Zerar</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-8 pt-6 pb-24 md:pb-12 max-w-5xl mx-auto w-full">
        {activeTab === 'dashboard' && (
          <MainDashboard
            tasks={tasks}
            todayLogs={todayLogs}
            allLogs={logs}
            settings={settings}
            currentStreak={currentStreak}
            maxStreak={maxStreak}
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onStartTask={handleStartTask}
            onOpenSessionPlanner={() => setIsSessionPlannerOpen(true)}
            onNavigateToTasks={() => setActiveTab('tasks')}
            onNavigateToEvolution={() => setActiveTab('evolution')}
            onNavigateToCalendar={() => setActiveTab('calendar')}
          />
        )}

        {activeTab === 'tasks' && (
          <TaskList
            tasks={tasks}
            todayCompletedTaskIds={todayCompletedTaskIds}
            onStartTask={handleStartTask}
            onEditTask={(task) => setEditTaskTarget(task)}
            onAddNewTask={() => setEditTaskTarget('new')}
            onOpenSessionPlanner={() => setIsSessionPlannerOpen(true)}
            onStartFullList={handleStartFullList}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView logs={logs} tasks={tasks} settings={settings} />
        )}

        {activeTab === 'history' && (
          <HistoryView logs={logs} settings={settings} />
        )}

        {activeTab === 'evolution' && (
          <EvidenceComparison
            evidenceList={evidenceList}
            tasks={tasks}
            currentDayNumber={currentDayNumber}
            onOpenNewEvidence={(task, milestone) => setEvidenceTarget({ task, milestone })}
          />
        )}

        {activeTab === 'transformation' && (
          <TransformationDashboard
            logs={logs}
            evidenceList={evidenceList}
            settings={settings}
            tasks={tasks}
            currentStreak={currentStreak}
            maxStreak={maxStreak}
          />
        )}
      </main>

      {/* Execution Anti-Distraction Screen */}
      {activeTask && (
        <ExecutionTimer
          task={activeTask}
          daySequenceNumber={todayLogs.length + 1}
          onFinish={(logData, shouldOpenEvidence) => handleFinishTask(logData, shouldOpenEvidence)}
          onNextTask={() => {
            if (sessionQueue.length > 0) {
              const [next, ...rem] = sessionQueue;
              setSessionQueue(rem);
              setActiveTask(next);
            } else {
              const uncompleted = tasks.find((t) => !todayCompletedTaskIds.has(t.id));
              if (uncompleted) {
                setActiveTask(uncompleted);
              } else {
                setActiveTask(null);
              }
            }
          }}
          onCancel={() => {
            setActiveTask(null);
            setSessionQueue([]);
          }}
        />
      )}

      {/* Evidence Capture Modal */}
      {evidenceTarget && (
        <EvidenceModal
          task={evidenceTarget.task}
          dayNumber={currentDayNumber}
          dateStr={todayStr}
          initialMilestone={evidenceTarget.milestone}
          onSave={handleSaveEvidence}
          onClose={() => setEvidenceTarget(null)}
        />
      )}

      {/* Task Edit / Create Modal */}
      {editTaskTarget && (
        <TaskEditModal
          task={editTaskTarget === 'new' ? null : editTaskTarget}
          onSave={handleSaveTask}
          onDelete={editTaskTarget === 'new' ? undefined : handleDeleteTask}
          onClose={() => setEditTaskTarget(null)}
        />
      )}

      {/* Session Planner Modal */}
      {isSessionPlannerOpen && (
        <SessionPlannerModal
          tasks={tasks}
          onStartSession={handleStartSession}
          onClose={() => setIsSessionPlannerOpen(false)}
        />
      )}

      {/* Google Drive & Backup Architecture Modal */}
      {isDriveModalOpen && (
        <DriveArchitectureModal
          settings={settings}
          evidenceList={evidenceList}
          onSaveSettings={handleSaveSettings}
          onRefreshData={loadData}
          onClose={() => setIsDriveModalOpen(false)}
        />
      )}

      {/* Future Modules Modal */}
      {isFutureModulesOpen && (
        <FutureModulesModal
          settings={settings}
          logs={logs}
          onSaveSettings={handleSaveSettings}
          onClose={() => setIsFutureModulesOpen(false)}
        />
      )}

      {/* Cloud Auth & Sync Modal */}
      {isAuthModalOpen && (
        <AuthSyncModal
          currentUser={currentUser}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}

      {/* Bottom Mobile-First Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-[#09090b]/95 backdrop-blur-lg border-t border-zinc-900 px-2 py-1.5 flex items-center justify-around sm:justify-center sm:space-x-3 max-w-lg mx-auto sm:max-w-none">
        {[
          { id: 'dashboard', label: 'Início', icon: Zap },
          { id: 'tasks', label: 'Tarefas', icon: ListTodo },
          { id: 'calendar', label: 'Calendário', icon: CalendarIcon },
          { id: 'history', label: 'Histórico', icon: BarChart3 },
          { id: 'evolution', label: 'Evolução', icon: Dna },
          { id: 'transformation', label: 'Identidade', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex flex-col items-center justify-center py-1.5 px-2.5 sm:px-4 rounded-xl text-[11px] font-semibold transition select-none ${
                isActive
                  ? 'text-emerald-400 bg-zinc-900 border border-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
