import React, { useState } from 'react';
import { X, Check, Trash2 } from 'lucide-react';
import { Task, TaskCategory, Priority } from '../types';
import { CATEGORY_DETAILS } from '../data/initialTasks';

interface TaskEditModalProps {
  task: Task | null;
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onClose: () => void;
}

export const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  onSave,
  onDelete,
  onClose,
}) => {
  const isEditing = Boolean(task);

  const [name, setName] = useState<string>(task ? task.name : '');
  const [description, setDescription] = useState<string>(task?.description || '');
  const [category, setCategory] = useState<TaskCategory>(task?.category || 'ESPIRITUAL');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'MÉDIA');
  const [isEssential, setIsEssential] = useState<boolean>(task?.isEssential || false);
  const [defaultDurationMinutes, setDefaultDurationMinutes] = useState<number>(task?.defaultDurationMinutes || 10);
  const [requiresEvidence, setRequiresEvidence] = useState<boolean>(task?.requiresEvidence || false);
  const [evidenceTypePrompt, setEvidenceTypePrompt] = useState<'audio' | 'video' | 'photo' | 'observation' | 'metric'>(
    task?.evidenceTypePrompt || 'observation'
  );
  const [metricUnit, setMetricUnit] = useState<string>(task?.metricUnit || '');

  const categories: TaskCategory[] = [
    'ESPIRITUAL',
    'FÍSICO',
    'MUSICAL',
    'MENTAL',
    'COMUNICAÇÃO',
    'CUIDADOS PESSOAIS',
    'ORGANIZAÇÃO',
    'OUTROS',
    'DINHEIRO',
  ];

  const priorities: Priority[] = ['ESSENCIAL', 'ALTA', 'MÉDIA', 'BAIXA'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updatedTask: Task = {
      id: task ? task.id : `task-${Date.now()}`,
      order: task ? task.order : 99,
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      isEssential: priority === 'ESSENCIAL' || isEssential,
      defaultDurationMinutes,
      frequency: task ? task.frequency : 'ALL',
      requiresEvidence,
      evidenceTypePrompt: requiresEvidence ? evidenceTypePrompt : undefined,
      metricUnit: requiresEvidence && evidenceTypePrompt === 'metric' ? metricUnit || 'Unidades' : undefined,
      isOriginalUncertain: false, // Once edited by the user, mark confirmed
      createdAt: task ? task.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(updatedTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <span className="text-xs font-mono-numeric uppercase tracking-wider text-emerald-400 font-bold">
              {isEditing ? 'EDITAR BLOCO DE 10 MINUTOS' : 'NOVO BLOCO DE 10 MINUTOS'}
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">
              {name || 'Configurar Tarefa'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1 font-mono-numeric">
              Nome da Tarefa *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Treino de Dicção, Oração..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1 font-mono-numeric">
              Instruções / Descrição (O que fazer nesses 10 minutos)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva exatamente o exercício ou prática..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1 font-mono-numeric">
              Categoria
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {categories.map((catKey) => {
                const cat = CATEGORY_DETAILS[catKey] || CATEGORY_DETAILS['OUTROS'];
                const selected = category === catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border text-left flex items-center space-x-1.5 transition ${
                      selected
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1 font-mono-numeric">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono-numeric"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1 font-mono-numeric">
                Duração (Minutos)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={defaultDurationMinutes}
                onChange={(e) => setDefaultDurationMinutes(parseInt(e.target.value) || 10)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs font-mono-numeric text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Evidence Configuration */}
          <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-200 block">Exigir Registro de Evidência</span>
                <span className="text-[11px] text-zinc-500">Pede gravação, foto ou número ao concluir</span>
              </div>
              <input
                type="checkbox"
                checked={requiresEvidence}
                onChange={(e) => setRequiresEvidence(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
            </div>

            {requiresEvidence && (
              <div className="pt-2 border-t border-zinc-900 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1 font-mono-numeric">Tipo sugerido</label>
                  <select
                    value={evidenceTypePrompt}
                    onChange={(e) => setEvidenceTypePrompt(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200"
                  >
                    <option value="audio">Áudio (voz/instrumento)</option>
                    <option value="video">Vídeo</option>
                    <option value="photo">Foto</option>
                    <option value="metric">Métrica (número)</option>
                    <option value="observation">Nota escrita</option>
                  </select>
                </div>

                {evidenceTypePrompt === 'metric' && (
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1 font-mono-numeric">Unidade</label>
                    <input
                      type="text"
                      placeholder="BPM, reps, kg..."
                      value={metricUnit}
                      onChange={(e) => setMetricUnit(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Remover tarefa "${task?.name}"?`)) {
                    onDelete(task!.id);
                    onClose();
                  }
                }}
                className="flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-950/30 rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center space-x-2 transition active:scale-95 shadow-md shadow-emerald-500/20"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Salvar Tarefa</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
