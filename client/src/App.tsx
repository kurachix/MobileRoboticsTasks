import React, { useState, useEffect, useCallback } from 'react';
import { User, Task, TaskStatus } from './types';
import { api } from './api';
import { Header } from './components/Header';
import { LoginView } from './components/LoginView';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskModal } from './components/TaskModal';

export const App: React.FC = () => {
  // Estado de Autenticação
  const [user, setUser] = useState<User | null>(null);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Estado do Kanban e Usuários
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isTasksLoading, setIsTasksLoading] = useState<boolean>(false);

  // Estado do Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [initialColumnStatus, setInitialColumnStatus] = useState<TaskStatus>('todo');

  // Carregar configurações de autenticação e verificar sessão existente
  useEffect(() => {
    async function initAuth() {
      try {
        const configData = await api.getConfig();
        setGoogleClientId(configData.googleClientId);

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

  const handleGoogleSuccess = async (credential: string) => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await api.loginGoogle(credential);
      setUser(res.user);
    } catch (err: any) {
      setAuthError(err.message || 'Falha ao autenticar com o Google.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await api.loginDemo('WorldSkills', 'ws@worldskills.org');
      setUser(res.user);
    } catch (err: any) {
      setAuthError(err.message || 'Falha no login de demonstração.');
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
    // Atualização otimista na interface
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await api.updateTask(taskId, { status: newStatus });
    } catch (err) {
      // Reverter se falhar
      loadWorkspaceData();
    }
  };

  const handleOpenNewTask = (status: TaskStatus = 'todo') => {
    setSelectedTask(null);
    setInitialColumnStatus(status);
    setIsModalOpen(true);
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
      <div className="min-h-screen flex items-center justify-center bg-[#060609]">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // 2. Primeira Tela: Apenas Login Google
  if (!user) {
    return (
      <LoginView
        googleClientId={googleClientId}
        onCredentialsLogin={handleCredentialsLogin}
        onGoogleSuccess={handleGoogleSuccess}
        onDemoLogin={handleDemoLogin}
        isLoading={isAuthLoading}
        error={authError}
      />
    );
  }

  // 3. Sistema Logado: Header Minimalista + Kanban das 3 Colunas
  return (
    <div className="relative min-h-screen bg-[#060609] text-zinc-100 flex flex-col overflow-x-hidden">
      {/* Ambient Background Lighting */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none" />
      <div className="fixed top-[-120px] left-1/4 w-[500px] h-[500px] bg-purple-600/12 blur-[150px] rounded-full pointer-events-none animate-float-slow" />
      <div className="fixed bottom-[-120px] right-1/4 w-[450px] h-[450px] bg-violet-700/10 blur-[140px] rounded-full pointer-events-none animate-float-reverse" />

      <Header
        user={user}
        onLogout={handleLogout}
      />

      <main className="relative z-10 flex-1 overflow-x-auto">
        {isTasksLoading && tasks.length === 0 ? (
          <div className="py-20 flex justify-center items-center">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <KanbanBoard
            tasks={tasks}
            users={users}
            onTaskClick={handleOpenEditTask}
            onMoveTask={handleMoveTask}
            onTaskCreated={handleTaskSaved}
          />
        )}
      </main>

      {/* Modal de Detalhes / Criação da Tarefa */}
      {isModalOpen && (
        <TaskModal
          task={selectedTask}
          initialStatus={initialColumnStatus}
          users={users}
          onClose={() => setIsModalOpen(false)}
          onSave={handleTaskSaved}
          onDelete={handleTaskDeleted}
        />
      )}
    </div>
  );
};

