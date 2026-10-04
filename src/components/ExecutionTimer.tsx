import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, Check, RotateCcw, SkipForward, Camera, Sparkles, Volume2, Shield } from 'lucide-react';
import { Task, ExecutionLog, TaskCategory } from '../types';
import { SoundService } from '../services/sound';
import { CATEGORY_DETAILS } from '../data/initialTasks';

interface ExecutionTimerProps {
  task: Task;
  onFinish: (log: Omit<ExecutionLog, 'id' | 'globalSequenceNumber'>, shouldOpenEvidence?: boolean) => void;
  onNextTask?: () => void;
  onCancel: () => void;
  daySequenceNumber: number;
}

export const ExecutionTimer: React.FC<ExecutionTimerProps> = ({
  task,
  onFinish,
  onNextTask,
  onCancel,
  daySequenceNumber,
}) => {
  const durationSeconds = (task.defaultDurationMinutes || 10) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState<number>(durationSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [hasPlayedChime, setHasPlayedChime] = useState<boolean>(false);
  
  // Track start and end times
  const startTimeRef = useRef<Date>(new Date());
  const expectedEndTimeRef = useRef<number>(Date.now() + durationSeconds * 1000);
  const remainingWhenPausedRef = useRef<number>(durationSeconds);

  // Philosophy quote rotation
  const executionQuotes = [
    'Não pense. Execute.',
    'Você não precisa mudar sua vida inteira hoje. Você precisa executar os próximos 10 minutos.',
    'Ação vence intenção.',
    'Consistência acumulada vira capacidade.',
    'Não dependa da motivação. Execute o próximo bloco.',
    'Silencie o ruído. O foco está aqui.'
  ];
  const [currentQuote] = useState(() => executionQuotes[Math.floor(Math.random() * executionQuotes.length)]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        const now = Date.now();
        const diff = Math.max(0, Math.round((expectedEndTimeRef.current - now) / 1000));
        setSecondsRemaining(diff);

        if (diff === 0) {
          setIsRunning(false);
          setIsCompleted(true);
          if (!hasPlayedChime) {
            SoundService.playCompletionChime();
            setHasPlayedChime(true);
          }
        }
      }, 250);
    }

    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining, hasPlayedChime]);

  const handleTogglePlay = () => {
    SoundService.playSoftClick();
    if (isRunning) {
      // Pause
      remainingWhenPausedRef.current = secondsRemaining;
      setIsRunning(false);
    } else {
      // Resume
      expectedEndTimeRef.current = Date.now() + remainingWhenPausedRef.current * 1000;
      setIsRunning(true);
    }
  };

  const handleRepeat = () => {
    SoundService.playSoftClick();
    setSecondsRemaining(durationSeconds);
    expectedEndTimeRef.current = Date.now() + durationSeconds * 1000;
    remainingWhenPausedRef.current = durationSeconds;
    setIsCompleted(false);
    setHasPlayedChime(false);
    setIsRunning(true);
  };

  const handleManualComplete = () => {
    if (!hasPlayedChime) {
      SoundService.playCompletionChime();
      setHasPlayedChime(true);
    }
    setIsCompleted(true);
    setIsRunning(false);
  };

  const handleConfirmCompletion = (openEvidence = false, proceedToNext = false) => {
    const now = new Date();
    const elapsedMinutes = Math.max(1, Math.round((durationSeconds - secondsRemaining) / 60)) || task.defaultDurationMinutes || 10;
    
    const logData: Omit<ExecutionLog, 'id' | 'globalSequenceNumber'> = {
      taskId: task.id,
      taskName: task.name,
      category: task.category,
      date: now.toISOString().split('T')[0],
      startTime: startTimeRef.current.toISOString(),
      endTime: now.toISOString(),
      durationMinutes: elapsedMinutes,
      completed: true,
      daySequenceNumber,
    };

    onFinish(logData, openEvidence);
    if (proceedToNext && onNextTask) {
      onNextTask();
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercent = Math.min(100, Math.max(0, ((durationSeconds - secondsRemaining) / durationSeconds) * 100));
  const categoryConfig = CATEGORY_DETAILS[task.category] || CATEGORY_DETAILS['OUTROS'];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#09090b] text-zinc-100 select-none overflow-hidden">
      {/* Top Header - Ultra minimal */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-[#09090b]/80 backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono-numeric uppercase tracking-widest text-zinc-400">
            MODO EXECUÇÃO • {categoryConfig.label}
          </span>
        </div>

        <button
          onClick={onCancel}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          title="Cancelar execução"
        >
          <X className="w-4 h-4" />
          <span>Cancelar</span>
        </button>
      </div>

      {/* Main Focus Canvas */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-xl mx-auto w-full text-center">
        {!isCompleted ? (
          <>
            {/* Task Category Tag */}
            <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-4 ${categoryConfig.bgClass} ${categoryConfig.colorClass} border ${categoryConfig.borderClass}`}>
              <span>{categoryConfig.icon}</span>
              <span>{categoryConfig.label}</span>
              {task.isEssential && (
                <span className="ml-1 bg-amber-500/20 text-amber-300 text-[10px] px-1.5 py-0.5 rounded font-bold">
                  ESSENCIAL
                </span>
              )}
            </div>

            {/* Task Name */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-3">
              {task.name}
            </h1>

            {task.description && (
              <p className="text-sm text-zinc-400 max-w-md mx-auto mb-8 line-clamp-2">
                {task.description}
              </p>
            )}

            {/* Huge Clean Timer */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="text-7xl sm:text-8xl md:text-9xl font-mono-numeric font-black tracking-tighter text-zinc-100">
                {formatTime(secondsRemaining)}
              </div>
            </div>

            {/* Minimal Progress Bar */}
            <div className="w-full max-w-xs h-1.5 bg-zinc-800/80 rounded-full overflow-hidden my-6">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Focus Philosophy Statement */}
            <div className="text-xs uppercase tracking-widest text-zinc-500 font-mono-numeric my-4 px-4 py-2 rounded border border-zinc-900 bg-zinc-950/60 max-w-sm">
              "{currentQuote}"
            </div>

            {/* Execution Controls */}
            <div className="flex items-center justify-center space-x-4 mt-8 w-full max-w-xs">
              <button
                onClick={handleTogglePlay}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg active:scale-95 ${
                  isRunning
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5 fill-current" />
                    <span>PAUSAR</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>CONTINUAR</span>
                  </>
                )}
              </button>

              <button
                onClick={handleManualComplete}
                className="py-4 px-4 rounded-xl font-semibold text-xs text-zinc-400 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition active:scale-95"
                title="Concluir agora"
              >
                <Check className="w-5 h-5 text-emerald-400" />
              </button>
            </div>
          </>
        ) : (
          /* Completion State */
          <div className="flex flex-col items-center justify-center animate-in fade-in duration-300 w-full">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <span className="text-xs font-mono-numeric uppercase tracking-widest text-emerald-400 mb-1">
              ✓ BLOCO CONCLUÍDO
            </span>

            <h2 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
              10 MINUTOS CONCLUÍDOS.
            </h2>

            <p className="text-zinc-400 text-sm italic font-mono-numeric mb-8">
              "Mais uma evidência."
            </p>

            {/* Task finished summary */}
            <div className="w-full max-w-sm bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 mb-8 text-left">
              <div className="text-xs text-zinc-400 uppercase font-mono-numeric">Atividade realizada</div>
              <div className="text-base font-bold text-zinc-100">{task.name}</div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
                <span>Duração: 10 minutos</span>
                <span className="text-emerald-400 font-bold">Bloco #{daySequenceNumber} do dia</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3 w-full max-w-sm">
              <button
                onClick={() => handleConfirmCompletion(false, true)}
                className="w-full py-4 px-6 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center space-x-2 transition active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                <SkipForward className="w-4 h-4 fill-current" />
                <span>PRÓXIMA TAREFA</span>
              </button>

              <button
                onClick={() => handleConfirmCompletion(true, false)}
                className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 flex items-center justify-center space-x-2 transition active:scale-95"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>REGISTRAR EVIDÊNCIA</span>
              </button>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleRepeat}
                  className="py-3 px-4 rounded-xl font-medium text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 flex items-center justify-center space-x-1.5 transition active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>REPETIR (10M)</span>
                </button>

                <button
                  onClick={() => handleConfirmCompletion(false, false)}
                  className="py-3 px-4 rounded-xl font-medium text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 flex items-center justify-center space-x-1.5 transition active:scale-95"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>FINALIZAR SESSÃO</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar: Anti-distraction badge */}
      <div className="py-3 text-center border-t border-zinc-900/60 bg-[#09090b] text-[11px] text-zinc-600 font-mono-numeric">
        10 MINUTOS • MODO EXECUÇÃO DIRETA • SEM DISTRAÇÃO
      </div>
    </div>
  );
};
