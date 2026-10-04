import React, { useState } from 'react';
import { EvidenceItem, Task } from '../types';
import { ArrowRight, Play, Pause, Camera, Video, Mic, Hash, Calendar, Trophy, ChevronRight, SplitSquareVertical } from 'lucide-react';
import { CATEGORY_DETAILS } from '../data/initialTasks';

interface EvidenceComparisonProps {
  evidenceList: EvidenceItem[];
  tasks: Task[];
  currentDayNumber: number;
  onOpenNewEvidence: (task: Task, milestone?: 1 | 7 | 30 | 90 | 180 | 365) => void;
}

export const EvidenceComparison: React.FC<EvidenceComparisonProps> = ({
  evidenceList,
  tasks,
  currentDayNumber,
  onOpenNewEvidence,
}) => {
  // Filter by task or view all
  const [selectedTaskId, setSelectedTaskId] = useState<string>('all');
  
  // Side-by-side comparison state
  const [compareLeftId, setCompareLeftId] = useState<string | null>(null);
  const [compareRightId, setCompareRightId] = useState<string | null>(null);

  // Audio player state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioObj, setAudioObj] = useState<HTMLAudioElement | null>(null);

  const milestones: (1 | 7 | 30 | 90 | 180 | 365)[] = [1, 7, 30, 90, 180, 365];
  
  // Find which milestone is today or closest
  const todayMilestone = milestones.find(m => m === currentDayNumber);

  const filteredEvidence = evidenceList.filter((item) => {
    if (selectedTaskId === 'all') return true;
    return item.taskId === selectedTaskId;
  });

  const handleTogglePlay = (id: string, url?: string) => {
    if (!url) return;

    if (playingId === id) {
      audioObj?.pause();
      setPlayingId(null);
    } else {
      if (audioObj) audioObj.pause();
      const newAudio = new Audio(url);
      newAudio.onended = () => setPlayingId(null);
      newAudio.play();
      setAudioObj(newAudio);
      setPlayingId(id);
    }
  };

  const leftEvidence = evidenceList.find((e) => e.id === compareLeftId) || filteredEvidence[filteredEvidence.length - 1];
  const rightEvidence = evidenceList.find((e) => e.id === compareRightId) || filteredEvidence[0];

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Milestone Reminder Alert Banner if today is a milestone */}
      {todayMilestone && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-5 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase font-mono-numeric font-bold tracking-wider text-amber-400">
                MARCO DIA {todayMilestone}
              </div>
              <h3 className="text-lg font-bold text-white">Hoje é um dia de comparação.</h3>
              <p className="text-sm text-zinc-300">
                Registre novamente sua prática de instrumento, voz ou físico para comparar com o início.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenNewEvidence(tasks[0], todayMilestone)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl self-start sm:self-auto transition shrink-0"
          >
            REGISTRAR MARCO DIA {todayMilestone}
          </button>
        </div>
      )}

      {/* Header & Milestone Status */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <span className="text-xs font-mono-numeric text-emerald-400 uppercase tracking-widest font-bold">
              PROVA DE EXECUÇÃO & CAPACIDADE ACUMULADA
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              MINHA EVOLUÇÃO
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              Evidências concretas. Não é sensação de melhora, é registro real.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-zinc-500 font-mono-numeric">Total:</span>
            <span className="text-xl font-bold font-mono-numeric text-white">{evidenceList.length}</span>
            <span className="text-xs text-zinc-500">evidências salvas</span>
          </div>
        </div>

        {/* Milestone Tracker Bar */}
        <div className="pt-6">
          <div className="text-xs font-mono-numeric text-zinc-400 uppercase tracking-wider mb-3">
            Linha do Tempo dos Marcos:
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {milestones.map((m) => {
              const reached = currentDayNumber >= m;
              const hasEvidence = evidenceList.some((e) => e.milestone === m || e.dayNumber === m);
              return (
                <div
                  key={m}
                  className={`p-3 rounded-xl border text-center transition ${
                    reached
                      ? hasEvidence
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300'
                      : 'bg-zinc-950/60 border-zinc-900 text-zinc-600'
                  }`}
                >
                  <div className="text-[10px] font-mono-numeric uppercase">Marco</div>
                  <div className="text-base font-bold font-mono-numeric">DIA {m}</div>
                  <div className="text-[10px] mt-1">
                    {hasEvidence ? '✓ Registrado' : reached ? 'Pendente' : 'Futuro'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Side-By-Side Comparison Section */}
      {filteredEvidence.length >= 2 && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <SplitSquareVertical className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Comparação Lado a Lado</h3>
            </div>
            <span className="text-xs font-mono-numeric text-zinc-400">
              Selecione duas evidências para confrontar
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Card */}
            <div className="bg-[#121215] border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono-numeric font-bold text-zinc-400 uppercase bg-zinc-900 px-2 py-1 rounded">
                    EVIDÊNCIA ANTERIOR
                  </span>
                  <select
                    value={compareLeftId || leftEvidence?.id || ''}
                    onChange={(e) => setCompareLeftId(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded px-2 py-1 font-mono-numeric"
                  >
                    {filteredEvidence.map((e) => (
                      <option key={e.id} value={e.id}>
                        Dia {e.dayNumber} - {e.taskName} ({e.date})
                      </option>
                    ))}
                  </select>
                </div>

                {leftEvidence && (
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-zinc-200">{leftEvidence.taskName}</div>
                    <div className="text-xs text-zinc-500 font-mono-numeric">
                      {leftEvidence.date} • Dia {leftEvidence.dayNumber}
                      {leftEvidence.milestone && ` • Marco Dia ${leftEvidence.milestone}`}
                    </div>

                    {leftEvidence.metricValue !== undefined && (
                      <div className="p-3 bg-zinc-900 rounded-lg">
                        <span className="text-2xl font-black font-mono-numeric text-white">
                          {leftEvidence.metricValue}
                        </span>{' '}
                        <span className="text-xs text-zinc-400 font-mono-numeric">
                          {leftEvidence.metricUnit || ''}
                        </span>
                      </div>
                    )}

                    {leftEvidence.mediaDataUrl && leftEvidence.type === 'photo' && (
                      <img
                        src={leftEvidence.mediaDataUrl}
                        alt="Evidência"
                        className="rounded-lg max-h-48 w-full object-cover border border-zinc-800"
                      />
                    )}

                    {leftEvidence.mediaDataUrl && (leftEvidence.type === 'audio' || leftEvidence.type === 'video') && (
                      <button
                        onClick={() => handleTogglePlay(leftEvidence.id, leftEvidence.mediaDataUrl)}
                        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg flex items-center justify-center space-x-2"
                      >
                        {playingId === leftEvidence.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>Ouvir Gravação (Dia {leftEvidence.dayNumber})</span>
                      </button>
                    )}

                    {leftEvidence.observation && (
                      <p className="text-xs text-zinc-400 italic bg-zinc-950 p-2.5 rounded border border-zinc-900">
                        "{leftEvidence.observation}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Card */}
            <div className="bg-[#121215] border border-emerald-950 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono-numeric font-bold text-emerald-400 uppercase bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/20">
                    EVIDÊNCIA MAIS RECENTE
                  </span>
                  <select
                    value={compareRightId || rightEvidence?.id || ''}
                    onChange={(e) => setCompareRightId(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded px-2 py-1 font-mono-numeric"
                  >
                    {filteredEvidence.map((e) => (
                      <option key={e.id} value={e.id}>
                        Dia {e.dayNumber} - {e.taskName} ({e.date})
                      </option>
                    ))}
                  </select>
                </div>

                {rightEvidence && (
                  <div className="space-y-3">
                    <div className="text-sm font-bold text-zinc-200">{rightEvidence.taskName}</div>
                    <div className="text-xs text-zinc-500 font-mono-numeric">
                      {rightEvidence.date} • Dia {rightEvidence.dayNumber}
                      {rightEvidence.milestone && ` • Marco Dia ${rightEvidence.milestone}`}
                    </div>

                    {rightEvidence.metricValue !== undefined && (
                      <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-lg flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-black font-mono-numeric text-emerald-300">
                            {rightEvidence.metricValue}
                          </span>{' '}
                          <span className="text-xs text-emerald-400 font-mono-numeric">
                            {rightEvidence.metricUnit || ''}
                          </span>
                        </div>

                        {leftEvidence?.metricValue !== undefined && (
                          <div className="text-right">
                            <span className="text-xs font-mono-numeric text-emerald-400 font-bold">
                              {rightEvidence.metricValue >= leftEvidence.metricValue ? '+' : ''}
                              {(rightEvidence.metricValue - leftEvidence.metricValue).toFixed(0)}{' '}
                              {rightEvidence.metricUnit}
                            </span>
                            <div className="text-[10px] text-zinc-400 font-mono-numeric">evolução</div>
                          </div>
                        )}
                      </div>
                    )}

                    {rightEvidence.mediaDataUrl && rightEvidence.type === 'photo' && (
                      <img
                        src={rightEvidence.mediaDataUrl}
                        alt="Evidência Recente"
                        className="rounded-lg max-h-48 w-full object-cover border border-zinc-800"
                      />
                    )}

                    {rightEvidence.mediaDataUrl && (rightEvidence.type === 'audio' || rightEvidence.type === 'video') && (
                      <button
                        onClick={() => handleTogglePlay(rightEvidence.id, rightEvidence.mediaDataUrl)}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg flex items-center justify-center space-x-2"
                      >
                        {playingId === rightEvidence.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        <span>Ouvir Gravação (Dia {rightEvidence.dayNumber})</span>
                      </button>
                    )}

                    {rightEvidence.observation && (
                      <p className="text-xs text-zinc-300 italic bg-zinc-950 p-2.5 rounded border border-zinc-900">
                        "{rightEvidence.observation}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter by Task */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedTaskId('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            selectedTaskId === 'all'
              ? 'bg-zinc-100 text-black'
              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Todas as Habilidades
        </button>
        {tasks
          .filter((t) => t.requiresEvidence || evidenceList.some((e) => e.taskId === t.id))
          .map((task) => (
            <button
              key={task.id}
              onClick={() => setSelectedTaskId(task.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                selectedTaskId === task.id
                  ? 'bg-emerald-500 text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {task.name}
            </button>
          ))}
      </div>

      {/* Complete Evidence Feed */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white uppercase font-mono-numeric tracking-wider">
          Registros Salvos ({filteredEvidence.length})
        </h3>

        {filteredEvidence.length === 0 ? (
          <div className="p-12 text-center border border-zinc-900 rounded-2xl bg-zinc-950/40">
            <p className="text-zinc-500 text-sm">Nenhuma evidência registrada para esta categoria ainda.</p>
            <p className="text-zinc-600 text-xs mt-1">Conclua um bloco e clique em "Registrar Evidência".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEvidence.map((item) => {
              const cat = CATEGORY_DETAILS[item.category] || CATEGORY_DETAILS['OUTROS'];
              return (
                <div
                  key={item.id}
                  className="bg-[#121215] border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${cat.bgClass} ${cat.colorClass} ${cat.borderClass}`}>
                        {cat.label}
                      </span>
                      <span className="text-xs font-mono-numeric text-zinc-500">
                        {item.date} • Dia {item.dayNumber}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-2">{item.taskName}</h4>

                    {item.metricValue !== undefined && (
                      <div className="text-lg font-mono-numeric font-black text-emerald-400 mb-2">
                        {item.metricValue} <span className="text-xs text-zinc-400">{item.metricUnit}</span>
                      </div>
                    )}

                    {item.mediaDataUrl && item.type === 'photo' && (
                      <img
                        src={item.mediaDataUrl}
                        alt="Evidência"
                        className="rounded-lg max-h-40 w-full object-cover mb-2 border border-zinc-800"
                      />
                    )}

                    {item.mediaDataUrl && (item.type === 'audio' || item.type === 'video') && (
                      <button
                        onClick={() => handleTogglePlay(item.id, item.mediaDataUrl)}
                        className="w-full py-2 mb-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium rounded-lg flex items-center justify-center space-x-2"
                      >
                        {playingId === item.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        <span>Reproduzir Áudio</span>
                      </button>
                    )}

                    {item.observation && (
                      <p className="text-xs text-zinc-400 italic bg-zinc-950 p-2.5 rounded border border-zinc-900">
                        "{item.observation}"
                      </p>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500 font-mono-numeric">
                    <span>Caminho: {item.drivePath?.split('/').slice(-2).join('/')}</span>
                    {item.milestone && (
                      <span className="text-amber-400 font-bold">MARCO D{item.milestone}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
