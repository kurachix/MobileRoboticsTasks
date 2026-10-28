import React, { useState, useEffect } from 'react';
import { Task, User, Comment, Delivery, TaskStatus } from '../types';
import { api } from '../api';
import {
  X,
  Trash2,
  Calendar,
  UserCheck,
  Paperclip,
  MessageSquare,
  Send,
  ExternalLink,
} from 'lucide-react';

interface TaskModalProps {
  task: Task | null;
  initialStatus?: TaskStatus;
  users: User[];
  onClose: () => void;
  onSave: (savedTask: Task) => void;
  onDelete?: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  initialStatus = 'todo',
  users,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditing = !!task;

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || initialStatus);
  const [dueDate, setDueDate] = useState<string>(
    task?.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
  );
  const [assignedTo, setAssignedTo] = useState<string>(task?.assigned_to || '');

  const [comments, setComments] = useState<Comment[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'deliveries' | 'comments'>('details');

  const [newComment, setNewComment] = useState('');
  const [deliveryContent, setDeliveryContent] = useState('');
  const [deliveryUrl, setDeliveryUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task?.id) {
      api.getTaskDetails(task.id)
        .then(data => {
          setComments(data.comments || []);
          setDeliveries(data.deliveries || []);
        })
        .catch(err => console.error(err));
    }
  }, [task?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Título obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && task) {
        const res = await api.updateTask(task.id, {
          title: title.trim(),
          description: description.trim(),
          status,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          assigned_to: assignedTo || null,
        });
        onSave(res.task);
      } else {
        const res = await api.createTask({
          title: title.trim(),
          description: description.trim(),
          status,
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
          assigned_to: assignedTo || null,
        });
        onSave(res.task);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !task) return;

    try {
      const res = await api.addComment(task.id, newComment.trim());
      setComments(prev => [...prev, res.comment]);
      setNewComment('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryContent.trim() || !task) return;

    try {
      const res = await api.addDelivery(task.id, deliveryContent.trim(), deliveryUrl.trim() || null);
      setDeliveries(prev => [res.delivery, ...prev]);
      setDeliveryContent('');
      setDeliveryUrl('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteDelivery = async (deliveryId: string) => {
    try {
      await api.deleteDelivery(deliveryId);
      setDeliveries(prev => prev.filter(d => d.id !== deliveryId));
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-[#0e0e16]/95 backdrop-blur-2xl border-t sm:border border-purple-500/25 shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden animate-modal-in pb-[env(safe-area-inset-bottom)]"
      >
        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-purple-400/70 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rotate-45 rounded-[2px] bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-100">
              {isEditing ? 'Tarefa' : 'Nova Tarefa'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Excluir tarefa?')) {
                    onDelete(task.id);
                    onClose();
                  }
                }}
                className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        {isEditing && (
          <div className="grid grid-cols-3 border-b border-white/[0.06] px-2 sm:px-6 bg-[#0a0a10] shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`py-3 px-2 text-xs font-semibold border-b-2 text-center transition-all ${
                activeTab === 'details'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Geral
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('deliveries')}
              className={`py-3 px-2 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'deliveries'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">Entregas ({deliveries.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`py-3 px-2 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'comments'
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">Comentários ({comments.length})</span>
            </button>
          </div>
        )}

        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          {activeTab === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Título
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Título..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#151520] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-base sm:text-sm text-zinc-100 placeholder-zinc-600 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['todo', 'doing', 'done'] as TaskStatus[]).map(s => {
                    const label = s === 'todo' ? 'A Fazer' : s === 'doing' ? 'Fazendo' : 'Completo';
                    const active = status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`py-2.5 px-2 sm:px-3 rounded-xl text-xs font-semibold border text-center transition-all duration-200 ${
                          active
                            ? 'bg-purple-800/35 border-purple-500 text-white shadow-[0_0_20px_rgba(88,28,135,0.4)]'
                            : 'bg-[#151520] border-white/[0.06] text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>Data</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#151520] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-base sm:text-xs font-mono text-zinc-200 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>Designação</span>
                  </label>
                  <select
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#151520] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-base sm:text-xs text-zinc-200 transition-colors"
                  >
                    <option value="">—</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Descrição..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#151520] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-base sm:text-xs text-zinc-100 placeholder-zinc-600 transition-colors resize-none"
                />
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 sm:py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-purple-700 to-violet-800 hover:from-purple-600 hover:to-violet-700 text-white text-xs font-semibold transition-all shadow-[0_4px_20px_rgba(88,28,135,0.45)]"
                >
                  {isSubmitting ? '...' : 'Salvar'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'deliveries' && (
            <div className="space-y-4">
              <form onSubmit={handleAddDelivery} className="p-3.5 sm:p-4 rounded-2xl bg-[#151520] border border-white/[0.07] space-y-3">
                <textarea
                  value={deliveryContent}
                  onChange={e => setDeliveryContent(e.target.value)}
                  placeholder="Entrega..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0e0e16] border border-white/[0.07] text-base sm:text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
                  required
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={deliveryUrl}
                    onChange={e => setDeliveryUrl(e.target.value)}
                    placeholder="URL..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#0e0e16] border border-white/[0.07] text-base sm:text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-purple-700 to-violet-800 hover:from-purple-600 hover:to-violet-700 text-white text-xs font-semibold transition-all"
                  >
                    Enviar
                  </button>
                </div>
              </form>

              <div className="space-y-2.5 max-h-[240px] overflow-y-auto">
                {deliveries.length === 0 ? (
                  <p className="text-center py-6 text-xs font-mono text-zinc-600">—</p>
                ) : (
                  deliveries.map(del => (
                    <div
                      key={del.id}
                      className="p-3.5 rounded-2xl bg-[#151520] border border-white/[0.07] flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-purple-300">{del.user_name || 'User'}</span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {new Date(del.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 break-words">{del.content}</p>
                        {del.attachment_url && (
                          <a
                            href={del.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-mono"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>LINK</span>
                          </a>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteDelivery(del.id)}
                        className="text-zinc-600 hover:text-red-400 p-1.5 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-3.5">
              <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-center py-6 text-xs font-mono text-zinc-600">—</p>
                ) : (
                  comments.map(c => (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-2xl bg-[#151520] border border-white/[0.07] flex items-start justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-purple-300">{c.user_name || 'User'}</span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {new Date(c.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 whitespace-pre-wrap break-words">{c.content}</p>
                      </div>

                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-zinc-600 hover:text-red-400 p-1.5 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-3 border-t border-white/[0.06]">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Comentário..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#151520] border border-white/[0.08] text-base sm:text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="p-3 sm:p-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-violet-800 hover:from-purple-600 hover:to-violet-700 disabled:opacity-40 text-white transition-all shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
