import React from 'react';
import { Task, ExecutionLog, UserSettings } from '../types';
import { Play, Flame, Clock, CheckCircle2, ChevronRight, Award, Target, AlertCircle, ArrowUpRight, Sparkles, Cloud, Ticket, Settings as SettingsIcon } from 'lucide-react';
import { CATEGORY_DETAILS } from '../data/initialTasks';

interface MainDashboardProps {
  tasks: Task[];
  todayLogs: ExecutionLog[];
  allLogs: ExecutionLog[];
  settings: UserSettings;
  currentStreak: number;
  maxStreak: number;
  currentUser?: any;
  onOpenAuthModal?: () => void;
  onOpenLeisureTickets?: (tab?: 'tickets' | 'settings') => void;
  onStartTask: (task: Task) => void;
  onOpenSessionPlanner: () => void;
  onNavigateToTasks: () => void;
  onNavigateToEvolution: () => void;
  onNavigateToCalendar: () => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  tasks,
  todayLogs,
  allLogs,
  settings,
  currentStreak,
  maxStreak,
  currentUser,
  onOpenAuthModal,
  onOpenLeisureTickets,
  onStartTask,
  onOpenSessionPlanner,
  onNavigateToTasks,
  onNavigateToEvolution,
  onNavigateToCalendar,
}) => {
  const todayCompletedCount = todayLogs.length;
  const idealGoal = settings.idealDailyGoalBlocks || 24;
  const minGoal = settings.minDailyGoalBlocks || 3;
  const todayMinutes = todayCompletedCount * 10;

  // Next task to execute
  const todayCompletedIds = new Set(todayLogs.map((l) => l.taskId));
  
  // Find next pending task prioritized by Essential > Order
  const pendingEssential = tasks.find((t) => t.isEssential && !todayCompletedIds.has(t.id));
  const pendingGeneral = tasks.find((t) => !todayCompletedIds.has(t.id));
  const nextTask = pendingEssential || pendingGeneral || tasks[0];

  // All time metrics
  const totalCompletedBlocks = allLogs.length;
  const isNewUser = totalCompletedBlocks === 0;
  const totalAllTimeMinutes = allLogs.reduce((acc, l) => acc + (l.durationMinutes || 10), 0);
  const totalAllTimeHours = Math.floor(totalAllTimeMinutes / 60);
  const totalAllTimeMinutesRemainder = totalAllTimeMinutes % 60;

  // Days executed vs total days since start
  const startDate = new Date(settings.startDate);
  const today = new Date();
  const diffDays = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const uniqueExecutedDays = new Set(allLogs.map((l) => l.date)).size;
  const missedDays = Math.max(0, diffDays - uniqueExecutedDays);
  const adherencePercent = isNewUser ? '0.0' : ((uniqueExecutedDays / diffDays) * 100).toFixed(1);

  // Today progress percentage
  const todayPercent = Math.min(100, Math.round((todayCompletedCount / idealGoal) * 100));

  // Determine current day number
  const dayNumber = isNewUser ? 1 : Math.max(1, diffDays);

  // Leisure Ticket Calculations
  const blocksRequired = settings.blocksRequiredForFreeTime || 3;
  const minutesPerTicket = settings.freeMinutesPerBatch || 15;
  const totalEarnedTickets = Math.floor(todayCompletedCount / blocksRequired);
  const usedTickets = settings.usedTicketsCountToday || 0;
  const availableTickets = Math.max(0, totalEarnedTickets - usedTickets);
  const cycleProgress = todayCompletedCount % blocksRequired;
  const blocksUntilNextTicket = blocksRequired - cycleProgress;
  const isAllDayUnlocked = (settings.unlockedAllDayOnceTargetMet ?? true) && todayCompletedCount >= idealGoal;

  const nextTaskCategory = nextTask ? (CATEGORY_DETAILS[nextTask.category] || CATEGORY_DETAILS['OUTROS']) : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Cloud Sync Reminder Banner if not signed in */}
      {!currentUser && onOpenAuthModal && (
        <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Cloud className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white font-mono-numeric">
                SINCRONIZAÇÃO EM NUVEM (CELULAR & PC)
              </div>
              <p className="text-xs text-zinc-400">
                Conecte sua conta para que os blocos executados no celular apareçam instantaneamente no computador.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAuthModal}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl transition shadow-md shadow-emerald-500/20 whitespace-nowrap"
          >
            CONECTAR CONTA
          </button>
        </div>
      )}

      {/* Top Main Hero: DIA XX & Hoje */}
      <div className="bg-gradient-to-b from-zinc-900 to-[#121215] border border-zinc-800 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800/80 gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono-numeric uppercase tracking-widest text-emerald-400 font-extrabold bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-500/20">
                DIA {dayNumber}
              </span>
              <span className="text-xs font-mono-numeric text-zinc-500">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
              10 MINUTOS
            </h1>
          </div>

          {/* Quick Streak Pill */}
          <div className="flex items-center space-x-3 bg-zinc-950 p-2.5 rounded-2xl border border-zinc-850">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-orange-950/40 border border-orange-500/30 rounded-xl text-orange-400">
              <Flame className="w-5 h-5 fill-current" />
              <span className="font-mono-numeric font-black text-sm">{currentStreak} dias</span>
            </div>
            <div className="text-xs text-zinc-400 font-mono-numeric pr-2">
              consecutivos
            </div>
          </div>
        </div>

        {/* Progress of Today */}
        <div className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-mono-numeric text-zinc-400 uppercase tracking-wider font-bold">
                PROGRESSO DE HOJE
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono-numeric text-white mt-0.5">
                {todayCompletedCount} / {idealGoal} <span className="text-sm font-normal text-zinc-400">blocos</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xl sm:text-2xl font-black font-mono-numeric text-emerald-400">
                {todayMinutes} min
              </div>
              <span className="text-xs text-zinc-500 font-mono-numeric">
                {todayPercent}% concluído
              </span>
            </div>
          </div>

          {/* Minimalist Visual Block Bar */}
          <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800 flex gap-0.5">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className={`h-full flex-1 rounded-sm transition-all duration-300 ${
                  i < todayCompletedCount
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                    : 'bg-zinc-800/40'
                }`}
              />
            ))}
          </div>

          {/* Flexibility status check */}
          <div className="flex items-center justify-between text-xs font-mono-numeric pt-1">
            <span className="text-zinc-500">
              Meta mínima do dia: {minGoal} blocos (
              {todayCompletedCount >= minGoal ? (
                <strong className="text-emerald-400">✓ Cumprida</strong>
              ) : (
                <span className="text-amber-400">faltam {minGoal - todayCompletedCount}</span>
              )}
              )
            </span>
            <span className="text-zinc-500">Meta ideal: {idealGoal} blocos</span>
          </div>
        </div>
      </div>

      {/* LEISURE TICKET CARD (RECOMPENSA DE 15 MINUTOS) */}
      <div className="bg-gradient-to-r from-amber-950/25 via-[#121215] to-zinc-900 border border-amber-500/30 rounded-3xl p-6 sm:p-7 relative overflow-hidden shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-400 shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono-numeric uppercase tracking-wider text-amber-400 font-extrabold">
                  SISTEMA DE TICKETS & DISCIPLINA
                </span>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono-numeric">
                  {blocksRequired} blocos = +{minutesPerTicket} min
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                {isAllDayUnlocked ? 'Lazer 100% Liberado Hoje!' : `${availableTickets} ${availableTickets === 1 ? 'Ticket Disponível' : 'Tickets Disponíveis'} (${availableTickets * minutesPerTicket} min)`}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenLeisureTickets && (
              <>
                <button
                  onClick={() => onOpenLeisureTickets('settings')}
                  className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition"
                  title="Configurar regras de tempo e aplicativos bloqueados"
                >
                  <SettingsIcon className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onOpenLeisureTickets('tickets')}
                  className={`py-2.5 px-5 rounded-xl font-black text-xs flex items-center space-x-2 transition shadow-md active:scale-95 ${
                    availableTickets > 0 || isAllDayUnlocked
                      ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/60'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{availableTickets > 0 || isAllDayUnlocked ? 'USAR TICKET' : 'VER TICKETS'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Progress cubes for next ticket */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono-numeric">
          <div className="flex items-center space-x-2 text-zinc-400">
            <span>Próximo ticket:</span>
            <div className="flex items-center space-x-1.5">
              {Array.from({ length: blocksRequired }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] transition-all border ${
                    idx < cycleProgress
                      ? 'bg-amber-500/20 border-amber-500/60 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                  }`}
                >
                  {idx < cycleProgress ? '✓' : idx + 1}
                </div>
              ))}
            </div>
            <span className="text-zinc-500 text-[11px] pl-1">
              {isAllDayUnlocked 
                ? '(Meta do dia concluída)' 
                : cycleProgress === 0 && todayCompletedCount > 0
                ? 'Ticket acabou de ser liberado!' 
                : `(faltam ${blocksUntilNextTicket} blocos)`}
            </span>
          </div>

          <div className="text-[11px] text-zinc-400 flex items-center space-x-1.5">
            <span className="text-amber-400/90 font-bold">Válido para:</span>
            <span className="text-zinc-300 truncate max-w-[200px] sm:max-w-none">
              {(settings.rewardApps || ['Instagram', 'TikTok', 'WhatsApp', 'YouTube']).slice(0, 4).join(', ')}...
            </span>
          </div>
        </div>
      </div>

      {/* Next Block Highlight (PRÓXIMO BLOCO) */}
      {nextTask && (
        <div className="bg-[#121215] border border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-mono-numeric uppercase tracking-wider text-emerald-400 font-extrabold">
                PRÓXIMO BLOCO RECOMENDADO
              </span>
            </div>

            {nextTaskCategory && (
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${nextTaskCategory.bgClass} ${nextTaskCategory.colorClass} ${nextTaskCategory.borderClass}`}>
                {nextTaskCategory.icon} {nextTaskCategory.label}
              </span>
            )}
          </div>

          <div className="space-y-2 mb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {nextTask.name}
            </h2>
            {nextTask.description && (
              <p className="text-sm text-zinc-400 max-w-xl">
                {nextTask.description}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-zinc-800/80">
            <div className="flex items-center space-x-2 text-zinc-300 font-mono-numeric">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span className="text-2xl font-black tracking-tight">
                {String(nextTask.defaultDurationMinutes || 10).padStart(2, '0')}:00
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={onOpenSessionPlanner}
                className="py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl border border-zinc-800 transition active:scale-95"
              >
                MONTAR SESSÃO
              </button>

              <button
                onClick={() => onStartTask(nextTask)}
                className="py-3.5 px-8 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm rounded-xl flex items-center space-x-2 transition active:scale-95 shadow-xl shadow-emerald-500/25"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>INICIAR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3 Core Execution Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Streak card */}
        <div
          onClick={onNavigateToCalendar}
          className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-mono-numeric uppercase">Consistência</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="text-3xl font-black font-mono-numeric text-white flex items-baseline space-x-2">
              <span>{currentStreak}</span>
              <span className="text-xs font-bold text-zinc-400">dias seguidos</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 font-mono-numeric">
              Maior sequência: {maxStreak} dias
            </p>
          </div>
        </div>

        {/* Accumulated Hours */}
        <div
          onClick={onNavigateToTasks}
          className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-mono-numeric uppercase">Horas Acumuladas</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="text-3xl font-black font-mono-numeric text-white flex items-baseline space-x-2">
              <span>{totalAllTimeHours}h{totalAllTimeMinutesRemainder}m</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 font-mono-numeric">
              Prática pura acumulada
            </p>
          </div>
        </div>

        {/* Completed Blocks */}
        <div
          onClick={onNavigateToEvolution}
          className="bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-mono-numeric uppercase">Blocos Totais</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-3xl font-black font-mono-numeric text-emerald-400 flex items-baseline space-x-2">
              <span>{totalCompletedBlocks}</span>
              <span className="text-xs font-bold text-zinc-400">blocos</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 font-mono-numeric">
              {adherencePercent}% aderência global
            </p>
          </div>
        </div>
      </div>

      {/* Consistency & Streak Resilience Banner */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-mono-numeric uppercase text-zinc-400 font-bold">
            {isNewUser ? 'STATUS DE CONSISTÊNCIA: PRONTO PARA O PRIMEIRO BLOCO' : `ESTATÍSTICA DE ADERÊNCIA: ${uniqueExecutedDays} / ${diffDays} DIAS CUMPRIDOS (${adherencePercent}%)`}
          </div>
          <p className="text-xs text-zinc-400">
            {isNewUser ? (
              <span>
                Nenhum bloco executado ainda. O aplicativo está 100% zerado e pronto. Inicie seu primeiro bloco de 10 minutos para registrar o marco inicial!
              </span>
            ) : missedDays > 0 ? (
              <span>
                {missedDays} dia(s) sem registro anterior. Mas você já acumulou{' '}
                <strong className="text-zinc-200">{uniqueExecutedDays} dias de execução</strong>. O foco é executar o próximo bloco agora.
              </span>
            ) : (
              <span>Sequência perfeita mantida desde o início! Continue no próximo bloco.</span>
            )}
          </p>
        </div>

        <button
          onClick={onNavigateToTasks}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 self-start sm:self-auto transition shrink-0"
        >
          <span>Ver Lista de Tarefas</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
