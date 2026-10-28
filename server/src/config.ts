import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  jwtSecret: process.env.JWT_SECRET || 'ws_secret_v2_worldskills_mobile_robotics_jwt_key',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  databasePath: process.env.DATABASE_PATH || path.resolve(process.cwd(), 'data/tasks.db'),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

