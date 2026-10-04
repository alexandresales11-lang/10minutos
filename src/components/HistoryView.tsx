import React, { useState } from 'react';
import { ExecutionLog, UserSettings, TaskCategory } from '../types';
import { Clock, CheckCircle2, Flame, TrendingUp, Target, Calendar, BarChart3 } from 'lucide-react';
import { CATEGORY_DETAILS } from '../data/initialTasks';

interface HistoryViewProps {
  logs: ExecutionLog[];
  settings: UserSettings;
}

type Period = 'today' | 'yesterday' | '7days' | '30days' | '6months' | 'year';

export const HistoryView: React.FC<HistoryViewProps> = ({ logs, settings }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('7days');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const getFilteredLogs = (period: Period): { periodLogs: ExecutionLog[]; daysCount: number } => {
    switch (period) {
      case 'today':
        return {
          periodLogs: logs.filter((l) => l.date === todayStr),
          daysCount: 1,
        };
      case 'yesterday':
        return {
          periodLogs: logs.filter((l) => l.date === yesterdayStr),
          daysCount: 1,
        };
      case '7days': {
        const d7 = new Date(now);
        d7.setDate(now.getDate() - 7);
        const d7Str = d7.toISOString().split('T')[0];
        return {
          periodLogs: logs.filter((l) => l.date >= d7Str),
          daysCount: 7,
        };
      }
      case '30days': {
        const d30 = new Date(now);
        d30.setDate(now.getDate() - 30);
        const d30Str = d30.toISOString().split('T')[0];
        return {
          periodLogs: logs.filter((l) => l.date >= d30Str),
          daysCount: 30,
        };
      }
      case '6months': {
        const d180 = new Date(now);
        d180.setDate(now.getDate() - 180);
        const d180Str = d180.toISOString().split('T')[0];
        return {
          periodLogs: logs.filter((l) => l.date >= d180Str),
          daysCount: 180,
        };
      }
      case 'year': {
        const d365 = new Date(now);
        d365.setDate(now.getDate() - 365);
        const d365Str = d365.toISOString().split('T')[0];
        return {
          periodLogs: logs.filter((l) => l.date >= d365Str),
          daysCount: 365,
        };
      }
    }
  };

  const { periodLogs, daysCount } = getFilteredLogs(selectedPeriod);

  // Stats calculation
  const totalBlocks = periodLogs.length;
  const totalMinutes = periodLogs.reduce((acc, l) => acc + (l.durationMinutes || 10), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  // Unique active days in period
  const uniqueActiveDays = new Set(periodLogs.map((l) => l.date)).size;
  const adherenceRate = ((uniqueActiveDays / daysCount) * 100).toFixed(1);

  // Group by category
  const categoryCounts = periodLogs.reduce<Record<string, number>>((acc, l) => {
    acc[l.category] = (acc[l.category] || 0) + 1;
    return acc;
  }, {});

  // Overall stats across all logs ever
  const allTimeTotalMinutes = logs.reduce((acc, l) => acc + (l.durationMinutes || 10), 0);
  const allTimeHours = Math.floor(allTimeTotalMinutes / 60);
  const allTimeMinutesRem = allTimeTotalMinutes % 60;
  const allTimeUniqueDays = new Set(logs.map((l) => l.date)).size;

  // Daily average blocks over last 30 days
  const logsLast30 = getFilteredLogs('30days').periodLogs;
  const dailyAverageBlocks = (logsLast30.length / 30).toFixed(1);
  const dailyAverageHours = (parseFloat(dailyAverageBlocks) * 10) / 60;

  // Projections
  const projectedHours30Days = Math.round(dailyAverageHours * 30);
  const projectedHours6Months = Math.round(dailyAverageHours * 180);
  const projectedHours1Year = Math.round(dailyAverageHours * 365);

  const periods: { id: Period; label: string }[] = [
    { id: 'today', label: 'Hoje' },
    { id: 'yesterday', label: 'Ontem' },
    { id: '7days', label: '7 Dias' },
    { id: '30days', label: '30 Dias' },
    { id: '6months', label: '6 Meses' },
    { id: 'year', label: 'Ano' },
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <span className="text-xs font-mono-numeric text-emerald-400 uppercase tracking-widest font-bold">
              ANÁLISE TEMPORAL
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              HISTÓRICO DE DISCIPLINA
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Métricas consolidadas de horas e blocos executados.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 overflow-x-auto">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  selectedPeriod === p.id
                    ? 'bg-zinc-100 text-black'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Period Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="bg-[#121215] border border-zinc-800 rounded-xl p-4">
            <span className="text-xs font-mono-numeric text-zinc-500 uppercase">Blocos no Período</span>
            <div className="text-2xl sm:text-3xl font-black font-mono-numeric text-emerald-400 mt-1">
              {totalBlocks}
            </div>
            <span className="text-[11px] text-zinc-400 font-mono-numeric">10 min por bloco</span>
          </div>

          <div className="bg-[#121215] border border-zinc-800 rounded-xl p-4">
            <span className="text-xs font-mono-numeric text-zinc-500 uppercase">Tempo Acumulado</span>
            <div className="text-2xl sm:text-3xl font-black font-mono-numeric text-white mt-1">
              {totalHours}h
            </div>
            <span className="text-[11px] text-zinc-400 font-mono-numeric">{totalMinutes} minutos</span>
          </div>

          <div className="bg-[#121215] border border-zinc-800 rounded-xl p-4">
            <span className="text-xs font-mono-numeric text-zinc-500 uppercase">Dias Executados</span>
            <div className="text-2xl sm:text-3xl font-black font-mono-numeric text-zinc-200 mt-1">
              {uniqueActiveDays} / {daysCount}
            </div>
            <span className="text-[11px] text-zinc-400 font-mono-numeric">com pelo menos 1 bloco</span>
          </div>

          <div className="bg-[#121215] border border-zinc-800 rounded-xl p-4">
            <span className="text-xs font-mono-numeric text-zinc-500 uppercase">Aderência</span>
            <div className="text-2xl sm:text-3xl font-black font-mono-numeric text-amber-400 mt-1">
              {adherenceRate}%
            </div>
            <span className="text-[11px] text-zinc-400 font-mono-numeric">taxa de presença</span>
          </div>
        </div>

        {/* Categories Distribution in Selected Period */}
        {totalBlocks > 0 && (
          <div className="pt-6 mt-6 border-t border-zinc-800/80">
            <div className="text-xs font-mono-numeric text-zinc-400 uppercase tracking-wider mb-3">
              Distribuição por Categoria:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(categoryCounts).map(([catKey, count]) => {
                const cat = CATEGORY_DETAILS[catKey] || CATEGORY_DETAILS['OUTROS'];
                const percent = Math.round((count / totalBlocks) * 100);
                return (
                  <div
                    key={catKey}
                    className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-zinc-300 font-semibold truncate">{cat.label}</span>
                      <span className="text-zinc-500 font-mono-numeric">{percent}%</span>
                    </div>
                    <div className="text-base font-bold font-mono-numeric text-white">
                      {count} <span className="text-xs text-zinc-500 font-normal">blocos</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Meta de Longo Prazo / Projeto 1 Ano Section */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center space-x-2 pb-4 border-b border-zinc-800">
          <Target className="w-5 h-5 text-emerald-400" />
          <h3 className="text-lg font-bold text-white uppercase font-mono-numeric tracking-wide">
            PROJETO 1 ANO • METAS DE LONGO PRAZO
          </h3>
        </div>

        <div className="pt-6 space-y-6">
          {/* 365 Days Progress */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono-numeric mb-2">
              <span className="text-zinc-400 uppercase tracking-wider">DIAS CUMPRIDOS NO ANO</span>
              <span className="font-bold text-emerald-400">{allTimeUniqueDays} / 365 dias</span>
            </div>
            <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, (allTimeUniqueDays / 365) * 100)}%` }}
              />
            </div>
          </div>

          {/* All-time Accumulator cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-[#121215] border border-zinc-800 rounded-xl">
              <span className="text-xs font-mono-numeric text-zinc-500 uppercase">Horas Totais Acumuladas</span>
              <div className="text-3xl font-black font-mono-numeric text-white mt-1">
                {allTimeHours}h{allTimeMinutesRem}min
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Tempo puro de prática deliberada e oração.
              </p>
            </div>

            <div className="p-4 bg-[#121215] border border-zinc-800 rounded-xl">
              <span className="text-xs font-mono-numeric text-zinc-500 uppercase">Blocos Totais Executados</span>
              <div className="text-3xl font-black font-mono-numeric text-emerald-400 mt-1">
                {logs.length}
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Cada bloco é um tijolo de consistência inabalável.
              </p>
            </div>
          </div>

          {/* Projection Section */}
          <div className="p-5 bg-zinc-950 rounded-xl border border-zinc-900 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-mono-numeric text-amber-400 uppercase font-bold tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Se você mantiver a média atual ({dailyAverageBlocks} blocos / dia):</span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-zinc-900 rounded-lg text-center">
                <div className="text-xs text-zinc-400 font-mono-numeric uppercase">Em 30 Dias</div>
                <div className="text-xl font-bold font-mono-numeric text-white mt-0.5">
                  +{projectedHours30Days}h
                </div>
              </div>
              <div className="p-3 bg-zinc-900 rounded-lg text-center">
                <div className="text-xs text-zinc-400 font-mono-numeric uppercase">Em 6 Meses</div>
                <div className="text-xl font-bold font-mono-numeric text-white mt-0.5">
                  +{projectedHours6Months}h
                </div>
              </div>
              <div className="p-3 bg-zinc-900 rounded-lg text-center">
                <div className="text-xs text-zinc-400 font-mono-numeric uppercase">Em 1 Ano</div>
                <div className="text-xl font-bold font-mono-numeric text-emerald-400 mt-0.5">
                  +{projectedHours1Year}h
                </div>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500 italic text-center font-mono-numeric pt-1">
              "Consistência acumulada vira capacidade."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
