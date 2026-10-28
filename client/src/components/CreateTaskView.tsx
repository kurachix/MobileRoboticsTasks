import React, { useState } from 'react';
import { Task, TaskStatus, User } from '../types';
import { api } from '../api';
import { Plus, Calendar, UserCheck } from 'lucide-react';

interface CreateTaskViewProps {
  users: User[];
  onTaskCreated: (task: Task) => void;
}

export const CreateTaskView: React.FC<CreateTaskViewProps> = ({ users, onTaskCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      const res = await api.createTask({
        title: title.trim(),
        description: description.trim(),
        status,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        assigned_to: assignedTo || null,
      });
      setTitle('');
      setDescription('');
      setDueDate('');
      setAssignedTo('');
      setStatus('todo');
      onTaskCreated(res.task);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar tarefa.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-3.5 sm:px-6 pt-4 pb-24 sm:py-10">
      <div className="relative rounded-3xl bg-[#0d0d14]/85 backdrop-blur-xl border border-purple-500/20 p-5 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.6)] animate-modal-in">
        {/* Top Glowing Line */}
        <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5 sm:mb-6">
          <span className="w-2.5 h-2.5 rotate-45 rounded-[2px] bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-100">
            Nova Tarefa
          </h2>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Título..."
              className="w-full px-4 py-3 rounded-2xl bg-[#14141f] border border-white/[0.07] focus:border-purple-600 focus:outline-none text-base sm:text-sm text-zinc-100 placeholder-zinc-500 transition-colors"
              required
            />
          </div>

          {/* Status Selector */}
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
                        : 'bg-[#14141f] border-white/[0.06] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data & Designação */}
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141f] border border-white/[0.07] focus:border-purple-600 focus:outline-none text-base sm:text-xs font-mono text-zinc-200 transition-colors"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141f] border border-white/[0.07] focus:border-purple-600 focus:outline-none text-base sm:text-xs text-zinc-200 transition-colors"
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

          {/* Descrição */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              placeholder="Descrição..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#14141f] border border-white/[0.07] focus:border-purple-600 focus:outline-none text-base sm:text-xs text-zinc-100 placeholder-zinc-500 transition-colors resize-none"
            />
          </div>

          {/* Botão Criar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isCreating || !title.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 sm:py-3 px-6 rounded-2xl bg-gradient-to-r from-purple-700 to-violet-800 hover:from-purple-600 hover:to-violet-700 active:scale-[0.99] disabled:opacity-40 text-white text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-[0_6px_24px_rgba(88,28,135,0.45)] sm:hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreating ? '...' : 'Adicionar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
