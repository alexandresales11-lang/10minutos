import React, { useState } from 'react';
import { X, DollarSign, Smartphone, Lock, Unlock, Clock, TrendingUp, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { UserSettings, ExecutionLog } from '../types';

interface FutureModulesModalProps {
  settings: UserSettings;
  logs: ExecutionLog[];
  onSaveSettings: (settings: UserSettings) => void;
  onClose: () => void;
}

export const FutureModulesModal: React.FC<FutureModulesModalProps> = ({
  settings,
  logs,
  onSaveSettings,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'money' | 'blocking'>('money');

  // Calculate earned free minutes based on 3 blocks = 5 free minutes
  const totalCompletedBlocks = logs.length;
  const earnedBatches = Math.floor(totalCompletedBlocks / (settings.blocksRequiredForFreeTime || 3));
  const totalFreeMinutesEarned = earnedBatches * (settings.freeMinutesPerBatch || 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <span className="text-xs font-mono-numeric uppercase tracking-wider text-emerald-400 font-bold">
              EXPANSÃO & ARQUITETURA AVANÇADA
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Módulos em Preparação
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-2 bg-zinc-950 border-b border-zinc-850 gap-2">
          <button
            onClick={() => setActiveTab('money')}
            className={`py-2 px-3 rounded-xl text-xs font-bold font-mono-numeric flex items-center justify-center space-x-2 transition ${
              activeTab === 'money'
                ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>10 MINUTOS — DINHEIRO</span>
          </button>

          <button
            onClick={() => setActiveTab('blocking')}
            className={`py-2 px-3 rounded-xl text-xs font-bold font-mono-numeric flex items-center justify-center space-x-2 transition ${
              activeTab === 'blocking'
                ? 'bg-zinc-800 text-amber-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>TICKETS & BLOQUEIO</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {activeTab === 'money' ? (
            /* MONEY VERSION ARCHITECTURE */
            <div className="space-y-5">
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-5">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono-numeric font-bold uppercase mb-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>CONVERSÃO DE HORAS DE EXECUÇÃO EM RESULTADO FINANCEIRO</span>
                </div>
                <h3 className="text-xl font-black text-white">
                  A Mesma Disciplina. Aplicada ao Trabalho & Renda.
                </h3>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                  A versão "10 Minutos Dinheiro" quebra as maiores barreiras de procrastinação em vendas, prospecção e atendimento através do mesmo princípio: blocos focados de 10 minutos.
                </p>
              </div>

              {/* Pipeline funnel preview */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-3 font-mono-numeric">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Métrica da Proporção Desejada (Exemplo):
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-lg">
                    <span className="text-zinc-300">120 Blocos de Prospecção (20h)</span>
                    <span className="text-emerald-400 font-bold">240 Contatos</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-lg">
                    <span className="text-zinc-300">Respostas obtidas</span>
                    <span className="text-white font-bold">37 respostas</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-zinc-900 rounded-lg">
                    <span className="text-zinc-300">Reuniões agendadas</span>
                    <span className="text-white font-bold">12 reuniões</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-lg">
                    <span className="text-emerald-200 font-bold">Vendas Fechadas</span>
                    <span className="text-emerald-300 font-black">4 vendas (R$ X)</span>
                  </div>
                </div>
              </div>

              {/* Tasks ready for activation */}
              <div className="space-y-2">
                <div className="text-xs font-bold font-mono-numeric text-zinc-400 uppercase tracking-wider">
                  Tarefas Mapeadas no Código:
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  {[
                    'Prospecção Ativa',
                    'Follow-up com Clientes',
                    'Envio de Propostas',
                    'Criação de Oferta',
                    'Melhoria de Portfólio',
                    'Organização de CRM',
                    'Criação de Conteúdo',
                    'Recuperação de Leads',
                  ].map((t) => (
                    <div key={t} className="p-2.5 bg-zinc-900/60 border border-zinc-800 rounded-lg flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="truncate">{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-900 text-xs text-zinc-400">
                <span className="text-emerald-400 font-bold">Equilíbrio Preservado:</span> Este módulo não substitui o espiritual ou a saúde, mas adiciona blocos produtivos específicos para quem busca independência financeira com rigor.
              </div>
            </div>
          ) : (
            /* PHONE BLOCKING ARCHITECTURE */
            <div className="space-y-5">
              <div className="bg-blue-950/20 border border-blue-500/30 rounded-2xl p-5">
                <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono-numeric font-bold uppercase mb-2">
                  <Smartphone className="w-4 h-4" />
                  <span>SISTEMA DE TICKETS E RECOMPENSA (JÁ ATIVO!)</span>
                </div>
                <h3 className="text-xl font-black text-white">
                  3 Blocos de 10 Min = 15 Min de Liberação
                </h3>
                <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                  A distração não é proibida; ela é conquistada com esforço real. O sistema de Tickets já está ativo no seu aplicativo: acumule 3 blocos de foco para receber seu Ticket de 15 minutos com alarme sonoro.
                </p>
              </div>

              {/* Real Internal Accounting */}
              <div className="p-5 bg-zinc-950 rounded-xl border border-zinc-900 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400 font-mono-numeric uppercase">
                    Tempo Livre Acumulado por Execução:
                  </span>
                  <span className="text-2xl font-black font-mono-numeric text-emerald-400">
                    {totalFreeMinutesEarned} min
                  </span>
                </div>
                <div className="text-xs text-zinc-500 font-mono-numeric">
                  Baseado em {totalCompletedBlocks} blocos concluídos ({earnedBatches} ciclos de 3 blocos)
                </div>
              </div>

              {/* Architecture Technical Note */}
              <div className="bg-[#09090b] p-4 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-bold font-mono-numeric">
                  <ShieldAlert className="w-4 h-4" />
                  <span>INTEGRIDADE TÉCNICA (SEM FALSA SIMULAÇÃO)</span>
                </div>
                <p>
                  Por regras de segurança dos navegadores (Web/PWA), nenhuma página web pode assumir o controle do sistema operacional do seu celular para bloquear outros apps.
                </p>
                <p>
                  A lógica matemática interna está 100% pronta e calculando. Para a versão de produção instalada na loja (Android/iOS), o código está estruturado para se conectar com:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-zinc-300 font-mono-numeric text-[11px]">
                  <li>Android: AccessibilityService & UsageStatsManager API</li>
                  <li>iOS: Apple Screen Time & DeviceActivity Framework</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
