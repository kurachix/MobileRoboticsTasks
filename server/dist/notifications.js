"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSseClient = registerSseClient;
exports.removeSseClient = removeSseClient;
exports.notifyUsersOfTaskEvent = notifyUsersOfTaskEvent;
const db_js_1 = require("./db.js");
// Conexões SSE ativas mapeadas por ID de usuário (recipient_user_id)
const sseClients = new Map();
function registerSseClient(userId, res) {
    let set = sseClients.get(userId);
    if (!set) {
        set = new Set();
        sseClients.set(userId, set);
    }
    set.add(res);
}
function removeSseClient(userId, res) {
    const set = sseClients.get(userId);
    if (!set)
        return;
    set.delete(res);
    if (set.size === 0) {
        sseClients.delete(userId);
    }
}
function pushToUser(userId, notification) {
    const clients = sseClients.get(userId);
    if (!clients || clients.size === 0)
        return;
    const payload = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;
    for (const res of clients) {
        try {
            res.write(payload);
        }
        catch {
            clients.delete(res);
        }
    }
}
const STATUS_LABELS = {
    todo: 'A Fazer',
    doing: 'Fazendo',
    done: 'Completo',
};
function notifyUsersOfTaskEvent(params) {
    const { actor, task, previousTask, action, extraText } = params;
    // Buscar apenas os outros usuários que ativaram notificações
    const recipients = (0, db_js_1.getUsersWithNotificationsEnabled)(actor.id);
    if (recipients.length === 0)
        return;
    const assignedUser = task.assigned_to ? (0, db_js_1.findUserById)(task.assigned_to) : null;
    for (const recipient of recipients) {
        const isAssignedToRecipient = task.assigned_to === recipient.id;
        const wasAssignedToRecipient = previousTask?.assigned_to === recipient.id;
        let type = 'task_updated';
        let title = '';
        let message = '';
        if (action === 'created') {
            type = isAssignedToRecipient ? 'task_assigned' : 'task_created';
            if (isAssignedToRecipient) {
                title = `${recipient.name}, nova tarefa para você`;
                message = `${actor.name} atribuiu "${task.title}" diretamente a você.`;
            }
            else if (assignedUser) {
                title = `${recipient.name}: Nova tarefa criada`;
                message = `${actor.name} criou "${task.title}" (designada para ${assignedUser.name}).`;
            }
            else {
                title = `${recipient.name}: Nova tarefa criada`;
                message = `${actor.name} adicionou "${task.title}" ao quadro.`;
            }
        }
        else if (action === 'updated') {
            const statusChanged = previousTask && previousTask.status !== task.status;
            const assigneeChanged = previousTask && previousTask.assigned_to !== task.assigned_to;
            if (assigneeChanged && isAssignedToRecipient) {
                type = 'task_assigned';
                title = `${recipient.name}, tarefa atribuída a você`;
                message = `${actor.name} designou você como responsável por "${task.title}".`;
            }
            else if (statusChanged) {
                type = 'task_status';
                const statusLabel = STATUS_LABELS[task.status] || task.status;
                if (isAssignedToRecipient) {
                    title = `${recipient.name}: Sua tarefa avançou`;
                    message = `${actor.name} moveu sua tarefa "${task.title}" para ${statusLabel}.`;
                }
                else {
                    title = `${recipient.name}: Status atualizado`;
                    message = `${actor.name} moveu "${task.title}" para ${statusLabel}.`;
                }
            }
            else {
                type = 'task_updated';
                if (isAssignedToRecipient || wasAssignedToRecipient) {
                    title = `${recipient.name}: Sua tarefa foi editada`;
                    message = `${actor.name} alterou os detalhes da sua tarefa "${task.title}".`;
                }
                else {
                    title = `${recipient.name}: Tarefa modificada`;
                    message = `${actor.name} atualizou a tarefa "${task.title}".`;
                }
            }
        }
        else if (action === 'deleted') {
            type = 'task_deleted';
            if (isAssignedToRecipient) {
                title = `${recipient.name}: Sua tarefa foi removida`;
                message = `${actor.name} excluiu a tarefa "${task.title}" que estava com você.`;
            }
            else {
                title = `${recipient.name}: Tarefa removida`;
                message = `${actor.name} excluiu a tarefa "${task.title}".`;
            }
        }
        else if (action === 'commented') {
            type = 'task_comment';
            const snippet = extraText ? ` "${extraText.slice(0, 50)}"` : '';
            if (isAssignedToRecipient) {
                title = `${recipient.name}: Comentário na sua tarefa`;
                message = `${actor.name} comentou em "${task.title}":${snippet}`;
            }
            else {
                title = `${recipient.name}: Novo comentário`;
                message = `${actor.name} comentou em "${task.title}":${snippet}`;
            }
        }
        else if (action === 'delivered') {
            type = 'task_delivery';
            if (isAssignedToRecipient) {
                title = `${recipient.name}: Entrega na sua tarefa`;
                message = `${actor.name} registrou uma entrega em "${task.title}".`;
            }
            else {
                title = `${recipient.name}: Nova entrega registrada`;
                message = `${actor.name} enviou um entregável em "${task.title}".`;
            }
        }
        const saved = (0, db_js_1.createNotification)({
            recipient_user_id: recipient.id,
            actor_user_id: actor.id,
            actor_name: actor.name,
            actor_avatar: actor.avatar_url || null,
            task_id: action === 'deleted' ? null : task.id,
            type,
            title,
            message,
        });
        pushToUser(recipient.id, saved);
    }
}
