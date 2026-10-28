import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  draggingTaskId: string | null;
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  onDragStart: (taskId: string) => void;
  onDragEnd: () => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  draggingTaskId,
  onTaskClick,
  onMoveTask,
  onDragStart,
  onDragEnd,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const indicatorStyle =
    id === 'todo'
      ?'bg-zinc-400 shadow-[0_0_8px_rgba(161,161,170,0.4)]'
      : id === 'doing'
  ? 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.85)] animate-pulse'
  : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]';

  const topAccentGradient =
  id === 'todo'
    ? 'from-transparent via-zinc-500/30 to-transparent'
    : id === 'doing'
      ?'from-transparent via-purple-500/70 to-transparent'
      : 'from-transparent via-emerald-500/40 to-transparent';

const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (!isDragOver) {
    setIsDragOver(true);
  }
};

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsDragOver(false);
      }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
  const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
  if (taskId) {
    onMoveTask(taskId, id);
  }
  onDragEnd();
};

  return (
  <div
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    onDrop={handleDrop}
    className={`relative flex-1 min-w-[310px] flex flex-col rounded-3xl bg-[#0d0d14]/80 backdrop-blur-xl border transition-all duration-300 overflow-hidden ${isDragOver
        ? 'border-purple-500 bg-purple-950/20 scale-[1.015] shadow-[0_0_45px_rgba(139,92,246,0.25)]'
        : 'border-white/[0.07] shadow-[0_10px_40px_rgba(0,0,0,0.45)]'
      }`}
  >
        {/* Top Glowing Line */}
        <div className={`h-[1px] w-full bg-gradient-to-r ${topAccentGradient}`} />

      {/* Column Header */}
      <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rotate-45 rounded-[2px] ${indicatorStyle}`} />
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-100">
            {title}
          </h2>
        </div>

          <span className="text-[11px] font-mono font-semibold text-purple-300 bg-purple-500/15 px-2.5 py-0.5 rounded-full border border-purple-500/25">
            {tasks.length}
          </span>
        </div>

        {/* Task List & Drop Zone */}
        <div className="flex-1 p-3.5 space-y-3 overflow-y-auto min-h-[300px] max-h-[calc(100vh-190px)]">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              isDragging={draggingTaskId === task.id}
              onClick={() => onTaskClick(task)}
              onMoveStatus={newStatus => onMoveTask(task.id, newStatus)}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))}

          {/* Drop Indicator / Empty State */}
          {(tasks.length === 0 || isDragOver) && (
            <div
            className={`h-28 rounded-2xl border border-dashed flex items-center justify-center transition-all duration-200 select-none ${isDragOver
                  ? 'border-purple-400 bg-purple-500/10 text-purple-300 scale-[0.99]'
                  : 'border-white/[0.06] text-zinc-700'
            }`}
          >
          <span className="text-xs font-mono tracking-widest uppercase">
            {isDragOver ? 'Soltar aqui' : '—'}
          </span>
        </div>
        )}
      </div>
    </div>
  );
};
