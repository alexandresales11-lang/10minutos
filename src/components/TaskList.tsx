import React, { useState } from 'react';
import { Task, TaskCategory, Priority, ExecutionLog } from '../types';
import { Play, Edit3, Plus, CheckCircle2, AlertCircle, Sparkles, Filter, Mic, Camera, Video, Hash } from 'lucide-react';
import { CATEGORY_DETAILS } from '../data/initialTasks';

interface TaskListProps {
  tasks: Task[];
  todayCompletedTaskIds: Set<string>;
  onStartTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onAddNewTask: () => void;
  onOpenSessionPlanner: () => void;
  onStartFullList: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  todayCompletedTaskIds,
  onStartTask,
  onEditTask,
  onAddNewTask,
  onOpenSessionPlanner,
  onStartFullList,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'essential' | 'unconfirmed' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = [
    'ESPIRITUAL',
    'FÍSICO',
    'MUSICAL',
    'MENTAL',
    'COMUNICAÇÃO',
    'CUIDADOS PESSOAIS',
    'ORGANIZAÇÃO',
    'OUTROS',
  ];

  const filteredTasks = tasks.filter((t) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.name.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q) ?? false;
      if (!matchName && !matchDesc) return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && t.category !== selectedCategory) {
      return false;
    }

    // Secondary mode filter
    if (filterMode === 'essential' && !t.isEssential) return false;
    if (filterMode === 'unconfirmed' && !t.isOriginalUncertain) return false;
    if (filterMode === 'pending' && todayCompletedTaskIds.has(t.id)) return false;

    return true;
  });

  const unconfirmedCount = tasks.filter((t) => t.isOriginalUncertain).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Banner & Quick Session Triggers */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <span className="text-xs font-mono-numeric text-emerald-400 uppercase tracking-widest font-bold">
              CADASTRO & EXECUÇÃO DOS BLOCOS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
              LISTA DE TAREFAS (10 MIN)
            </h2>
            <p className="text-sm text-zinc-400 mt-1">
              {tasks.length} blocos mapeados. Escolha e execute sem pensar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onStartFullList}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>LISTA COMPLETA</span>
            </button>

            <button
              onClick={onOpenSessionPlanner}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition active:scale-95"
            >
              <span>ESCOLHER TAREFAS</span>
            </button>

            <button
              onClick={onAddNewTask}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl flex items-center space-x-1.5 transition active:scale-95 shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>NOVA TAREFA</span>
            </button>
          </div>
        </div>

        {/* Unconfirmed Handwriting Notice */}
        {unconfirmedCount > 0 && (
          <div className="mt-4 p-3.5 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>
                Existem <strong>{unconfirmedCount} tarefas</strong> com escrita manuscrita incerta. Clique em editar para ajustar o nome original quando quiser.
              </span>
            </div>
            <button
              onClick={() => {
                setFilterMode(filterMode === 'unconfirmed' ? 'all' : 'unconfirmed');
                setSelectedCategory('all');
              }}
              className="text-xs font-mono-numeric font-bold underline text-amber-400 ml-2 whitespace-nowrap"
            >
              {filterMode === 'unconfirmed' ? 'Ver Todas' : 'Filtrar Incertas'}
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div className="pt-6 space-y-4">
          {/* Search and Secondary Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Buscar tarefa por nome ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 font-mono-numeric"
            />

            <div className="flex items-center space-x-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-850 overflow-x-auto">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'pending', label: 'Pendentes Hoje' },
                { id: 'essential', label: 'Essenciais' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilterMode(f.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    filterMode === f.id
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                selectedCategory === 'all'
                  ? 'bg-zinc-100 text-black border-zinc-100 font-bold'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:border-zinc-700'
              }`}
            >
              Todas as Categorias
            </button>

            {categories.map((catKey) => {
              const cat = CATEGORY_DETAILS[catKey] || CATEGORY_DETAILS['OUTROS'];
              const active = selectedCategory === catKey;
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border flex items-center space-x-1.5 ${
                    active
                      ? `${cat.bgClass} ${cat.colorClass} ${cat.borderClass} font-bold`
                      : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:border-zinc-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Task List Items */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center border border-zinc-900 rounded-2xl bg-zinc-950/40">
            <p className="text-zinc-500 text-sm">Nenhuma tarefa encontrada com os filtros selecionados.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompletedToday = todayCompletedTaskIds.has(task.id);
            const cat = CATEGORY_DETAILS[task.category] || CATEGORY_DETAILS['OUTROS'];

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCompletedToday
                    ? 'bg-zinc-950/40 border-zinc-900 opacity-70 hover:opacity-100'
                    : 'bg-[#121215] border-zinc-800 hover:border-zinc-700 shadow-sm'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  {/* Order number */}
                  <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono-numeric font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    #{task.order}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm sm:text-base font-bold text-white">
                        {task.name}
                      </span>

                      {/* Category Badge */}
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${cat.bgClass} ${cat.colorClass} ${cat.borderClass}`}>
                        {cat.label}
                      </span>

                      {/* Essential badge */}
                      {task.isEssential && (
                        <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-500/30 font-mono-numeric">
                          ESSENCIAL
                        </span>
                      )}

                      {/* Evidence icon */}
                      {task.requiresEvidence && (
                        <span
                          className="flex items-center space-x-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-950/50 text-blue-300 border border-blue-500/30 font-mono-numeric"
                          title="Exige evidência na conclusão"
                        >
                          {task.evidenceTypePrompt === 'audio' && <Mic className="w-3 h-3" />}
                          {task.evidenceTypePrompt === 'photo' && <Camera className="w-3 h-3" />}
                          {task.evidenceTypePrompt === 'video' && <Video className="w-3 h-3" />}
                          {task.evidenceTypePrompt === 'metric' && <Hash className="w-3 h-3" />}
                          <span>EVIDÊNCIA</span>
                        </span>
                      )}

                      {/* Unconfirmed note badge */}
                      {task.isOriginalUncertain && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-950/50 text-amber-400 border border-amber-500/30">
                          Confirmar Original
                        </span>
                      )}

                      {/* Done today status */}
                      {isCompletedToday && (
                        <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-400 font-mono-numeric">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Feito Hoje</span>
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-xs text-zinc-400 line-clamp-2 max-w-xl">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onEditTask(task)}
                    className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
                    title="Editar bloco"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onStartTask(task)}
                    className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center space-x-2 transition active:scale-95 shadow-md ${
                      isCompletedToday
                        ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>INICIAR 10M</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
