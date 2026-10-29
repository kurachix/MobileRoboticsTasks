import React, { useState, useEffect, useCallback } from 'react';
import { User, Task, TaskStatus } from './types';
import { api } from './api';
import { Header, ActiveTab } from './components/Header';
import { LoginView } from './components/LoginView';
import { KanbanBoard } from './components/KanbanBoard';
import { CreateTaskView } from './components/CreateTaskView';
import { TaskModal } from './components/TaskModal';
import { ProfileModal } from './components/ProfileModal';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { NotificationCenter } from './components/NotificationCenter';

export const App: React.FC = () => {
  // Estado de Autenticação
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Estado das 2 Guias (Tela 1: Nova Tarefa -> Tela 2: Kanban)
  const [activeTab, setActiveTab] = useState<ActiveTab>('create');

  // Estado do Kanban e Usuários
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState<boolean>(false);

  // Estado dos Modais e Notificações
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Verificar sessão existente
  useEffect(() => {
    async function initAuth() {
      try {
        const meData = await api.getMe();
        if (meData?.user) {
          setUser(meData.user);
        }
      } catch (e) {
        // Usuário não autenticado - fluxo normal de primeira tela
      } finally {
        setIsAuthLoading(false);
      }
    }
    initAuth();
  }, []);

  // Carregar tarefas e usuários do sistema quando autenticado
  const loadWorkspaceData = useCallback(async () => {
    if (!user) return;
    setIsTasksLoading(true);
    try {
      const [tasksRes, usersRes] = await Promise.all([
        api.getTasks(),
        api.getUsers(),
      ]);
      setTasks(tasksRes.tasks || []);
      setUsers(usersRes.users || []);
    } catch (err: any) {
      console.error('Erro ao carregar dados do workspace:', err);
    } finally {
      setIsTasksLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadWorkspaceData();
    }
  }, [user, loadWorkspaceData]);

  // Handlers de Login
  const handleCredentialsLogin = async (identifier: string, password: string) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await api.loginCredentials(identifier, password);
      setUser(res.user);
    } catch (err: any) {
      setAuthError(err.message || 'Credenciais inválidas.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) { }
    setUser(null);
    setTasks([]);
  };

  // Handlers de Tarefas
  const handleMoveTask = async (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.updateTask(taskId, { status: newStatus });
    } catch (err) {
      loadWorkspaceData();
    }
  };

  const handleOpenEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleTaskSaved = (savedTask: Task) => {
    setTasks(prev => {
      const exists = prev.some(t => t.id === savedTask.id);
      if (exists) {
        return prev.map(t => (t.id === savedTask.id ? savedTask : t));
      }
      return [savedTask, ...prev];
    });
  };

  const handleTaskDeleted = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await api.deleteTask(taskId);
    } catch (err) {
      loadWorkspaceData();
    }
  };

  // 1. Tela de Carregamento Inicial
  if (isAuthLoading && !user) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#060609]">
        <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  // 2. Primeira Tela: Login
  if (!user) {
    return (
      <>
        <LoginView
          onCredentialsLogin={handleCredentialsLogin}
          isLoading={isAuthLoading}
          error={authError}
        />
        <PwaInstallPrompt />
      </>
    );
  }

  // 3. Sistema Logado: Header com 2 Guias + Conteúdo da Guia Ativa
  return (
    <div className="relative min-h-dvh bg-[#060609] text-zinc-100 flex flex-col overflow-x-hidden">
      {/* Ambient Background Lighting */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none" />
      <div className="fixed top-[-120px] left-1/4 w-[500px] h-[500px] bg-purple-900/15 blur-[150px] rounded-full pointer-events-none animate-float-slow" />
      <div className="fixed bottom-[-120px] right-1/4 w-[450px] h-[450px] bg-violet-950/15 blur-[140px] rounded-full pointer-events-none animate-float-reverse" />

      <Header
        user={user}
        activeTab={activeTab}
        taskCount={tasks.length}
        unreadNotifications={unreadNotifications}
        notificationsEnabled={notificationsEnabled}
        onChangeTab={setActiveTab}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
      />

      <main className="relative z-10 flex-1 overflow-x-hidden">
        {isTasksLoading && tasks.length === 0 ? (
          <div className="py-20 flex justify-center items-center">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'board' ? (
          <KanbanBoard
            tasks={tasks}
            onTaskClick={handleOpenEditTask}
            onMoveTask={handleMoveTask}
          />
        ) : (
          <CreateTaskView
            users={users}
            onTaskCreated={newTask => {
              handleTaskSaved(newTask);
              setActiveTab('board');
            }}
          />
        )}
      </main>

      {/* Modal de Detalhes / Edição da Tarefa */}
      {isModalOpen && (
        <TaskModal
          task={selectedTask}
          users={users}
          onClose={() => setIsModalOpen(false)}
          onSave={handleTaskSaved}
          onDelete={handleTaskDeleted}
        />
      )}

      {/* Modal de Configuração de Perfil */}
      {isProfileOpen && (
        <ProfileModal
          user={user}
          onClose={() => setIsProfileOpen(false)}
          onUpdated={updatedUser => {
            setUser(updatedUser);
            setNotificationsEnabled(Boolean(updatedUser.notifications_enabled));
            loadWorkspaceData();
          }}
        />
      )}

      {/* Central de Notificações e Pedido Pós-Login (100% Direcionado ao Usuário) */}
      <NotificationCenter
        user={user}
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onUnreadCountChange={setUnreadNotifications}
        onNotificationsEnabledChange={(enabled, updatedUser) => {
          setNotificationsEnabled(enabled);
          if (updatedUser) {
            setUser(updatedUser);
          }
        }}
        onTaskActivity={loadWorkspaceData}
        onOpenTaskById={taskId => {
          const found = tasks.find(t => t.id === taskId);
          if (found) {
            setActiveTab('board');
            handleOpenEditTask(found);
          } else {
            loadWorkspaceData();
          }
        }}
      />

      {/* Prompt de Instalação do PWA em dispositivos Mobile */}
      <PwaInstallPrompt />
    </div>
  );
};
