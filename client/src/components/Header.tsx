import React from 'react';
import { User } from '../types';
import { Plus, LogOut, Sparkles } from 'lucide-react';

interface HeaderProps {
  user: User;
  onNewTask: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onNewTask, onLogout }) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#09090b]/80 backdrop-blur-md border-b border-[#262636]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-white">Tasks</span>
          <span className="hidden sm:inline-block text-xs text-zinc-500 font-mono px-2 py-0.5 rounded bg-[#181822] border border-[#262636]">
            minimal
          </span>
        </div>

        {/* Actions & Profile */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNewTask}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors shadow-sm shadow-purple-900/40"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Tarefa</span>
          </button>

          <div className="h-4 w-px bg-[#262636]" />

          {/* User Profile */}
          <div className="flex items-center gap-2.5 pl-1">
            <img
              src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
              alt={user.name}
              className="w-8 h-8 rounded-full border border-purple-500/40 object-cover bg-[#181822]"
            />
            <span className="hidden md:inline text-sm text-zinc-300 font-medium max-w-[140px] truncate">
              {user.name}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Sair do sistema"
            className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

