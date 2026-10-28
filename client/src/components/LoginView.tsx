import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

interface LoginViewProps {
  googleClientId: string | null;
  onGoogleSuccess: (credential: string) => void;
  onDemoLogin: () => void;
  isLoading: boolean;
  error: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({
  googleClientId,
  onGoogleSuccess,
  onDemoLogin,
  isLoading,
  error,
}) => {
  const googleBtnRef = useRef<HTMLDivElement>(null);

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
        width: 280,
      });
    } catch (e) {
      console.error(e);
    }
  }, [googleClientId, onGoogleSuccess]);

  return (
      <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#060609] overflow-hidden">
        {/* Perspective Grid */}
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none" />

          {/* Animated Ambient Purple Orbs */}
          <div className="absolute top-1/4 left-1/3 w-[420px] h-[420px] bg-purple-600/20 blur-[130px] rounded-full pointer-events-none animate-float-slow" />
          <div className="absolute bottom-1/4 right-1/3 w-[360px] h-[360px] bg-violet-700/15 blur-[110px] rounded-full pointer-events-none animate-float-reverse" />

              {/* Main Glass Card */}
              <div className="relative z-10 w-full max-w-[380px] rounded-3xl bg-[#0d0d14]/85 backdrop-blur-2xl border border-purple-500/20 p-9 shadow-[0_24px_80px_rgba(88,28,135,0.28)] animate-modal-in">
                {/* Top Glowing Line */}
                <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-purple-400/70 to-transparent" />

                {/* Animated WorldSkills Prism Emblem */}
                <div className="flex flex-col items-center text-center mb-9">
                  <div className="relative w-20 h-20 flex items-center justify-center mb-6 group">
                    {/* Outer Ambient Glow */}
                    <div className="absolute inset-0 rounded-full bg-purple-600/25 blur-xl group-hover:bg-purple-500/40 transition-all duration-500" />

                    {/* Rotating Outer Geometric Frame */}
                    <div className="absolute w-16 h-16 rounded-2xl border border-purple-500/30 rotate-45 animate-spin-slow" />
                    <div className="absolute w-16 h-16 rounded-2xl border border-violet-400/20 -rotate-12 transition-transform duration-700 group-hover:rotate-45" />

                    {/* Core Diamond */}
                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-900 p-[1px] rotate-45 shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-transform duration-500 group-hover:scale-110">
                      <div className="w-full h-full rounded-[11px] bg-[#0b0b12] flex items-center justify-center">
                        <div className="w-4 h-4 rounded-sm bg-gradient-to-tr from-purple-400 to-fuchsia-300 shadow-[0_0_12px_rgba(192,132,252,0.8)]" />
                      </div>
                    </div>
                  </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
            <span className="text-[10px] font-mono font-medium tracking-[0.2em] uppercase text-purple-300">
              SKILL 23 • MOBILE ROBOTICS
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-b from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            WorldSkills
          </h1>
        </div>

                {error && (
                  <div className="mb-5 p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs text-center">
                    {error}
                  </div>
                )}

                {/* Google Login Actions */}
                <div className="flex flex-col items-center gap-3">
                  {googleClientId && (
            <div ref={googleBtnRef} className="min-h-[44px] flex items-center justify-center" />
                  )}

                  <button
                    onClick={onDemoLogin}
                    disabled={isLoading}
                    className="relative w-full overflow-hidden flex items-center justify-between px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#161622] via-[#1c1c2e] to-[#161622] hover:from-purple-600 hover:via-purple-500 hover:to-violet-600 border border-purple-500/30 hover:border-purple-400 text-zinc-100 hover:text-white text-sm font-medium transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(139,92,246,0.45)] hover:-translate-y-0.5 active:translate-y-0 group"
                  >
                    <div className="flex items-center gap-3">
                      {/* Official Google "G" Icon */}
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                      <span>{isLoading ? 'Autenticando...' : 'Continuar com Google'}</span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                  </button>
                </div>
              </div>
          </div>
          );
};
