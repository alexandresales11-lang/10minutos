import React from 'react';
import { ExecutionLog, EvidenceItem, UserSettings, Task } from '../types';
import { ShieldCheck, Flame, Trophy, Award, Clock, CheckSquare, Layers, Sparkles } from 'lucide-react';
import { CATEGORY_DETAILS } from '../data/initialTasks';

interface TransformationDashboardProps {
  logs: ExecutionLog[];
  evidenceList: EvidenceItem[];
  settings: UserSettings;
  tasks: Task[];
  currentStreak: number;
  maxStreak: number;
}

export const TransformationDashboard: React.FC<TransformationDashboardProps> = ({
  logs,
  evidenceList,
  settings,
  tasks,
  currentStreak,
  maxStreak,
}) => {
  // Total blocks
  const totalBlocks = logs.length;

  // Total minutes & hours
  const totalMinutes = logs.reduce((acc, l) => acc + (l.durationMinutes || 10), 0);
  const totalHours = Math.floor(totalMinutes / 60);

  // Distinct days executed
  const uniqueDays = new Set(logs.map((l) => l.date)).size;

  // Categories practiced
  const categoriesMap = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.category] = (acc[l.category] || 0) + 1;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoriesMap).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Transformation Hero Card */}
      <div className="bg-gradient-to-b from-zinc-900 to-[#121215] border border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono-numeric uppercase tracking-wider font-bold mb-4">
            <ShieldCheck className="w-4 h-4" />
            <span>IDENTIDADE CONSTRUÍDA POR EXECUÇÃO</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            QUEM ESTOU ME TORNANDO.
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 mt-2 max-w-xl">
            A autoconfiança não é fruto de pensamentos positivos. Ela é a consequência inevitável de pilhas de evidências concretas.
          </p>
        </div>

        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Core Executive Numbers Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-mono-numeric uppercase">Blocos Concluídos</span>
            <CheckSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono-numeric text-white">
            {totalBlocks}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            blocos de 10 minutos
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-mono-numeric uppercase">Horas Reais</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono-numeric text-white">
            {totalHours}h
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {totalMinutes} min de ação deliberada
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-mono-numeric uppercase">Dias em Ação</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono-numeric text-white">
            {uniqueDays}
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            dias de consistência provada
          </p>
        </div>

        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-zinc-500 mb-2">
            <span className="text-xs font-mono-numeric uppercase">Maior Sequência</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-3xl sm:text-4xl font-black font-mono-numeric text-emerald-400">
            {maxStreak}d
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            atual: {currentStreak} dias seguidos
          </p>
        </div>
      </div>

      {/* Areas Practiced / Skill Evolution */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-lg font-bold text-white uppercase font-mono-numeric tracking-wide">
              ÁREAS PRATICADAS & CAPACIDADE DESENVOLVIDA
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Equilíbrio entre espírito, corpo, voz, mente e rotina.
            </p>
          </div>
          <span className="text-xs font-mono-numeric text-zinc-500">
            {sortedCategories.length} categorias ativas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-6">
          {sortedCategories.map(([catKey, count]) => {
            const cat = CATEGORY_DETAILS[catKey] || CATEGORY_DETAILS['OUTROS'];
            const hoursInCat = ((count * 10) / 60).toFixed(1);
            return (
              <div
                key={catKey}
                className="bg-[#121215] border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${cat.bgClass} ${cat.colorClass} ${cat.borderClass}`}>
                      {cat.icon} {cat.label}
                    </span>
                  </div>
                  <div className="text-2xl font-black font-mono-numeric text-white mt-1">
                    {count}{' '}
                    <span className="text-xs text-zinc-400 font-normal">blocos</span>
                  </div>
                </div>

                <div className="pt-3 mt-2 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-400 font-mono-numeric">
                  <span>Equivalente a:</span>
                  <span className="text-emerald-400 font-bold">{hoursInCat} horas</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Philosophy Progression Chain */}
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-6 sm:p-8 text-center space-y-4">
        <span className="text-xs font-mono-numeric uppercase tracking-widest text-emerald-400 font-bold">
          O CICLO DA DISCIPLINA INQUESTIONÁVEL
        </span>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 py-4 font-mono-numeric text-xs sm:text-sm font-black">
          <div className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 w-full sm:w-auto">
            "EU DISSE QUE FARIA."
          </div>
          <span className="text-emerald-500 font-bold hidden sm:inline">→</span>
          <span className="text-emerald-500 font-bold sm:hidden">↓</span>
          <div className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 w-full sm:w-auto">
            "EU FIZ."
          </div>
          <span className="text-emerald-500 font-bold hidden sm:inline">→</span>
          <span className="text-emerald-500 font-bold sm:hidden">↓</span>
          <div className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 w-full sm:w-auto">
            "EU CONTINUEI FAZENDO."
          </div>
          <span className="text-emerald-500 font-bold hidden sm:inline">→</span>
          <span className="text-emerald-500 font-bold sm:hidden">↓</span>
          <div className="px-4 py-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 rounded-xl w-full sm:w-auto">
            "EXISTEM EVIDÊNCIAS."
          </div>
        </div>

        <p className="text-xs text-zinc-500 font-mono-numeric max-w-lg mx-auto">
          Você já registrou {evidenceList.length} evidências materiais da sua transformação.
        </p>
      </div>
    </div>
  );
};
