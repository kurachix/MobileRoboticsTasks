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
      ? new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
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
      className="group relative bg-[#16161d] hover:bg-[#1a1a24] border border-[#232330] hover:border-purple-500/60 p-3.5 transition-all duration-150 cursor-pointer"
    >
      {/* Left Accent Line */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-transparent group-hover:bg-purple-500 transition-colors" />

      {/* Top row: Title & Quick Move buttons */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-xs font-medium text-zinc-100 group-hover:text-white leading-snug line-clamp-2">
              {task.title}
            </h3>

              <div className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity shrink-0">
                {task.status !== 'todo' && (
                  <button
                    onClick={handlePrev}
                    className="p-1 hover:bg-[#232330] text-zinc-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}

                {task.status !== 'done' ? (
                  <button
                    onClick={handleNext}
                    className="p-1 hover:bg-purple-600/30 text-purple-400 hover:text-purple-200 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                    <span className="p-1 text-purple-400">
                      <Check className="w-3.5 h-3.5" />
                    </span>
          )}
                  </div>
      </div>

              {task.description && (
                  <p className="text-[11px] text-zinc-500 line-clamp-1 mb-2.5">
                    {task.description}
                  </p>
      )}

                  {/* Footer / Badges */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#232330]/70 text-[11px] font-mono text-zinc-400">
                      {/* Left: Designação */}
                      <div className="flex items-center gap-1.5">
                        {task.assigned_name ? (
                            <div className="flex items-center gap-1.5">
                              <img
                                src={task.assigned_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${task.assigned_name}`}
                                alt={task.assigned_name}
                                className="w-4 h-4 border border-purple-500/40 bg-[#111116]"
                              />
                                <span className="text-[10px] text-zinc-300 max-w-[85px] truncate uppercase">
                                  {task.assigned_name.split(' ')[0]}
                                </span>
                            </div>
                            ) : (
                            <span className="text-[10px] text-zinc-700">—</span>
          )}
                          </div>

        {/* Right: Date, Deliveries & Comments Count */}
                          <div className="flex items-center gap-2.5">
                            {formattedDate && (
                              <div
              className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-red-400' : 'text-zinc-400'
                                  }`}
                              >
                                <Calendar className="w-3 h-3" />
                                <span>{formattedDate}</span>
                              </div>
                            )}

                            {(task.delivery_count || 0) > 0 && (
                                <div className="flex items-center gap-1 text-[10px] text-purple-400">
                                  <Paperclip className="w-3 h-3" />
                                  <span>{task.delivery_count}</span>
                                </div>
          )}

                                {(task.comment_count || 0) > 0 && (
                                    <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                                      <MessageSquare className="w-3 h-3" />
                                      <span>{task.comment_count}</span>
                                    </div>
          )}
                                  </div>
      </div>
    </div>
                          );
};
