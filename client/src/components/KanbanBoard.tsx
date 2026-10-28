import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskClick,
  onMoveTask,
}) => {
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [mobileColumn, setMobileColumn] = useState<TaskStatus>('todo');

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const doingTasks = tasks.filter(t => t.status === 'doing');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const columns: { id: TaskStatus; title: string; items: Task[] }[] = [
    { id: 'todo', title: 'A Fazer', items: todoTasks },
    { id: 'doing', title: 'Fazendo', items: doingTasks },
    { id: 'done', title: 'Completo', items: doneTasks },
  ];

  const activeMobileCol = columns.find(c => c.id === mobileColumn) || columns[0];

  return (
    <div className="relative max-w-7xl mx-auto px-3.5 sm:px-6 pt-4 pb-24 sm:py-8">
      {/* Mobile Column Switcher (< md) */}
      <div className="md:hidden grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#0d0d14] border border-purple-500/20 mb-4">
        {columns.map(col => {
          const active = mobileColumn === col.id;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setMobileColumn(col.id)}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                active
                  ? 'bg-purple-800/45 text-white border border-purple-500/50 shadow-[0_0_16px_rgba(88,28,135,0.45)]'
                  : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <span className="truncate">{col.title}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  active
                    ? 'bg-purple-500/30 text-purple-100'
                    : 'bg-white/[0.05] text-zinc-400'
                }`}
              >
                {col.items.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile View: Active Column Full-Width */}
      <div className="md:hidden">
        <KanbanColumn
          key={activeMobileCol.id}
          id={activeMobileCol.id}
          title={activeMobileCol.title}
          tasks={activeMobileCol.items}
          draggingTaskId={draggingTaskId}
          onTaskClick={onTaskClick}
          onMoveTask={onMoveTask}
          onDragStart={setDraggingTaskId}
          onDragEnd={() => setDraggingTaskId(null)}
        />
      </div>

      {/* Desktop View: 3 Columns Side-by-Side */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 items-start">
        {columns.map(col => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            tasks={col.items}
            draggingTaskId={draggingTaskId}
            onTaskClick={onTaskClick}
            onMoveTask={onMoveTask}
            onDragStart={setDraggingTaskId}
            onDragEnd={() => setDraggingTaskId(null)}
          />
        ))}
      </div>
    </div>
  );
};
