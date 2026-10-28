import { Router } from 'express';
import { generateToken, verifyGoogleIdToken, authMiddleware, AuthenticatedRequest } from '../auth.js';
import { upsertUser, findUserById } from '../db.js';
import { config } from '../config.js';

export const authRouter = Router();

// Retorna configurações públicas (ex: Google Client ID)
authRouter.get('/config', (req, res) => {
  res.json({
    googleClientId: config.googleClientId || null,
    isProduction: config.isProduction,
  });
});

// Autenticação com Google One-Tap / ID Token
authRouter.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Credencial do Google é obrigatória.' });
    }

    const googleUser = await verifyGoogleIdToken(credential);
    const user = upsertUser({
      id: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
      avatar_url: googleUser.avatar_url,
    });

    const token = generateToken(user);

    // Salvar em cookie HttpOnly
    res.cookie('tasks_token', token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: config.isProduction ? 'strict' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
    });

    return res.json({ user, token });
  } catch (error: any) {
    console.error('Erro na autenticação Google:', error);
    return res.status(401).json({ error: error.message || 'Falha na validação do Google' });
  }
});

// Login Demo / Desenvolvedor (para testes locais sem precisar criar client no Google Cloud)
authRouter.post('/demo', (req, res) => {
  const { name, email } = req.body;
  const demoEmail = email || 'convidado@tasks.minimal';
  const demoName = name || 'Convidado Minimal';

  const user = upsertUser({
    id: `demo_${Date.now()}`,
    email: demoEmail,
    name: demoName,
    avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(demoName)}`,
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

