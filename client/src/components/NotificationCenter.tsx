import React, { useEffect, useState, useRef, useCallback } from 'react';
import { AppNotification, User } from '../types';
import { api } from '../api';
import {
  Bell,
  BellRing,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';

interface NotificationCenterProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
  onNotificationsEnabledChange: (enabled: boolean, updatedUser?: User) => void;
  onTaskActivity: () => void;
  onOpenTaskById: (taskId: string) => void;
}

function playNotificationTone() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.14); // A5
    osc2.frequency.setValueAtTime(293.66, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.36);
    osc2.stop(now + 0.36);
  } catch {}
}

async function triggerSystemNotification(notif: AppNotification) {
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate?.([120, 50, 120]);
    }
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const options: NotificationOptions = {
      body: notif.message,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: notif.id,
    };

    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(notif.title, options);
        return;
      }
    }

    new Notification(notif.title, options);
  } catch {}
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  user,
  isOpen,
  onClose,
  onUnreadCountChange,
  onNotificationsEnabledChange,
  onTaskActivity,
  onOpenTaskById,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    Boolean(user.notifications_enabled)
  );
  const [showPostLoginPrompt, setShowPostLoginPrompt] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);
  const [isUpdatingPref, setIsUpdatingPref] = useState<boolean>(false);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef<boolean>(false);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((notif: AppNotification) => {
    setActiveToast(notif);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => {
      setActiveToast(null);
    }, 6000);
  }, []);

  const handleIncomingNotification = useCallback(
    (notif: AppNotification) => {
      if (notif.recipient_user_id !== user.id) return;
      if (seenIdsRef.current.has(notif.id)) return;
      seenIdsRef.current.add(notif.id);

      setNotifications(prev => {
        if (prev.some(n => n.id === notif.id)) return prev;
        const next = [notif, ...prev].slice(0, 40);
        const unread = next.filter(n => n.is_read === 0).length;
        onUnreadCountChange(unread);
        return next;
      });

      playNotificationTone();
      triggerSystemNotification(notif);
      showToast(notif);
      onTaskActivity();
    },
    [user.id, onUnreadCountChange, onTaskActivity, showToast]
  );

  // Carregar estado inicial de notificações logo após o login
  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      const list = data.notifications || [];

      if (!initialLoadDoneRef.current) {
        list.forEach(n => seenIdsRef.current.add(n.id));
        initialLoadDoneRef.current = true;

        setNotificationsEnabled(data.notificationsEnabled);
        onNotificationsEnabledChange(data.notificationsEnabled);

        // Exibir pedido de aceitar notificações APÓS o login caso o usuário ainda não tenha ativado
        const sessionKey = `notif_prompt_seen_${user.id}`;
        const seenThisSession = sessionStorage.getItem(sessionKey);
        if (!data.notificationsEnabled && !data.notificationsPrompted && !seenThisSession) {
          setShowPostLoginPrompt(true);
        }
      } else {
        // Verificar se chegaram novas notificações via polling fallback
        for (const item of [...list].reverse()) {
          if (!seenIdsRef.current.has(item.id)) {
            handleIncomingNotification(item);
          }
        }
      }

      setNotifications(list);
      onUnreadCountChange(list.filter(n => n.is_read === 0).length);
    } catch {}
  }, [user.id, onUnreadCountChange, onNotificationsEnabledChange, handleIncomingNotification]);

  useEffect(() => {
    seenIdsRef.current.clear();
    initialLoadDoneRef.current = false;
    fetchNotifications();

    // Conexão SSE em tempo real direcionada ao usuário logado
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/notifications/stream', { withCredentials: true });
      es.addEventListener('notification', (event: MessageEvent) => {
        try {
          const notif: AppNotification = JSON.parse(event.data);
          handleIncomingNotification(notif);
        } catch {}
      });
    } catch {}

    // Fallback de polling a cada 5s para redes móveis onde SSE possa oscilar
    const pollInterval = window.setInterval(() => {
      fetchNotifications();
    }, 5000);

    return () => {
      if (es) es.close();
      window.clearInterval(pollInterval);
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [user.id, fetchNotifications, handleIncomingNotification]);

  // Sincronizar quando a preferência é alterada nos Ajustes (ProfileModal)
  useEffect(() => {
    setNotificationsEnabled(Boolean(user.notifications_enabled));
  }, [user.notifications_enabled]);

  // Aceitar / Ativar notificações
  const handleEnableNotifications = async () => {
    setIsUpdatingPref(true);
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        try {
          await Notification.requestPermission();
        } catch {}
      }
      const res = await api.updateNotificationPreferences(true);
      setNotificationsEnabled(true);
      onNotificationsEnabledChange(true, res.user);
      sessionStorage.setItem(`notif_prompt_seen_${user.id}`, '1');
      setShowPostLoginPrompt(false);
    } catch {
    } finally {
      setIsUpdatingPref(false);
    }
  };

  // Dispensar ou Desativar notificações
  const handleDisableOrDismissPrompt = async (disableServer = true) => {
    sessionStorage.setItem(`notif_prompt_seen_${user.id}`, '1');
    setShowPostLoginPrompt(false);
    if (disableServer) {
      setIsUpdatingPref(true);
      try {
        const res = await api.updateNotificationPreferences(false);
        setNotificationsEnabled(false);
        onNotificationsEnabledChange(false, res.user);
      } catch {
      } finally {
        setIsUpdatingPref(false);
      }
    }
  };

  const handleTogglePreference = async () => {
    if (notificationsEnabled) {
      await handleDisableOrDismissPrompt(true);
    } else {
      await handleEnableNotifications();
    }
  };

  const handleMarkRead = async (notif: AppNotification) => {
    if (notif.is_read === 0) {
      setNotifications(prev => {
        const next = prev.map(n => (n.id === notif.id ? { ...n, is_read: 1 } : n));
        onUnreadCountChange(next.filter(n => n.is_read === 0).length);
        return next;
      });
      api.markNotificationRead(notif.id).catch(() => {});
    }

    if (notif.task_id) {
      onClose();
      onOpenTaskById(notif.task_id);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    onUnreadCountChange(0);
    await api.markAllNotificationsRead().catch(() => {});
  };

  const handleClearAll = async () => {
    setNotifications([]);
    onUnreadCountChange(0);
    await api.clearNotifications().catch(() => {});
  };

  const formatTime = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* 1. Toast Flutuante em Tempo Real (100% direcionado ao usuário) */}
      {activeToast && (
        <div className="fixed top-16 sm:top-20 right-3 left-3 sm:left-auto sm:w-96 z-[90] animate-fade-up">
          <div
            onClick={() => {
              const toast = activeToast;
              setActiveToast(null);
              handleMarkRead(toast);
            }}
            className="cursor-pointer rounded-2xl bg-[#0e0e17]/95 backdrop-blur-2xl border border-purple-500/40 shadow-[0_16px_50px_rgba(88,28,135,0.45)] p-4 flex items-start gap-3.5 hover:border-purple-400 transition-all"
          >
            <div className="relative shrink-0">
              <img
                src={
                  activeToast.actor_avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${activeToast.actor_name}&backgroundColor=7c3aed`
                }
                alt={activeToast.actor_name}
                className="w-10 h-10 rounded-xl object-cover border border-purple-500/40 bg-[#151520]"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center text-white shadow">
                <BellRing className="w-2.5 h-2.5" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple-400">
                  Para {user.name}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Agora</span>
              </div>
              <p className="text-xs font-bold text-white truncate mt-0.5">{activeToast.title}</p>
              <p className="text-[11px] text-zinc-300 line-clamp-2 mt-0.5 leading-relaxed">
                {activeToast.message}
              </p>
            </div>

            <button
              onClick={e => {
                e.stopPropagation();
                setActiveToast(null);
              }}
              className="p-1 rounded-lg text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 2. Modal Pós-Login: Pedido para Aceitar Notificações Direcionadas */}
      {showPostLoginPrompt && (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-up">
          <div
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl bg-[#0d0d14]/98 backdrop-blur-2xl border-t sm:border border-purple-500/30 shadow-[0_24px_80px_rgba(0,0,0,0.9)] p-6 overflow-hidden animate-modal-in"
          >
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-purple-500/70 to-transparent" />

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/15 border border-purple-500/35 flex items-center justify-center text-purple-300 shadow-[0_0_24px_rgba(109,40,217,0.35)] shrink-0">
                <BellRing className="w-6 h-6 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-purple-400">
                    Alertas Pessoais
                  </span>
                </div>
                <h3 className="text-base font-bold text-white truncate mt-0.5">
                  Olá, {user.name}
                </h3>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed mb-5">
              Deseja ativar as notificações direcionadas a você? Você será avisado sempre que outro usuário adicionar ou modificar uma tarefa.
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                disabled={isUpdatingPref}
                onClick={handleEnableNotifications}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-purple-700 to-violet-800 hover:from-purple-600 hover:to-violet-700 text-white text-xs font-bold uppercase tracking-[0.14em] transition-all shadow-[0_6px_24px_rgba(109,40,217,0.45)] active:scale-95"
              >
                <Bell className="w-4 h-4" />
                <span>{isUpdatingPref ? 'Ativando...' : 'Ativar Notificações'}</span>
              </button>

              <button
                type="button"
                disabled={isUpdatingPref}
                onClick={() => handleDisableOrDismissPrompt(true)}
                className="w-full py-2.5 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Central de Notificações do Usuário (Aberta pelo ícone de Sino no Header) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0e0e16]/98 backdrop-blur-2xl border-t sm:border border-purple-500/25 shadow-[0_24px_80px_rgba(0,0,0,0.9)] overflow-hidden animate-modal-in max-h-[88dvh] flex flex-col"
          >
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rotate-45 rounded-[2px] bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.7)]" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-100 block">
                    Notificações • {user.name}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Barra de Status de Notificação Direcionada + Ações */}
            <div className="px-5 sm:px-6 py-3 bg-[#13131d] border-b border-white/[0.05] flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                disabled={isUpdatingPref}
                onClick={handleTogglePreference}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all active:scale-95 ${
                  notificationsEnabled
                    ? 'bg-purple-600/20 border-purple-500/40 text-purple-200'
                    : 'bg-zinc-900 border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {notificationsEnabled ? (
                  <>
                    <BellRing className="w-3.5 h-3.5 text-purple-400" />
                    <span>Ativadas para {user.name}</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Desativadas (Toque p/ ativar)</span>
                  </>
                )}
              </button>

              {notifications.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    title="Marcar todas como lidas"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-purple-300 hover:bg-white/[0.05] transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    title="Limpar notificações"
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/[0.05] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Lista de Notificações */}
            <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#151520] border border-white/[0.05] flex items-center justify-center mx-auto mb-3 text-zinc-600">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-zinc-400">
                    Nenhuma notificação para {user.name}
                  </p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkRead(notif)}
                    className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      notif.is_read === 0
                        ? 'bg-[#171528] border-purple-500/35 shadow-[0_4px_20px_rgba(88,28,135,0.2)]'
                        : 'bg-[#13131c] border-white/[0.05] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={
                        notif.actor_avatar ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${notif.actor_name}&backgroundColor=7c3aed`
                      }
                      alt={notif.actor_name}
                      className="w-9 h-9 rounded-xl object-cover border border-purple-500/30 shrink-0 mt-0.5"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {notif.title}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                          {formatTime(notif.created_at)}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed mt-1">
                        {notif.message}
                      </p>
                    </div>

                    {notif.is_read === 0 ? (
                      <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.9)] shrink-0 mt-1.5" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-1" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

