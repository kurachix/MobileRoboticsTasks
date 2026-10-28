import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { config } from './config.js';
import { initDatabase } from './db.js';
import { authRouter } from './routes/authRoutes.js';
import { taskRouter } from './routes/taskRoutes.js';
import { userRouter } from './routes/userRoutes.js';

const app = express();

// Inicializar banco de dados SQLite
initDatabase();

// Middlewares essenciais
app.use(cors({
  origin: config.isProduction ? true : [config.clientUrl, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());

// Rotas de API
app.use('/api/auth', authRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/users', userRouter);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir frontend compilado em produção ou se a pasta public existir
const publicDir = path.resolve(process.cwd(), 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// Inicializar servidor
app.listen(config.port, '0.0.0.0', () => {
  console.log(`\n✦ Tasks Server rodando em http://0.0.0.0:${config.port}`);
  console.log(`✦ Modo: ${config.nodeEnv}`);
  console.log(`✦ Banco: ${config.databasePath}\n`);
});

