import { Router } from 'express';
import { generateToken, authMiddleware, AuthenticatedRequest } from '../auth.js';
import { upsertUser } from '../db.js';
import { config } from '../config.js';

export const authRouter = Router();

// Credenciais pré-definidas
const STATIC_USERS = [
  {
    id: 'user_carlos',
    email: 'carlos@spskills.com',
    username: 'carlos',
    name: 'Carlos',
    password: 'nimaka',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Carlos&backgroundColor=7c3aed',
  },
  {
    id: 'user_nicolle',
    email: 'nicolle@spskills.com',
    username: 'nicolle',
    name: 'Nicolle',
    password: 'nimaka',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Nicolle&backgroundColor=9333ea',
  },
  {
    id: 'user_kurachi',
    email: 'kurachi@spskills.com',
    username: 'kurachi',
    name: 'Kurachi',
    password: 'nimaka',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Kurachi&backgroundColor=6d28d9',
  },
  {
    id: 'user_admin',
    email: 'admin@admin.com',
    username: 'admin',
    name: 'Admin',
    password: 'admin',
    avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin&backgroundColor=4c1d95',
  },
];

// Login por credenciais
authRouter.post('/login', (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Informe o login e a senha.' });
  }

  const normalizedInput = String(identifier).trim().toLowerCase();
  const matched = STATIC_USERS.find(
    u =>
      (u.email.toLowerCase() === normalizedInput ||
        u.username.toLowerCase() === normalizedInput ||
        u.name.toLowerCase() === normalizedInput) &&
      u.password === String(password)
  );

  if (!matched) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const user = upsertUser({
    id: matched.id,
    email: matched.email,
    name: matched.name,
    avatar_url: matched.avatar_url,
  });

  const token = generateToken(user);

  res.cookie('tasks_token', token, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return res.json({ user, token });
});

// Obter usuário logado atual
authRouter.get('/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  return res.json({ user: req.user });
});

// Logout
authRouter.post('/logout', (req, res) => {
  res.clearCookie('tasks_token');
  return res.json({ success: true, message: 'Desconectado com sucesso' });
});
