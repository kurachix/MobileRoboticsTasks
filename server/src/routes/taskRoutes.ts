import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../auth.js';
import {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  deleteComment,
  addDelivery,
  deleteDelivery,
} from '../db.js';

export const taskRouter = Router();

// Todas as rotas exigem autenticação
taskRouter.use(authMiddleware);

// Listar todas as tarefas (com agregados)
taskRouter.get('/', (req, res) => {
  const tasks = listTasks();
  res.json({ tasks });
});

// Obter detalhes de uma tarefa (inclui comentários e entregas)
taskRouter.get('/:id', (req, res) => {
  const data = getTaskById(req.params.id);
  if (!data) {
    return res.status(404).json({ error: 'Tarefa não encontrada' });
  }
  res.json(data);
});

// Criar nova tarefa
taskRouter.post('/', (req: AuthenticatedRequest, res) => {
  const { title, description, status, due_date, assigned_to } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'O título da tarefa é obrigatório' });
  }

  const validStatus = ['todo', 'doing', 'done'].includes(status) ? status : 'todo';

  const task = createTask({
    title: title.trim(),
    description: description ? description.trim() : '',
    status: validStatus,
    due_date: due_date || null,
    assigned_to: assigned_to || null,
    created_by: req.user!.id,
  });

  res.status(201).json({ task });
});

// Atualizar tarefa
taskRouter.put('/:id', (req, res) => {
  const { title, description, status, due_date, assigned_to } = req.body;

  if (status && !['todo', 'doing', 'done'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido. Use todo, doing ou done' });
  }

  const updated = updateTask(req.params.id, {
    title: title !== undefined ? title.trim() : undefined,
    description: description !== undefined ? description.trim() : undefined,
    status,
    due_date,
    assigned_to,
  });

  if (!updated) {
    return res.status(404).json({ error: 'Tarefa não encontrada' });
  }

  res.json({ task: updated });
});

// Excluir tarefa
taskRouter.delete('/:id', (req, res) => {
  const success = deleteTask(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Tarefa não encontrada' });
  }
  res.json({ success: true, message: 'Tarefa excluída' });
});

// Adicionar comentário a uma tarefa
taskRouter.post('/:id/comments', (req: AuthenticatedRequest, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Conteúdo do comentário é obrigatório' });
  }

  const comment = addComment({
    task_id: req.params.id,
    user_id: req.user!.id,
    content: content.trim(),
  });

  res.status(201).json({ comment });
});

// Excluir comentário
taskRouter.delete('/comments/:id', (req, res) => {
  const success = deleteComment(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Comentário não encontrado' });
  }
  res.json({ success: true, message: 'Comentário removido' });
});

// Adicionar entrega (comprovante/link) a uma tarefa
taskRouter.post('/:id/deliveries', (req: AuthenticatedRequest, res) => {
  const { content, attachment_url } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Descrição do entregável é obrigatória' });
  }

  const delivery = addDelivery({
    task_id: req.params.id,
    user_id: req.user!.id,
    content: content.trim(),
    attachment_url: attachment_url ? attachment_url.trim() : null,
  });

  res.status(201).json({ delivery });
});

// Excluir entrega
taskRouter.delete('/deliveries/:id', (req, res) => {
  const success = deleteDelivery(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Entrega não encontrada' });
  }
  res.json({ success: true, message: 'Entrega removida' });
});

