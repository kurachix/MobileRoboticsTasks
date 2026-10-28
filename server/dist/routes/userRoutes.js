"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const auth_js_1 = require("../auth.js");
const db_js_1 = require("../db.js");
exports.userRouter = (0, express_1.Router)();
// Lista usuários disponíveis para designação
exports.userRouter.get('/', auth_js_1.authMiddleware, (req, res) => {
    const users = (0, db_js_1.listUsers)();
    res.json({ users });
});
