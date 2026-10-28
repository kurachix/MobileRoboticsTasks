export type TaskStatus = 'todo' | 'doing' | 'done';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface Delivery {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  attachment_url?: string | null;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  due_date?: string | null;
  assigned_to?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joins
  assigned_name?: string | null;
  assigned_avatar?: string | null;
  creator_name?: string | null;
  comment_count?: number;
  delivery_count?: number;
}

