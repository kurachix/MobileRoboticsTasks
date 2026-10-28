"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_js_1 = require("../auth.js");
const db_js_1 = require("../db.js");
const config_js_1 = require("../config.js");
exports.authRouter = (0, express_1.Router)();
// Credenciais simples pré-definidas (SPSkills / WorldSkills)
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
// Retorna configurações públicas (ex: Google Client ID)
exports.authRouter.get('/config', (req, res) => {
    res.json({
        googleClientId: config_js_1.config.googleClientId || null,
        isProduction: config_js_1.config.isProduction,
    });
});
// Login por credenciais simples (sem cadastro)
exports.authRouter.post('/login', (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
        return res.status(400).json({ error: 'Informe o login e a senha.' });
    }
    const normalizedInput = String(identifier).trim().toLowerCase();
    const matched = STATIC_USERS.find(u => (u.email.toLowerCase() === normalizedInput ||
        u.username.toLowerCase() === normalizedInput ||
        u.name.toLowerCase() === normalizedInput) &&
        u.password === String(password));
    if (!matched) {
        return res.status(401).json({ error: 'Credenciais inválidas.' });
    }
    const user = (0, db_js_1.upsertUser)({
        id: matched.id,
        email: matched.email,
        name: matched.name,
        avatar_url: matched.avatar_url,
    });
    const token = (0, auth_js_1.generateToken)(user);
    res.cookie('tasks_token', token, {
        httpOnly: true,
        secure: config_js_1.config.isProduction,
        sameSite: config_js_1.config.isProduction ? 'strict' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return res.json({ user, token });
});
// Autenticação com Google One-Tap / ID Token
exports.authRouter.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ error: 'Credencial do Google é obrigatória.' });
        }
        const googleUser = await (0, auth_js_1.verifyGoogleIdToken)(credential);
        const user = (0, db_js_1.upsertUser)({
            id: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            avatar_url: googleUser.avatar_url,
        });
        const token = (0, auth_js_1.generateToken)(user);
        res.cookie('tasks_token', token, {
            httpOnly: true,
            secure: config_js_1.config.isProduction,
            sameSite: config_js_1.config.isProduction ? 'strict' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        return res.json({ user, token });
    }
    catch (error) {
        console.error('Erro na autenticação Google:', error);
        return res.status(401).json({ error: error.message || 'Falha na validação do Google' });
    }
});
// Login Demo / Google rápido (fallback caso GOOGLE_CLIENT_ID não esteja configurado no .env)
exports.authRouter.post('/demo', (req, res) => {
    const { name, email } = req.body;
    const demoEmail = email || 'google@spskills.com';
    const demoName = name || 'Google User';
    const user = (0, db_js_1.upsertUser)({
        id: `google_${demoEmail}`,
        email: demoEmail,
        name: demoName,
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(demoName)}&backgroundColor=7c3aed`,
    });
    const token = (0, auth_js_1.generateToken)(user);
    res.cookie('tasks_token', token, {
        httpOnly: true,
        secure: config_js_1.config.isProduction,
        sameSite: config_js_1.config.isProduction ? 'strict' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return res.json({ user, token });
});
// Obter usuário logado atual
exports.authRouter.get('/me', auth_js_1.authMiddleware, (req, res) => {
    return res.json({ user: req.user });
});
// Logout
exports.authRouter.post('/logout', (req, res) => {
    res.clearCookie('tasks_token');
    return res.json({ success: true, message: 'Desconectado com sucesso' });
});
