import React, { useState } from 'react';
import { Task, TaskStatus, User } from '../types';
import { api } from '../api';
import { Plus, Calendar, UserCheck, AlignLeft, Type } from 'lucide-react';

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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Outer Gradient Ring Wrapper */}
      <div className="relative p-[1px] rounded-[30px] bg-gradient-to-b from-purple-500/45 via-purple-500/15 to-white/[0.04] shadow-[0_28px_90px_rgba(88,28,135,0.35)] animate-modal-in">
        {/* Inner Glass Card */}
        <div className="relative rounded-[29px] bg-[#0b0b12]/92 backdrop-blur-2xl p-7 sm:p-9 overflow-hidden">
          {/* Top Glowing Highlight */}
          <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-purple-400/90 to-transparent" />
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-28 bg-purple-500/20 blur-2xl rounded-full pointer-events-none" />

          {/* Header */}
          <div className="flex items-center gap-3 mb-7">
            <span className="w-2.5 h-2.5 rotate-45 rounded-[2px] bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.85)]" />
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-100">
              Nova Tarefa
            </h2>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 text-xs text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Título */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-purple-400" />
                <span>Título</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Título..."
                className="w-full px-4 py-3.5 rounded-2xl bg-[#12121c] border border-white/[0.08] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none text-sm text-zinc-100 placeholder-zinc-500 transition-all"
                required
              />
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Status
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['todo', 'doing', 'done'] as TaskStatus[]).map(s => {
                  const label = s === 'todo' ? 'A Fazer' : s === 'doing' ? 'Fazendo' : 'Completo';
                  const active = status === s;
                  const dotColor =
                    s === 'todo'
                      ? 'bg-zinc-400'
                      : s === 'doing'
                      ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                      : 'bg-emerald-400';

                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-semibold border transition-all duration-200 ${
                        active
                          ? 'bg-purple-600/25 border-purple-500 text-white shadow-[0_0_24px_rgba(139,92,246,0.28)] scale-[1.02]'
                          : 'bg-[#12121c] border-white/[0.07] text-zinc-400 hover:text-zinc-200 hover:border-purple-500/30'
                      }`}
                    >
                      <span className={`w-2 h-2 rotate-45 rounded-[1px] ${dotColor}`} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Designação Visual & Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Data */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  <span>Data</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#12121c] border border-white/[0.08] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none text-xs font-mono text-zinc-200 transition-all"
                />
              </div>

              {/* Designação */}
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Designação</span>
                </label>
                <select
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#12121c] border border-white/[0.08] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none text-xs text-zinc-200 transition-all"
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

            {/* Pílulas de Seleção Rápida de Responsável */}
            {users.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-0.5">
                {users.map(u => {
                  const selected = assignedTo === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setAssignedTo(selected ? '' : u.id)}
                      className={`flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
                        selected
                          ? 'bg-purple-600/25 border-purple-500 text-white shadow-[0_0_16px_rgba(139,92,246,0.3)]'
                          : 'bg-[#12121c] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-purple-500/30'
                      }`}
                    >
                      <img
                        src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}&backgroundColor=7c3aed`}
                        alt={u.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span>{u.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Descrição */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                <AlignLeft className="w-3.5 h-3.5 text-purple-400" />
                <span>Descrição</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="Descrição..."
                className="w-full px-4 py-3 rounded-2xl bg-[#12121c] border border-white/[0.08] focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none text-xs text-zinc-100 placeholder-zinc-500 transition-all resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isCreating || !title.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-purple-600 hover:from-purple-500 hover:via-violet-500 hover:to-purple-500 disabled:opacity-40 text-white text-xs font-semibold uppercase tracking-widest transition-all duration-300 shadow-[0_8px_28px_rgba(139,92,246,0.45)] hover:shadow-[0_12px_36px_rgba(139,92,246,0.65)] hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreating ? '...' : 'Adicionar Tarefa'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

