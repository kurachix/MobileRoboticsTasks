"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_js_1 = require("../auth.js");
const db_js_1 = require("../db.js");
const config_js_1 = require("../config.js");
exports.authRouter = (0, express_1.Router)();
// Retorna configurações públicas (ex: Google Client ID)
exports.authRouter.get('/config', (req, res) => {
    res.json({
        googleClientId: config_js_1.config.googleClientId || null,
        isProduction: config_js_1.config.isProduction,
    });
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
        // Salvar em cookie HttpOnly
        res.cookie('tasks_token', token, {
            httpOnly: true,
            secure: config_js_1.config.isProduction,
            sameSite: config_js_1.config.isProduction ? 'strict' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
        });
        return res.json({ user, token });
    }
    catch (error) {
        console.error('Erro na autenticação Google:', error);
        return res.status(401).json({ error: error.message || 'Falha na validação do Google' });
    }
});
// Login Demo / Desenvolvedor (para testes locais sem precisar criar client no Google Cloud)
exports.authRouter.post('/demo', (req, res) => {
    const { name, email } = req.body;
    const demoEmail = email || 'convidado@tasks.minimal';
    const demoName = name || 'Convidado Minimal';
    const user = (0, db_js_1.upsertUser)({
        id: `demo_${Date.now()}`,
        email: demoEmail,
        name: demoName,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(demoName)}`,
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
