import fs from 'fs';
import path from 'path';
import { config } from './config.js';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at?: string;
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

let sqliteDb: any = null;
let useJsonFallback = false;

// Fallback in-memory/JSON store
interface JsonStorage {
  users: User[];
  tasks: Task[];
  deliveries: Delivery[];
  comments: Comment[];
}

const jsonDbPath = path.resolve(path.dirname(config.databasePath), 'fallback_store.json');
let memoryStore: JsonStorage = {
  users: [
    {
      id: 'demo_user_1',
      email: 'demo@tasks.minimal',
      name: 'Equipe Tasks',
      avatar_url: 'https://api.dicebear.com/7.x/bottts/svg?seed=tasks',
      created_at: new Date().toISOString()
    }
  ],
  tasks: [
    {
      id: '1',
      title: 'Configurar servidor VPS e Caddy com SSL',
      description: 'Garantir que a porta 80 e 443 estão liberadas no firewall e apontar o domínio DNS.',
      status: 'todo',
      due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
      assigned_to: 'demo_user_1',
      created_by: 'demo_user_1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Validar autenticação Google OAuth no frontend',
      description: 'Obter o client ID no console do Google Cloud e testar o fluxo de login em tela única.',
      status: 'doing',
      due_date: new Date(Date.now() + 86400000).toISOString(),
      assigned_to: 'demo_user_1',
      created_by: 'demo_user_1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Definir paleta de cores Dark Minimalist (Preto & Roxo)',
      description: 'Construir a identidade visual sóbria, contrastada e sem poluição.',
      status: 'done',
      due_date: new Date().toISOString(),
      assigned_to: 'demo_user_1',
      created_by: 'demo_user_1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  deliveries: [
    {
      id: 'del_1',
      task_id: '3',
      user_id: 'demo_user_1',
      content: 'Especificação do design system preto e roxo concluída.',
      attachment_url: 'https://github.com',
      created_at: new Date().toISOString()
    }
  ],
  comments: [
    {
      id: 'com_1',
      task_id: '2',
      user_id: 'demo_user_1',
      content: 'Client ID gerado com sucesso. Resta vincular no .env da VPS.',
      created_at: new Date().toISOString()
    }
  ]
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
    // Dynamic import / require of better-sqlite3
    const Database = require('better-sqlite3');
    sqliteDb = new Database(config.databasePath);
    sqliteDb.pragma('journal_mode = WAL');
    sqliteDb.pragma('foreign_keys = ON');

    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
      CREATE INDEX IF NOT EXISTS idx_deliveries_task_id ON deliveries(task_id);
    `);

    // Inserir usuário demo se banco estiver vazio
    const count = sqliteDb.prepare('SELECT count(*) as c FROM tasks').get() as { c: number };
    if (count.c === 0) {
      sqliteDb.prepare(`
        INSERT OR IGNORE INTO users (id, email, name, avatar_url)
        VALUES ('demo_user_1', 'demo@tasks.minimal', 'Equipe Tasks', 'https://api.dicebear.com/7.x/bottts/svg?seed=tasks')
      `).run();

      sqliteDb.prepare(`
        INSERT INTO tasks (id, title, description, status, due_date, assigned_to, created_by)
        VALUES 
          ('1', 'Configurar servidor VPS e Caddy com SSL', 'Garantir que a porta 80 e 443 estão liberadas no firewall e apontar o domínio DNS.', 'todo', datetime('now', '+2 days'), 'demo_user_1', 'demo_user_1'),
          ('2', 'Validar autenticação Google OAuth no frontend', 'Obter o client ID no console do Google Cloud e testar o fluxo de login em tela única.', 'doing', datetime('now', '+1 days'), 'demo_user_1', 'demo_user_1'),
          ('3', 'Definir paleta de cores Dark Minimalist (Preto & Roxo)', 'Construir a identidade visual sóbria, contrastada e sem poluição.', 'done', datetime('now'), 'demo_user_1', 'demo_user_1')
      `).run();
    }

    console.log('Banco de dados SQLite inicializado com sucesso em:', config.databasePath);
  } catch (err: any) {
    console.warn('Aviso: SQLite nativo não disponível, utilizando persistência JSON resiliente:', err.message);
    useJsonFallback = true;
    if (fs.existsSync(jsonDbPath)) {
      try {
        memoryStore = JSON.parse(fs.readFileSync(jsonDbPath, 'utf-8'));
      } catch (e) {}
    } else {
      saveJsonStore();
    }
  }
}

// Queries de Usuários
export function findUserById(id: string): User | null {
  if (!useJsonFallback && sqliteDb) {
    return (sqliteDb.prepare('SELECT * FROM users WHERE id = ?').get(id) as User) || null;
  }
  return memoryStore.users.find(u => u.id === id) || null;
}

export function findUserByEmail(email: string): User | null {
  if (!useJsonFallback && sqliteDb) {
    return (sqliteDb.prepare('SELECT * FROM users WHERE email = ?').get(email) as User) || null;
  }
  return memoryStore.users.find(u => u.email === email) || null;
}

export function upsertUser(user: User): User {
  if (!useJsonFallback && sqliteDb) {
    sqliteDb.prepare(`
      INSERT INTO users (id, email, name, avatar_url)
      VALUES (@id, @email, @name, @avatar_url)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        avatar_url = excluded.avatar_url
    `).run({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url || null,
    });
    return findUserById(user.id)!;
  }

  const existingIdx = memoryStore.users.findIndex(u => u.id === user.id || u.email === user.email);
  if (existingIdx >= 0) {
    memoryStore.users[existingIdx] = { ...memoryStore.users[existingIdx], ...user };
    saveJsonStore();
    return memoryStore.users[existingIdx];
  } else {
    const newUser = { ...user, created_at: new Date().toISOString() };
    memoryStore.users.push(newUser);
    saveJsonStore();
    return newUser;
  }
}

export function listUsers(): User[] {
  if (!useJsonFallback && sqliteDb) {
    return sqliteDb.prepare('SELECT id, email, name, avatar_url FROM users ORDER BY name ASC').all() as User[];
  }
  return memoryStore.users;
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
    `).all() as Task[];
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
    `).get(id) as Task;

    if (!task) return null;

    const comments = sqliteDb.prepare(`
      SELECT c.*, u.name as user_name, u.avatar_url as user_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.task_id = ?
      ORDER BY c.created_at ASC
    `).all(id) as Comment[];

    const deliveries = sqliteDb.prepare(`
      SELECT d.*, u.name as user_name, u.avatar_url as user_avatar
      FROM deliveries d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.task_id = ?
      ORDER BY d.created_at DESC
    `).all(id) as Delivery[];

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
      VALUES (@id, @title, @description, @status, @due_date, @assigned_to, @created_by, @created_at, @updated_at)
    `).run(newTask);
    return listTasks().find(t => t.id === id)!;
  }

  memoryStore.tasks.unshift(newTask);
  saveJsonStore();
  return listTasks().find(t => t.id === id)!;
}

export function updateTask(id: string, updates: Partial<Task>): Task | null {
  const now = new Date().toISOString();

  if (!useJsonFallback && sqliteDb) {
    const existing = sqliteDb.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task;
    if (!existing) return null;

    const merged = {
      title: updates.title !== undefined ? updates.title : existing.title,
      description: updates.description !== undefined ? updates.description : existing.description,
      status: updates.status !== undefined ? updates.status : existing.status,
      due_date: updates.due_date !== undefined ? updates.due_date : existing.due_date,
      assigned_to: updates.assigned_to !== undefined ? updates.assigned_to : existing.assigned_to,
      updated_at: now,
      id,
    };

    sqliteDb.prepare(`
      UPDATE tasks 
      SET title = @title, description = @description, status = @status, 
          due_date = @due_date, assigned_to = @assigned_to, updated_at = @updated_at
      WHERE id = @id
    `).run(merged);

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
    return info.changes > 0;
  }

  const initialLen = memoryStore.tasks.length;
  memoryStore.tasks = memoryStore.tasks.filter(t => t.id !== id);
  memoryStore.comments = memoryStore.comments.filter(c => c.task_id !== id);
  memoryStore.deliveries = memoryStore.deliveries.filter(d => d.task_id !== id);
  saveJsonStore();
  return memoryStore.tasks.length < initialLen;
}

// Entregas e Comentários
export function addDelivery(delivery: { task_id: string; user_id: string; content: string; attachment_url?: string }): Delivery {
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
      VALUES (@id, @task_id, @user_id, @content, @attachment_url, @created_at)
    `).run(newDelivery);

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
    return info.changes > 0;
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
      VALUES (@id, @task_id, @user_id, @content, @created_at)
    `).run(newComment);

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
    return info.changes > 0;
  }
  const len = memoryStore.comments.length;
  memoryStore.comments = memoryStore.comments.filter(c => c.id !== id);
  saveJsonStore();
  return memoryStore.comments.length < len;
}

