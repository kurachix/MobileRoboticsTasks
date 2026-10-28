"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
    jwtSecret: process.env.JWT_SECRET || 'dev_secret_tasks_minimal_change_in_production_key_123456789',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    databasePath: process.env.DATABASE_PATH || path_1.default.resolve(process.cwd(), 'data/tasks.db'),
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
