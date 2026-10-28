import React, { useState } from 'react';
import { ArrowRight, Lock, Mail } from 'lucide-react';

interface LoginViewProps {
  onCredentialsLogin: (identifier: string, password: string) => void;
  isLoading: boolean;
  error: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onCredentialsLogin,
  isLoading,
  error,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    onCredentialsLogin(identifier.trim(), password);
  };

  return (
    <div className="relative min-h-dvh flex items-center justify-center p-4 bg-[#060609] overflow-hidden">
      {/* Perspective Grid */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />

      {/* Animated Ambient Dark Purple Orbs */}
      <div className="absolute top-1/4 left-1/3 w-[320px] sm:w-[440px] h-[320px] sm:h-[440px] bg-purple-900/20 blur-[120px] sm:blur-[140px] rounded-full pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 right-1/3 w-[280px] sm:w-[380px] h-[280px] sm:h-[380px] bg-violet-950/20 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none animate-float-reverse" />

      {/* Main Dark Glass Card */}
      <div className="relative z-10 w-full max-w-[360px] rounded-3xl bg-[#0d0d14]/90 backdrop-blur-2xl border border-purple-500/20 p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.75)] animate-modal-in">
        {/* Top Glowing Line */}
        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />

        {/* SENAI Logo */}
        <div className="flex items-center justify-center mb-7">
          <div className="h-10 sm:h-11 rounded-xl overflow-hidden shadow-[0_0_25px_rgba(88,28,135,0.35)] border border-white/10 flex items-center justify-center">
            <img
              src="/img/senai-logo.png"
              alt="SENAI"
              className="h-full w-auto object-contain"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs text-center animate-card-in">
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="relative">
            <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="E-mail"
              className="w-full pl-10 pr-4 py-3.5 sm:py-3 rounded-2xl bg-[#14141f] border border-white/[0.07] focus:border-purple-600 focus:outline-none text-sm sm:text-xs text-zinc-100 placeholder-zinc-500 transition-colors"
              required
            />
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Senha"
              className="w-full pl-10 pr-4 py-3.5 sm:py-3 rounded-2xl bg-[#14141f] border border-white/[0.07] focus:border-purple-600 focus:outline-none text-sm sm:text-xs text-zinc-100 placeholder-zinc-500 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-700 to-violet-800 hover:from-purple-600 hover:to-violet-700 active:scale-[0.99] text-white text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-[0_6px_24px_rgba(88,28,135,0.45)] sm:hover:-translate-y-0.5"
          >
            <span>{isLoading ? '...' : 'Entrar'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
