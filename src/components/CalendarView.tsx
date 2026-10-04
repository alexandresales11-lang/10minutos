import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { ExecutionLog, Task, UserSettings, TaskCategory } from '../types';
import { CATEGORY_DETAILS } from '../data/initialTasks';

interface CalendarViewProps {
  logs: ExecutionLog[];
  tasks: Task[];
  settings: UserSettings;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ logs, tasks, settings }) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(
    new Date().toISOString().split('T')[0]
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Group logs by YYYY-MM-DD
  const logsByDate = logs.reduce<Record<string, ExecutionLog[]>>((acc, log) => {
    if (!acc[log.date]) acc[log.date] = [];
    acc[log.date].push(log);
    return acc;
  }, {});

  // Selected Day Details
  const selectedDayLogs = selectedDateStr ? logsByDate[selectedDateStr] || [] : [];
  const selectedDayCompletedTaskIds = new Set(selectedDayLogs.map((l) => l.taskId));
  const selectedTotalMinutes = selectedDayLogs.reduce((acc, l) => acc + (l.durationMinutes || 10), 0);

  // Category breakdown for selected day
  const categoryCounts = selectedDayLogs.reduce<Record<string, number>>((acc, log) => {
    acc[log.category] = (acc[log.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Calendar Header Card */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-mono-numeric text-emerald-400 uppercase tracking-widest font-bold">
              REGISTRO DE CONSISTÊNCIA
            </span>
            <h2 className="text-2xl font-black text-white mt-1">
              CALENDÁRIO DE EXECUÇÃO
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              title="Mês anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold font-mono-numeric text-zinc-100 min-w-[130px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              title="Próximo mês"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono-numeric text-zinc-400 pb-4 mb-4 border-b border-zinc-800/80">
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-400" />
            <span>Meta Cumprida (≥ {settings.minDailyGoalBlocks} blocos)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-500 border border-amber-400" />
            <span>Parcial (1-{settings.minDailyGoalBlocks - 1} blocos)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded bg-zinc-900 border border-zinc-800" />
            <span>Sem Registro</span>
          </div>
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-mono-numeric font-bold text-zinc-500 mb-2">
          {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Empty cells before month starts */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-14 sm:h-18 rounded-xl bg-zinc-950/20 border border-zinc-900/30" />
          ))}

          {/* Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayLogs = logsByDate[dateStr] || [];
            const blockCount = dayLogs.length;

            const isGoalMet = blockCount >= settings.minDailyGoalBlocks;
            const isPartial = blockCount > 0 && blockCount < settings.minDailyGoalBlocks;
            const isSelected = selectedDateStr === dateStr;
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`h-14 sm:h-18 p-1.5 rounded-xl border flex flex-col justify-between text-left transition relative active:scale-95 ${
                  isSelected
                    ? 'ring-2 ring-emerald-400 z-10'
                    : ''
                } ${
                  isGoalMet
                    ? 'bg-emerald-950/30 border-emerald-500/50 hover:bg-emerald-950/50'
                    : isPartial
                    ? 'bg-amber-950/30 border-amber-500/50 hover:bg-amber-950/50'
                    : 'bg-zinc-950 border-zinc-850 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-mono-numeric font-bold ${
                      isToday
                        ? 'bg-zinc-100 text-black px-1.5 py-0.5 rounded'
                        : isGoalMet
                        ? 'text-emerald-300'
                        : isPartial
                        ? 'text-amber-300'
                        : 'text-zinc-500'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {blockCount > 0 && (
                    <span
                      className={`text-[10px] font-mono-numeric font-extrabold ${
                        isGoalMet ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {blockCount}b
                    </span>
                  )}
                </div>

                {/* Visual block indicator bar */}
                <div className="w-full flex items-center space-x-0.5 mt-auto">
                  {blockCount > 0 ? (
                    <div
                      className={`h-1 rounded-full w-full ${
                        isGoalMet ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                  ) : (
                    <div className="h-0.5 w-full bg-zinc-800/40" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Detailed Breakdown */}
      {selectedDateStr && (
        <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-zinc-800 gap-3">
            <div>
              <div className="text-xs font-mono-numeric text-zinc-400 uppercase">DETALHAMENTO DO DIA</div>
              <h3 className="text-xl font-black text-white mt-0.5">
                {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 text-center">
                <div className="text-xl font-black font-mono-numeric text-emerald-400">
                  {selectedDayLogs.length}
                </div>
                <div className="text-[10px] text-zinc-500 uppercase font-mono-numeric">blocos</div>
              </div>
              <div className="bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 text-center">
                <div className="text-xl font-black font-mono-numeric text-white">
                  {selectedTotalMinutes}m
                </div>
                <div className="text-[10px] text-zinc-500 uppercase font-mono-numeric">tempo total</div>
              </div>
            </div>
          </div>

          {/* Categories breakdown on that day */}
          {selectedDayLogs.length > 0 && (
            <div className="py-4 border-b border-zinc-800/80">
              <div className="text-xs font-mono-numeric text-zinc-400 uppercase tracking-wider mb-2.5">
                Áreas Trabalhadas no Dia:
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(categoryCounts).map(([catKey, count]) => {
                  const cat = CATEGORY_DETAILS[catKey] || CATEGORY_DETAILS['OUTROS'];
                  return (
                    <div
                      key={catKey}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${cat.bgClass} ${cat.colorClass} ${cat.borderClass}`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}:</span>
                      <span className="font-bold font-mono-numeric">{count} {count === 1 ? 'bloco' : 'blocos'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tasks Completed vs Pending on that day */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5">
            {/* Completed */}
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold font-mono-numeric uppercase tracking-wider text-emerald-400 mb-3">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tarefas Concluídas ({selectedDayLogs.length})</span>
              </div>
              {selectedDayLogs.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">Nenhum bloco registrado nesta data.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {selectedDayLogs.map((log, idx) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-mono-numeric font-bold text-zinc-500">#{idx + 1}</span>
                        <span className="font-medium text-zinc-200">{log.taskName}</span>
                      </div>
                      <span className="font-mono-numeric text-zinc-400">{log.durationMinutes} min</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Not executed on that day */}
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-bold font-mono-numeric uppercase tracking-wider text-zinc-400 mb-3">
                <AlertCircle className="w-4 h-4" />
                <span>Tarefas Não Executadas ({tasks.length - selectedDayCompletedTaskIds.size})</span>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {tasks
                  .filter((t) => !selectedDayCompletedTaskIds.has(t.id))
                  .slice(0, 15)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="p-2 rounded-lg bg-zinc-950 border border-zinc-900 flex items-center justify-between text-xs text-zinc-400"
                    >
                      <span className="truncate">{task.name}</span>
                      <span className="text-[10px] font-mono-numeric text-zinc-600">{task.category}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
