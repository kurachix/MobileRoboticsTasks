import { Router } from 'express';
import { authMiddleware } from '../auth.js';
import { listUsers } from '../db.js';

export const userRouter = Router();

// Lista usuários disponíveis para designação
userRouter.get('/', authMiddleware, (req, res) => {
  const users = listUsers();
  res.json({ users });
});

