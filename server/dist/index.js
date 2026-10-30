"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const config_js_1 = require("./config.js");
const db_js_1 = require("./db.js");
const authRoutes_js_1 = require("./routes/authRoutes.js");
const taskRoutes_js_1 = require("./routes/taskRoutes.js");
const userRoutes_js_1 = require("./routes/userRoutes.js");
const notificationRoutes_js_1 = require("./routes/notificationRoutes.js");
const calendarRoutes_js_1 = require("./routes/calendarRoutes.js");
const app = (0, express_1.default)();
// Inicializar banco de dados SQLite
(0, db_js_1.initDatabase)();
// Middlewares essenciais
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json({ limit: '8mb' }));
// Servir pasta de uploads de fotos de perfil (/uploads)
const uploadsDir = path_1.default.resolve(path_1.default.dirname(config_js_1.config.databasePath), 'uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express_1.default.static(uploadsDir));
// Rotas de API
app.use('/api/auth', authRoutes_js_1.authRouter);
app.use('/api/tasks', taskRoutes_js_1.taskRouter);
app.use('/api/users', userRoutes_js_1.userRouter);
app.use('/api/notifications', notificationRoutes_js_1.notificationRouter);
app.use('/api/calendar', calendarRoutes_js_1.calendarRouter);
// Healthcheck & info de túnel HTTPS para PWA
app.get('/api/health', (req, res) => {
    let httpsUrl = process.env.HTTPS_URL || null;
    const httpsFile = path_1.default.resolve(path_1.default.dirname(config_js_1.config.databasePath), 'https_url.txt');
    if (!httpsUrl && fs_1.default.existsSync(httpsFile)) {
        try {
            httpsUrl = fs_1.default.readFileSync(httpsFile, 'utf-8').trim() || null;
        }
        catch { }
    }
    res.json({ status: 'ok', httpsUrl, timestamp: new Date().toISOString() });
});
// Servir pasta de imagens da raiz (/img)
const imgDir = path_1.default.resolve(process.cwd(), 'img');
if (fs_1.default.existsSync(imgDir)) {
    app.use('/img', express_1.default.static(imgDir));
}
// Servir frontend compilado com headers corretos de PWA (Manifest + Service Worker)
const possiblePublicDirs = [
    path_1.default.resolve(process.cwd(), 'client/dist'),
    path_1.default.resolve(process.cwd(), 'public'),
    path_1.default.resolve(__dirname, '../public'),
    path_1.default.resolve(__dirname, '../../client/dist'),
];
const publicDir = possiblePublicDirs.find(d => fs_1.default.existsSync(path_1.default.join(d, 'index.html')));
if (publicDir) {
    console.log(`✦ Servindo frontend compilado a partir de: ${publicDir}`);
    app.get(['/manifest.webmanifest', '/manifest.json'], (req, res) => {
        const manifestPath = fs_1.default.existsSync(path_1.default.join(publicDir, 'manifest.webmanifest'))
            ? path_1.default.join(publicDir, 'manifest.webmanifest')
            : path_1.default.join(publicDir, 'manifest.json');
        res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        res.sendFile(manifestPath);
    });
    app.get('/sw.js', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Service-Worker-Allowed', '/');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.sendFile(path_1.default.join(publicDir, 'sw.js'));
    });
    app.use(express_1.default.static(publicDir));
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(publicDir, 'index.html'));
    });
}
// Inicializar servidor
app.listen(config_js_1.config.port, '0.0.0.0', () => {
    console.log(`\n✦ Tasks Server rodando em http://0.0.0.0:${config_js_1.config.port}`);
    console.log(`✦ Local: http://localhost:${config_js_1.config.port}`);
    const nets = os_1.default.networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name] || []) {
            if (net.family === 'IPv4' && !net.internal) {
                console.log(`✦ Rede (${name}): http://${net.address}:${config_js_1.config.port}`);
            }
        }
    }
    console.log(`✦ Modo: ${config_js_1.config.nodeEnv}`);
    console.log(`✦ Banco: ${config_js_1.config.databasePath}\n`);
});
