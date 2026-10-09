import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Ticket, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Settings, 
  ShieldAlert, 
  Smartphone, 
  Plus, 
  Trash2, 
  Award, 
  AlertTriangle 
} from 'lucide-react';
import { UserSettings, ExecutionLog } from '../types';
import { SoundService } from '../services/sound';

interface LeisureTicketModalProps {
  settings: UserSettings;
  todayLogs: ExecutionLog[];
  onSaveSettings: (settings: UserSettings) => Promise<void>;
  onClose: () => void;
  initialTab?: 'tickets' | 'settings';
}

export const LeisureTicketModal: React.FC<LeisureTicketModalProps> = ({
  settings,
  todayLogs,
  onSaveSettings,
  onClose,
  initialTab = 'tickets',
}) => {
  const [activeTab, setActiveTab] = useState<'tickets' | 'settings'>(initialTab);

  // Configuration state
  const blocksRequired = settings.blocksRequiredForFreeTime || 3;
  const minutesPerTicket = settings.freeMinutesPerBatch || 15;
  const idealGoal = settings.idealDailyGoalBlocks || 24;
  const rewardApps = settings.rewardApps || ['Instagram', 'TikTok', 'WhatsApp', 'YouTube', 'Jogos'];
  const unlockedAllDay = settings.unlockedAllDayOnceTargetMet ?? true;

  // Today calculations
  const todayBlocks = todayLogs.length;
  const totalEarnedTickets = Math.floor(todayBlocks / blocksRequired);
  const usedTickets = settings.usedTicketsCountToday || 0;
  const availableTickets = Math.max(0, totalEarnedTickets - usedTickets);
  const progressInCurrentCycle = todayBlocks % blocksRequired;
  const blocksUntilNext = blocksRequired - progressInCurrentCycle;
  const isGoalReached = todayBlocks >= idealGoal;
  const isAllDayFree = unlockedAllDay && isGoalReached;

  // Active Leisure Timer state
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(minutesPerTicket * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [hasWarned1Min, setHasWarned1Min] = useState<boolean>(false);
  const [isTimerExpired, setIsTimerExpired] = useState<boolean>(false);
  
  const timerExpectedEndRef = useRef<number>(0);
  const timerPausedRemainingRef = useRef<number>(minutesPerTicket * 60);

  // Rules form state
  const [formBlocksRequired, setFormBlocksRequired] = useState<number>(blocksRequired);
  const [formMinutesPerTicket, setFormMinutesPerTicket] = useState<number>(minutesPerTicket);
  const [formRewardApps, setFormRewardApps] = useState<string[]>(rewardApps);
  const [newAppName, setNewAppName] = useState<string>('');
  const [formUnlockedAllDay, setFormUnlockedAllDay] = useState<boolean>(unlockedAllDay);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isTimerActive && isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.max(0, Math.round((timerExpectedEndRef.current - now) / 1000));
        setSecondsRemaining(diff);

        // Warning at 60 seconds
        if (diff <= 60 && diff > 0 && !hasWarned1Min) {
          SoundService.playTimerWarning();
          setHasWarned1Min(true);
        }

        // Completion
        if (diff === 0) {
          setIsTimerRunning(false);
          setIsTimerExpired(true);
          SoundService.playFreeTimeOverAlert();
        }
      }, 250);
    }

    return () => clearInterval(interval);
  }, [isTimerActive, isTimerRunning, secondsRemaining, hasWarned1Min]);

  // Start using a ticket
  const handleStartTicket = async () => {
    if (availableTickets <= 0 && !isAllDayFree) return;

    SoundService.playSoftClick();
    const durationSec = minutesPerTicket * 60;
    setSecondsRemaining(durationSec);
    timerExpectedEndRef.current = Date.now() + durationSec * 1000;
    timerPausedRemainingRef.current = durationSec;
    setIsTimerActive(true);
    setIsTimerRunning(true);
    setHasWarned1Min(false);
    setIsTimerExpired(false);

    // Consume 1 ticket in settings
    if (!isAllDayFree) {
      const updated = {
        ...settings,
        usedTicketsCountToday: usedTickets + 1,
        accumulatedFreeMinutes: Math.max(0, (settings.accumulatedFreeMinutes || 0) - minutesPerTicket),
      };
      await onSaveSettings(updated);
    }
  };

  const handleToggleTimer = () => {
    SoundService.playSoftClick();
    if (isTimerRunning) {
      // Pause
      timerPausedRemainingRef.current = secondsRemaining;
      setIsTimerRunning(false);
    } else {
      // Resume
      timerExpectedEndRef.current = Date.now() + timerPausedRemainingRef.current * 1000;
      setIsTimerRunning(true);
    }
  };

  const handleStopLeisure = () => {
    SoundService.playSoftClick();
    setIsTimerActive(false);
    setIsTimerRunning(false);
    setIsTimerExpired(false);
  };

  // Save rules
  const handleSaveRules = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserSettings = {
      ...settings,
      blocksRequiredForFreeTime: Number(formBlocksRequired),
      freeMinutesPerBatch: Number(formMinutesPerTicket),
      rewardApps: formRewardApps,
      unlockedAllDayOnceTargetMet: formUnlockedAllDay,
    };
    await onSaveSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setActiveTab('tickets');
    }, 1200);
  };

  const handleAddApp = () => {
    if (newAppName.trim() && !formRewardApps.includes(newAppName.trim())) {
      setFormRewardApps([...formRewardApps, newAppName.trim()]);
      setNewAppName('');
    }
  };

  const handleRemoveApp = (appToRemove: string) => {
    setFormRewardApps(formRewardApps.filter((a) => a !== appToRemove));
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono-numeric uppercase tracking-wider text-amber-400 font-extrabold flex items-center space-x-1.5">
                <span>SISTEMA DE RECOMPENSA & FOCO</span>
                <Sparkles className="w-3 h-3" />
              </span>
              <h2 className="text-lg font-black text-white">
                Tickets de Lazer (15 Minutos)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-2 bg-zinc-950 border-b border-zinc-850 gap-2">
          <button
            onClick={() => setActiveTab('tickets')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold font-mono-numeric flex items-center justify-center space-x-2 transition ${
              activeTab === 'tickets'
                ? 'bg-zinc-850 text-amber-400 border border-amber-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>MEUS TICKETS & CRONÔMETRO</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold font-mono-numeric flex items-center justify-center space-x-2 transition ${
              activeTab === 'settings'
                ? 'bg-zinc-850 text-white border border-zinc-700 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>CONFIGURAR REGRAS</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {activeTab === 'tickets' ? (
            <div className="space-y-6">
              {/* Day Unlocked Gold Banner */}
              {isAllDayFree && (
                <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border border-amber-500/40 rounded-2xl p-5 text-center space-y-2">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 text-xs font-extrabold uppercase font-mono-numeric">
                    <Award className="w-4 h-4" />
                    <span>META DO DIA BATIDA ({todayBlocks} BLOCOS)!</span>
                  </div>
                  <h3 className="text-xl font-black text-white">
                    Lazer Totalmente Liberado!
                  </h3>
                  <p className="text-xs text-zinc-300 max-w-md mx-auto">
                    Você venceu a batalha da disciplina de hoje. Pode desfrutar de entretenimento livremente até as 00:00 sem travas ou culpa!
                  </p>
                </div>
              )}

              {/* ACTIVE LEISURE TIMER VIEW */}
              {isTimerActive ? (
                <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold font-mono-numeric">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>TICKET EM USO • APROVEITE SEU DESCANSO</span>
                  </div>

                  {/* Countdown Digital Display */}
                  <div className="space-y-2">
                    <div className={`text-6xl sm:text-7xl font-black font-mono-numeric tracking-tight transition-colors ${
                      isTimerExpired ? 'text-red-500 animate-pulse' : secondsRemaining <= 60 ? 'text-amber-400' : 'text-white'
                    }`}>
                      {formatTime(secondsRemaining)}
                    </div>
                    <div className="text-xs text-zinc-400 font-mono-numeric">
                      {isTimerExpired 
                        ? 'TEMPO DE LAZER ESGOTADO!' 
                        : secondsRemaining <= 60 
                        ? '⚠️ Atenção: último minuto restante de lazer!' 
                        : `${minutesPerTicket} minutos de entretenimento merecido`}
                    </div>
                  </div>

                  {/* Allowed Apps Pills */}
                  <div className="bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800 space-y-2">
                    <span className="text-[11px] font-mono-numeric text-zinc-400 uppercase font-bold tracking-wider">
                      Aplicativos Liberados neste Ticket:
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {rewardApps.map((app) => (
                        <span key={app} className="px-2.5 py-1 bg-zinc-900 text-zinc-300 rounded-lg text-xs font-medium border border-zinc-800">
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Timer Controls */}
                  <div className="flex items-center justify-center space-x-3 pt-2">
                    {!isTimerExpired && (
                      <button
                        onClick={handleToggleTimer}
                        className="py-3 px-6 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl border border-zinc-700 flex items-center space-x-2 transition"
                      >
                        {isTimerRunning ? (
                          <>
                            <Pause className="w-4 h-4" />
                            <span>PAUSAR</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-current" />
                            <span>CONTINUAR</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={handleStopLeisure}
                      className="py-3 px-6 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl flex items-center space-x-2 transition shadow-lg shadow-amber-500/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ENCERRAR & VOLTAR AO FOCO</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* TICKET DASHBOARD VIEW */
                <>
                  {/* Golden Digital Ticket Card */}
                  <div className="relative bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/30 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-xl overflow-hidden">
                    {/* Decorative Ticket Cutouts */}
                    <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-[#121215] rounded-full border border-amber-500/40" />
                    <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-[#121215] rounded-full border border-amber-500/40" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-dashed border-amber-500/30">
                      <div>
                        <div className="flex items-center space-x-2">
                          <Ticket className="w-5 h-5 text-amber-400" />
                          <span className="text-xs font-mono-numeric font-black tracking-widest text-amber-400 uppercase">
                            TICKET DE LAZER AUTORIZADO
                          </span>
                        </div>
                        <h3 className="text-2xl font-black text-white mt-1">
                          {minutesPerTicket} Minutos de Entretenimento
                        </h3>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-black font-mono-numeric text-amber-400">
                          {availableTickets}
                        </div>
                        <span className="text-xs font-mono-numeric text-zinc-400">
                          {availableTickets === 1 ? 'ticket disponível' : 'tickets disponíveis'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-5 space-y-4">
                      {/* Apps list */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-zinc-400 font-mono-numeric pr-1">Válido para:</span>
                        {rewardApps.map((a) => (
                          <span key={a} className="px-2 py-0.5 bg-zinc-950 text-amber-300/90 rounded-md text-[11px] font-mono-numeric border border-amber-500/20">
                            {a}
                          </span>
                        ))}
                      </div>

                      {/* Launch Button */}
                      <button
                        onClick={handleStartTicket}
                        disabled={availableTickets === 0 && !isAllDayFree}
                        className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition shadow-xl ${
                          availableTickets > 0 || isAllDayFree
                            ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/25 active:scale-[0.98]'
                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                        }`}
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>
                          {availableTickets > 0 || isAllDayFree
                            ? `ATIVAR TICKET DE ${minutesPerTicket} MINUTOS AGORA`
                            : `CUMPRA MAIS ${blocksUntilNext} BLOCOS PARA LIBERAR 1 TICKET`}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Progress to Next Ticket */}
                  <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono-numeric">
                      <span className="text-zinc-400 font-bold uppercase">
                        Progresso do Próximo Ticket:
                      </span>
                      <span className="text-amber-400 font-bold">
                        {progressInCurrentCycle} de {blocksRequired} blocos
                      </span>
                    </div>

                    {/* Visual 3-Block Cubes */}
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: blocksRequired }).map((_, idx) => {
                        const isDone = idx < progressInCurrentCycle;
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                              isDone
                                ? 'bg-amber-950/40 border-amber-500/50 text-amber-400'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                            }`}
                          >
                            <span className="text-xs font-black font-mono-numeric">
                              BLOCO {idx + 1}
                            </span>
                            <span className="text-[10px] font-mono-numeric">
                              {isDone ? '✓ Concluído' : 'Pendente'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[11px] text-zinc-500 font-mono-numeric flex items-center justify-between pt-1">
                      <span>
                        Hoje: <strong>{todayBlocks}</strong> blocos de 10 min executados.
                      </span>
                      <span>
                        Falta: <strong>{blocksUntilNext}</strong> {blocksUntilNext === 1 ? 'bloco' : 'blocos'} para +{minutesPerTicket} min.
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Psychology Motivation Quote */}
              <div className="bg-zinc-950/60 border border-zinc-850 rounded-2xl p-4 text-xs text-zinc-400 space-y-1">
                <span className="text-amber-400 font-bold font-mono-numeric uppercase flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>A Filosofia do Ticket:</span>
                </span>
                <p className="leading-relaxed">
                  O entretenimento não é o inimigo. A procrastinação descontrolada é. Quando você sabe que tem 15 minutos garantidos pela frente após 3 blocos de esforço, seu cérebro foca com o dobro de energia.
                </p>
              </div>
            </div>
          ) : (
            /* RULES SETTINGS TAB */
            <form onSubmit={handleSaveRules} className="space-y-6">
              <div className="space-y-4">
                {/* 1. Blocks required per ticket */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 font-mono-numeric uppercase">
                    Quantos Blocos de 10 Min para Liberar 1 Ticket?
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        type="button"
                        key={num}
                        onClick={() => setFormBlocksRequired(num)}
                        className={`py-3 rounded-xl border text-xs font-mono-numeric font-bold transition ${
                          formBlocksRequired === num
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        {num} {num === 1 ? 'Bloco' : 'Blocos'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Padrão recomendado: 3 blocos (30 minutos de trabalho focado para cada descanso).
                  </p>
                </div>

                {/* 2. Minutes granted per ticket */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 font-mono-numeric uppercase">
                    Duração de Cada Ticket de Lazer:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 10, 15, 20].map((mins) => (
                      <button
                        type="button"
                        key={mins}
                        onClick={() => setFormMinutesPerTicket(mins)}
                        className={`py-3 rounded-xl border text-xs font-mono-numeric font-bold transition ${
                          formMinutesPerTicket === mins
                            ? 'bg-amber-500 text-black border-amber-400'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        {mins} Minutos
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Target distraction apps */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 font-mono-numeric uppercase">
                    Aplicativos de Entretenimento a Disciplinar:
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-zinc-950 rounded-xl border border-zinc-850">
                    {formRewardApps.map((app) => (
                      <span
                        key={app}
                        className="inline-flex items-center space-x-1.5 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200"
                      >
                        <span>{app}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveApp(app)}
                          className="text-zinc-500 hover:text-red-400 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex space-x-2 pt-1">
                    <input
                      type="text"
                      value={newAppName}
                      onChange={(e) => setNewAppName(e.target.value)}
                      placeholder="Adicionar app (ex: Netflix, X, Reddit)..."
                      className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddApp();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddApp}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>

                {/* 4. Unlock all day if goal met */}
                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-850 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white font-mono-numeric">
                      Liberação Total ao Bater a Meta do Dia
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Quando você atingir sua meta diária de blocos, o lazer fica 100% livre até a meia-noite.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formUnlockedAllDay}
                    onChange={(e) => setFormUnlockedAllDay(e.target.checked)}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs font-bold font-mono-numeric text-center animate-in fade-in">
                  ✓ Regras salvas e sincronizadas com sucesso!
                </div>
              )}

              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('tickets')}
                  className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs transition shadow-lg shadow-amber-500/20"
                >
                  Salvar Novas Regras
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs text-zinc-500 font-mono-numeric">
          <span>10 Minutos • Método Disciplina & Lazer</span>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
