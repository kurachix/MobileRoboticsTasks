import React from 'react';
import { Task, TaskStatus } from '../types';
import { Calendar, MessageSquare, Paperclip, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onMoveStatus: (newStatus: TaskStatus) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onMoveStatus }) => {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  const formattedDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'doing') onMoveStatus('todo');
    if (task.status === 'done') onMoveStatus('doing');
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'todo') onMoveStatus('doing');
    if (task.status === 'doing') onMoveStatus('done');
  };

  return (
    <div
      onClick={onClick}
      className="group relative rounded-xl bg-[#181822] hover:bg-[#1c1c28] border border-[#262636] hover:border-purple-500/40 p-4 transition-all duration-150 cursor-pointer shadow-sm hover:shadow-purple-950/20"
    >
      {/* Top row: Title & Quick Move buttons */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-medium text-zinc-100 group-hover:text-purple-200 transition-colors line-clamp-2">
          {task.title}
        </h3>

        {/* Quick status switch */}
        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          {task.status !== 'todo' && (
            <button
              onClick={handlePrev}
              title="Mover para coluna anterior"
              className="p-1 rounded hover:bg-[#262636] text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {task.status !== 'done' ? (
            <button
              onClick={handleNext}
              title="Avançar coluna"
              className="p-1 rounded hover:bg-purple-600/30 text-purple-400 hover:text-purple-200 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="p-1 text-emerald-400">
              <Check className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Description preview if exists */}
      {task.description && (
        <p className="text-xs text-zinc-400 line-clamp-2 mb-3 font-normal">
          {task.description}
        </p>
      )}

      {/* Footer / Badges */}
      <div className="flex items-center justify-between pt-2 border-t border-[#262636]/60 text-xs text-zinc-400">
        {/* Left: Designação (Assignee) */}
        <div className="flex items-center gap-1.5">
          {task.assigned_name ? (
            <div className="flex items-center gap-1.5" title={`Designado para: ${task.assigned_name}`}>
              <img
                src={task.assigned_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${task.assigned_name}`}
                alt={task.assigned_name}
                className="w-5 h-5 rounded-full border border-purple-500/30 bg-[#121217]"
              />
              <span className="text-[11px] text-zinc-300 max-w-[90px] truncate">
                {task.assigned_name.split(' ')[0]}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-zinc-600 italic">Sem designação</span>
          )}
        </div>

        {/* Right: Date, Deliveries & Comments Count */}
        <div className="flex items-center gap-3">
          {formattedDate && (
            <div
              className={`flex items-center gap-1 text-[11px] ${
                isOverdue ? 'text-red-400 font-medium' : 'text-zinc-400'
              }`}
              title={isOverdue ? 'Atrasada' : 'Data de vencimento'}
            >
              <Calendar className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
          )}

          {(task.delivery_count || 0) > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-purple-400" title="Entregas registradas">
              <Paperclip className="w-3 h-3" />
              <span>{task.delivery_count}</span>
            </div>
          )}

          {(task.comment_count || 0) > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-zinc-400" title="Comentários">
              <MessageSquare className="w-3 h-3" />
              <span>{task.comment_count}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

