#!/usr/bin/env node
"use strict";
/**
 * MCP Server para SAP Business One - Transporte STDIO
 * Diseñado para funcionar con Claude Desktop
 *
 * Uso en claude_desktop_config.json:
 * {
 *   "mcpServers": {
 *     "sap-sql": {
 *       "command": "node",
 *       "args": ["path/to/dist/stdio-server.js"],
 *       "env": {
 *         "DB_SERVER": "servidor",
 *         "DB_NAME": "base_de_datos",
 *         "DB_USER": "usuario",
 *         "DB_PASSWORD": "password",
 *         "DB_PORT": "1433",
 *         "DB_ENCRYPT": "false",
 *         "DB_TRUST_SERVER_CERTIFICATE": "true"
 *       }
 *     }
 *   }
 * }
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const sqlTools_1 = require("./tools/sqlTools");
const sqlClient_1 = require("./db/sqlClient");
// Crear instancia del servidor MCP
const server = new index_js_1.Server({
    name: 'mcp-sap-sql-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Registrar las herramientas SQL optimizadas para SAP
(0, sqlTools_1.registerSqlTools)(server);
// Crear transporte stdio para Claude Desktop
const transport = new stdio_js_1.StdioServerTransport();
// Manejar cierre graceful
const shutdown = async () => {
    await (0, sqlClient_1.closePool)();
    process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
// Conectar el servidor al transporte stdio
async function main() {
    try {
        await server.connect(transport);
    }
    catch (error) {
        process.exit(1);
    }
}
main();
//# sourceMappingURL=stdio-server.js.map