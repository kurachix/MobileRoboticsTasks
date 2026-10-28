import React, { useEffect, useRef } from 'react';
import { Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

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
      console.error('Falha ao inicializar Google Sign-In:', e);
    }
  }, [googleClientId, onGoogleSuccess]);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#09090b] overflow-hidden">
      {/* Glow de fundo roxo suave e minimalista */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-purple-600/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-[#121217] border border-[#262636] p-8 shadow-2xl shadow-purple-950/20 backdrop-blur-sm text-center">
        {/* Ícone e Marca */}
        <div className="mx-auto w-12 h-12 rounded-xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center mb-6 text-purple-400">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">
          Tasks
        </h1>
        <p className="text-sm text-zinc-400 mb-8 font-normal">
          Fluxo de trabalho minimalista. Sem distrações.
        </p>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs text-left">
            {error}
          </div>
        )}

        {/* Botão Oficial do Google */}
        <div className="flex flex-col items-center justify-center gap-4">
          {googleClientId ? (
            <div ref={googleBtnRef} className="min-h-[44px] flex items-center justify-center" />
          ) : (
            <div className="text-xs text-zinc-500 mb-2">
              (Configure GOOGLE_CLIENT_ID no .env para ativar o login oficial)
            </div>
          )}

          {/* Botão de Demonstração / Convidado para testes instantâneos */}
          <button
            onClick={onDemoLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#181822] hover:bg-[#20202e] border border-[#262636] hover:border-purple-500/50 text-zinc-200 hover:text-white text-sm font-medium transition-all group"
          >
            <span>{isLoading ? 'Autenticando...' : 'Entrar como Convidado (Demo)'}</span>
            <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-[#262636]/60 flex items-center justify-center gap-2 text-xs text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>Acesso seguro com Google SSO</span>
        </div>
      </div>
    </div>
  );
};

