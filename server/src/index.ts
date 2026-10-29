import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { config } from './config.js';
import { initDatabase } from './db.js';
import { authRouter } from './routes/authRoutes.js';
import { taskRouter } from './routes/taskRoutes.js';
import { userRouter } from './routes/userRoutes.js';
import { notificationRouter } from './routes/notificationRoutes.js';

const app = express();

// Inicializar banco de dados SQLite
initDatabase();

// Middlewares essenciais
app.use(cors({
  origin: true,
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
app.use('/api/notifications', notificationRouter);

// Healthcheck & info de túnel HTTPS para PWA
app.get('/api/health', (req, res) => {
  let httpsUrl = process.env.HTTPS_URL || null;
  const httpsFile = path.resolve(path.dirname(config.databasePath), 'https_url.txt');
  if (!httpsUrl && fs.existsSync(httpsFile)) {
    try {
      httpsUrl = fs.readFileSync(httpsFile, 'utf-8').trim() || null;
    } catch {}
  }
  res.json({ status: 'ok', httpsUrl, timestamp: new Date().toISOString() });
});

// Servir pasta de imagens da raiz (/img)
const imgDir = path.resolve(process.cwd(), 'img');
if (fs.existsSync(imgDir)) {
  app.use('/img', express.static(imgDir));
}

// Servir frontend compilado com headers corretos de PWA (Manifest + Service Worker)
const possiblePublicDirs = [
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), 'public'),
  path.resolve(__dirname, '../public'),
  path.resolve(__dirname, '../../client/dist'),
];

const publicDir = possiblePublicDirs.find(d => fs.existsSync(path.join(d, 'index.html')));
if (publicDir) {
  console.log(`✦ Servindo frontend compilado a partir de: ${publicDir}`);

  app.get(['/manifest.webmanifest', '/manifest.json'], (req, res) => {
    const manifestPath = fs.existsSync(path.join(publicDir, 'manifest.webmanifest'))
      ? path.join(publicDir, 'manifest.webmanifest')
      : path.join(publicDir, 'manifest.json');
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(manifestPath);
  });

  app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.sendFile(path.join(publicDir, 'sw.js'));
  });

  app.use(express.static(publicDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// Inicializar servidor
app.listen(config.port, '0.0.0.0', () => {
  console.log(`\n✦ Tasks Server rodando em http://0.0.0.0:${config.port}`);
  console.log(`✦ Local: http://localhost:${config.port}`);
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log(`✦ Rede (${name}): http://${net.address}:${config.port}`);
      }
    }
  }
  console.log(`✦ Modo: ${config.nodeEnv}`);
  console.log(`✦ Banco: ${config.databasePath}\n`);
});

