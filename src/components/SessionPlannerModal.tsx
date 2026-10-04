import React, { useState } from 'react';
import { X, Play, Clock, Check, ListChecks } from 'lucide-react';
import { Task } from '../types';
import { CATEGORY_DETAILS } from '../data/initialTasks';

interface SessionPlannerModalProps {
  tasks: Task[];
  onStartSession: (selectedTasks: Task[]) => void;
  onClose: () => void;
}

export const SessionPlannerModal: React.FC<SessionPlannerModalProps> = ({
  tasks,
  onStartSession,
  onClose,
}) => {
  // Select initial recommended essential tasks
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(() => {
    return tasks.filter((t) => t.isEssential).map((t) => t.id).slice(0, 3);
  });

  const toggleTask = (id: string) => {
    if (selectedTaskIds.includes(id)) {
      setSelectedTaskIds(selectedTaskIds.filter((tId) => tId !== id));
    } else {
      setSelectedTaskIds([...selectedTaskIds, id]);
    }
  };

  const selectedTasks = tasks.filter((t) => selectedTaskIds.includes(t.id));
  const totalMinutes = selectedTasks.reduce((acc, t) => acc + (t.defaultDurationMinutes || 10), 0);

  const handleStart = () => {
    if (selectedTasks.length === 0) return;
    onStartSession(selectedTasks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <span className="text-xs font-mono-numeric uppercase tracking-wider text-emerald-400 font-bold">
              MODO SESSÃO PERSONALIZADA
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Escolher Tarefas da Sessão
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Summary bar */}
        <div className="px-6 py-3 bg-zinc-950 border-b border-zinc-850 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono-numeric">
            <span className="text-emerald-400 font-bold">{selectedTasks.length} selecionadas</span>
            <span className="text-zinc-600">•</span>
            <span className="text-white font-bold">{totalMinutes} minutos de foco</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedTaskIds(tasks.filter(t => t.isEssential).map(t => t.id))}
              className="text-[11px] text-amber-400 hover:underline font-mono-numeric"
            >
              Só Essenciais
            </button>
            <span className="text-zinc-600">|</span>
            <button
              onClick={() => setSelectedTaskIds(tasks.map((t) => t.id))}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 font-mono-numeric"
            >
              Todas
            </button>
            <span className="text-zinc-600">|</span>
            <button
              onClick={() => setSelectedTaskIds([])}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 font-mono-numeric"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* Task Selection List */}
        <div className="p-4 space-y-2 overflow-y-auto flex-1">
          {tasks.map((task) => {
            const isSelected = selectedTaskIds.includes(task.id);
            const cat = CATEGORY_DETAILS[task.category] || CATEGORY_DETAILS['OUTROS'];
            return (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition select-none ${
                  isSelected
                    ? 'bg-emerald-950/20 border-emerald-500/50'
                    : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                      isSelected
                        ? 'bg-emerald-500 border-emerald-400 text-black'
                        : 'border-zinc-700 bg-zinc-950'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="truncate">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-zinc-200 truncate">{task.name}</span>
                      {task.isEssential && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-950/60 px-1 rounded">
                          ESSENCIAL
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono-numeric">
                      {cat.label} • {task.defaultDurationMinutes || 10} min
                    </span>
                  </div>
                </div>

                <span className="text-xs font-mono-numeric text-zinc-400 font-bold shrink-0 ml-2">
                  10m
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="text-xs text-zinc-400 font-mono-numeric">
            Execução sequencial sem pausas de distração.
          </div>

          <button
            onClick={handleStart}
            disabled={selectedTasks.length === 0}
            className={`px-6 py-3 rounded-xl font-bold text-xs flex items-center space-x-2 transition active:scale-95 shadow-lg ${
              selectedTasks.length > 0
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>INICIAR SESSÃO ({totalMinutes} MIN)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
