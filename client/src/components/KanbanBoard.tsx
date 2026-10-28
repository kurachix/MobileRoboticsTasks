import React from 'react';
import { Task, TaskStatus } from '../types';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: string, newStatus: TaskStatus) => void;
  onAddTask: (status: TaskStatus) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskClick,
  onMoveTask,
  onAddTask,
}) => {
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const doingTasks = tasks.filter(t => t.status === 'doing');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        <KanbanColumn
          id="todo"
          title="A Fazer"
          tasks={todoTasks}
          onTaskClick={onTaskClick}
          onMoveTask={onMoveTask}
          onAddTask={onAddTask}
        />

        <KanbanColumn
          id="doing"
          title="Fazendo"
          tasks={doingTasks}
          onTaskClick={onTaskClick}
          onMoveTask={onMoveTask}
          onAddTask={onAddTask}
        />

        <KanbanColumn
          id="done"
          title="Completo"
          tasks={doneTasks}
          onTaskClick={onTaskClick}
          onMoveTask={onMoveTask}
          onAddTask={onAddTask}
        />
      </div>
    </div>
  );
};

