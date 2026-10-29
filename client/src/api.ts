import { Task, User, Comment, Delivery, AppNotification } from './types';

const API_BASE = '/api';

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Erro HTTP ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  getMe: () => request<{ user: User }>('/auth/me'),
  loginCredentials: (identifier: string, password: string) =>
    request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    }),
  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  // Usuários
  getUsers: () => request<{ users: User[] }>('/users'),
  updateProfile: (data: { password: string; avatarDataUrl?: string | null; presetAvatarUrl?: string | null }) =>
    request<{ user: User }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Tarefas
  getTasks: () => request<{ tasks: Task[] }>('/tasks'),
  getTaskDetails: (id: string) =>
    request<{ task: Task; comments: Comment[]; deliveries: Delivery[] }>(`/tasks/${id}`),
  createTask: (data: { title: string; description?: string; status?: string; due_date?: string | null; assigned_to?: string | null }) =>
    request<{ task: Task }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (id: string, data: Partial<Task>) =>
    request<{ task: Task }>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTask: (id: string) =>
    request<{ success: boolean }>(`/tasks/${id}`, {
      method: 'DELETE',
    }),

  // Comentários
  addComment: (taskId: string, content: string) =>
    request<{ comment: Comment }>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  deleteComment: (commentId: string) =>
    request<{ success: boolean }>(`/tasks/comments/${commentId}`, {
      method: 'DELETE',
    }),

  // Entregas
  addDelivery: (taskId: string, content: string, attachment_url?: string | null) =>
    request<{ delivery: Delivery }>(`/tasks/${taskId}/deliveries`, {
      method: 'POST',
      body: JSON.stringify({ content, attachment_url }),
    }),
  deleteDelivery: (deliveryId: string) =>
    request<{ success: boolean }>(`/tasks/deliveries/${deliveryId}`, {
      method: 'DELETE',
    }),

  // Notificações
  getNotifications: () =>
    request<{
      notifications: AppNotification[];
      unreadCount: number;
      notificationsEnabled: boolean;
      notificationsPrompted: boolean;
    }>('/notifications'),
  updateNotificationPreferences: (enabled: boolean) =>
    request<{
      user: User;
      notificationsEnabled: boolean;
      notificationsPrompted: boolean;
    }>('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify({ enabled }),
    }),
  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/notifications/read-all', {
      method: 'PUT',
    }),
  clearNotifications: () =>
    request<{ success: boolean }>('/notifications', {
      method: 'DELETE',
    }),
};
