"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarRouter = void 0;
const express_1 = require("express");
const auth_js_1 = require("../auth.js");
const db_js_1 = require("../db.js");
const notifications_js_1 = require("../notifications.js");
exports.calendarRouter = (0, express_1.Router)();
exports.calendarRouter.use(auth_js_1.authMiddleware);
// Listar todas as datas marcadas no calendário
exports.calendarRouter.get('/', (req, res) => {
    const events = (0, db_js_1.listCalendarEvents)();
    res.json({ events });
});
// Marcar nova data no calendário
exports.calendarRouter.post('/', (req, res) => {
    const { title, description, event_date, event_time, color } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'O título da marcação é obrigatório.' });
    }
    if (!event_date || typeof event_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
        return res.status(400).json({ error: 'Data inválida. Use o formato AAAA-MM-DD.' });
    }
    const validColors = ['purple', 'violet', 'emerald', 'amber', 'rose'];
    const safeColor = validColors.includes(color) ? color : 'purple';
    const event = (0, db_js_1.createCalendarEvent)({
        title: title.trim(),
        description: description ? String(description).trim() : '',
        event_date,
        event_time: event_time ? String(event_time).trim() : null,
        color: safeColor,
        created_by: req.user.id,
    });
    (0, notifications_js_1.notifyUsersOfCalendarEvent)({
        actor: req.user,
        title: event.title,
        eventDate: event.event_date,
        eventTime: event.event_time,
        action: 'created',
    });
    res.status(201).json({ event });
});
// Remover data marcada do calendário
exports.calendarRouter.delete('/:id', (req, res) => {
    const existing = (0, db_js_1.getCalendarEventById)(req.params.id);
    const success = (0, db_js_1.deleteCalendarEvent)(req.params.id);
    if (!success) {
        return res.status(404).json({ error: 'Evento não encontrado.' });
    }
    if (existing) {
        (0, notifications_js_1.notifyUsersOfCalendarEvent)({
            actor: req.user,
            title: existing.title,
            eventDate: existing.event_date,
            eventTime: existing.event_time,
            action: 'deleted',
        });
    }
    res.json({ success: true });
});
