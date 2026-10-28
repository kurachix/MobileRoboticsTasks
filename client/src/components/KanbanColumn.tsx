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
  const diamondStyle =
    id === 'todo'
        ? 'border-zinc-500 bg-transparent'
        : id === 'doing'
      ?'border-purple-400 bg-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]'
      : 'border-purple-500/60 bg-purple-500/30';

return (
    <div className="flex-1 min-w-[300px] flex flex-col bg-[#111116] border border-[#232330]">
      {/* Column Header */}
        <div className="px-4 py-3 border-b border-[#232330] flex items-center justify-between bg-[#13131a]">
          <div className="flex items-center gap-2.5">
              <span className={`w-2 h-2 rotate-45 border ${diamondStyle}`} />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-200">
                {title}
              </h2>
              <span className="text-[11px] font-mono text-purple-400 bg-purple-950/30 px-1.5 py-0.5 border border-purple-500/20">
                {String(tasks.length).padStart(2, '0')}
              </span>
          </div>

          <button
            onClick={() => onAddTask(id)}
            className="p-1 text-zinc-500 hover:text-purple-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Task List */}
          <div className="flex-1 p-2.5 space-y-2 overflow-y-auto max-h-[calc(100vh-140px)]">
            {tasks.length === 0 ? (
                <div className="h-24 flex items-center justify-center border border-dashed border-[#1e1e2a] text-zinc-700 font-mono text-xs select-none">
                  —
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
