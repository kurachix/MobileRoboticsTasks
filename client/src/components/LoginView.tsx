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
        shape: 'rectangular',
        text: 'signin_with',
        locale: 'pt-BR',
        width: 260,
      });
    } catch (e) {
      console.error(e);
    }
  }, [googleClientId, onGoogleSuccess]);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#09090b] overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 w-full max-w-[320px] bg-[#111116] border border-[#232330] p-7 shadow-2xl">
            {/* Top Accent Line WorldSkills */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-700 via-purple-500 to-purple-900" />

            {/* WorldSkills Geometric Emblem & Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-11 h-11 mb-4 flex items-center justify-center bg-purple-500/10 border border-purple-500/30 rotate-45">
                <div className="w-4 h-4 bg-purple-500 -rotate-45" />
              </div>

              <h1 className="text-base font-bold tracking-[0.2em] uppercase text-white">
                WORLDSKILLS
              </h1>
              <span className="mt-1 text-[10px] font-mono tracking-[0.18em] uppercase text-purple-400">
                MOBILE ROBOTICS // TASKS
              </span>
            </div>

            {error && (
                <div className="mb-4 p-2.5 bg-red-950/40 border border-red-800/50 text-red-300 text-[11px] font-mono">
                  {error}
                </div>
        )}

        <div className="flex flex-col items-center gap-3">
          {googleClientId && (
            <div ref={googleBtnRef} className="min-h-[40px] flex items-center justify-center" />
          )}

          <button
            onClick={onDemoLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-[#16161d] hover:bg-purple-600 border border-[#232330] hover:border-purple-500 text-zinc-200 hover:text-white text-xs font-mono uppercase tracking-wider transition-all group"
          >
            <span>{isLoading ? '...' : 'Entrar com Google'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>
      </div>
              </div>
            );
};
