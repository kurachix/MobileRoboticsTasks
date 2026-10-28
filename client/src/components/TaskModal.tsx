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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
              <div className="relative w-full max-w-xl bg-[#111116] border border-[#232330] shadow-2xl overflow-hidden my-8">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-700 via-purple-500 to-purple-900" />

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#232330]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rotate-45 bg-purple-500" />
                    <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-200">
                      {isEditing ? 'TAREFA' : 'NOVA TAREFA'}
                    </span>
                  </div>

                    <div className="flex items-center gap-1">
                      {isEditing && onDelete && (
                        <button
                          type="button"
                          onClick={() => {
                              if (confirm('Excluir tarefa?')) {
                                onDelete(task.id);
                                onClose();
                              }
                            }
                          }
                          className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={onClose}
                        className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tabs */}
                  {isEditing && (
                      <div className="flex border-b border-[#232330] px-5 bg-[#0d0d12]">
                        <button
                          type="button"
                          onClick={() => setActiveTab('details')}
                                  ? 'border-purple-500 text-white'
                                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
                              }`}
            >
              Geral
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('deliveries')}
                          className = {`py-2.5 px-3 text-[11px] font-mono uppercase tracking-wider border-b-2 flex items-center gap-1.5 transition-colors ${activeTab === 'deliveries'
                                ? 'border-purple-500 text-white'
                                : 'border-transparent text-zinc-500 hover:text-zinc-300'
                            }`}
            >
                        <Paperclip className="w-3 h-3" />
                        <span>Entregas ({deliveries.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('comments')}
                                ? 'border-purple-500 text-white'
                                : 'border-transparent text-zinc-500 hover:text-zinc-300'
                            }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>Comentários ({comments.length})</span>
            </button>
          </div>
        )}

        <div className="p-5">
          {error && (
            <div className="mb-4 p-2.5 bg-red-950/40 border border-red-800/50 text-red-300 text-xs font-mono">
              {error}
            </div>
          )}

          {activeTab === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Título..."
                  className="w-full px-3 py-2 bg-[#16161d] border border-[#232330] focus:border-purple-500 focus:outline-none text-xs text-zinc-100 placeholder-zinc-600 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
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
                        className = {`py-2 px-3 text-[11px] font-mono uppercase tracking-wider border text-center transition-all ${active
                              ? 'bg-purple-600/20 border-purple-500 text-white'
                              : 'bg-[#16161d] border-[#232330] text-zinc-500 hover:text-zinc-300'
                          }`}
                      >
                        {label}
                      </button>
                      );
                  })}
                    </div>
              </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-purple-400" />
                          <span>Data</span>
                        </label>
                        <input
                          type="date"
                          value={dueDate}
                          onChange={e => setDueDate(e.target.value)}
                          className="w-full px-3 py-2 bg-[#16161d] border border-[#232330] focus:border-purple-500 focus:outline-none text-xs font-mono text-zinc-200 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1 flex items-center gap-1.5">
                          <UserCheck className="w-3 h-3 text-purple-400" />
                          <span>Designação</span>
                        </label>
                        <select
                          value={assignedTo}
                          onChange={e => setAssignedTo(e.target.value)}
                          className="w-full px-3 py-2 bg-[#16161d] border border-[#232330] focus:border-purple-500 focus:outline-none text-xs text-zinc-200 transition-colors"
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
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Descrição..."
                      className="w-full px-3 py-2 bg-[#16161d] border border-[#232330] focus:border-purple-500 focus:outline-none text-xs text-zinc-100 placeholder-zinc-600 transition-colors resize-none"
                    />
                  </div>

                    <div className="pt-3 border-t border-[#232330] flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-mono uppercase tracking-wider transition-all"
                      >
                        {isSubmitting ? '...' : 'Salvar'}
                      </button>
                    </div>
                  </form>
          )}

                  {activeTab === 'deliveries' && (
                          <div className="space-y-4">
                            <form onSubmit={handleAddDelivery} className="p-3 bg-[#16161d] border border-[#232330] space-y-2.5">
                              <textarea
                                value={deliveryContent}
                                onChange={e => setDeliveryContent(e.target.value)}
                                placeholder="Entrega..."
                                rows={2}
                                className="w-full px-3 py-1.5 bg-[#111116] border border-[#232330] text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 resize-none"
                                required
                              />
                              <div className="flex gap-2">
                                <input
                                  type="url"
                                  value={deliveryUrl}
                                  onChange={e => setDeliveryUrl(e.target.value)}
                                  placeholder="URL..."
                                  className="flex-1 px-3 py-1.5 bg-[#111116] border border-[#232330] text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                                />
                                <button
                                  type="submit"
                                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-mono uppercase tracking-wider transition-colors"
                                >
                                  Enviar
                                </button>
                              </div>
                            </form>

                              <div className="space-y-2 max-h-[260px] overflow-y-auto">
                                {deliveries.length === 0 ? (
                  <p className="text-center py-6 text-xs font-mono text-zinc-600">—</p>
                                ) : (
                                  deliveries.map(del => (
                                    <div
                                      key={del.id}
                                      className="p-3 bg-[#16161d] border border-[#232330] flex items-start justify-between gap-3"
                                    >
                                            <div className="space-y-1 flex-1">
                                              <div className="flex items-center gap-2 font-mono">
                                                <span className="text-[11px] text-purple-400 uppercase">{del.user_name || 'USER'}</span>
                                                <span className="text-[10px] text-zinc-600">
                                                  {new Date(del.created_at).toLocaleString('pt-BR')}
                                                </span>
                                              </div>
                                              <p className="text-xs text-zinc-300">{del.content}</p>
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
                                              className="text-zinc-600 hover:text-red-400 p-1"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        ))
                )}
                                      </div>
                                    </div>
                                  )}

                                {activeTab === 'comments' && (
                                      <div className="space-y-3">
                                        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                                          {comments.length === 0 ? (
                  <p className="text-center py-6 text-xs font-mono text-zinc-600">—</p>
                                          ) : (
                                            comments.map(c => (
                                              <div
                                                key={c.id}
                                                className="p-2.5 bg-[#16161d] border border-[#232330] flex items-start justify-between gap-2"
                                              >
                                                    <div>
                                                      <div className="flex items-center gap-2 mb-0.5 font-mono">
                                                        <span className="text-[11px] text-purple-400 uppercase">{c.user_name || 'USER'}</span>
                                                        <span className="text-[10px] text-zinc-600">
                                                          {new Date(c.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                      </div>
                                                      <p className="text-xs text-zinc-300 whitespace-pre-wrap">{c.content}</p>
                                                    </div>

                                                    <button
                                                      onClick={() => handleDeleteComment(c.id)}
                                                      className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                                                    >
                                                      <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                  </div>
                                                  ))
                )}
                                                </div>

                                                  <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2 border-t border-[#232330]">
                                                    <input
                                                      type="text"
                                                      value={newComment}
                                                      onChange={e => setNewComment(e.target.value)}
                                                      placeholder="Comentário..."
                                                      className="flex-1 px-3 py-1.5 bg-[#16161d] border border-[#232330] text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500"
                                                    />
                                                    <button
                                                      type="submit"
                                                      disabled={!newComment.trim()}
                                                      className="p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-colors"
                                                    >
                                                      <Send className="w-3.5 h-3.5" />
                                                    </button>
                                                  </form>
                                              </div>
                                            )}
                                        </div>
                                      </div>
                                    </div>
                                    );
};
