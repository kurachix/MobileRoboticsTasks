import React from 'react';
import { User } from '../types';
import { Plus, LogOut } from 'lucide-react';

interface HeaderProps {
  user: User;
  onNewTask: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onNewTask, onLogout }) => {
  return (
            <header className="sticky top-0 z-30 w-full bg-[#09090b]/90 backdrop-blur-md border-b border-[#232330]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                {/* WorldSkills Brand */}
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center bg-purple-500/15 border border-purple-500/40 rotate-45">
                    <div className="w-2 h-2 bg-purple-500 -rotate-45" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs tracking-[0.2em] uppercase text-white">
                      WORLDSKILLS
                    </span>
                    <span className="text-purple-500 font-mono text-xs">//</span>
                    <span className="hidden sm:inline-block text-[11px] font-mono tracking-widest uppercase text-zinc-400">
                      MOBILE ROBOTICS
                    </span>
                  </div>
                </div>

                {/* Actions & Profile */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={onNewTask}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-mono uppercase tracking-wider transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tarefa</span>
                  </button>

                  <div className="h-4 w-px bg-[#232330]" />

                  {/* User Profile */}
                    <div className="flex items-center gap-2">
                      <img
                        src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
                        alt={user.name}
                        className="w-7 h-7 border border-purple-500/40 object-cover bg-[#16161d]"
                      />
                        <span className="hidden md:inline text-xs font-mono text-zinc-300 max-w-[130px] truncate">
                          {user.name}
                        </span>
                    </div>

                    <button
                      onClick={onLogout}
                      title="Sair"
                      className="p-1.5 text-zinc-500 hover:text-purple-400 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
            </header>
            );
};
