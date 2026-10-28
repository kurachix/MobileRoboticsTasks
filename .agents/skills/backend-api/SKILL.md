---
name: backend-api
description: >-
  Guia e procedimentos para implementação, manutenção e deploy do back-end em VPS.
  Use esta skill para gerenciar a autenticação Google OAuth2, banco de dados SQLite,
  endpoints da API REST de tarefas, comentários e entregas, além de containers Docker e proxy reverso.
---

# Back-End & Deployment API Guide — Minimalist To-Do

Esta skill orienta o desenvolvimento robusto do servidor, persistência de dados e a publicação em servidor VPS com suporte a HTTPS automático.

---

## 1. Arquitetura do Back-End

O back-end foi desenhado para ser leve, rápido e de baixíssimo consumo de memória (ideal para instâncias VPS básicas a partir de 512MB/1GB de RAM).

- **Linguagem**: Node.js com TypeScript / Express.
- **Banco de Dados**: SQLite com `better-sqlite3` ou `sqlite3`.
- **Modo do Banco**: Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) para permitir leituras concorrentes ultrarrápidas sem travamentos de escrita.
- **Autenticação**:
  - Verificação de ID Token do Google via `google-auth-library`.
  - Sessão mantida por JWT (`jsonwebtoken`) assinado pelo servidor em cookie seguro (`HttpOnly`, `SameSite=Lax`).

---

## 2. Esquema do Banco de Dados e Migrations

Execute o script de inicialização do banco ao iniciar o servidor:

```typescript
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/app.db');
export const db = new Database(dbPath);

// Configurações de alta performance do SQLite
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
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
}
```

---

## 3. Autenticação Google OAuth2

### Fluxo de Autenticação:
1. O Front-end obtém o `credential` (ID Token JWT emitido pelo Google Identity Services).
2. O Front-end envia um `POST /api/auth/google` com o payload `{ "credential": "<token>" }`.
3. O Back-end valida a assinatura contra as chaves públicas do Google:
   ```typescript
   import { OAuth2Client } from 'google-auth-library';
   const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

   export async function verifyGoogleToken(token: string) {
     const ticket = await client.verifyIdToken({
       idToken: token,
       audience: process.env.GOOGLE_CLIENT_ID,
     });
     return ticket.getPayload();
   }
   ```
4. Se válido, busca ou insere o usuário na tabela `users`.
5. Emite um cookie JWT HttpOnly de sessão e responde `{ "user": { ... } }`.

---

## 4. Endpoints REST da API

### `GET /api/tasks`
Retorna a lista de tarefas agregada com informações do usuário designado e contadores:
```sql
SELECT 
  t.*,
  u.name as assigned_name,
  u.avatar_url as assigned_avatar,
  (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) as comment_count,
  (SELECT COUNT(*) FROM deliveries d WHERE d.task_id = t.id) as delivery_count
FROM tasks t
LEFT JOIN users u ON t.assigned_to = u.id
ORDER BY t.created_at DESC;
```

### `POST /api/tasks`
Cria nova tarefa com payload:
```json
{
  "title": "Configurar Nginx no VPS",
  "description": "Configuração inicial de proxy reverso e firewall",
  "status": "todo",
  "due_date": "2026-11-05T18:00:00Z",
  "assigned_to": "google_user_id_aqui"
}
```

### `PUT /api/tasks/:id`
Atualiza status (movimentação de coluna), datas, responsável ou textos.

### `POST /api/tasks/:id/deliveries`
Registra entregável da tarefa:
```json
{
  "content": "Deploy concluído e testado no VPS https://tasks.seudominio.com",
  "attachment_url": "https://github.com/..."
}
```

### `POST /api/tasks/:id/comments`
Registra comentário no feed da tarefa:
```json
{
  "content": "Aguardando liberação da porta 443 no painel do VPS."
}
```

---

## 5. Deploy em VPS (Passo a Passo)

### 5.1. Dockerfile Multi-stage (Otimizado)
Gera uma imagem leve contendo o build do front-end e o servidor Node.js:
```dockerfile
# Stage 1: Build Front-end
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client ./
RUN npm run build

# Stage 2: Build Back-end
FROM node:20-alpine AS backend-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server ./
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY server/package*.json ./
RUN npm install --only=production
COPY --from=backend-builder /app/server/dist ./dist
COPY --from=frontend-builder /app/client/dist ./public
VOLUME /data
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### 5.2. `docker-compose.yml` com Caddy (SSL Automático)
O Caddy emite certificados SSL Let's Encrypt automaticamente para o seu domínio sem necessidade de configurar cronjobs de certbot.

```yaml
version: '3.8'

services:
  app:
    build: .
    restart: unless-stopped
    environment:
      - PORT=3000
      - DATABASE_PATH=/data/app.db
      - JWT_SECRET=${JWT_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
    volumes:
      - app_data:/data
    networks:
      - webnet

  caddy:
    image: caddy:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    environment:
      - DOMAIN=${DOMAIN}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - app
    networks:
      - webnet

volumes:
  app_data:
  caddy_data:
  caddy_config:

networks:
  webnet:
```

### 5.3. Arquivo `Caddyfile`
```caddyfile
{$DOMAIN} {
    reverse_proxy app:3000
}
```

### 5.4. Comandos de Deploy no VPS
1. Instale o Docker e Docker Compose no seu VPS (ex: Ubuntu):
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
2. Clone o repositório no VPS:
   ```bash
   git clone <URL_DO_REPOSITORIO> app-tasks
   cd app-tasks
   ```
3. Crie o arquivo `.env` preenchendo as chaves:
   ```bash
   cp .env.example .env
   nano .env
   ```
4. Inicie o sistema:
   ```bash
   docker compose up -d --build
   ```
5. O site estará online com HTTPS automático no seu domínio!

