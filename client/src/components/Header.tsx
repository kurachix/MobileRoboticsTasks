import React from 'react';
import { User } from '../types';
import { LogOut } from 'lucide-react';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

  export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
    return (
      <header className="sticky top-0 z-30 w-full bg-[#060609]/85 backdrop-blur-xl border-b border-purple-500/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* WorldSkills & SENAI Logos */}
          <div className="flex items-center gap-3">
            <div className="h-9 px-2.5 py-1 rounded-xl bg-white/95 shadow-[0_0_18px_rgba(139,92,246,0.2)] flex items-center justify-center">
              <img
                src="/img/worldskills-logo.png"
                alt="WorldSkills"
                className="h-7 w-auto object-contain"
              />
            </div>

            <div className="h-7 rounded-lg overflow-hidden border border-white/10 shadow-sm flex items-center justify-center">
              <img
                src="/img/senai-logo.png"
                alt="SENAI"
                className="h-full w-auto object-contain"
              />
            </div>
          </div>

          {/* Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full bg-[#11111a] border border-purple-500/20">
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&backgroundColor=7c3aed`}
                alt={user.name}
                className="w-6 h-6 rounded-full border border-purple-500/40 object-cover bg-[#16161d]"
              />
              <span className="text-xs font-semibold text-zinc-100 max-w-[120px] truncate">
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
      </header>
    );
  };
