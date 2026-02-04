"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMcpRequest = processMcpRequest;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const sqlTools_1 = require("../tools/sqlTools");
/**
 * Procesa una request MCP y devuelve la respuesta
 * Este wrapper maneja la comunicación entre Express y el servidor MCP
 */
async function processMcpRequest(server, request) {
    if (!request || !request.method) {
        throw new Error('Invalid request: method is required');
    }
    const method = request.method;
    const params = request.params || {};
    // Manejar notificaciones PRIMERO (no requieren respuesta y no deben buscar handlers)
    if (method === 'initialized' || method === 'notifications/initialized') {
        // Este es una notificación, no requiere respuesta
        if (process.env.DEBUG === 'true') {
            console.log(`   ✅ Notificación ${method} procesada (sin respuesta requerida)`);
        }
        return null;
    }
    // Manejar otras notificaciones comunes (no requieren respuesta)
    if (method.startsWith('notifications/')) {
        // Todas las notificaciones no requieren respuesta en JSON-RPC
        if (process.env.DEBUG === 'true') {
            console.log(`   ✅ Notificación ${method} procesada (sin respuesta requerida)`);
        }
        return null;
    }
    // Manejar método initialize (requerido por el protocolo MCP)
    // Este método debe funcionar sin conexión previa
    if (method === 'initialize') {
        // ChatGPT Desktop espera una respuesta específica del método initialize
        // Asegurarse de que todos los campos requeridos estén presentes
        return {
            protocolVersion: '2024-11-05',
            capabilities: {
                tools: {},
                // Añadir otras capacidades si es necesario
            },
            serverInfo: {
                name: 'mcp-sql-server',
                version: '1.0.0',
            },
        };
    }
    // Para otros métodos, intentar usar métodos públicos del servidor si están disponibles
    if (typeof server.request === 'function') {
        try {
            return await server.request(method, params);
        }
        catch (error) {
            // Si falla por "Not connected", usar handlers directamente
            if (error instanceof Error && error.message.includes('connected')) {
                // Continuar con el fallback
            }
            else {
                throw error;
            }
        }
    }
    if (typeof server.processRequest === 'function') {
        try {
            return await server.processRequest(request);
        }
        catch (error) {
            // Si falla por "Not connected", usar handlers directamente
            if (error instanceof Error && error.message.includes('connected')) {
                // Continuar con el fallback
            }
            else {
                throw error;
            }
        }
    }
    if (typeof server.handleRequest === 'function') {
        try {
            return await server.handleRequest(request);
        }
        catch (error) {
            // Si falla por "Not connected", usar handlers directamente
            if (error instanceof Error && error.message.includes('connected')) {
                // Continuar con el fallback
            }
            else {
                throw error;
            }
        }
    }
    // Fallback: acceder a los handlers registrados directamente
    // Los handlers se registran con setRequestHandler usando schemas
    // Intentar diferentes formas de acceso a los handlers del SDK
    let handlers = null;
    // Intentar acceder a los handlers de diferentes maneras
    // El SDK de MCP puede almacenar los handlers en diferentes propiedades
    const possibleHandlerProps = [
        '_requestHandlers',
        'requestHandlers',
        '_handlers',
        'handlers',
        '_methodHandlers',
        'methodHandlers'
    ];
    for (const prop of possibleHandlerProps) {
        if (server[prop]) {
            handlers = server[prop];
            if (process.env.DEBUG === 'true') {
                console.log(`   📦 Handlers encontrados en: ${prop}`);
            }
            break;
        }
    }
    if (handlers) {
        // Buscar handler por método
        let handler = null;
        if (method === 'tools/list') {
            // Buscar handler de ListToolsRequestSchema
            // Intentar diferentes formas de acceso a los handlers
            if (handlers instanceof Map) {
                // Si es un Map, usar get con el schema o el string
                handler = handlers.get(types_js_1.ListToolsRequestSchema) || handlers.get('tools/list');
            }
            else if (handlers.get && typeof handlers.get === 'function') {
                // Si tiene método get, intentar con el schema y el string
                handler = handlers.get(types_js_1.ListToolsRequestSchema) || handlers.get('tools/list');
            }
            else if (typeof handlers === 'object') {
                // Si es un objeto, buscar por diferentes keys
                handler = handlers['tools/list'];
            }
        }
        else if (method === 'tools/call') {
            // Buscar handler de CallToolRequestSchema
            if (handlers instanceof Map) {
                handler = handlers.get(types_js_1.CallToolRequestSchema) || handlers.get('tools/call');
            }
            else if (handlers.get && typeof handlers.get === 'function') {
                handler = handlers.get(types_js_1.CallToolRequestSchema) || handlers.get('tools/call');
            }
            else if (typeof handlers === 'object') {
                handler = handlers['tools/call'];
            }
        }
        if (handler && typeof handler === 'function') {
            // Crear objeto request en formato esperado por el handler
            // El handler puede recibir el request completo o solo los params
            try {
                // Intentar llamar al handler con el formato que espera
                if (method === 'tools/list') {
                    // tools/list no requiere params
                    return await handler({ params: {} });
                }
                else if (method === 'tools/call') {
                    // tools/call requiere params con name y arguments
                    return await handler({ params });
                }
            }
            catch (error) {
                // Si falla, intentar con el request completo
                return await handler(request);
            }
        }
    }
    // Si no encontramos handler en el SDK, usar handlers exportados directamente
    if (method === 'tools/list') {
        try {
            return await (0, sqlTools_1.toolsListHandler)();
        }
        catch (error) {
            console.error(`   ⚠️  Handler directo de tools/list falló:`, error instanceof Error ? error.message : String(error));
        }
    }
    // Si no encontramos handler, intentar una última vez con el método request del servidor
    // si está disponible (puede que el SDK tenga un método público)
    if (typeof server.request === 'function') {
        try {
            // El método request puede requerir un formato específico
            const result = await server.request({
                jsonrpc: '2.0',
                method,
                params: method === 'tools/list' ? {} : params,
                id: request.id || 1
            });
            return result;
        }
        catch (error) {
            // Si falla, continuar con el error
            console.error(`   ⚠️  Método request falló:`, error instanceof Error ? error.message : String(error));
        }
    }
    // Si no encontramos handler, lanzar error con información de debugging
    const errorMsg = `No handler found for method: ${method}`;
    console.error(`❌ ${errorMsg}`);
    if (handlers) {
        if (handlers instanceof Map) {
            console.error(`   Handlers disponibles (Map):`, Array.from(handlers.keys()).map(k => String(k).substring(0, 50)));
        }
        else {
            console.error(`   Handlers disponibles:`, Object.keys(handlers));
        }
    }
    else {
        console.error(`   No se encontraron handlers en el servidor`);
        console.error(`   Propiedades del servidor:`, Object.keys(server).filter(k => !k.startsWith('_')).slice(0, 10));
    }
    throw new Error(errorMsg);
}
//# sourceMappingURL=handler.js.map