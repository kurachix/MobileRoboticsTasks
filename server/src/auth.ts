import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { config } from './config.js';
import { findUserById, upsertUser, User } from './db.js';

const googleClient = new OAuth2Client(config.googleClientId);

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url },
    config.jwtSecret,
    { expiresIn: '30d' }
  );
}

export async function verifyGoogleIdToken(token: string) {
  if (!config.googleClientId) {
    throw new Error('GOOGLE_CLIENT_ID não configurado no servidor.');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: token,
    audience: config.googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error('Payload do Google OAuth inválido.');
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    avatar_url: payload.picture,
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.tasks_token || req.headers.authorization?.replace(/^Bearer\s+/, '');

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
    const user = findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida' });
  }
}

