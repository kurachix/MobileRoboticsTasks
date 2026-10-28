"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskRouter = void 0;
const express_1 = require("express");
const auth_js_1 = require("../auth.js");
const db_js_1 = require("../db.js");
exports.taskRouter = (0, express_1.Router)();
// Todas as rotas exigem autenticação
exports.taskRouter.use(auth_js_1.authMiddleware);
// Listar todas as tarefas (com agregados)
exports.taskRouter.get('/', (req, res) => {
    const tasks = (0, db_js_1.listTasks)();
    res.json({ tasks });
});
// Obter detalhes de uma tarefa (inclui comentários e entregas)
exports.taskRouter.get('/:id', (req, res) => {
    const data = (0, db_js_1.getTaskById)(req.params.id);
    if (!data) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    res.json(data);
});
// Criar nova tarefa
exports.taskRouter.post('/', (req, res) => {
    const { title, description, status, due_date, assigned_to } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'O título da tarefa é obrigatório' });
    }
    const validStatus = ['todo', 'doing', 'done'].includes(status) ? status : 'todo';
    const task = (0, db_js_1.createTask)({
        title: title.trim(),
        description: description ? description.trim() : '',
        status: validStatus,
        due_date: due_date || null,
        assigned_to: assigned_to || null,
        created_by: req.user.id,
    });
    res.status(201).json({ task });
});
// Atualizar tarefa
exports.taskRouter.put('/:id', (req, res) => {
    const { title, description, status, due_date, assigned_to } = req.body;
    if (status && !['todo', 'doing', 'done'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido. Use todo, doing ou done' });
    }
    const updated = (0, db_js_1.updateTask)(req.params.id, {
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
exports.taskRouter.delete('/:id', (req, res) => {
    const success = (0, db_js_1.deleteTask)(req.params.id);
    if (!success) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    res.json({ success: true, message: 'Tarefa excluída' });
});
// Adicionar comentário a uma tarefa
exports.taskRouter.post('/:id/comments', (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Conteúdo do comentário é obrigatório' });
    }
    const comment = (0, db_js_1.addComment)({
        task_id: req.params.id,
        user_id: req.user.id,
        content: content.trim(),
    });
    res.status(201).json({ comment });
});
// Excluir comentário
exports.taskRouter.delete('/comments/:id', (req, res) => {
    const success = (0, db_js_1.deleteComment)(req.params.id);
    if (!success) {
        return res.status(404).json({ error: 'Comentário não encontrado' });
    }
    res.json({ success: true, message: 'Comentário removido' });
});
// Adicionar entrega (comprovante/link) a uma tarefa
exports.taskRouter.post('/:id/deliveries', (req, res) => {
    const { content, attachment_url } = req.body;
    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Descrição do entregável é obrigatória' });
    }
    const delivery = (0, db_js_1.addDelivery)({
        task_id: req.params.id,
        user_id: req.user.id,
        content: content.trim(),
        attachment_url: attachment_url ? attachment_url.trim() : null,
    });
    res.status(201).json({ delivery });
});
// Excluir entrega
exports.taskRouter.delete('/deliveries/:id', (req, res) => {
    const success = (0, db_js_1.deleteDelivery)(req.params.id);
    if (!success) {
        return res.status(404).json({ error: 'Entrega não encontrada' });
    }
    res.json({ success: true, message: 'Entrega removida' });
});
