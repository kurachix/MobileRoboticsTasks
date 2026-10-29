"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRouter = void 0;
const express_1 = require("express");
const auth_js_1 = require("../auth.js");
const db_js_1 = require("../db.js");
const notifications_js_1 = require("../notifications.js");
exports.notificationRouter = (0, express_1.Router)();
exports.notificationRouter.use(auth_js_1.authMiddleware);
// Listar notificações direcionadas ao usuário autenticado
exports.notificationRouter.get('/', (req, res) => {
    const userId = req.user.id;
    const freshUser = (0, db_js_1.findUserById)(userId) || req.user;
    const notifications = (0, db_js_1.listUserNotifications)(userId, 40);
    const unreadCount = notifications.filter(n => n.is_read === 0).length;
    res.json({
        notifications,
        unreadCount,
        notificationsEnabled: Boolean(freshUser.notifications_enabled),
        notificationsPrompted: Boolean(freshUser.notifications_prompted),
    });
});
// Stream em tempo real (SSE) direcionado exclusivamente ao usuário logado
exports.notificationRouter.get('/stream', (req, res) => {
    const userId = req.user.id;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write(`event: connected\ndata: ${JSON.stringify({ userId })}\n\n`);
    (0, notifications_js_1.registerSseClient)(userId, res);
    const heartbeat = setInterval(() => {
        try {
            res.write(': ping\n\n');
        }
        catch {
            clearInterval(heartbeat);
        }
    }, 25000);
    req.on('close', () => {
        clearInterval(heartbeat);
        (0, notifications_js_1.removeSseClient)(userId, res);
    });
});
// Atualizar preferência de notificações do usuário (ativar / desativar)
exports.notificationRouter.put('/preferences', (req, res) => {
    const userId = req.user.id;
    const { enabled } = req.body;
    const updatedUser = (0, db_js_1.setUserNotificationPreference)(userId, Boolean(enabled));
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
exports.notificationRouter.put('/read-all', (req, res) => {
    (0, db_js_1.markAllNotificationsRead)(req.user.id);
    res.json({ success: true });
});
// Marcar uma notificação como lida
exports.notificationRouter.put('/:id/read', (req, res) => {
    (0, db_js_1.markNotificationRead)(req.params.id, req.user.id);
    res.json({ success: true });
});
// Limpar histórico de notificações do usuário
exports.notificationRouter.delete('/', (req, res) => {
    (0, db_js_1.clearUserNotifications)(req.user.id);
    res.json({ success: true });
});
