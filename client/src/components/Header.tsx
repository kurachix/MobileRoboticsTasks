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
        <header className="sticky top-0 z-30 w-full bg-[#060609]/80 backdrop-blur-xl border-b border-purple-500/15">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* WorldSkills Brand */}
            <div className="flex items-center gap-3.5 group cursor-default">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-lg bg-purple-600/20 blur-md group-hover:bg-purple-500/40 transition-all duration-300" />
                <div className="relative w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-indigo-700 p-[1px] rotate-45 group-hover:rotate-90 transition-transform duration-500 shadow-[0_0_15px_rgba(139,92,246,0.4)]">
                  <div className="w-full h-full rounded-[5px] bg-[#09090f] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-[1px] bg-purple-400" />
                  </div>
                </div>
              </div>

                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm tracking-wide text-white">
                    WorldSkills
                  </span>
                  <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    SKILL 23
                  </span>
                </div>
              </div>

              {/* Actions & Profile */}
              <div className="flex items-center gap-3">
                <button
                  onClick={onNewTask}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-xs font-semibold tracking-wide transition-all duration-200 shadow-[0_4px_20px_rgba(139,92,246,0.35)] hover:shadow-[0_6px_25px_rgba(139,92,246,0.55)] hover:-translate-y-0.5 active:translate-y-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Tarefa</span>
                </button>

                <div className="h-5 w-px bg-purple-500/15" />

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-full bg-[#11111a] border border-purple-500/20">
          <img
            src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`}
            alt={user.name}
            className="w-6 h-6 rounded-full border border-purple-500/40 object-cover bg-[#16161d]"
          />
          <span className="hidden md:inline text-xs font-medium text-zinc-200 max-w-[120px] truncate">
            {user.name}
          </span>
        </div>

        <button
          onClick={onLogout}
          title="Sair"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#11111a] hover:bg-red-950/30 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-300 text-xs font-medium transition-all duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </div>
    </header >
  );
};
