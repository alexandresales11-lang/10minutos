import React, { useState } from 'react';
import { X, Cloud, CloudCheck, Check, LogIn, LogOut, Copy, Shield, Smartphone, Monitor } from 'lucide-react';
import { User } from 'firebase/auth';
import { FirebaseService } from '../services/firebase';
import firebaseConfigData from '../../firebase-applet-config.json';

interface AuthSyncModalProps {
  currentUser: User | null;
  onClose: () => void;
}

export const AuthSyncModal: React.FC<AuthSyncModalProps> = ({ currentUser, onClose }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await FirebaseService.loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao realizar login com Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await FirebaseService.logout();
      onClose();
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const vercelEnvText = `VITE_FIREBASE_API_KEY=${firebaseConfigData.apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${firebaseConfigData.authDomain}
VITE_FIREBASE_PROJECT_ID=${firebaseConfigData.projectId}
VITE_FIREBASE_APP_ID=${firebaseConfigData.appId}
VITE_FIREBASE_DATABASE_ID=${firebaseConfigData.firestoreDatabaseId || '(default)'}
VITE_FIREBASE_STORAGE_BUCKET=${firebaseConfigData.storageBucket}
VITE_FIREBASE_MESSAGING_SENDER_ID=${firebaseConfigData.messagingSenderId}`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(vercelEnvText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <Cloud className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white uppercase font-mono-numeric">
              SINCRONIZAÇÃO EM NUVEM (CELULAR & PC)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Status Banner */}
          {currentUser ? (
            <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || ''}
                    className="w-10 h-10 rounded-full border border-emerald-500/50"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center border border-emerald-500/40">
                    {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <div className="text-xs font-mono-numeric text-emerald-400 font-bold uppercase flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>SINCRONIZAÇÃO EM NUVEM ATIVA</span>
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {currentUser.displayName || currentUser.email}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono-numeric">
                    {currentUser.email}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-mono-numeric rounded-lg transition"
              >
                Desconectar
              </button>
            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 text-center space-y-4">
              <div className="flex items-center justify-center space-x-3 text-zinc-400 text-xs font-mono-numeric">
                <span className="flex items-center space-x-1">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Celular</span>
                </span>
                <span className="text-emerald-500 font-bold">⇄</span>
                <span className="flex items-center space-x-1">
                  <Cloud className="w-4 h-4 text-blue-400" />
                  <span>Firebase Nuvem</span>
                </span>
                <span className="text-emerald-500 font-bold">⇄</span>
                <span className="flex items-center space-x-1">
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <span>Computador</span>
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">
                  Conecte sua Conta para Sincronizar em Tempo Real
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Ao fazer login, qualquer bloco que você executar no celular será espelhado instantaneamente no computador e vice-versa.
                </p>
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 transition active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'CONECTANDO...' : 'ENTRAR COM CONTA GOOGLE'}</span>
              </button>

              {errorMsg && (
                <p className="text-xs text-red-400 font-mono-numeric">{errorMsg}</p>
              )}
            </div>
          )}

          {/* Vercel Deployment Instructions */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-mono-numeric text-zinc-300 font-bold uppercase">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Variáveis para Vercel & Domínio Próprio</span>
              </div>

              <button
                onClick={handleCopyEnv}
                className="flex items-center space-x-1 text-xs text-emerald-400 hover:text-emerald-300 font-mono-numeric font-bold transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Variáveis'}</span>
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Quando você fizer o deploy na Vercel a partir do seu GitHub, copie e cole estas variáveis no painel da Vercel (aba <em>Settings &gt; Environment Variables</em>):
            </p>

            <pre className="bg-[#09090b] p-3 rounded-lg border border-zinc-850 text-[11px] font-mono-numeric text-zinc-300 overflow-x-auto select-all">
              {vercelEnvText}
            </pre>
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
