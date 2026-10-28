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
  PlusCircle,
} from 'lucide-react';

interface TaskModalProps {
  task: Task | null; // null se criando nova tarefa
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

  // Form states
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || initialStatus);
  const [dueDate, setDueDate] = useState<string>(
    task?.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
  );
  const [assignedTo, setAssignedTo] = useState<string>(task?.assigned_to || '');

  // Sub-items states
  const [comments, setComments] = useState<Comment[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'deliveries' | 'comments'>('details');

  // Input states
  const [newComment, setNewComment] = useState('');
  const [deliveryContent, setDeliveryContent] = useState('');
  const [deliveryUrl, setDeliveryUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar comentários e entregas detalhados se editando tarefa existente
  useEffect(() => {
    if (task?.id) {
      api.getTaskDetails(task.id)
        .then(data => {
          setComments(data.comments || []);
          setDeliveries(data.deliveries || []);
        })
        .catch(err => console.error('Erro ao buscar detalhes da tarefa:', err));
    }
  }, [task?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('O título da tarefa é obrigatório.');
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
      setError(err.message || 'Erro ao salvar tarefa.');
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
      alert(err.message || 'Erro ao enviar comentário.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await api.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir comentário.');
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
      alert(err.message || 'Erro ao registrar entrega.');
    }
  };

  const handleDeleteDelivery = async (deliveryId: string) => {
    try {
      await api.deleteDelivery(deliveryId);
      setDeliveries(prev => prev.filter(d => d.id !== deliveryId));
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir entrega.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#121217] border border-[#262636] rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-6 border-b border-[#262636]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-purple-400 bg-purple-950/40 border border-purple-800/40 px-2.5 py-1 rounded-md">
              {isEditing ? 'EDITAR TAREFA' : 'NOVA TAREFA'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja realmente excluir esta tarefa?')) {
                    onDelete(task.id);
                    onClose();
                  }
                }}
                title="Excluir tarefa"
                className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#181822] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Abas se editando tarefa existente */}
        {isEditing && (
          <div className="flex border-b border-[#262636] px-6 bg-[#0e0e13]">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-purple-500 text-purple-300'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Detalhes & Designação
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('deliveries')}
              className={`py-3 px-4 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'deliveries'
                  ? 'border-purple-500 text-purple-300'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>Entregas ({deliveries.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`py-3 px-4 text-xs font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
                activeTab === 'comments'
                  ? 'border-purple-500 text-purple-300'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Comentários ({comments.length})</span>
            </button>
          </div>
        )}

        {/* Conteúdo do Modal */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* TAB 1: Formulário Principal de Detalhes */}
          {activeTab === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Título da Tarefa</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Desenvolver autenticação com Google OAuth"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181822] border border-[#262636] focus:border-purple-500 focus:outline-none text-sm text-zinc-100 placeholder-zinc-500 transition-colors"
                  required
                />
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Coluna / Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['todo', 'doing', 'done'] as TaskStatus[]).map(s => {
                    const label = s === 'todo' ? 'A Fazer' : s === 'doing' ? 'Fazendo' : 'Completo';
                    const active = status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                          active
                            ? 'bg-purple-600/20 border-purple-500 text-purple-200 shadow-sm shadow-purple-950'
                            : 'bg-[#181822] border-[#262636] text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Data & Designação (Grid de 2 colunas) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Data de Vencimento */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span>Data de Entrega / Vencimento</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#181822] border border-[#262636] focus:border-purple-500 focus:outline-none text-xs text-zinc-200 transition-colors"
                  />
                </div>

                {/* Designação (Usuário Atribuído) */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>Designação (Responsável)</span>
                  </label>
                  <select
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#181822] border border-[#262636] focus:border-purple-500 focus:outline-none text-xs text-zinc-200 transition-colors"
                  >
                    <option value="">Não atribuído</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">Descrição & Requisitos</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Detalhes sobre a tarefa, links relevantes ou observações..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#181822] border border-[#262636] focus:border-purple-500 focus:outline-none text-xs text-zinc-100 placeholder-zinc-500 transition-colors resize-none"
                />
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-4 border-t border-[#262636] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-[#181822] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-all shadow-md shadow-purple-950/40"
                >
                  {isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Tarefa' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Entregas (Submissões e comprovantes) */}
          {activeTab === 'deliveries' && (
            <div className="space-y-5">
              {/* Formulário de Nova Entrega */}
              <form onSubmit={handleAddDelivery} className="p-4 rounded-xl bg-[#181822] border border-[#262636] space-y-3">
                <h4 className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>Registrar Nova Entrega</span>
                </h4>
                <div>
                  <textarea
                    value={deliveryContent}
                    onChange={e => setDeliveryContent(e.target.value)}
                    placeholder="Descrição da entrega, resumo das alterações ou notas..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-[#121217] border border-[#262636] text-xs text-zinc-200 focus:outline-none focus:border-purple-500 resize-none"
                    required
                  />
                </div>
                <div>
                  <input
                    type="url"
                    value={deliveryUrl}
                    onChange={e => setDeliveryUrl(e.target.value)}
                    placeholder="Link do entregável (GitHub PR, Figma, Documento, URL de produção...)"
                    className="w-full px-3 py-2 rounded-lg bg-[#121217] border border-[#262636] text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors"
                  >
                    Confirmar Entrega
                  </button>
                </div>
              </form>

              {/* Lista de Entregas Realizadas */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {deliveries.length === 0 ? (
                  <p className="text-center py-8 text-xs text-zinc-500">
                    Nenhuma entrega registrada ainda para esta tarefa.
                  </p>
                ) : (
                  deliveries.map(del => (
                    <div
                      key={del.id}
                      className="p-3.5 rounded-xl bg-[#181822] border border-[#262636] flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <img
                            src={del.user_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${del.user_name || 'U'}`}
                            alt={del.user_name || 'Usuário'}
                            className="w-4 h-4 rounded-full border border-purple-500/30"
                          />
                          <span className="text-xs font-medium text-zinc-200">{del.user_name || 'Usuário'}</span>
                          <span className="text-[10px] text-zinc-500">
                            {new Date(del.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 font-normal">{del.content}</p>
                        {del.attachment_url && (
                          <a
                            href={del.attachment_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 underline font-mono"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Abrir link do entregável</span>
                          </a>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteDelivery(del.id)}
                        className="text-zinc-500 hover:text-red-400 p-1"
                        title="Excluir entrega"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Comentários */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Feed de Comentários */}
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-center py-8 text-xs text-zinc-500">
                    Nenhum comentário. Inicie a conversa abaixo.
                  </p>
                ) : (
                  comments.map(c => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl bg-[#181822] border border-[#262636] flex items-start justify-between gap-2"
                    >
                      <div className="flex items-start gap-2.5">
                        <img
                          src={c.user_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.user_name || 'C'}`}
                          alt={c.user_name || 'User'}
                          className="w-6 h-6 rounded-full border border-purple-500/30 mt-0.5"
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-zinc-200">{c.user_name || 'Usuário'}</span>
                            <span className="text-[10px] text-zinc-500">
                              {new Date(c.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 font-normal whitespace-pre-wrap">{c.content}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                        title="Excluir comentário"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Input de envio rápido de comentário */}
              <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2 border-t border-[#262636]">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#181822] border border-[#262636] text-xs text-zinc-200 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-colors"
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

