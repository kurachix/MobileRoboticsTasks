import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Lock, Mail } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

interface LoginViewProps {
  googleClientId: string | null;
  onCredentialsLogin: (identifier: string, password: string) => void;
  onGoogleSuccess: (credential: string) => void;
  onDemoLogin: () => void;
  isLoading: boolean;
  error: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({
  googleClientId,
  onCredentialsLogin,
  onGoogleSuccess,
  onDemoLogin,
  isLoading,
  error,
}) => {
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!googleClientId || !window.google?.accounts?.id || !googleBtnRef.current) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: any) => {
          if (response.credential) {
            onGoogleSuccess(response.credential);
          }
        },
      });

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'signin_with',
        locale: 'pt-BR',
        width: 300,
      });
    } catch (e) {
      console.error(e);
    }
  }, [googleClientId, onGoogleSuccess]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    onCredentialsLogin(identifier.trim(), password);
  };

  return (
      <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#050508] overflow-hidden">
        {/* Perspective Grid */}
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />

        {/* Animated Ambient Purple Orbs */}
        <div className="absolute top-1/4 left-1/3 w-[480px] h-[480px] bg-purple-600/20 blur-[150px] rounded-full pointer-events-none animate-float-slow" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-violet-700/15 blur-[130px] rounded-full pointer-events-none animate-float-reverse" />

          {/* Outer Gradient Ring Wrapper */}
          <div className="relative z-10 w-full max-w-[390px] p-[1px] rounded-[30px] bg-gradient-to-b from-purple-500/45 via-purple-500/15 to-white/[0.04] shadow-[0_28px_90px_rgba(88,28,135,0.4)] animate-modal-in">
            {/* Inner Glass Card */}
            <div className="relative rounded-[29px] bg-[#0b0b12]/92 backdrop-blur-2xl p-8 sm:p-9 overflow-hidden">
              {/* Top Glowing Highlight */}
              <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-purple-400/90 to-transparent" />
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-48 h-28 bg-purple-500/20 blur-2xl rounded-full pointer-events-none" />

                  {/* Stylized SENAI Logo */}
                  <div className="relative flex flex-col items-center justify-center mb-9">
                    <div className="relative group">
                      <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-purple-600/35 via-fuchsia-500/25 to-purple-600/35 blur-xl animate-pulse-glow pointer-events-none" />
                      <div className="relative p-1.5 rounded-2xl bg-gradient-to-b from-white/[0.14] to-white/[0.03] border border-purple-400/30 shadow-[0_10px_35px_rgba(0,0,0,0.65)] transition-transform duration-300 group-hover:scale-[1.03]">
                        <img
                          src="/img/senai-logo.png"
                          alt="SENAI"
                          className="h-11 sm:h-12 w-auto rounded-xl object-contain block"
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs text-center animate-card-in">
                      {error}
                    </div>
                  )}

                {/* Credentials Form */}
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="relative group">
                    <Mail className="w-4 h-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="E-mail"
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#12121c] border border-white/[0.08] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none text-xs text-zinc-100 placeholder-zinc-500 transition-all"
                      required
                    />
                  </div>

                  <div className="relative group">
                    <Lock className="w-4 h-4 text-zinc-500 group-focus-within:text-purple-400 transition-colors absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Senha"
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#12121c] border border-white/[0.08] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none text-xs text-zinc-100 placeholder-zinc-500 transition-all"
                      required
                    />
                  </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 hover:from-purple-500 hover:via-violet-500 hover:to-purple-500 text-white text-xs font-semibold uppercase tracking-widest transition-all duration-300 shadow-[0_8px_28px_rgba(139,92,246,0.45)] hover:shadow-[0_12px_36px_rgba(139,92,246,0.65)] hover:-translate-y-0.5 active:translate-y-0"
                    >
                      <span>{isLoading ? '...' : 'Entrar'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>

                    {/* Divider */}
                    <div className="relative my-6 flex items-center justify-center">
                      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/[0.09] to-transparent" />
                      <span className="px-3 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                        ou
                      </span>
                      <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/[0.09] to-transparent" />
                    </div>

                {/* Google Login */}
                <div className="flex flex-col items-center gap-2.5">
                  {googleClientId && (
                    <div ref={googleBtnRef} className="min-h-[42px] flex items-center justify-center" />
                  )}

                    <button
                      type="button"
                      onClick={onDemoLogin}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl bg-[#12121c] hover:bg-[#191927] border border-white/[0.08] hover:border-purple-500/40 text-zinc-200 hover:text-white text-xs font-medium transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                        <svg className="w-3 h-3" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                          />
                        </svg>
                      </div>
                      <span>Google</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            );
};
