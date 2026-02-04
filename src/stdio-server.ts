#!/usr/bin/env node
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

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerSqlTools } from './tools/sqlTools';
import { closePool } from './db/sqlClient';

// Crear instancia del servidor MCP
const server = new Server(
  {
    name: 'mcp-sap-sql-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Registrar las herramientas SQL optimizadas para SAP
registerSqlTools(server);

// Crear transporte stdio para Claude Desktop
const transport = new StdioServerTransport();

// Manejar cierre graceful
const shutdown = async () => {
  await closePool();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Conectar el servidor al transporte stdio
async function main() {
  try {
    await server.connect(transport);
  } catch (error) {
    process.exit(1);
  }
}

main();
