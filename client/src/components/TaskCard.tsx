import React from 'react';
import { Task, TaskStatus } from '../types';
import {
  Calendar,
  MessageSquare,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  Check,
  GripVertical,
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onClick: () => void;
  onMoveStatus: (newStatus: TaskStatus) => void;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
}

  export const TaskCard: React.FC<TaskCardProps> = ({
    task,
    isDragging,
    onClick,
    onMoveStatus,
    onDragStart,
    onDragEnd,
  }) => {
    const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

    const formattedDate = task.due_date
    ?new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
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

const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
  e.dataTransfer.setData('text/plain', task.id);
  e.dataTransfer.effectAllowed = 'move';
  onDragStart(task.id);
};

return (
  <div
    draggable
    onDragStart={handleDragStart}
    onDragEnd={onDragEnd}
    onClick={onClick}
    className={`group relative rounded-2xl bg-gradient-to-b from-[#151520] to-[#111119] border p-4 transition-all duration-200 cursor-grab active:cursor-grabbing select-none animate-card-in ${isDragging
        ? 'opacity-40 scale-95 border-purple-500 border-dashed shadow-[0_0_25px_rgba(139,92,246,0.3)]'
        : 'border-white/[0.07] hover:border-purple-500/50 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(139,92,246,0.18)]'
      }`}
  >
    {/* Top Subtle Highlight Line */}
    <div className="absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r from-transparent via-purple-400/0 group-hover:via-purple-400/50 to-transparent transition-all duration-300" />

      {/* Top row: Drag Handle + Title + Quick Move buttons */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-start gap-2 min-w-0">
          <GripVertical className="w-4 h-4 text-zinc-600 group-hover:text-purple-400 transition-colors shrink-0 mt-0.5" />
          <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white leading-snug line-clamp-2 transition-colors">
            {task.title}
          </h3>
        </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {task.status !== 'todo' && (
              <button
                onClick={handlePrev}
                className="p-1 rounded-lg bg-[#1d1d2b] hover:bg-purple-600/30 text-zinc-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}

          {task.status !== 'done' ? (
              <button
                onClick={handleNext}
                className="p-1 rounded-lg bg-purple-500/15 hover:bg-purple-600 text-purple-300 hover:text-white transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-zinc-400/90 line-clamp-2 mb-3.5 pl-6 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer / Badges */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.05] text-xs pl-6">
            {/* Left: Assignee */}
            <div className="flex items-center gap-2">
              {task.assigned_name ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                  <img
                    src={task.assigned_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${task.assigned_name}`}
                    alt={task.assigned_name}
                    className="w-4 h-4 rounded-full object-cover"
                  />
                  <span className="text-[11px] font-medium text-purple-200 max-w-[85px] truncate">
                    {task.assigned_name.split(' ')[0]}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-zinc-700 font-mono">—</span>
              )}
          </div>

          {/* Right: Date, Deliveries & Comments Count */}
            <div className="flex items-center gap-2">
              {formattedDate && (
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono ${isOverdue
                      ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                      : 'bg-white/[0.04] text-zinc-400'
                    }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>{formattedDate}</span>
                </div>
              )}

          {(task.delivery_count || 0) > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 text-[11px] font-mono">
                  <Paperclip className="w-3 h-3" />
                  <span>{task.delivery_count}</span>
                </div>
              )}

          {(task.comment_count || 0) > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-300 text-[11px] font-mono">
                  <MessageSquare className="w-3 h-3" />
                  <span>{task.comment_count}</span>
                </div>
              )}
          </div>
        </div>
      </div>
      );
};
