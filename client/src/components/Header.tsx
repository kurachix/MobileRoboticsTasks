import React from 'react';
import { User } from '../types';
import { LogOut, Settings, LayoutGrid, PlusCircle } from 'lucide-react';

export type ActiveTab = 'create' | 'board';

interface HeaderProps {
  user: User;
  activeTab: ActiveTab;
  taskCount: number;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

      export const Header: React.FC<HeaderProps> = ({
        user,
        activeTab,
        taskCount,
        onChangeTab,
        onOpenProfile,
        onLogout,
}) => {
  return (
        <header className="sticky top-0 z-30 w-full bg-[#060609]/85 backdrop-blur-xl border-b border-purple-500/15">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* SENAI Logo */}
            <div className="flex items-center shrink-0">
              <div className="h-8 rounded-lg overflow-hidden border border-white/10 shadow-sm flex items-center justify-center">
                <img
                  src="/img/senai-logo.png"
                  alt="SENAI"
                  className="h-full w-auto object-contain"
                />
              </div>
            </div>

              {/* Center: Tela 1 (Nova Tarefa) -> Tela 2 (Kanban) */}
              <nav className="flex items-center p-1 rounded-2xl bg-[#0d0d14] border border-purple-500/20">
                <button
                  type="button"
                  onClick={() => onChangeTab('create')}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${activeTab === 'create'
                      ? 'bg-purple-700/80 text-white border border-purple-500/40 shadow-[0_0_18px_rgba(88,28,135,0.5)]'
                      : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Nova Tarefa</span>
                </button>

                      < button
            type="button"
                    onClick={() => onChangeTab('board')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${activeTab === 'board'
                        ? 'bg-purple-700/80 text-white border border-purple-500/40 shadow-[0_0_18px_rgba(88,28,135,0.5)]'
                        : 'text-zinc-400 hover:text-zinc-200'
                      }`}
          >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kanban</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'board'
                      ? 'bg-black/30 text-purple-100'
                      : 'bg-purple-500/15 text-purple-300'
                    }`}
                >
                  {taskCount}
                </span>
              </button>
            </nav>

              {/* Profile & Logout */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="group flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full bg-[#11111a] hover:bg-purple-500/15 border border-purple-500/20 hover:border-purple-500/50 transition-all duration-200 cursor-pointer"
                >
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&backgroundColor=7c3aed`}
                    alt={user.name}
                    className="w-6 h-6 rounded-full border border-purple-500/40 object-cover bg-[#16161d]"
                  />
                  <span className="hidden sm:inline text-xs font-semibold text-zinc-100 group-hover:text-white max-w-[110px] truncate">
                    {user.name}
                  </span>
                  <Settings className="w-3.5 h-3.5 text-zinc-500 group-hover:text-purple-300 group-hover:rotate-45 transition-all duration-300" />
                </button>

        <button
          onClick={onLogout}
          title="Sair"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#11111a] hover:bg-red-950/30 border border-zinc-800 hover:border-red-500/40 text-zinc-400 hover:text-red-300 text-xs font-medium transition-all duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Sair</span>
        </button>
      </div>
    </div>
    </header >
  );
};
