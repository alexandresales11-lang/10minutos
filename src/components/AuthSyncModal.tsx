import React, { useState } from 'react';
import { X, Cloud, Check, LogIn, Copy, Shield, Smartphone, Monitor, Mail, KeyRound, AlertCircle } from 'lucide-react';
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

  // Email form state
  const [showEmailForm, setShowEmailForm] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await FirebaseService.loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg(
          'Este domínio Vercel ainda não está na lista de domínios autorizados do Google. Use a opção "Entrar com E-mail e Senha" logo abaixo (ela funciona imediatamente em qualquer domínio!).'
        );
        setShowEmailForm(true);
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMsg('O navegador bloqueou o pop-up do Google. Permita pop-ups ou use o login por e-mail abaixo.');
        setShowEmailForm(true);
      } else {
        setErrorMsg(err.message || 'Erro ao realizar login.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Preencha seu e-mail e uma senha.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await FirebaseService.loginWithEmail(email, password);
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        setErrorMsg('Senha incorreta para este e-mail.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg('Formato de e-mail inválido.');
      } else {
        setErrorMsg(err.message || 'Erro ao autenticar com e-mail.');
      }
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
              CONECTAR CONTA & SINCRONIZAÇÃO
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
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center border border-emerald-500/40 font-mono-numeric">
                    {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <div className="text-xs font-mono-numeric text-emerald-400 font-bold uppercase flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>SINCRONIZAÇÃO EM TEMPO REAL ATIVA</span>
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
                Sair
              </button>
            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-center space-x-3 text-zinc-400 text-xs font-mono-numeric">
                <span className="flex items-center space-x-1">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Celular</span>
                </span>
                <span className="text-emerald-500 font-bold">⇄</span>
                <span className="flex items-center space-x-1">
                  <Cloud className="w-4 h-4 text-blue-400" />
                  <span>Nuvem</span>
                </span>
                <span className="text-emerald-500 font-bold">⇄</span>
                <span className="flex items-center space-x-1">
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <span>Computador</span>
                </span>
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-white">
                  Conecte sua Conta para Sincronizar Tudo
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Qualquer bloco executado no celular aparece no computador no mesmo segundo. Cada pessoa tem sua conta 100% isolada e privada.
                </p>
              </div>

              {/* Login Method 1: Google 1-Click */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 transition active:scale-95 shadow-lg shadow-emerald-500/20"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'CONECTANDO...' : 'ENTRAR COM CONTA GOOGLE (1 CLIQUE)'}</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t border-zinc-800 w-full" />
                <span className="bg-zinc-900 px-3 text-[11px] text-zinc-500 font-mono-numeric uppercase">
                  OU COM E-MAIL E SENHA
                </span>
              </div>

              {/* Login Method 2: Email & Password */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      placeholder="Seu e-mail (ex: seu_email@gmail.com)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 font-mono-numeric"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      placeholder="Sua senha (mínimo 6 caracteres)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 font-mono-numeric"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition active:scale-95"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>ENTRAR OU CRIAR COM E-MAIL</span>
                </button>
              </form>

              {errorMsg && (
                <div className="p-3 bg-red-950/30 border border-red-500/40 rounded-xl flex items-start space-x-2 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Vercel Deployment Instructions */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-mono-numeric text-zinc-300 font-bold uppercase">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Variáveis para Vercel</span>
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
              O arquivo de credenciais já acompanha o projeto. Se a Vercel solicitar as variáveis em <em>Settings &gt; Environment Variables</em>, você pode colá-las aqui:
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
