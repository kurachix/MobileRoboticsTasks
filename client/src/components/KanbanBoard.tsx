import React, { useState } from 'react';
import { Task, TaskStatus, User } from '../types';
import { KanbanColumn } from './KanbanColumn';
import { Plus, Calendar, UserCheck } from 'lucide-react';
import { api } from '../api';

interface KanbanBoardProps {
  tasks: Task[];
  users: User[];
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  onTaskCreated: (newTask: Task) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  users,
  onTaskClick,
  onMoveTask,
  onTaskCreated,
}) => {
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  // Estados do criador de tarefa no topo da tela
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [isCreating, setIsCreating] = useState(false);

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const doingTasks = tasks.filter(t => t.status === 'doing');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const res = await api.createTask({
        title: title.trim(),
        description: description.trim(),
        status,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        assigned_to: assignedTo || null,
      });
      onTaskCreated(res.task);
      setTitle('');
      setDescription('');
      setDueDate('');
      setAssignedTo('');
      setStatus('todo');
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Barra Superior de Criação Rápida de Tarefa */}
          <form
            onSubmit={handleCreateTask}
            className="relative rounded-3xl bg-[#0d0d14]/85 backdrop-blur-xl border border-purple-500/20 p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] animate-card-in"
          >
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Título */}
              <div className="md:col-span-3">
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Título..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141f] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-xs text-zinc-100 placeholder-zinc-500 transition-colors"
                  required
                />
              </div>

                {/* Descrição */}
          <div className="md:col-span-3">
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descrição..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#14141f] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-xs text-zinc-100 placeholder-zinc-500 transition-colors"
                />
              </div>

                {/* Data */}
          <div className="md:col-span-2 relative">
                <Calendar className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#14141f] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-xs font-mono text-zinc-200 transition-colors"
                />
              </div>

              {/* Designação */}
              <div className="md:col-span-2 relative">
                <UserCheck className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={assignedTo}
                  onChange={e => setAssignedTo(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#14141f] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-xs text-zinc-200 transition-colors"
                >
                  <option value="">Designação</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status & Botão Adicionar */}
              <div className="md:col-span-2 flex items-center gap-2">
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as TaskStatus)}
                  className="flex-1 px-2.5 py-2.5 rounded-xl bg-[#14141f] border border-white/[0.08] focus:border-purple-500 focus:outline-none text-xs text-zinc-200 transition-colors"
                >
                  <option value="todo">A Fazer</option>
                  <option value="doing">Fazendo</option>
                  <option value="done">Completo</option>
                </select>

                <button
                  type="submit"
                  disabled={isCreating || !title.trim()}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-40 text-white text-xs font-semibold transition-all duration-200 shadow-[0_4px_20px_rgba(139,92,246,0.35)] hover:shadow-[0_6px_25px_rgba(139,92,246,0.55)] hover:-translate-y-0.5 active:translate-y-0 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden lg:inline">{isCreating ? '...' : 'Adicionar'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* As 3 Colunas de Tarefas embaixo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <KanbanColumn
              id="todo"
              title="A Fazer"
              tasks={todoTasks}
              draggingTaskId={draggingTaskId}
              onTaskClick={onTaskClick}
              onMoveTask={onMoveTask}
              onDragStart={setDraggingTaskId}
              onDragEnd={() => setDraggingTaskId(null)}
            />

            <KanbanColumn
              id="doing"
              title="Fazendo"
              tasks={doingTasks}
              draggingTaskId={draggingTaskId}
              onTaskClick={onTaskClick}
              onMoveTask={onMoveTask}
              onDragStart={setDraggingTaskId}
              onDragEnd={() => setDraggingTaskId(null)}
            />

            <KanbanColumn
              id="done"
              title="Completo"
              tasks={doneTasks}
              draggingTaskId={draggingTaskId}
              onTaskClick={onTaskClick}
              onMoveTask={onMoveTask}
              onDragStart={setDraggingTaskId}
              onDragEnd={() => setDraggingTaskId(null)}
            />
          </div>
        </div>
        );
};
