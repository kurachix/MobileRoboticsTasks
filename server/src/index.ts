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
app.use(express.json({ limit: '8mb' }));

// Servir pasta de uploads de fotos de perfil (/uploads)
const uploadsDir = path.resolve(path.dirname(config.databasePath), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Rotas de API
app.use('/api/auth', authRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/users', userRouter);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Servir pasta de imagens da raiz (/img)
const imgDir = path.resolve(process.cwd(), 'img');
if (fs.existsSync(imgDir)) {
  app.use('/img', express.static(imgDir));
}

// Servir frontend compilado
const possiblePublicDirs = [
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), 'public'),
  path.resolve(__dirname, '../public'),
  path.resolve(__dirname, '../../client/dist'),
];

const publicDir = possiblePublicDirs.find(d => fs.existsSync(path.join(d, 'index.html')));
if (publicDir) {
  console.log(`✦ Servindo frontend compilado a partir de: ${publicDir}`);
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

