import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, MoreVertical, X, Smartphone } from 'lucide-react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

export function isStrictMobileDevice(): boolean {
  const ua = window.navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isOtherMobile = /webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  return isIOS || isAndroid || isOtherMobile;
}

export const PwaInstallPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => window.__deferredPwaPrompt || null
  );
  const [showManualHint, setShowManualHint] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    const ua = window.navigator.userAgent || '';
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    const isMobile = isStrictMobileDevice();

    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('other');
    }

    // SOMENTE abre automaticamente se for dispositivo MOBILE real e não estiver instalado
    const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (isMobile && !isStandalone && !dismissed) {
        setIsVisible(true);
      }

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        const promptEvent = e as BeforeInstallPromptEvent;
        window.__deferredPwaPrompt = promptEvent;
        setDeferredPrompt(promptEvent);
          // Nunca exibe automaticamente no computador; apenas em dispositivos mobile
          if (isStrictMobileDevice() && !isStandalone && !sessionStorage.getItem('pwa_prompt_dismissed')) {
            setIsVisible(true);
          }
        };

        const handleCustomPromptAvailable = () => {
          if (window.__deferredPwaPrompt) {
            setDeferredPrompt(window.__deferredPwaPrompt);
              if (isStrictMobileDevice() && !isStandalone && !sessionStorage.getItem('pwa_prompt_dismissed')) {
                setIsVisible(true);
              }
            }
          };

          // Permite abrir manualmente pelos Ajustes (Perfil) tanto no celular quanto no computador
          const handleOpenFromSettings = () => {
            setShowManualHint(false);
            setIsVisible(true);
          };

          const handleAppInstalled = () => {
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
    sessionStorage.setItem('pwa_prompt_dismissed', '1');
    setIsVisible(false);
  };

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.__deferredPwaPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === 'accepted') {
          window.__deferredPwaPrompt = null;
          setDeferredPrompt(null);
          setIsVisible(false);
        }
      } catch (err) {
        setShowManualHint(true);
      }
    } else {
      setShowManualHint(true);
    }
  };

  if (!isVisible) return null;

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
                    1. Toque em <strong className="text-white">Compartilhar</strong> na barra do navegador
                  </p>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#13131d] border border-white/[0.06]">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed">
                    2. Selecione <strong className="text-white">Adicionar à Tela de Início</strong>
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
                  { showManualHint && (
                    <div className="space-y-2.5 mb-3">
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#13131d] border border-white/[0.06]">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                          <MoreVertical className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-zinc-200 leading-relaxed">
                          1. Abra o menu <strong className="text-white">⋮</strong> do navegador
                        </p>
                      </div>

                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#13131d] border border-white/[0.06]">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                          <Download className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-zinc-200 leading-relaxed">
                          2. Clique em <strong className="text-white">Instalar SPSKILLS TASKS</strong> ou <strong className="text-white">Adicionar à tela inicial</strong>
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
