import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, MoreVertical, X, Smartphone, ShieldCheck } from 'lucide-react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

const FIRST_VISIT_STORAGE_KEY = 'spskills_pwa_first_prompt_done_v1';
const INSTALLED_STORAGE_KEY = 'spskills_pwa_installed_v1';

export function isStrictMobileDevice(): boolean {
  const ua = window.navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isOtherMobile = /webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  return isIOS || isAndroid || isOtherMobile;
}

export function isRunningStandalone(): boolean {
  const isStandaloneDisplay =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://') ||
    window.location.search.includes('source=pwa');

  if (isStandaloneDisplay) {
    try {
      localStorage.setItem(INSTALLED_STORAGE_KEY, '1');
      localStorage.setItem(FIRST_VISIT_STORAGE_KEY, '1');
    } catch {}
    return true;
  }

  try {
    return localStorage.getItem(INSTALLED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export const PwaInstallPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => window.__deferredPwaPrompt || null
  );
  const [showManualHint, setShowManualHint] = useState(false);
  const [httpsTunnelUrl, setHttpsTunnelUrl] = useState<string | null>(null);

  useEffect(() => {
    const ua = window.navigator.userAgent || '';
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);

    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('other');
    }

    // Buscar URL HTTPS pública/túnel caso o servidor tenha uma ativa
    fetch('/api/health')
      .then(r => r.json())
      .then(data => {
        if (data?.httpsUrl) {
          setHttpsTunnelUrl(data.httpsUrl);
        }
      })
      .catch(() => {});

    const standalone = isRunningStandalone();
    const isMobile = isStrictMobileDevice();

    // Exibir AUTOMATICAMENTE apenas na PRIMEIRA VEZ em que o usuário abre no celular
    let alreadyShownBefore = false;
    try {
      alreadyShownBefore = localStorage.getItem(FIRST_VISIT_STORAGE_KEY) === '1';
    } catch {}

    if (isMobile && !standalone && !alreadyShownBefore) {
      try {
        localStorage.setItem(FIRST_VISIT_STORAGE_KEY, '1');
      } catch {}
      setIsVisible(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredPwaPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleCustomPromptAvailable = () => {
      if (window.__deferredPwaPrompt) {
        setDeferredPrompt(window.__deferredPwaPrompt);
      }
    };

    // Permite abrir manualmente pelos Ajustes (Perfil) quando o usuário quiser
    const handleOpenFromSettings = () => {
      setShowManualHint(false);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      try {
        localStorage.setItem(INSTALLED_STORAGE_KEY, '1');
        localStorage.setItem(FIRST_VISIT_STORAGE_KEY, '1');
      } catch {}
      window.__deferredPwaPrompt = null;
      setDeferredPrompt(null);
      setIsVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', handleCustomPromptAvailable);
    window.addEventListener('open-pwa-install', handleOpenFromSettings);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', handleCustomPromptAvailable);
      window.removeEventListener('open-pwa-install', handleOpenFromSettings);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(FIRST_VISIT_STORAGE_KEY, '1');
    } catch {}
    setIsVisible(false);
  };

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.__deferredPwaPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          try {
            localStorage.setItem(INSTALLED_STORAGE_KEY, '1');
            localStorage.setItem(FIRST_VISIT_STORAGE_KEY, '1');
          } catch {}
          window.__deferredPwaPrompt = null;
          setDeferredPrompt(null);
          setIsVisible(false);
        }
        return;
      } catch {}
    }

    // Se estiver em HTTP local sem contexto seguro e houver túnel HTTPS ativo, redirecionar para o endereço HTTPS onde o Android instala o WebAPK real
    if (!window.isSecureContext && httpsTunnelUrl) {
      window.location.href = httpsTunnelUrl;
      return;
    }

    setShowManualHint(true);
  };

  if (!isVisible) return null;

  const isInsecureHttp = !window.isSecureContext && window.location.hostname !== 'localhost';

  return (
    <div
      onClick={handleDismiss}
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-up"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#0d0d14]/98 backdrop-blur-2xl border-t sm:border border-purple-500/25 shadow-[0_-16px_60px_rgba(0,0,0,0.9)] p-6 overflow-hidden animate-modal-in"
      >
        {/* Top Glow Line */}
        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-purple-500/70 to-transparent" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon + WorldSkills Logo */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-[#13131d] border border-purple-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(109,40,217,0.3)] shrink-0 p-2.5">
            <img
              src="/img/worldskills-logo.png"
              alt="WorldSkills"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-purple-400">
                PWA Aplicativo
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight mt-0.5">
              SPSKILLS TASKS
            </h3>
          </div>
        </div>

        {/* Conteúdo específico para iOS (iPhone / iPad) */}
        {platform === 'ios' ? (
          <div className="space-y-3 mb-2">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#13131d] border border-white/[0.06]">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                <Share className="w-4 h-4" />
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed">
                1. No Safari, toque em <strong className="text-white">Compartilhar</strong> na barra inferior
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#13131d] border border-white/[0.06]">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                <PlusSquare className="w-4 h-4" />
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed">
                2. Selecione <strong className="text-white">Adicionar à Tela de Início</strong> para instalar o app completo
              </p>
            </div>

            <button
              onClick={handleDismiss}
              className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-purple-700 to-violet-800 hover:from-purple-600 hover:to-violet-700 text-white text-xs font-bold uppercase tracking-[0.14em] transition-all shadow-[0_6px_24px_rgba(109,40,217,0.45)] active:scale-95"
            >
              Entendi
            </button>
          </div>
        ) : (
          /* Conteúdo para Android / Outros */
          <div className="space-y-3">
            {isInsecureHttp && httpsTunnelUrl && !showManualHint && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30 text-[11px] text-purple-200">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Conexão segura HTTPS pronta para instalação nativa do aplicativo.</span>
              </div>
            )}

            {showManualHint && (
              <div className="space-y-2.5 mb-3">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#13131d] border border-white/[0.06]">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed">
                    1. Abra o menu <strong className="text-white">⋮</strong> do Chrome
                  </p>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#13131d] border border-white/[0.06]">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed">
                    2. Toque em <strong className="text-white">Instalar aplicativo</strong>
                  </p>
                </div>
              </div>
            )}

            {!showManualHint ? (
              <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-purple-700 to-violet-800 hover:from-purple-600 hover:to-violet-700 text-white text-xs font-bold uppercase tracking-[0.14em] transition-all shadow-[0_6px_24px_rgba(109,40,217,0.45)] active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Instalar SPSKILLS TASKS</span>
              </button>
            ) : (
              <button
                onClick={handleDismiss}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-700 to-violet-800 hover:from-purple-600 hover:to-violet-700 text-white text-xs font-bold uppercase tracking-[0.14em] transition-all shadow-[0_6px_24px_rgba(109,40,217,0.45)] active:scale-95"
              >
                Entendi
              </button>
            )}

            <button
              onClick={handleDismiss}
              className="w-full py-2.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Agora não
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
