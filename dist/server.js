"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const sqlTools_1 = require("./tools/sqlTools");
const env_1 = require("./config/env");
const sqlClient_1 = require("./db/sqlClient");
const handler_1 = require("./mcp/handler");
// Crear instancia del servidor Express
const app = (0, express_1.default)();
// Configurar trust proxy para Cloudflare (importante para obtener IPs correctas)
app.set('trust proxy', true);
// Middleware para parsear JSON
app.use(express_1.default.json());
// Middleware CORS para permitir requests desde ChatGPT Desktop
app.use((req, res, next) => {
    // Logging de todas las requests para debugging
    console.log(`📡 ${req.method} ${req.path}${req.url !== req.path ? ` (URL: ${req.url})` : ''} - Origin: ${req.headers['origin'] || 'none'} - User-Agent: ${req.headers['user-agent']?.substring(0, 50) || 'none'}`);
    // Headers para evitar redirects innecesarios
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        console.log('   → Respondiendo OPTIONS preflight');
        return res.sendStatus(200);
    }
    next();
});
// Middleware de seguridad: API KEY en la ruta
// Permite usar una API KEY en la ruta para autenticación cuando ChatGPT Desktop no puede enviar headers
// Formato esperado: /mcp/<MCP_API_KEY>/...
const API_KEY = env_1.config.auth.apiKey || process.env.MCP_API_KEY;
const DEV_API_KEY = 'dev-key-only-for-local-testing-do-not-use-in-production';
if (!API_KEY && process.env.NODE_ENV === 'production') {
    console.error('❌ ERROR: MCP_API_KEY no está definida y NODE_ENV=production');
    console.error('   Define MCP_API_KEY en tus variables de entorno antes de iniciar el servidor.');
    process.exit(1);
}
const activeApiKey = API_KEY || DEV_API_KEY;
if (!API_KEY) {
    console.warn('⚠️  ADVERTENCIA: MCP_API_KEY no definida, usando clave de desarrollo');
    console.warn('   Esta clave NO debe usarse en producción: ' + DEV_API_KEY);
    console.warn('   Define MCP_API_KEY en .env para producción');
}
// Middleware que verifica la API KEY en la ruta y reescribe la URL
app.use((req, res, next) => {
    // Permitir rutas públicas (health check, raíz) sin API KEY
    if (req.path === '/health' || req.path === '/') {
        return next();
    }
    // Patrón más flexible: acepta /mcp/<API_KEY> con o sin trailing slash
    const apiKeyRegex = /^\/mcp\/([^/]+)(\/.*)?$/;
    const match = req.path.match(apiKeyRegex);
    if (!match) {
        console.warn(`🚫 Acceso denegado: ruta no válida - ${req.method} ${req.path}`);
        return res.status(403).json({
            error: 'Forbidden - invalid API key',
            message: 'La ruta debe tener el formato /mcp/<API_KEY>/...'
        });
    }
    const keyInPath = match[1];
    const originalUrl = req.url;
    if (keyInPath !== activeApiKey) {
        console.warn(`🚫 API KEY incorrecta en la ruta - ${req.method} ${req.path}`);
        return res.status(403).json({
            error: 'Forbidden - invalid API key',
            message: 'La API KEY en la ruta es inválida'
        });
    }
    // Obtener el resto de la ruta después de /mcp/<API_KEY>
    let remainder = match[2] || '';
    // Si no hay ruta adicional o solo hay un slash, usar /mcp (endpoint SSE/JSON-RPC)
    if (!remainder || remainder === '/') {
        remainder = '/mcp';
    }
    // Reescribir la URL para que Express haga el routing correctamente
    const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    // Modificar req.url y req.path directamente
    req.url = remainder + queryString;
    // Actualizar req.path usando Object.defineProperty para forzar el cambio
    Object.defineProperty(req, 'path', {
        value: remainder,
        writable: true,
        configurable: true,
        enumerable: true
    });
    if (process.env.DEBUG === 'true') {
        console.log(`   🔑 API KEY válida - URL reescrita: ${originalUrl} -> ${req.url} (path: ${req.path})`);
    }
    else {
        // Logging mínimo siempre activo para debugging
        console.log(`   🔑 API KEY válida - Ruta: ${req.path}`);
    }
    next();
});
// Middleware de autenticación opcional (si se configura MCP_AUTH_TOKEN)
const authMiddleware = (req, res, next) => {
    if (env_1.config.auth.token) {
        const authHeader = req.headers.authorization;
        const token = authHeader?.replace('Bearer ', '') || req.query.token;
        if (token !== env_1.config.auth.token) {
            return res.status(401).json({ error: 'Token de autenticación inválido' });
        }
    }
    next();
};
// Crear instancia del servidor MCP
const mcpServer = new index_js_1.Server({
    name: 'mcp-sql-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Registrar las herramientas SQL
(0, sqlTools_1.registerSqlTools)(mcpServer);
// Endpoint SSE para MCP (Server-Sent Events)
app.get('/mcp', authMiddleware, (req, res) => {
    // Logging siempre activo para ver conexiones
    console.log('🔌 GET /mcp - Conexión SSE establecida');
    console.log('   User-Agent:', req.headers['user-agent'] || 'unknown');
    console.log('   IP:', req.ip || req.connection.remoteAddress || req.socket.remoteAddress);
    console.log('   Origin:', req.headers['origin'] || 'none');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Deshabilitar buffering en Nginx
    // Enviar evento de conexión (comentario SSE para mantener conexión abierta)
    res.write(': connected\n\n');
    console.log('✅ Conexión SSE establecida y mantenida');
    // El cliente MCP enviará requests POST para interactuar
    // Mantenemos la conexión SSE abierta para eventos del servidor
    // ChatGPT Desktop espera que la conexión SSE esté abierta para recibir eventos
    // Manejar cierre de conexión
    req.on('close', () => {
        if (process.env.DEBUG === 'true') {
            console.log('🔌 Conexión SSE cerrada');
        }
    });
    // Mantener conexión viva con heartbeat periódico (opcional)
    const heartbeat = setInterval(() => {
        try {
            res.write(': heartbeat\n\n');
        }
        catch (err) {
            clearInterval(heartbeat);
        }
    }, 30000); // Cada 30 segundos
    req.on('close', () => {
        clearInterval(heartbeat);
    });
});
// Endpoint POST para requests MCP
app.post('/mcp', authMiddleware, express_1.default.json(), async (req, res) => {
    // Logging básico siempre activo para ver si llegan requests
    console.log('📥 POST /mcp recibido desde:', req.headers['user-agent'] || 'unknown');
    console.log('   IP:', req.ip || req.connection.remoteAddress);
    console.log('   Content-Type:', req.headers['content-type']);
    try {
        // El SDK de MCP espera requests en formato JSON-RPC
        const request = req.body;
        // Logging para debugging (puedes deshabilitar en producción)
        if (process.env.DEBUG === 'true') {
            console.log('📥 Request MCP recibida:', JSON.stringify(request, null, 2));
        }
        else {
            // Logging mínimo incluso sin DEBUG
            if (request && request.method) {
                console.log(`   Método: ${request.method}, ID: ${request.id || 'N/A'}`);
            }
            else {
                console.log('   ⚠️  Request sin método o formato incorrecto:', JSON.stringify(request));
            }
        }
        if (!request || !request.method) {
            return res.status(400).json({
                jsonrpc: '2.0',
                id: request?.id || null,
                error: {
                    code: -32600,
                    message: 'Invalid Request',
                },
            });
        }
        // Procesar la request usando el wrapper que maneja diferentes APIs del SDK
        const response = await (0, handler_1.processMcpRequest)(mcpServer, request);
        if (process.env.DEBUG === 'true') {
            console.log('📤 Response MCP enviada:', JSON.stringify(response, null, 2));
        }
        // Si la respuesta es null (notificaciones como 'initialized'), no enviar respuesta
        if (response === null || response === undefined) {
            // Las notificaciones no requieren respuesta en JSON-RPC
            return res.status(200).end();
        }
        // Construir respuesta JSON-RPC
        const jsonRpcResponse = {
            jsonrpc: '2.0',
            id: request.id,
        };
        // Solo añadir result si hay respuesta
        if (response !== null) {
            jsonRpcResponse.result = response;
        }
        res.json(jsonRpcResponse);
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorCode = err instanceof Error && 'code' in err ? err.code : -32603;
        console.error('❌ Error procesando request MCP:', errorMessage);
        if (process.env.DEBUG === 'true') {
            console.error('Stack trace:', err instanceof Error ? err.stack : 'N/A');
        }
        res.status(200).json({
            jsonrpc: '2.0',
            id: req.body?.id || null,
            error: {
                code: errorCode,
                message: errorMessage,
            },
        });
    }
});
// Ruta de health check
app.get('/health', (req, res) => {
    console.log('💚 Health check recibido');
    res.json({
        status: 'ok',
        service: 'mcp-sql-server',
        timestamp: new Date().toISOString(),
    });
});
// Ruta raíz con información
app.get('/', (req, res) => {
    console.log('🏠 Request a ruta raíz');
    res.json({
        service: 'MCP SQL Server',
        version: '1.0.0',
        endpoint: `/mcp/${activeApiKey}/`,
        description: 'Servidor MCP HTTP remoto para interactuar con SQL Server',
        security: API_KEY ? 'API KEY en ruta (producción)' : 'API KEY de desarrollo (solo testing)',
    });
});
// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});
// Configurar puertos
// Para Cloudflare Tunnel, el servidor debe escuchar en HTTP (Cloudflare maneja HTTPS)
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : env_1.config.server.port;
const LISTEN_HOST = process.env.LISTEN_HOST || '0.0.0.0'; // Escuchar en todas las interfaces para Cloudflare Tunnel
// Rutas a los certificados
const certPath = process.env.CERT_PATH || path_1.default.join(__dirname, '..', 'cert');
const keyPath = path_1.default.join(certPath, 'key.pem');
const certFilePath = path_1.default.join(certPath, 'cert.pem');
let httpsOptions = null;
let useHttps = false;
// Intentar cargar certificados SSL
if (fs_1.default.existsSync(keyPath) && fs_1.default.existsSync(certFilePath)) {
    try {
        httpsOptions = {
            key: fs_1.default.readFileSync(keyPath),
            cert: fs_1.default.readFileSync(certFilePath),
        };
        useHttps = true;
        console.log('✅ Certificados SSL cargados correctamente');
        console.log(`   Certificado: ${certFilePath}`);
        console.log(`   Clave: ${keyPath}`);
    }
    catch (error) {
        console.error('❌ Error al cargar certificados SSL:', error);
        console.log('⚠️  El servidor se iniciará solo con HTTP');
    }
}
else {
    console.warn('⚠️  Certificados SSL no encontrados');
    console.warn(`   Buscados en: ${certPath}`);
    console.warn('   El servidor se iniciará solo con HTTP');
    console.warn('   Para HTTPS, crea los certificados y colócalos en la carpeta cert/');
}
// Variables para manejar el cierre graceful
let httpsServer = null;
let httpServer = null;
// Para Cloudflare Tunnel, el servidor debe escuchar en HTTP (Cloudflare maneja HTTPS)
// Si se requiere HTTPS local (sin Cloudflare), se puede habilitar con USE_LOCAL_HTTPS=true
const USE_LOCAL_HTTPS = process.env.USE_LOCAL_HTTPS === 'true';
if (USE_LOCAL_HTTPS && useHttps && httpsOptions) {
    // Modo HTTPS local (sin Cloudflare Tunnel)
    httpsServer = https_1.default.createServer(httpsOptions, app);
    httpsServer.listen(PORT, LISTEN_HOST, () => {
        console.log('🚀 Servidor MCP HTTPS iniciado (modo local)');
        console.log(`📍 Escuchando en: ${LISTEN_HOST}:${PORT}`);
        console.log(`📍 URL HTTPS: https://localhost:${PORT}/mcp/${activeApiKey}/`);
        console.log(`🔐 API KEY: ${activeApiKey.substring(0, 8)}... (${API_KEY ? 'producción' : 'desarrollo'})`);
        console.log(`💾 Base de datos: ${env_1.config.sql.database}@${env_1.config.sql.host}:${env_1.config.sql.port}`);
    });
}
else {
    // Modo HTTP (recomendado para Cloudflare Tunnel)
    httpServer = http_1.default.createServer(app);
    httpServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Error: Puerto ${PORT} ya está en uso`);
            console.error('   Soluciones:');
            console.error(`   1. Detener el proceso que usa el puerto ${PORT}`);
            console.error(`   2. Cambiar el puerto en .env: PORT=3333`);
            console.error(`   3. Ver qué proceso usa el puerto: netstat -ano | findstr :${PORT}`);
            process.exit(1);
        }
        else {
            console.error('❌ Error al iniciar servidor HTTP:', err.message);
            process.exit(1);
        }
    });
    httpServer.listen(PORT, LISTEN_HOST, () => {
        console.log('🚀 Servidor MCP HTTP iniciado');
        console.log(`📍 Escuchando en: ${LISTEN_HOST}:${PORT}`);
        console.log(`📍 URL local: http://localhost:${PORT}/mcp/${activeApiKey}/`);
        console.log(`🔐 API KEY: ${activeApiKey.substring(0, 8)}... (${API_KEY ? 'producción' : 'desarrollo'})`);
        console.log(`💾 Base de datos: ${env_1.config.sql.database}@${env_1.config.sql.host}:${env_1.config.sql.port}`);
        console.log('');
        if (!USE_LOCAL_HTTPS) {
            console.log('✅ Configurado para Cloudflare Tunnel');
            console.log('   Cloudflare manejará HTTPS automáticamente');
            console.log(`   URL externa: https://mcp.teambike.com/mcp/${activeApiKey}/`);
        }
    });
}
// Manejo de cierre graceful
const shutdown = async () => {
    console.log('🛑 Cerrando servidor...');
    const closePromises = [];
    if (httpsServer) {
        closePromises.push(new Promise((resolve) => {
            httpsServer.close(() => {
                console.log('✅ Servidor HTTPS cerrado');
                resolve();
            });
        }));
    }
    if (httpServer) {
        closePromises.push(new Promise((resolve) => {
            httpServer.close(() => {
                console.log('✅ Servidor HTTP cerrado');
                resolve();
            });
        }));
    }
    await Promise.all(closePromises);
    await (0, sqlClient_1.closePool)();
    process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
//# sourceMappingURL=server.js.map