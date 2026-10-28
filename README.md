# ✦ Minimalist Tasks — To-Do Kanban (Preto & Roxo)

Sistema de gerenciamento de tarefas extremamente minimalista, funcional e elegante.
- **Autenticação**: Exclusiva com **Google Single Sign-On (OAuth2)** na primeira tela.
- **Quadro Kanban**: 3 colunas canônicas — **A Fazer**, **Fazendo** e **Completo**.
- **Metadados de Tarefas**: Datas de vencimento, comentários em tempo real, submissão de entregas/comprovantes e designação de responsáveis.
- **Identidade Visual**: Dark Mode puro, mesclando tons de preto profundo (`#09090b`) e roxo elétrico (`#8b5cf6`).
- **Pronto para VPS**: Deploy com um comando via Docker + Docker Compose + Caddy (com SSL automático).

---

## 📁 Estrutura do Repositório

```text
├── .agents/
│   ├── rules/
│   │   └── project-rules.md     # Regras de código e arquitetura
│   └── skills/
│       ├── design-system/       # Skill especializada em UI/UX Dark Minimalist
│       │   └── SKILL.md
│       └── backend-api/         # Skill especializada em API, Google SSO e VPS
│           └── SKILL.md
├── AGENTS.md                    # Documento canônico de instruções para IA
├── server/                      # Back-end Node.js + Express + TypeScript + SQLite
├── client/                      # Front-end React + Vite + Tailwind CSS
├── Dockerfile                   # Build multi-stage para VPS
├── docker-compose.yml           # Orquestração do app + Caddy com SSL
├── Caddyfile                    # Proxy reverso com HTTPS automático (Let's Encrypt)
└── .env.example                 # Modelo de variáveis de ambiente
```

---

## 🚀 Como Executar Localmente

### 1. Clonar e Instalar Dependências
```bash
# Instala dependências do backend e do frontend
npm run install:all
```

### 2. Configurar Variáveis de Ambiente
Copie o `.env.example` para `.env`:
```bash
cp .env.example .env
```
*Dica: Você pode testar imediatamente mesmo antes de criar a credencial do Google usando o botão de **Login Demo/Convidado**.*

### 3. Iniciar em Modo de Desenvolvimento
```bash
npm run dev
```
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000`

---

## 🌐 Configuração do Google OAuth 2.0

Para usar o login real do Google:
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Crie ou selecione um projeto.
3. Em **Credenciais**, crie um **ID do cliente OAuth 2.0** (Tipo: *Aplicativo da Web*).
4. Adicione às **Origens JavaScript autorizadas**:
   - `http://localhost:5173` (para testes locais)
   - `https://tasks.seudominio.com` (o domínio do seu VPS)
5. Copie o **Client ID** gerado e cole no seu `.env`:
   ```env
   GOOGLE_CLIENT_ID=seu-id-aqui.apps.googleusercontent.com
   ```

---

## ☁️ Deploy no VPS (Produção em 2 minutos)

O projeto já inclui **Dockerfile multi-stage** e **Caddy** para emissão automática de certificado SSL gratuito.

### 1. No seu VPS (Ubuntu/Debian):
```bash
# 1. Instale o Docker caso não tenha
curl -fsSL https://get.docker.com | sh

# 2. Clone seu repositório
git clone <URL_DO_SEU_REPO> tasks
cd tasks

# 3. Configure o .env de produção
cp .env.example .env
nano .env
```

Preencha no `.env`:
```env
DOMAIN=tasks.seudominio.com
GOOGLE_CLIENT_ID=seu-google-client-id
JWT_SECRET=chave_aleatoria_longa_e_segura
```

### 2. Iniciar os Containers
```bash
docker compose up -d --build
```

O Caddy detectará seu domínio, emitirá o certificado SSL automaticamente e o sistema estará online em `https://tasks.seudominio.com` com persistência de dados em volume Docker!

