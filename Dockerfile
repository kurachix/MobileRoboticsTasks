# Etapa 1: Build do Frontend React + Vite
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Etapa 2: Build do Backend Express + TypeScript
FROM node:20-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# Etapa 3: Imagem final para execução em VPS
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Dependências de runtime do backend
COPY server/package*.json ./
RUN npm install --only=production

# Copiar artefatos compilados
COPY --from=server-builder /app/server/dist ./dist
COPY --from=client-builder /app/client/dist ./public

# Criar diretório de dados persistentes para o banco SQLite
RUN mkdir -p /data
ENV DATABASE_PATH=/data/app.db

EXPOSE 3000

CMD ["node", "dist/index.js"]

