import React, { useState } from 'react';
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
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const doingTasks = tasks.filter(t => t.status === 'doing');
  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <KanbanColumn
              id="todo"
              title="A Fazer"
              tasks={todoTasks}
              draggingTaskId={draggingTaskId}
              onTaskClick={onTaskClick}
              onMoveTask={onMoveTask}
              onAddTask={onAddTask}
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
              onAddTask={onAddTask}
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
              onAddTask={onAddTask}
              onDragStart={setDraggingTaskId}
              onDragEnd={() => setDraggingTaskId(null)}
            />
          </div>
        </div>
        );
};
