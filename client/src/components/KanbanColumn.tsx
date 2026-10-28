import React from 'react';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask: (status: TaskStatus) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  onTaskClick,
  onMoveTask,
  onAddTask,
}) => {
  // Dot colors according to status
  const dotColor =
    id === 'todo'
      ? 'bg-zinc-400'
      : id === 'doing'
      ? 'bg-purple-500 ring-4 ring-purple-500/20 animate-pulse'
      : 'bg-emerald-400';

  return (
    <div className="flex-1 min-w-[300px] flex flex-col bg-[#121217] rounded-2xl border border-[#262636] overflow-hidden">
      {/* Column Header */}
      <div className="p-4 border-b border-[#262636] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          <h2 className="text-sm font-semibold text-zinc-200 tracking-tight">{title}</h2>
          <span className="text-xs font-mono text-zinc-500 bg-[#181822] px-2 py-0.5 rounded-full border border-[#262636]">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onAddTask(id)}
          title={`Adicionar tarefa em ${title}`}
          className="p-1 rounded-lg text-zinc-400 hover:text-purple-300 hover:bg-[#181822] transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-210px)]">
        {tasks.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center border border-dashed border-[#262636] rounded-xl p-4 text-center">
            <p className="text-xs text-zinc-500 font-normal">Nenhuma tarefa aqui</p>
            <button
              onClick={() => onAddTask(id)}
              className="mt-2 text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              + Adicionar
            </button>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onMoveStatus={newStatus => onMoveTask(task.id, newStatus)}
            />
          ))
        )}
      </div>
    </div>
  );
};

