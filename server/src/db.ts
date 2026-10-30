import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  notifications_enabled?: number;
  notifications_prompted?: number;
  created_at?: string;
}

export interface AppNotification {
  id: string;
  recipient_user_id: string;
  actor_user_id: string;
  actor_name: string;
  actor_avatar?: string | null;
  task_id?: string | null;
  type: 'task_created' | 'task_updated' | 'task_status' | 'task_assigned' | 'task_deleted' | 'task_comment' | 'task_delivery';
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'doing' | 'done';
  due_date?: string | null;
  assigned_to?: string | null;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  // Joins
  assigned_name?: string | null;
  assigned_avatar?: string | null;
  creator_name?: string | null;
  comment_count?: number;
  delivery_count?: number;
}

export interface Delivery {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  attachment_url?: string | null;
  created_at?: string;
  user_name?: string;
  user_avatar?: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at?: string;
  user_name?: string;
  user_avatar?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time?: string | null;
  color: string;
  created_by: string;
  creator_name?: string | null;
  creator_avatar?: string | null;
  created_at?: string;
}

let sqliteDb: DatabaseSync | null = null;
let useJsonFallback = false;

// Fallback in-memory/JSON store
interface JsonStorage {
  users: User[];
  tasks: Task[];
  deliveries: Delivery[];
  comments: Comment[];
  notifications: AppNotification[];
  calendar_events: CalendarEvent[];
}

const jsonDbPath = path.resolve(path.dirname(config.databasePath), 'fallback_store.json');
let memoryStore: JsonStorage = {
  users: [],
  tasks: [],
  deliveries: [],
  comments: [],
  notifications: [],
  calendar_events: []
};

function saveJsonStore() {
  if (useJsonFallback) {
    try {
      fs.writeFileSync(jsonDbPath, JSON.stringify(memoryStore, null, 2), 'utf-8');
    } catch (e) {
      console.error('Erro ao salvar fallback json:', e);
    }
  }
}

export function initDatabase() {
  const dir = path.dirname(config.databasePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    sqliteDb = new DatabaseSync(config.databasePath);
    sqliteDb.exec('PRAGMA foreign_keys = ON;');

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        avatar_url TEXT,
        notifications_enabled INTEGER DEFAULT 0,
        notifications_prompted INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        recipient_user_id TEXT NOT NULL,
        actor_user_id TEXT NOT NULL,
        actor_name TEXT NOT NULL,
        actor_avatar TEXT,
        task_id TEXT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipient_user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT NOT NULL CHECK(status IN ('todo', 'doing', 'done')) DEFAULT 'todo',
        due_date DATETIME,
        assigned_to TEXT,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS deliveries (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        attachment_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS comments (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS calendar_events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        event_date TEXT NOT NULL,
        event_time TEXT,
        color TEXT DEFAULT 'purple',
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
      CREATE INDEX IF NOT EXISTS idx_deliveries_task_id ON deliveries(task_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_user_id, is_read);
      CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(event_date);
    `);

    // Migração segura caso a tabela users já exista sem as colunas de notificação
    try {
      sqliteDb.exec(`ALTER TABLE users ADD COLUMN notifications_enabled INTEGER DEFAULT 0;`);
    } catch {}
    try {
      sqliteDb.exec(`ALTER TABLE users ADD COLUMN notifications_prompted INTEGER DEFAULT 0;`);
    } catch {}

    // Limpar tarefas genéricas de exemplo e usuários extras antigos
    sqliteDb.prepare(`DELETE FROM tasks WHERE id IN ('1', '2', '3') AND created_by = 'demo_user_1'`).run();
    sqliteDb.prepare(`DELETE FROM users WHERE id NOT IN ('user_carlos', 'user_nicolle', 'user_kurachi', 'user_admin')`).run();

    // Garantir que os usuários da equipe SPSkills / WorldSkills existam para designação
    const seedUsers = [
      {
        id: 'user_carlos',
        email: 'carlos@spskills.com',
        name: 'Carlos',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Carlos&backgroundColor=7c3aed',
      },
      {
        id: 'user_nicolle',
        email: 'nicolle@spskills.com',
        name: 'Nicolle',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Nicolle&backgroundColor=9333ea',
      },
      {
        id: 'user_kurachi',
        email: 'kurachi@spskills.com',
        name: 'Kurachi',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Kurachi&backgroundColor=6d28d9',
      },
      {
        id: 'user_admin',
        email: 'admin@admin.com',
        name: 'Admin',
        avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin&backgroundColor=4c1d95',
      },
    ];

    const stmtUser = sqliteDb.prepare(`
      INSERT OR IGNORE INTO users (id, email, name, avatar_url)
      VALUES (?, ?, ?, ?)
    `);

    for (const u of seedUsers) {
      stmtUser.run(u.id, u.email, u.name, u.avatar_url);
    }

    console.log('✦ SQLite Nativo (node:sqlite) inicializado com sucesso em:', config.databasePath);
  } catch (err: any) {
    console.warn('Aviso: SQLite nativo não disponível, utilizando persistência JSON resiliente:', err.message);
    useJsonFallback = true;
    if (fs.existsSync(jsonDbPath)) {
      try {
        memoryStore = JSON.parse(fs.readFileSync(jsonDbPath, 'utf-8'));
      } catch (e) { }
    } else {
      saveJsonStore();
    }
  }
}

// Queries de Usuários
export function findUserById(id: string): User | null {
  if (!useJsonFallback && sqliteDb) {
    return (sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as User) || null;
  }
  return memoryStore.users.find(u => u.id === id) || null;
}

export function findUserByEmail(email: string): User | null {
  if (!useJsonFallback && sqliteDb) {
    return (sqliteDb.prepare('SELECT * FROM users WHERE email = ?').get(email) as unknown as User) || null;
  }
  return memoryStore.users.find(u => u.email === email) || null;
}

export function upsertUser(user: User): User {
  if (!useJsonFallback && sqliteDb) {
    sqliteDb.prepare(`
      INSERT INTO users (id, email, name, avatar_url)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        avatar_url = COALESCE(users.avatar_url, excluded.avatar_url)
    `).run(user.id, user.email, user.name, user.avatar_url || null);
    return findUserById(user.id)!;
  }

  const existingIdx = memoryStore.users.findIndex(u => u.id === user.id || u.email === user.email);
  if (existingIdx >= 0) {
    memoryStore.users[existingIdx] = {
      ...memoryStore.users[existingIdx],
      ...user,
      avatar_url: memoryStore.users[existingIdx].avatar_url || user.avatar_url,
    };
    saveJsonStore();
    return memoryStore.users[existingIdx];
  } else {
    const newUser = { ...user, created_at: new Date().toISOString() };
    memoryStore.users.push(newUser);
    saveJsonStore();
    return newUser;
  }
}

export function updateUserAvatar(id: string, avatarUrl: string): User | null {
  if (!useJsonFallback && sqliteDb) {
    sqliteDb.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, id);
    return findUserById(id);
  }
  const idx = memoryStore.users.findIndex(u => u.id === id);
  if (idx < 0) return null;
  memoryStore.users[idx].avatar_url = avatarUrl;
  saveJsonStore();
  return memoryStore.users[idx];
}

export function listUsers(): User[] {
  const allowedIds = ['user_carlos', 'user_nicolle', 'user_kurachi'];
  if (!useJsonFallback && sqliteDb) {
    return sqliteDb.prepare(`
      SELECT id, email, name, avatar_url
      FROM users
      WHERE id IN ('user_carlos', 'user_nicolle', 'user_kurachi')
      ORDER BY CASE id
        WHEN 'user_carlos' THEN 1
        WHEN 'user_nicolle' THEN 2
        WHEN 'user_kurachi' THEN 3
        ELSE 4
      END
    `).all() as unknown as User[];
  }
  return memoryStore.users.filter(u => allowedIds.includes(u.id));
}

// Queries de Tarefas
export function listTasks(): Task[] {
  if (!useJsonFallback && sqliteDb) {
    return sqliteDb.prepare(`
      SELECT 
        t.*,
        u.name as assigned_name,
        u.avatar_url as assigned_avatar,
        creator.name as creator_name,
        (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) as comment_count,
        (SELECT COUNT(*) FROM deliveries d WHERE d.task_id = t.id) as delivery_count
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      ORDER BY t.created_at DESC
    `).all() as unknown as Task[];
  }

  return memoryStore.tasks.map(t => {
    const assignee = memoryStore.users.find(u => u.id === t.assigned_to);
    const creator = memoryStore.users.find(u => u.id === t.created_by);
    const commentCount = memoryStore.comments.filter(c => c.task_id === t.id).length;
    const deliveryCount = memoryStore.deliveries.filter(d => d.task_id === t.id).length;

    return {
      ...t,
      assigned_name: assignee?.name || null,
      assigned_avatar: assignee?.avatar_url || null,
      creator_name: creator?.name || null,
      comment_count: commentCount,
      delivery_count: deliveryCount,
    };
  });
}

export function getTaskById(id: string): { task: Task; comments: Comment[]; deliveries: Delivery[] } | null {
  if (!useJsonFallback && sqliteDb) {
    const task = sqliteDb.prepare(`
      SELECT 
        t.*,
        u.name as assigned_name,
        u.avatar_url as assigned_avatar,
        creator.name as creator_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users creator ON t.created_by = creator.id
      WHERE t.id = ?
    `).get(id) as unknown as Task;

    if (!task) return null;

    const comments = sqliteDb.prepare(`
      SELECT c.*, u.name as user_name, u.avatar_url as user_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
      ORDER BY c.created_at ASC
    `).all(id) as unknown as Comment[];

    const deliveries = sqliteDb.prepare(`
      SELECT d.*, u.name as user_name, u.avatar_url as user_avatar
      FROM deliveries d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.task_id = ?
      ORDER BY d.created_at DESC
    `).all(id) as unknown as Delivery[];

    return { task, comments, deliveries };
  }

  const task = memoryStore.tasks.find(t => t.id === id);
  if (!task) return null;

  const assignee = memoryStore.users.find(u => u.id === task.assigned_to);
  const creator = memoryStore.users.find(u => u.id === task.created_by);

  const comments = memoryStore.comments
    .filter(c => c.task_id === id)
    .map(c => {
      const u = memoryStore.users.find(user => user.id === c.user_id);
      return { ...c, user_name: u?.name, user_avatar: u?.avatar_url };
    });

  const deliveries = memoryStore.deliveries
    .filter(d => d.task_id === id)
    .map(d => {
      const u = memoryStore.users.find(user => user.id === d.user_id);
      return { ...d, user_name: u?.name, user_avatar: u?.avatar_url };
    });

  return {
    task: {
      ...task,
      assigned_name: assignee?.name || null,
      assigned_avatar: assignee?.avatar_url || null,
      creator_name: creator?.name || null,
    },
    comments,
    deliveries,
  };
}

export function createTask(task: Partial<Task> & { title: string; created_by: string }): Task {
  const id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const newTask: Task = {
    id,
    title: task.title,
    description: task.description || '',
    status: task.status || 'todo',
    due_date: task.due_date || null,
    assigned_to: task.assigned_to || null,
    created_by: task.created_by,
    created_at: now,
    updated_at: now,
  };

  if (!useJsonFallback && sqliteDb) {
    sqliteDb.prepare(`
      INSERT INTO tasks (id, title, description, status, due_date, assigned_to, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newTask.id,
      newTask.title,
      newTask.description,
      newTask.status,
      newTask.due_date,
      newTask.assigned_to,
      newTask.created_by,
      newTask.created_at!,
      newTask.updated_at!
    );
    return listTasks().find(t => t.id === id)!;
  }

  memoryStore.tasks.unshift(newTask);
  saveJsonStore();
  return listTasks().find(t => t.id === id)!;
}

export function updateTask(id: string, updates: Partial<Task>): Task | null {
  const now = new Date().toISOString();

  if (!useJsonFallback && sqliteDb) {
    const existing = sqliteDb.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as unknown as Task;
    if (!existing) return null;

    const title = updates.title !== undefined ? updates.title : existing.title;
    const description = updates.description !== undefined ? updates.description : existing.description;
    const status = updates.status !== undefined ? updates.status : existing.status;
    const due_date = updates.due_date !== undefined ? updates.due_date : existing.due_date;
    const assigned_to = updates.assigned_to !== undefined ? updates.assigned_to : existing.assigned_to;

    sqliteDb.prepare(`
      UPDATE tasks 
      SET title = ?, description = ?, status = ?, 
          due_date = ?, assigned_to = ?, updated_at = ?
      WHERE id = ?
    `).run(title, description, status, due_date, assigned_to, now, id);

    return listTasks().find(t => t.id === id) || null;
  }

  const idx = memoryStore.tasks.findIndex(t => t.id === id);
  if (idx < 0) return null;

  memoryStore.tasks[idx] = {
    ...memoryStore.tasks[idx],
    ...updates,
    updated_at: now,
  };
  saveJsonStore();
  return listTasks().find(t => t.id === id) || null;
}

export function deleteTask(id: string): boolean {
  if (!useJsonFallback && sqliteDb) {
    const info = sqliteDb.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return Number(info.changes) > 0;
  }

  const initialLen = memoryStore.tasks.length;
  memoryStore.tasks = memoryStore.tasks.filter(t => t.id !== id);
  memoryStore.comments = memoryStore.comments.filter(c => c.task_id !== id);
  memoryStore.deliveries = memoryStore.deliveries.filter(d => d.task_id !== id);
  saveJsonStore();
  return memoryStore.tasks.length < initialLen;
}

// Entregas e Comentários
export function addDelivery(delivery: { task_id: string; user_id: string; content: string; attachment_url?: string | null }): Delivery {
  const id = `del_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const newDelivery: Delivery = {
    id,
    task_id: delivery.task_id,
    user_id: delivery.user_id,
    content: delivery.content,
    attachment_url: delivery.attachment_url || null,
    created_at: now,
  };

  if (!useJsonFallback && sqliteDb) {
    sqliteDb.prepare(`
      INSERT INTO deliveries (id, task_id, user_id, content, attachment_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      newDelivery.id,
      newDelivery.task_id,
      newDelivery.user_id,
      newDelivery.content,
      newDelivery.attachment_url,
      newDelivery.created_at!
    );

    const user = findUserById(delivery.user_id);
    return {
      ...newDelivery,
      user_name: user?.name,
      user_avatar: user?.avatar_url,
    };
  }

  memoryStore.deliveries.unshift(newDelivery);
  saveJsonStore();
  const user = findUserById(delivery.user_id);
  return {
    ...newDelivery,
    user_name: user?.name,
    user_avatar: user?.avatar_url,
  };
}

export function deleteDelivery(id: string): boolean {
  if (!useJsonFallback && sqliteDb) {
    const info = sqliteDb.prepare('DELETE FROM deliveries WHERE id = ?').run(id);
    return Number(info.changes) > 0;
  }
  const len = memoryStore.deliveries.length;
  memoryStore.deliveries = memoryStore.deliveries.filter(d => d.id !== id);
  saveJsonStore();
  return memoryStore.deliveries.length < len;
}

export function addComment(comment: { task_id: string; user_id: string; content: string }): Comment {
  const id = `com_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const newComment: Comment = {
    id,
    task_id: comment.task_id,
    user_id: comment.user_id,
    content: comment.content,
    created_at: now,
  };

  if (!useJsonFallback && sqliteDb) {
    sqliteDb.prepare(`
      INSERT INTO comments (id, task_id, user_id, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      newComment.id,
      newComment.task_id,
      newComment.user_id,
      newComment.content,
      newComment.created_at!
    );

    const user = findUserById(comment.user_id);
    return {
      ...newComment,
      user_name: user?.name,
      user_avatar: user?.avatar_url,
    };
  }

  memoryStore.comments.push(newComment);
  saveJsonStore();
  const user = findUserById(comment.user_id);
  return {
    ...newComment,
    user_name: user?.name,
    user_avatar: user?.avatar_url,
  };
}

export function deleteComment(id: string): boolean {
  if (!useJsonFallback && sqliteDb) {
    const info = sqliteDb.prepare('DELETE FROM comments WHERE id = ?').run(id);
    return Number(info.changes) > 0;
  }
  const len = memoryStore.comments.length;
  memoryStore.comments = memoryStore.comments.filter(c => c.id !== id);
  saveJsonStore();
  return memoryStore.comments.length < len;
}

// ==========================================
// Preferências e Queries de Notificações
// ==========================================

export function setUserNotificationPreference(userId: string, enabled: boolean): User | null {
  const val = enabled ? 1 : 0;
  if (!useJsonFallback && sqliteDb) {
    sqliteDb.prepare('UPDATE users SET notifications_enabled = ?, notifications_prompted = 1 WHERE id = ?').run(val, userId);
    return findUserById(userId);
  }
  const idx = memoryStore.users.findIndex(u => u.id === userId);
  if (idx < 0) return null;
  memoryStore.users[idx].notifications_enabled = val;
  memoryStore.users[idx].notifications_prompted = 1;
  saveJsonStore();
  return memoryStore.users[idx];
}

export function getUsersWithNotificationsEnabled(excludeUserId: string): User[] {
  if (!useJsonFallback && sqliteDb) {
    return sqliteDb.prepare(`
      SELECT * FROM users
      WHERE notifications_enabled = 1 AND id != ?
    `).all(excludeUserId) as unknown as User[];
  }
  return memoryStore.users.filter(u => u.notifications_enabled === 1 && u.id !== excludeUserId);
}

export function createNotification(
  notif: Omit<AppNotification, 'id' | 'is_read' | 'created_at'>
): AppNotification {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const newNotif: AppNotification = {
    id,
    recipient_user_id: notif.recipient_user_id,
    actor_user_id: notif.actor_user_id,
    actor_name: notif.actor_name,
    actor_avatar: notif.actor_avatar || null,
    task_id: notif.task_id || null,
    type: notif.type,
    title: notif.title,
    message: notif.message,
    is_read: 0,
    created_at: now,
  };

  if (!useJsonFallback && sqliteDb) {
    sqliteDb.prepare(`
      INSERT INTO notifications (
        id, recipient_user_id, actor_user_id, actor_name, actor_avatar,
        task_id, type, title, message, is_read, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
      newNotif.id,
      newNotif.recipient_user_id,
      newNotif.actor_user_id,
      newNotif.actor_name,
      newNotif.actor_avatar,
      newNotif.task_id,
      newNotif.type,
      newNotif.title,
      newNotif.message,
      newNotif.created_at
    );
    return newNotif;
  }

  if (!memoryStore.notifications) {
    memoryStore.notifications = [];
  }
  memoryStore.notifications.unshift(newNotif);
  saveJsonStore();
  return newNotif;
}

export function listUserNotifications(userId: string, limit = 40): AppNotification[] {
  if (!useJsonFallback && sqliteDb) {
    return sqliteDb.prepare(`
      SELECT * FROM notifications
      WHERE recipient_user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).all(userId, limit) as unknown as AppNotification[];
  }
  return (memoryStore.notifications || [])
    .filter(n => n.recipient_user_id === userId)
    .slice(0, limit);
}

export function markNotificationRead(id: string, userId: string): boolean {
  if (!useJsonFallback && sqliteDb) {
    const info = sqliteDb.prepare(`
      UPDATE notifications SET is_read = 1
      WHERE id = ? AND recipient_user_id = ?
    `).run(id, userId);
    return Number(info.changes) > 0;
  }
  const n = (memoryStore.notifications || []).find(item => item.id === id && item.recipient_user_id === userId);
  if (!n) return false;
  n.is_read = 1;
  saveJsonStore();
  return true;
}

export function markAllNotificationsRead(userId: string): boolean {
  if (!useJsonFallback && sqliteDb) {
    const info = sqliteDb.prepare(`
      UPDATE notifications SET is_read = 1
      WHERE recipient_user_id = ? AND is_read = 0
    `).run(userId);
    return Number(info.changes) > 0;
  }
  (memoryStore.notifications || []).forEach(item => {
    if (item.recipient_user_id === userId) item.is_read = 1;
  });
  saveJsonStore();
  return true;
}

export function clearUserNotifications(userId: string): boolean {
  if (!useJsonFallback && sqliteDb) {
    const info = sqliteDb.prepare(`
      DELETE FROM notifications WHERE recipient_user_id = ?
    `).run(userId);
    return Number(info.changes) > 0;
  }
  memoryStore.notifications = (memoryStore.notifications || []).filter(n => n.recipient_user_id !== userId);
  saveJsonStore();
  return true;
}

// ==========================================
// Queries de Eventos de Calendário (Datas Marcadas)
// ==========================================

export function listCalendarEvents(): CalendarEvent[] {
  if (!useJsonFallback && sqliteDb) {
    return sqliteDb.prepare(`
      SELECT
        e.*,
        u.name as creator_name,
        u.avatar_url as creator_avatar
      FROM calendar_events e
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.event_date ASC, e.event_time ASC, e.created_at ASC
    `).all() as unknown as CalendarEvent[];
  }
  return (memoryStore.calendar_events || []).map(e => {
    const creator = memoryStore.users.find(u => u.id === e.created_by);
    return {
      ...e,
      creator_name: creator?.name || null,
      creator_avatar: creator?.avatar_url || null,
    };
  });
}

export function getCalendarEventById(id: string): CalendarEvent | null {
  if (!useJsonFallback && sqliteDb) {
    return (
      (sqliteDb.prepare(`
        SELECT
          e.*,
          u.name as creator_name,
          u.avatar_url as creator_avatar
        FROM calendar_events e
        LEFT JOIN users u ON e.created_by = u.id
        WHERE e.id = ?
      `).get(id) as unknown as CalendarEvent) || null
    );
  }
  const found = (memoryStore.calendar_events || []).find(e => e.id === id);
  if (!found) return null;
  const creator = memoryStore.users.find(u => u.id === found.created_by);
  return {
    ...found,
    creator_name: creator?.name || null,
    creator_avatar: creator?.avatar_url || null,
  };
}

export function createCalendarEvent(evt: {
  title: string;
  description?: string;
  event_date: string;
  event_time?: string | null;
  color?: string;
  created_by: string;
}): CalendarEvent {
  const id = `cal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const newEvent: CalendarEvent = {
    id,
    title: evt.title,
    description: evt.description || '',
    event_date: evt.event_date,
    event_time: evt.event_time || null,
    color: evt.color || 'purple',
    created_by: evt.created_by,
    created_at: now,
  };

  if (!useJsonFallback && sqliteDb) {
    sqliteDb.prepare(`
      INSERT INTO calendar_events (id, title, description, event_date, event_time, color, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newEvent.id,
      newEvent.title,
      newEvent.description,
      newEvent.event_date,
      newEvent.event_time,
      newEvent.color,
      newEvent.created_by,
      newEvent.created_at!
    );
    return getCalendarEventById(id)!;
  }

  if (!memoryStore.calendar_events) {
    memoryStore.calendar_events = [];
  }
  memoryStore.calendar_events.push(newEvent);
  saveJsonStore();
  return getCalendarEventById(id)!;
}

export function deleteCalendarEvent(id: string): boolean {
  if (!useJsonFallback && sqliteDb) {
    const info = sqliteDb.prepare('DELETE FROM calendar_events WHERE id = ?').run(id);
    return Number(info.changes) > 0;
  }
  const len = (memoryStore.calendar_events || []).length;
  memoryStore.calendar_events = (memoryStore.calendar_events || []).filter(e => e.id !== id);
  saveJsonStore();
  return memoryStore.calendar_events.length < len;
}
