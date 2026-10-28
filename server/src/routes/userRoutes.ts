import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { authMiddleware, AuthenticatedRequest } from '../auth.js';
import { listUsers, findUserById, updateUserAvatar } from '../db.js';
import { config } from '../config.js';

export const userRouter = Router();

// Rate limiter em memória para troca de foto: máx 4 alterações por minuto por usuário
const avatarRateLimit = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 4;

const USER_PASSWORDS: Record<string, string> = {
  user_carlos: 'nimaka',
  user_nicolle: 'nimaka',
  user_kurachi: 'nimaka',
  user_admin: 'admin',
};

// Lista usuários disponíveis para designação
userRouter.get('/', authMiddleware, (req, res) => {
  const users = listUsers();
  res.json({ users });
});

// Atualizar foto de perfil (com pedido de senha, limite 5MB, rate limit e exclusão da anterior)
userRouter.put('/profile', authMiddleware, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { password, avatarDataUrl, presetAvatarUrl } = req.body;

  // 1. Verificar Rate Limit
  const now = Date.now();
  const userHistory = (avatarRateLimit.get(userId) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (userHistory.length >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Muitas alterações seguidas. Aguarde 1 minuto.',
    });
  }
  userHistory.push(now);
  avatarRateLimit.set(userId, userHistory);

  // 2. Verificar Senha
  if (!password) {
    return res.status(400).json({ error: 'Digite sua senha para confirmar.' });
  }

  const expectedPassword = USER_PASSWORDS[userId];
  if (expectedPassword) {
    if (String(password) !== expectedPassword) {
      return res.status(403).json({ error: 'Senha incorreta.' });
    }
  } else {
    // Caso seja conta Google SSO, aceita nimaka ou admin como confirmação
    if (String(password) !== 'nimaka' && String(password) !== 'admin') {
      return res.status(403).json({ error: 'Senha incorreta.' });
    }
  }

  // 3. Processar Nova Foto (Upload até 5MB ou Predefinida)
  const uploadsDir = path.resolve(path.dirname(config.databasePath), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  let finalAvatarUrl = '';

  if (avatarDataUrl && typeof avatarDataUrl === 'string') {
    const matches = avatarDataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Formato de imagem inválido (use PNG, JPG, WEBP ou GIF).' });
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const MAX_BYTES = 5 * 1024 * 1024; // 5MB
    if (buffer.byteLength > MAX_BYTES) {
      return res.status(400).json({ error: 'A imagem excede o limite máximo de 5MB.' });
    }

    const fileName = `avatar_${userId.replace(/[^a-zA-Z0-9_-]/g, '')}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);
    finalAvatarUrl = `/uploads/${fileName}`;
  } else if (presetAvatarUrl && typeof presetAvatarUrl === 'string') {
    finalAvatarUrl = presetAvatarUrl.trim();
  } else {
    return res.status(400).json({ error: 'Selecione uma foto predefinida ou envie uma imagem.' });
  }

  // 4. Apagar foto anterior do disco caso fosse um upload local (/uploads/...)
  const currentUser = findUserById(userId);
  if (currentUser?.avatar_url && currentUser.avatar_url.startsWith('/uploads/')) {
    const oldFileName = path.basename(currentUser.avatar_url);
    const oldFilePath = path.join(uploadsDir, oldFileName);
    if (fs.existsSync(oldFilePath)) {
      try {
        fs.unlinkSync(oldFilePath);
      } catch (err) {
        console.error('Erro ao remover foto antiga:', err);
      }
    }
  }

  // 5. Salvar novo avatar no banco
  const updatedUser = updateUserAvatar(userId, finalAvatarUrl);
  if (!updatedUser) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  return res.json({ user: updatedUser });
});
