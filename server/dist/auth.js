"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyGoogleIdToken = verifyGoogleIdToken;
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const config_js_1 = require("./config.js");
const db_js_1 = require("./db.js");
const googleClient = new google_auth_library_1.OAuth2Client(config_js_1.config.googleClientId);
function generateToken(user) {
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, name: user.name, avatar_url: user.avatar_url }, config_js_1.config.jwtSecret, { expiresIn: '30d' });
}
async function verifyGoogleIdToken(token) {
    if (!config_js_1.config.googleClientId) {
        throw new Error('GOOGLE_CLIENT_ID não configurado no servidor.');
    }
    const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: config_js_1.config.googleClientId,
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
function authMiddleware(req, res, next) {
    const token = req.cookies?.tasks_token || req.headers.authorization?.replace(/^Bearer\s+/, '');
    if (!token) {
        return res.status(401).json({ error: 'Não autenticado' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_js_1.config.jwtSecret);
        const user = (0, db_js_1.findUserById)(decoded.id);
        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }
        req.user = user;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Sessão expirada ou inválida' });
    }
}
