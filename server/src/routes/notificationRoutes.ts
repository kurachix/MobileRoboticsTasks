import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../auth.js';
import {
  listUserNotifications,
  setUserNotificationPreference,
  markNotificationRead,
  markAllNotificationsRead,
  clearUserNotifications,
  findUserById,
} from '../db.js';
import { registerSseClient, removeSseClient } from '../notifications.js';

export const notificationRouter = Router();

notificationRouter.use(authMiddleware);

// Listar notificações direcionadas ao usuário autenticado
notificationRouter.get('/', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const freshUser = findUserById(userId) || req.user!;
  const notifications = listUserNotifications(userId, 40);
  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  res.json({
    notifications,
    unreadCount,
    notificationsEnabled: Boolean(freshUser.notifications_enabled),
    notificationsPrompted: Boolean(freshUser.notifications_prompted),
  });
});

// Stream em tempo real (SSE) direcionado exclusivamente ao usuário logado
notificationRouter.get('/stream', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);

  registerSseClient(userId, res);

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeSseClient(userId, res);
  });
});

// Atualizar preferência de notificações do usuário (ativar / desativar)
notificationRouter.put('/preferences', (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { enabled } = req.body;

  const updatedUser = setUserNotificationPreference(userId, Boolean(enabled));
  if (!updatedUser) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  return res.json({
    user: updatedUser,
    notificationsEnabled: Boolean(updatedUser.notifications_enabled),
    notificationsPrompted: Boolean(updatedUser.notifications_prompted),
  });
});

// Marcar todas como lidas
notificationRouter.put('/read-all', (req: AuthenticatedRequest, res) => {
  markAllNotificationsRead(req.user!.id);
  res.json({ success: true });
});

// Marcar uma notificação como lida
notificationRouter.put('/:id/read', (req: AuthenticatedRequest, res) => {
  markNotificationRead(req.params.id, req.user!.id);
  res.json({ success: true });
});

// Limpar histórico de notificações do usuário
notificationRouter.delete('/', (req: AuthenticatedRequest, res) => {
  clearUserNotifications(req.user!.id);
  res.json({ success: true });
});

