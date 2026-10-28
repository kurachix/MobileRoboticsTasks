import React from 'react';
import { User } from '../types';
import { LogOut, Settings } from 'lucide-react';

interface HeaderProps {
  user: User;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onOpenProfile, onLogout }) => {
  return (
      <header className="sticky top-0 z-30 w-full bg-[#050508]/80 backdrop-blur-2xl border-b border-purple-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        {/* Bottom Subtle Glow Line */}
        <div className="absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
              {/* Stylized SENAI Logo */}
              <div className="relative group flex items-center">
                <div className="absolute -inset-1.5 rounded-xl bg-purple-600/25 blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <div className="relative p-1 rounded-xl bg-gradient-to-b from-white/[0.14] to-white/[0.03] border border-purple-400/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-[1.03]">
                  <img
                    src="/img/senai-logo.png"
                    alt="SENAI"
                    className="h-7 sm:h-8 w-auto rounded-lg object-contain block"
                  />
                </div>
              </div>

              {/* Profile & Logout */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="group flex items-center gap-2.5 pl-1.5 pr-3.5 py-1 rounded-full bg-[#11111a]/90 hover:bg-purple-500/15 border border-purple-500/25 hover:border-purple-400/60 shadow-[0_0_20px_rgba(139,92,246,0.12)] hover:shadow-[0_0_25px_rgba(139,92,246,0.3)] transition-all duration-200 cursor-pointer"
                >
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&backgroundColor=7c3aed`}
                    alt={user.name}
                    className="w-7 h-7 rounded-full border border-purple-400/50 object-cover bg-[#16161d]"
                  />
                  <span className="text-xs font-semibold text-zinc-100 group-hover:text-white max-w-[120px] truncate">
                    {user.name}
                  </span>
                  <Settings className="w-3.5 h-3.5 text-zinc-400 group-hover:text-purple-300 group-hover:rotate-90 transition-all duration-500" />
                </button>

                <button
                  onClick={onLogout}
                  title="Sair"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#11111a]/90 hover:bg-red-950/35 border border-white/[0.07] hover:border-red-500/40 text-zinc-400 hover:text-red-300 text-xs font-medium transition-all duration-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </div>
            </div>
          </header>
          );
};
