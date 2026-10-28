# AGENTS.md — Diretrizes e Arquitetura do Sistema Minimalista de To-Do

> **Visão Geral do Projeto**: Sistema web de gerenciamento de tarefas (Kanban To-Do) com estética **Dark Minimalist (Preto & Roxo)**, autenticação exclusiva com **Google Single Sign-On (OAuth2)**, focado em alta usabilidade, sem distrações ("sem nada a mais, nada a menos"). Projetado para rodar de forma leve e resiliente em VPS.

---

## 1. Princípios Arquiteturais & Filosofia

1. **Minimalismo Radical**: Nenhuma tela desnecessária. O fluxo consiste apenas em:
   - **Estado Deslogado**: Tela de entrada limpa com botão de Login com Google.
   - **Estado Logado**: O quadro Kanban completo com as 3 colunas e o modal de detalhes da tarefa.
2. **As 3 Colunas Canônicas**:
   - `A Fazer` (`todo`)
   - `Fazendo` (`doing`)
   - `Completo` (`done`)
3. **Atributos Essenciais da Tarefa**:
   - **Título** e **Descrição** (Markdown simplificado ou texto puro).
   - **Status**: `todo` | `doing` | `done`.
   - **Datas**: Data de Criação, Data de Atualização e Data de Entrega/Vencimento (`due_date`).
   - **Designação**: Usuário responsável atribuído (`assigned_to_user_id`), exibindo avatar e nome.
   - **Entregas (`deliveries`)**: Registro de submissões de entregáveis (links de repositório, docs, arquivos ou notas de entrega com timestamp e autor).
   - **Comentários (`comments`)**: Histórico cronológico limpo de discussões e notas internas.
4. **Identidade Visual**:
   - Dark mode absoluto: Fundo preto profundo (`#09090b` / `#0f0f13`), cartões em grafite escuro (`#16161f`), bordas sutis (`#262636`).
   - Acentos em Roxo Elétrico: Violeta / Roxo Neon (`#8b5cf6`, `#7c3aed`, `#a855f7`).
   - Sem saturações agressivas ou ruído visual. Tipografia nítida (Inter ou system-ui).
5. **Deployment em VPS**:
   - Totalmente auto-contido via Docker e Docker Compose, ou execução direta com Node.js + PM2.
   - Banco de dados SQLite persistente em volume (`/data/app.db`) com WAL (Write-Ahead Logging) ativado para máxima performance e zero custo de RAM/manutenção.

---

## 2. Stack Tecnológica Recomendada

- **Front-end**: React 18+ com Vite, TypeScript, Tailwind CSS, Lucide Icons, e Google Identity Services (`@react-oauth/google` ou Google GSI).
- **Back-end**: Node.js com Express / Fastify (TypeScript), autenticação via JWT + verificação de token Google (`google-auth-library`).
- **Banco de Dados**: SQLite com `better-sqlite3` ou SQLite3, estruturado com índices para consultas rápidas.
- **Deploy**: Dockerfile multi-stage, `docker-compose.yml` e Caddy como reverse proxy com emissão automática de certificado SSL (Let's Encrypt).

---

## 3. Modelo de Dados Relacional (SQLite)

```sql
-- Tabela de Usuários (criada/atualizada via Google OAuth)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,               -- Google Subject ID (sub)
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Tarefas
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,               -- UUID v4
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL CHECK(status IN ('todo', 'doing', 'done')) DEFAULT 'todo',
  due_date DATETIME,
  assigned_to TEXT,                  -- FK -> users.id
  created_by TEXT NOT NULL,          -- FK -> users.id
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Entregas (Submissões e comprovantes)
CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY,               -- UUID v4
  task_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,             -- URL ou texto descritivo do entregável
  attachment_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabela de Comentários
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,               -- UUID v4
  task_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 4. Endpoints da API REST

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `POST` | `/api/auth/google` | Valida ID token do Google, cria/atualiza usuário e retorna JWT de sessão |
| `GET` | `/api/auth/me` | Retorna o usuário logado |
| `POST` | `/api/auth/logout` | Limpa a sessão / cookie de autenticação |
| `GET` | `/api/users` | Lista usuários do sistema para designação de tarefas |
| `GET` | `/api/tasks` | Retorna todas as tarefas (com assignee, contadores de entregas/comentários) |
| `POST` | `/api/tasks` | Cria nova tarefa |
| `GET` | `/api/tasks/:id` | Retorna tarefa detalhada com entregas e comentários |
| `PUT` | `/api/tasks/:id` | Atualiza status, título, descrição, datas ou designação |
| `DELETE` | `/api/tasks/:id` | Remove a tarefa |
| `POST` | `/api/tasks/:id/comments` | Adiciona um comentário à tarefa |
| `DELETE` | `/api/comments/:id` | Remove um comentário |
| `POST` | `/api/tasks/:id/deliveries` | Registra uma nova entrega (link/comprovante) |
| `DELETE` | `/api/deliveries/:id` | Remove um registro de entrega |

---

## 5. Estrutura de Diretórios do Projeto

```text
├── .agents/
│   ├── rules/
│   │   └── project-rules.md
│   └── skills/
│       ├── design-system/
│       │   └── SKILL.md
│       └── backend-api/
│           └── SKILL.md
├── server/                    # Backend Node.js + Express/TypeScript
│   ├── src/
│   │   ├── config/            # Variáveis de ambiente e constantes
│   │   ├── db/                # Inicialização e queries SQLite
│   │   ├── middleware/        # Auth middleware (validação de JWT)
│   │   ├── routes/            # Rotas de auth, tasks, comments, deliveries
│   │   └── index.ts           # Entrada do servidor Express
│   ├── package.json
│   └── tsconfig.json
├── client/                    # Frontend React + Vite + Tailwind
│   ├── src/
│   │   ├── components/        # KanbanBoard, TaskCard, TaskModal, GoogleLoginView
│   │   ├── hooks/             # useAuth, useTasks
│   │   ├── types/             # Tipagens de Task, User, Delivery, Comment
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── Dockerfile
├── docker-compose.yml
├── Caddyfile                  # Configuração Caddy para SSL automático em VPS
├── .env.example
└── README.md
```

---

## 6. Regras de Código e Contribuição para Agentes

1. **Simplicidade primeiro**: Evite dependências pesadas e abstrações desnecessárias. Não adicione bibliotecas para tarefas que podem ser resolvidas com poucas linhas de código limpo.
2. **TypeScript Estrito**: Tipagem explícita para todas as entidades de dados (`Task`, `User`, `Delivery`, `Comment`).
3. **Consistência Visual**: Respeite a paleta Preto & Roxo definida no `design-system` skill. Não utilize cores fora da escala definida.
4. **Tratamento de Erros**: Respostas HTTP com status adequado (`400`, `401`, `403`, `404`, `500`) e mensagens JSON consistentes (`{ "error": "mensagem clara" }`).
5. **Portabilidade em VPS**: O sistema deve subir com um único comando `docker compose up -d` ou `npm run start` sem depender de serviços externos além do Google OAuth.

