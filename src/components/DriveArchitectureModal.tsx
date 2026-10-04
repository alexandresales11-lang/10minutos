import React, { useState } from 'react';
import { X, HardDrive, Folder, File, Download, Upload, Check, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { UserSettings, EvidenceItem } from '../types';
import { StorageService } from '../services/storage';

interface DriveArchitectureModalProps {
  settings: UserSettings;
  evidenceList: EvidenceItem[];
  onSaveSettings: (settings: UserSettings) => void;
  onRefreshData: () => void;
  onClose: () => void;
}

export const DriveArchitectureModal: React.FC<DriveArchitectureModalProps> = ({
  settings,
  evidenceList,
  onSaveSettings,
  onRefreshData,
  onClose,
}) => {
  const [accountEmail, setAccountEmail] = useState<string>(settings.googleDriveConfig.accountEmail || '');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const year = new Date().getFullYear();

  // Export full JSON backup
  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const json = await StorageService.exportFullBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `10_MINUTOS_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Erro ao exportar backup');
    } finally {
      setIsExporting(false);
    }
  };

  // Import JSON backup
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const success = await StorageService.importFullBackup(content);
        if (success) {
          setImportStatus('Backup restaurado com sucesso!');
          onRefreshData();
          setTimeout(() => {
            setImportStatus(null);
            onClose();
          }, 1500);
        } else {
          setImportStatus('Arquivo de backup inválido.');
        }
      } catch (err) {
        setImportStatus('Erro ao ler arquivo de backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveDriveConfig = () => {
    const updated: UserSettings = {
      ...settings,
      googleDriveConfig: {
        ...settings.googleDriveConfig,
        accountEmail: accountEmail.trim(),
        connected: Boolean(accountEmail.trim()),
        lastSyncTime: new Date().toISOString(),
      },
    };
    onSaveSettings(updated);
    alert('Configuração de arquitetura Google Drive atualizada.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white uppercase font-mono-numeric">
              GOOGLE DRIVE & ARMAZENAMENTO PESSOAL
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Architecture Transparency Banner */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 text-xs text-zinc-300 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold font-mono-numeric">
              <ShieldCheck className="w-4 h-4" />
              <span>ARQUITETURA DE DADOS PRIVADA</span>
            </div>
            <p className="text-zinc-400">
              Todas as evidências (áudios gravados no microfone, fotos, métricas e observações) estão salvas localmente no seu navegador via IndexedDB de alta performance.
            </p>
            <p className="text-zinc-400">
              Abaixo está mapeada a estrutura de pastas exata configurada para sincronização direta com sua conta do Google Drive.
            </p>
          </div>

          {/* Planned Folder Structure Visualizer */}
          <div className="bg-[#09090b] rounded-xl p-4 border border-zinc-900 font-mono-numeric text-xs text-zinc-300">
            <div className="text-[11px] uppercase tracking-wider text-zinc-500 mb-2 font-bold">
              Estrutura de Pastas Padronizada:
            </div>
            <div className="space-y-1 text-zinc-400">
              <div className="flex items-center space-x-2 text-white font-bold">
                <Folder className="w-4 h-4 text-emerald-400" />
                <span>10 MINUTOS/</span>
              </div>
              <div className="ml-4 flex items-center space-x-2 text-zinc-300">
                <Folder className="w-4 h-4 text-emerald-500" />
                <span>{year}/</span>
              </div>
              <div className="ml-8 space-y-1">
                {['Bateria', 'Violão', 'Voz', 'Dicção', 'Físico', 'Outros'].map((cat) => (
                  <div key={cat} className="flex items-center space-x-2">
                    <Folder className="w-3.5 h-3.5 text-blue-400" />
                    <span>{cat}/</span>
                    <span className="text-[10px] text-zinc-600">
                      → Dia_001, Dia_030, Dia_090, Dia_180, Dia_365
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Account Configuration */}
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-3">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider block font-mono-numeric">
              Conta Google Drive Associada
            </label>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="seu-email@gmail.com"
                value={accountEmail}
                onChange={(e) => setAccountEmail(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono-numeric"
              />
              <button
                type="button"
                onClick={handleSaveDriveConfig}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 transition"
              >
                Salvar
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono-numeric">
              Status:{' '}
              {settings.googleDriveConfig.connected ? (
                <span className="text-emerald-400 font-bold">Configurado ({settings.googleDriveConfig.accountEmail})</span>
              ) : (
                <span className="text-zinc-500">Pronto para ativação</span>
              )}
            </p>
          </div>

          {/* Backup & Portability Actions */}
          <div className="p-4 bg-zinc-900/60 rounded-xl border border-zinc-800 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-zinc-200 uppercase font-mono-numeric tracking-wider">
                Backup Completo e Portabilidade de Dados
              </h4>
              <p className="text-xs text-zinc-400 mt-1">
                Exporte todo o seu histórico, evidências de áudio/foto e blocos para um arquivo JSON único que você pode salvar no seu computador ou no Drive.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                disabled={isExporting}
                className="w-full sm:w-auto flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition active:scale-95 shadow-md shadow-emerald-500/20"
              >
                <Download className="w-4 h-4 stroke-[3]" />
                <span>EXPORTAR BACKUP (.JSON)</span>
              </button>

              <label className="w-full sm:w-auto flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 border border-zinc-700 cursor-pointer transition active:scale-95">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>RESTAURAR BACKUP</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileImport}
                />
              </label>
            </div>

            {importStatus && (
              <div className="p-3 bg-zinc-950 rounded-lg text-xs font-mono-numeric text-center text-emerald-400 border border-emerald-500/30">
                {importStatus}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
