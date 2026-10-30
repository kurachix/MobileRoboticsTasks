import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../auth.js';
import {
  listCalendarEvents,
  createCalendarEvent,
  getCalendarEventById,
  deleteCalendarEvent,
} from '../db.js';
import { notifyUsersOfCalendarEvent } from '../notifications.js';

export const calendarRouter = Router();

calendarRouter.use(authMiddleware);

// Listar todas as datas marcadas no calendário
calendarRouter.get('/', (req, res) => {
  const events = listCalendarEvents();
  res.json({ events });
});

// Marcar nova data no calendário
calendarRouter.post('/', (req: AuthenticatedRequest, res) => {
  const { title, description, event_date, event_time, color } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'O título da marcação é obrigatório.' });
  }

  if (!event_date || typeof event_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
    return res.status(400).json({ error: 'Data inválida. Use o formato AAAA-MM-DD.' });
  }

  const validColors = ['purple', 'violet', 'emerald', 'amber', 'rose'];
  const safeColor = validColors.includes(color) ? color : 'purple';

  const event = createCalendarEvent({
    title: title.trim(),
    description: description ? String(description).trim() : '',
    event_date,
    event_time: event_time ? String(event_time).trim() : null,
    color: safeColor,
    created_by: req.user!.id,
  });

  notifyUsersOfCalendarEvent({
    actor: req.user!,
    title: event.title,
    eventDate: event.event_date,
    eventTime: event.event_time,
    action: 'created',
  });

  res.status(201).json({ event });
});

// Remover data marcada do calendário
calendarRouter.delete('/:id', (req: AuthenticatedRequest, res) => {
  const existing = getCalendarEventById(req.params.id);
  const success = deleteCalendarEvent(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Evento não encontrado.' });
  }

  if (existing) {
    notifyUsersOfCalendarEvent({
      actor: req.user!,
      title: existing.title,
      eventDate: existing.event_date,
      eventTime: existing.event_time,
      action: 'deleted',
    });
  }

  res.json({ success: true });
});

