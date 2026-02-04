"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolsListHandler = void 0;
exports.registerSqlTools = registerSqlTools;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const sqlClient_1 = require("../db/sqlClient");
const env_1 = require("../config/env");
const sapTools = __importStar(require("./sapTools"));
const sapB1Tools = __importStar(require("./sapB1Tools"));
// Límite de filas configurable desde variables de entorno
// Por defecto 100,000 para permitir consultas complejas como comparativas de ventas
const MAX_RESULT_ROWS = env_1.config.limits.maxQueryRows;
/**
 * Tool: listTables
 * Devuelve la lista de todas las tablas de la base de datos
 */
const listTablesTool = {
    name: 'listTables',
    description: 'Lista todas las tablas disponibles en la base de datos actual. No requiere parámetros.',
    inputSchema: {
        type: 'object',
        properties: {},
        required: [],
    },
};
/**
 * Tool: getTableSchema
 * Devuelve el esquema (columnas y tipos) de una tabla específica
 */
const getTableSchemaTool = {
    name: 'getTableSchema',
    description: 'Obtiene el esquema completo de una tabla, incluyendo nombres de columnas, tipos de datos, y si permiten NULL.',
    inputSchema: {
        type: 'object',
        properties: {
            tableName: {
                type: 'string',
                description: 'Nombre de la tabla de la cual se desea obtener el esquema',
            },
        },
        required: ['tableName'],
    },
};
/**
 * Tool: runSqlQuery
 * Ejecuta una consulta SQL arbitraria y devuelve los resultados
 */
const runSqlQueryTool = {
    name: 'runSqlQuery',
    description: 'Ejecuta una consulta SQL SELECT y devuelve los resultados. Útil para consultas personalizadas como comparativas de ventas, análisis de períodos, etc. IMPORTANTE: Solo se permiten consultas SELECT. No hay límite estricto de filas, pero se recomienda usar filtros apropiados para consultas grandes.',
    inputSchema: {
        type: 'object',
        properties: {
            query: {
                type: 'string',
                description: 'Consulta SQL SELECT a ejecutar',
            },
            parameters: {
                type: 'array',
                description: 'Parámetros opcionales para la consulta (para consultas parametrizadas)',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        value: { type: ['string', 'number', 'boolean', 'null'] },
                    },
                    required: ['name', 'value'],
                },
            },
        },
        required: ['query'],
    },
};
/**
 * Tool: listDatabases (opcional)
 * Lista todas las bases de datos disponibles en el servidor
 */
const listDatabasesTool = {
    name: 'listDatabases',
    description: 'Lista todas las bases de datos disponibles en el servidor SQL Server. Útil para explorar qué bases de datos están disponibles.',
    inputSchema: {
        type: 'object',
        properties: {},
        required: [],
    },
};
/**
 * Tool: describeDatabase (opcional)
 * Describe la base de datos actual con información general
 */
const describeDatabaseTool = {
    name: 'describeDatabase',
    description: 'Obtiene información general sobre la base de datos actual, incluyendo número de tablas, tamaño aproximado, etc.',
    inputSchema: {
        type: 'object',
        properties: {},
        required: [],
    },
};
/**
 * Herramientas SAP-optimizadas
 */
// Análisis completo de tabla
const analyzeTableTool = {
    name: 'analyzeTable',
    description: 'Análisis completo de estructura de tabla incluyendo columnas, claves primarias, claves foráneas, índices y constraints. Optimizado para SAP SQL Server.',
    inputSchema: {
        type: 'object',
        properties: {
            tableName: { type: 'string', description: 'Nombre de la tabla a analizar' },
        },
        required: ['tableName'],
    },
};
// Análisis de stored procedure
const analyzeStoredProcedureTool = {
    name: 'analyzeStoredProcedure',
    description: 'Analiza la estructura de un stored procedure incluyendo parámetros, dependencias y código fuente. Especialmente útil para SAP que tiene muchos stored procedures.',
    inputSchema: {
        type: 'object',
        properties: {
            procedureName: { type: 'string', description: 'Nombre del stored procedure a analizar' },
        },
        required: ['procedureName'],
    },
};
// Preview de datos
const previewDataTool = {
    name: 'previewData',
    description: 'Vista previa de datos de una tabla con filtros opcionales y límite de filas. Útil para explorar datos rápidamente.',
    inputSchema: {
        type: 'object',
        properties: {
            tableName: { type: 'string', description: 'Nombre de la tabla' },
            limit: { type: 'number', description: 'Número máximo de filas a devolver (default: 50)', default: 50 },
            whereClause: { type: 'string', description: 'Cláusula WHERE opcional (sin la palabra WHERE)' },
            orderBy: { type: 'string', description: 'Cláusula ORDER BY opcional (sin la palabra ORDER BY)' },
        },
        required: ['tableName'],
    },
};
// Estadísticas de columna
const getColumnStatsTool = {
    name: 'getColumnStats',
    description: 'Obtiene estadísticas completas de una columna específica incluyendo conteos, valores min/max, promedio y top 10 valores más frecuentes.',
    inputSchema: {
        type: 'object',
        properties: {
            tableName: { type: 'string', description: 'Nombre de la tabla' },
            columnName: { type: 'string', description: 'Nombre de la columna' },
        },
        required: ['tableName', 'columnName'],
    },
};
// Ejecutar stored procedure
const executeStoredProcedureTool = {
    name: 'executeStoredProcedure',
    description: 'Ejecuta un stored procedure con parámetros y devuelve los resultados. Especialmente útil para SAP que tiene muchos stored procedures para procesos de negocio.',
    inputSchema: {
        type: 'object',
        properties: {
            procedureName: { type: 'string', description: 'Nombre del stored procedure a ejecutar' },
            parameters: {
                type: 'array',
                description: 'Parámetros del stored procedure',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        value: { type: ['string', 'number', 'boolean', 'null'] },
                    },
                    required: ['name', 'value'],
                },
            },
        },
        required: ['procedureName'],
    },
};
// Análisis rápido de datos
const quickDataAnalysisTool = {
    name: 'quickDataAnalysis',
    description: 'Análisis rápido estadístico de una tabla incluyendo conteo de filas, distribuciones de columnas numéricas y valores top. Útil para entender rápidamente el contenido de una tabla.',
    inputSchema: {
        type: 'object',
        properties: {
            tableName: { type: 'string', description: 'Nombre de la tabla a analizar' },
        },
        required: ['tableName'],
    },
};
// Búsqueda comprehensiva
const searchDatabaseObjectsTool = {
    name: 'searchDatabaseObjects',
    description: 'Búsqueda comprehensiva en objetos de base de datos (tablas, vistas, stored procedures, funciones) por nombre. Muy útil para SAP con muchas tablas.',
    inputSchema: {
        type: 'object',
        properties: {
            searchTerm: { type: 'string', description: 'Término de búsqueda (se busca en nombres de objetos)' },
            objectTypes: {
                type: 'array',
                description: 'Tipos de objetos a buscar: TABLE, VIEW, PROCEDURE, FUNCTION',
                items: { type: 'string' },
                default: ['TABLE', 'VIEW', 'PROCEDURE', 'FUNCTION'],
            },
        },
        required: ['searchTerm'],
    },
};
// Dependencias de objetos
const getObjectDependenciesTool = {
    name: 'getObjectDependencies',
    description: 'Obtiene dependencias de un objeto de base de datos (qué objetos usa y qué objetos lo usan). Útil para entender relaciones en SAP.',
    inputSchema: {
        type: 'object',
        properties: {
            objectName: { type: 'string', description: 'Nombre del objeto' },
            objectType: { type: 'string', description: 'Tipo de objeto: TABLE, PROCEDURE, VIEW, FUNCTION', default: 'TABLE' },
        },
        required: ['objectName'],
    },
};
// Valores de muestra
const getSampleValuesTool = {
    name: 'getSampleValues',
    description: 'Obtiene valores de muestra únicos de una columna específica. Útil para entender qué valores contiene una columna.',
    inputSchema: {
        type: 'object',
        properties: {
            tableName: { type: 'string', description: 'Nombre de la tabla' },
            columnName: { type: 'string', description: 'Nombre de la columna' },
            limit: { type: 'number', description: 'Número máximo de valores a devolver (default: 50)', default: 50 },
        },
        required: ['tableName', 'columnName'],
    },
};
// Listar tablas agrupadas por prefijo (SAP)
const listTablesByPrefixTool = {
    name: 'listTablesByPrefix',
    description: 'Lista tablas agrupadas por prefijo. Especialmente útil para SAP Business One que usa prefijos como OITM (Items), OITW (Item Warehouse), etc.',
    inputSchema: {
        type: 'object',
        properties: {},
        required: [],
    },
};
// ============================================
// HERRAMIENTAS ESPECÍFICAS SAP BUSINESS ONE
// ============================================
const getSapTablesDictionaryTool = {
    name: 'getSapTablesDictionary',
    description: 'Obtiene el diccionario completo de tablas SAP Business One con descripciones, categorías y relaciones. Útil para entender la estructura de SAP B1.',
    inputSchema: {
        type: 'object',
        properties: {},
        required: [],
    },
};
const getSapTableInfoTool = {
    name: 'getSapTableInfo',
    description: 'Obtiene información detallada de una tabla SAP B1 específica, incluyendo descripción, campos con sus significados y relaciones.',
    inputSchema: {
        type: 'object',
        properties: {
            tableName: { type: 'string', description: 'Nombre de la tabla SAP B1 (ej: OITM, ORDR, OINV)' },
        },
        required: ['tableName'],
    },
};
const getItemStockTool = {
    name: 'getItemStock',
    description: 'Obtiene el stock actual de un artículo en SAP B1, incluyendo stock total, comprometido, en pedido y disponible por almacén.',
    inputSchema: {
        type: 'object',
        properties: {
            itemCode: { type: 'string', description: 'Código del artículo' },
        },
        required: ['itemCode'],
    },
};
const getBusinessPartnerTool = {
    name: 'getBusinessPartner',
    description: 'Obtiene información completa de un socio de negocio (cliente o proveedor) en SAP B1.',
    inputSchema: {
        type: 'object',
        properties: {
            cardCode: { type: 'string', description: 'Código del socio de negocio' },
        },
        required: ['cardCode'],
    },
};
const getSalesHistoryTool = {
    name: 'getSalesHistory',
    description: 'Obtiene el historial de ventas de un artículo en SAP B1, agrupado por mes.',
    inputSchema: {
        type: 'object',
        properties: {
            itemCode: { type: 'string', description: 'Código del artículo' },
            year: { type: 'number', description: 'Año a consultar (por defecto el año actual)' },
        },
        required: ['itemCode'],
    },
};
const getOpenSalesOrdersTool = {
    name: 'getOpenSalesOrders',
    description: 'Obtiene los pedidos de venta abiertos/pendientes en SAP B1.',
    inputSchema: {
        type: 'object',
        properties: {
            cardCode: { type: 'string', description: 'Filtrar por código de cliente (opcional)' },
        },
        required: [],
    },
};
const getOpenInvoicesTool = {
    name: 'getOpenInvoices',
    description: 'Obtiene las facturas de cliente pendientes de cobro en SAP B1.',
    inputSchema: {
        type: 'object',
        properties: {
            cardCode: { type: 'string', description: 'Filtrar por código de cliente (opcional)' },
        },
        required: [],
    },
};
const getPartnerBalanceTool = {
    name: 'getPartnerBalance',
    description: 'Obtiene el saldo y documentos abiertos de un cliente o proveedor en SAP B1.',
    inputSchema: {
        type: 'object',
        properties: {
            cardCode: { type: 'string', description: 'Código del socio de negocio' },
        },
        required: ['cardCode'],
    },
};
const getTopSellingItemsTool = {
    name: 'getTopSellingItems',
    description: 'Obtiene los artículos más vendidos en SAP B1.',
    inputSchema: {
        type: 'object',
        properties: {
            top: { type: 'number', description: 'Número de artículos a mostrar (por defecto 10)' },
            year: { type: 'number', description: 'Año a consultar (por defecto el año actual)' },
        },
        required: [],
    },
};
const getTopCustomersTool = {
    name: 'getTopCustomers',
    description: 'Obtiene los mejores clientes por facturación en SAP B1.',
    inputSchema: {
        type: 'object',
        properties: {
            top: { type: 'number', description: 'Número de clientes a mostrar (por defecto 10)' },
            year: { type: 'number', description: 'Año a consultar (por defecto el año actual)' },
        },
        required: [],
    },
};
const getLowStockItemsTool = {
    name: 'getLowStockItems',
    description: 'Obtiene los artículos con stock por debajo del mínimo definido en SAP B1.',
    inputSchema: {
        type: 'object',
        properties: {},
        required: [],
    },
};
const getSalesSummaryTool = {
    name: 'getSalesSummary',
    description: 'Obtiene un resumen de ventas con totales y comparativa con el período anterior.',
    inputSchema: {
        type: 'object',
        properties: {
            year: { type: 'number', description: 'Año a consultar (por defecto el año actual)' },
            month: { type: 'number', description: 'Mes a consultar (opcional, 1-12)' },
        },
        required: [],
    },
};
const searchDocumentTool = {
    name: 'searchDocument',
    description: 'Busca documentos en SAP B1 por número, cliente o referencia.',
    inputSchema: {
        type: 'object',
        properties: {
            searchTerm: { type: 'string', description: 'Término de búsqueda (número de documento, código de cliente, etc.)' },
            docType: { type: 'string', description: 'Tipo de documento: invoice, order, delivery, purchase, purchaseInvoice (opcional)' },
        },
        required: ['searchTerm'],
    },
};
// Almacenar referencias a los handlers para acceso directo desde HTTP
const toolsListHandler = async () => {
    return {
        tools: [
            // Herramientas básicas SQL
            listTablesTool,
            getTableSchemaTool,
            runSqlQueryTool,
            listDatabasesTool,
            describeDatabaseTool,
            // Herramientas de análisis
            analyzeTableTool,
            analyzeStoredProcedureTool,
            previewDataTool,
            getColumnStatsTool,
            executeStoredProcedureTool,
            quickDataAnalysisTool,
            searchDatabaseObjectsTool,
            getObjectDependenciesTool,
            getSampleValuesTool,
            listTablesByPrefixTool,
            // Herramientas específicas SAP Business One
            getSapTablesDictionaryTool,
            getSapTableInfoTool,
            getItemStockTool,
            getBusinessPartnerTool,
            getSalesHistoryTool,
            getOpenSalesOrdersTool,
            getOpenInvoicesTool,
            getPartnerBalanceTool,
            getTopSellingItemsTool,
            getTopCustomersTool,
            getLowStockItemsTool,
            getSalesSummaryTool,
            searchDocumentTool,
        ],
    };
};
exports.toolsListHandler = toolsListHandler;
/**
 * Registra todas las herramientas SQL en el servidor MCP
 */
function registerSqlTools(server) {
    // Listar herramientas disponibles
    server.setRequestHandler(types_js_1.ListToolsRequestSchema, toolsListHandler);
    // Handler para ejecutar herramientas
    const toolsCallHandler = async (request) => {
        const { name, arguments: args } = request.params;
        try {
            switch (name) {
                case 'listTables': {
                    const query = `
            SELECT TABLE_SCHEMA, TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_SCHEMA, TABLE_NAME
          `;
                    const result = await (0, sqlClient_1.executeQuery)(query);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(result.map((row) => ({
                                    schema: row.TABLE_SCHEMA,
                                    name: row.TABLE_NAME,
                                    fullName: `${row.TABLE_SCHEMA}.${row.TABLE_NAME}`,
                                })), null, 2),
                            },
                        ],
                    };
                }
                case 'getTableSchema': {
                    const { tableName } = args;
                    if (!tableName || typeof tableName !== 'string') {
                        throw new Error('tableName es requerido y debe ser un string');
                    }
                    const query = `
            SELECT 
              COLUMN_NAME,
              DATA_TYPE,
              CHARACTER_MAXIMUM_LENGTH,
              NUMERIC_PRECISION,
              NUMERIC_SCALE,
              IS_NULLABLE,
              COLUMN_DEFAULT
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = @tableName
            ORDER BY ORDINAL_POSITION
          `;
                    const result = await (0, sqlClient_1.executeQuery)(query, [
                        { name: 'tableName', value: tableName },
                    ]);
                    if (result.length === 0) {
                        throw new Error(`No se encontró la tabla: ${tableName}`);
                    }
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(result.map((row) => ({
                                    columnName: row.COLUMN_NAME,
                                    dataType: row.DATA_TYPE,
                                    maxLength: row.CHARACTER_MAXIMUM_LENGTH,
                                    precision: row.NUMERIC_PRECISION,
                                    scale: row.NUMERIC_SCALE,
                                    nullable: row.IS_NULLABLE === 'YES',
                                    defaultValue: row.COLUMN_DEFAULT,
                                })), null, 2),
                            },
                        ],
                    };
                }
                case 'runSqlQuery': {
                    const { query, parameters } = args;
                    if (!query || typeof query !== 'string') {
                        throw new Error('query es requerido y debe ser un string');
                    }
                    // Validación básica de seguridad: solo permitir SELECT
                    const trimmedQuery = query.trim().toUpperCase();
                    if (!trimmedQuery.startsWith('SELECT')) {
                        throw new Error('Solo se permiten consultas SELECT por razones de seguridad');
                    }
                    // NO agregar límites automáticamente - el usuario controla la query
                    // Solo verificamos si hay un límite muy alto y advertimos
                    let finalQuery = query;
                    let warningMessage;
                    // Verificar si la query ya tiene TOP o LIMIT
                    const hasTop = trimmedQuery.includes('TOP');
                    const hasLimit = trimmedQuery.includes('LIMIT');
                    // Si no tiene límite, ejecutamos la query tal cual
                    // El usuario es responsable de usar filtros apropiados
                    if (!hasTop && !hasLimit) {
                        // No agregamos límite automático - permitimos consultas completas
                        // Esto es importante para comparativas de ventas y análisis complejos
                        warningMessage = `⚠️ Esta consulta no tiene límite de filas. Si devuelve muchas filas, considere agregar filtros o usar TOP/LIMIT.`;
                    }
                    const result = await (0, sqlClient_1.executeQuery)(finalQuery, parameters);
                    // Advertir si el resultado es muy grande (pero no bloquear)
                    if (result.length >= MAX_RESULT_ROWS) {
                        warningMessage = `⚠️ La consulta devolvió ${result.length} filas (límite configurado: ${MAX_RESULT_ROWS}). Si necesita más filas, ajuste MAX_QUERY_ROWS en las variables de entorno.`;
                    }
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    rowCount: result.length,
                                    rows: result,
                                    message: warningMessage,
                                }, null, 2),
                            },
                        ],
                    };
                }
                case 'listDatabases': {
                    const query = `
            SELECT 
              name AS database_name,
              database_id,
              create_date
            FROM sys.databases
            WHERE state_desc = 'ONLINE'
            ORDER BY name
          `;
                    const result = await (0, sqlClient_1.executeQuery)(query);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(result.map((row) => ({
                                    name: row.database_name,
                                    id: row.database_id,
                                    created: row.create_date,
                                })), null, 2),
                            },
                        ],
                    };
                }
                case 'describeDatabase': {
                    const tableCountQuery = `
            SELECT COUNT(*) AS table_count
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
          `;
                    const tableCount = await (0, sqlClient_1.executeScalar)(tableCountQuery);
                    const sizeQuery = `
            SELECT 
              SUM(size * 8 / 1024) AS size_mb
            FROM sys.master_files
            WHERE database_id = DB_ID()
          `;
                    const sizeMb = await (0, sqlClient_1.executeScalar)(sizeQuery);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    currentDatabase: env_1.config.sql.database,
                                    tableCount: tableCount || 0,
                                    approximateSizeMB: sizeMb || 0,
                                }, null, 2),
                            },
                        ],
                    };
                }
                // Herramientas SAP-optimizadas
                case 'analyzeTable': {
                    const { tableName } = args;
                    if (!tableName || typeof tableName !== 'string') {
                        throw new Error('tableName es requerido y debe ser un string');
                    }
                    const result = await sapTools.analyzeTableStructure(tableName);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'analyzeStoredProcedure': {
                    const { procedureName } = args;
                    if (!procedureName || typeof procedureName !== 'string') {
                        throw new Error('procedureName es requerido y debe ser un string');
                    }
                    const result = await sapTools.analyzeStoredProcedure(procedureName);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'previewData': {
                    const { tableName, limit, whereClause, orderBy } = args;
                    if (!tableName || typeof tableName !== 'string') {
                        throw new Error('tableName es requerido y debe ser un string');
                    }
                    const result = await sapTools.previewTableData(tableName, limit || env_1.config.limits.defaultPreviewRows, whereClause, orderBy);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'getColumnStats': {
                    const { tableName, columnName } = args;
                    if (!tableName || typeof tableName !== 'string') {
                        throw new Error('tableName es requerido y debe ser un string');
                    }
                    if (!columnName || typeof columnName !== 'string') {
                        throw new Error('columnName es requerido y debe ser un string');
                    }
                    const result = await sapTools.getColumnStatistics(tableName, columnName);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'executeStoredProcedure': {
                    const { procedureName, parameters } = args;
                    if (!procedureName || typeof procedureName !== 'string') {
                        throw new Error('procedureName es requerido y debe ser un string');
                    }
                    const result = await (0, sqlClient_1.executeProcedure)(procedureName, parameters);
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({
                                    procedureName,
                                    resultSets: result.resultSets,
                                    returnValue: result.returnValue,
                                    resultSetCount: result.resultSets.length,
                                }, null, 2),
                            },
                        ],
                    };
                }
                case 'quickDataAnalysis': {
                    const { tableName } = args;
                    if (!tableName || typeof tableName !== 'string') {
                        throw new Error('tableName es requerido y debe ser un string');
                    }
                    const result = await sapTools.quickDataAnalysis(tableName);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'searchDatabaseObjects': {
                    const { searchTerm, objectTypes } = args;
                    if (!searchTerm || typeof searchTerm !== 'string') {
                        throw new Error('searchTerm es requerido y debe ser un string');
                    }
                    const result = await sapTools.searchDatabaseObjects(searchTerm, objectTypes || ['TABLE', 'VIEW', 'PROCEDURE', 'FUNCTION']);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'getObjectDependencies': {
                    const { objectName, objectType } = args;
                    if (!objectName || typeof objectName !== 'string') {
                        throw new Error('objectName es requerido y debe ser un string');
                    }
                    const result = await sapTools.getObjectDependencies(objectName, objectType || 'TABLE');
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'getSampleValues': {
                    const { tableName, columnName, limit } = args;
                    if (!tableName || typeof tableName !== 'string') {
                        throw new Error('tableName es requerido y debe ser un string');
                    }
                    if (!columnName || typeof columnName !== 'string') {
                        throw new Error('columnName es requerido y debe ser un string');
                    }
                    const result = await sapTools.getSampleValues(tableName, columnName, limit || env_1.config.limits.defaultSampleValues);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'listTablesByPrefix': {
                    const result = await sapTools.listTablesGroupedByPrefix();
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                // ============================================
                // HERRAMIENTAS ESPECÍFICAS SAP BUSINESS ONE
                // ============================================
                case 'getSapTablesDictionary': {
                    const result = await sapB1Tools.getSapTablesDictionary();
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'getSapTableInfo': {
                    const { tableName } = args;
                    if (!tableName || typeof tableName !== 'string') {
                        throw new Error('tableName es requerido y debe ser un string');
                    }
                    const result = await sapB1Tools.getSapTableInfo(tableName);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'getItemStock': {
                    const { itemCode } = args;
                    if (!itemCode || typeof itemCode !== 'string') {
                        throw new Error('itemCode es requerido y debe ser un string');
                    }
                    const result = await sapB1Tools.getItemStock(itemCode);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'getBusinessPartner': {
                    const { cardCode } = args;
                    if (!cardCode || typeof cardCode !== 'string') {
                        throw new Error('cardCode es requerido y debe ser un string');
                    }
                    const result = await sapB1Tools.getBusinessPartner(cardCode);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'getSalesHistory': {
                    const { itemCode, year } = args;
                    if (!itemCode || typeof itemCode !== 'string') {
                        throw new Error('itemCode es requerido y debe ser un string');
                    }
                    const result = await sapB1Tools.getSalesHistory(itemCode, year);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'getOpenSalesOrders': {
                    const { cardCode } = args;
                    const result = await sapB1Tools.getOpenSalesOrders(cardCode);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'getOpenInvoices': {
                    const { cardCode } = args;
                    const result = await sapB1Tools.getOpenInvoices(cardCode);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'getPartnerBalance': {
                    const { cardCode } = args;
                    if (!cardCode || typeof cardCode !== 'string') {
                        throw new Error('cardCode es requerido y debe ser un string');
                    }
                    const result = await sapB1Tools.getPartnerBalance(cardCode);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'getTopSellingItems': {
                    const { top, year } = args;
                    const result = await sapB1Tools.getTopSellingItems(top || 10, year);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'getTopCustomers': {
                    const { top, year } = args;
                    const result = await sapB1Tools.getTopCustomers(top || 10, year);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'getLowStockItems': {
                    const result = await sapB1Tools.getLowStockItems();
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'getSalesSummary': {
                    const { year, month } = args;
                    const result = await sapB1Tools.getSalesSummary(year, month);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                case 'searchDocument': {
                    const { searchTerm, docType } = args;
                    if (!searchTerm || typeof searchTerm !== 'string') {
                        throw new Error('searchTerm es requerido y debe ser un string');
                    }
                    const result = await sapB1Tools.searchDocument(searchTerm, docType);
                    return {
                        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                    };
                }
                default:
                    throw new Error(`Herramienta desconocida: ${name}`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            error: errorMessage,
                        }, null, 2),
                    },
                ],
                isError: true,
            };
        }
    };
    server.setRequestHandler(types_js_1.CallToolRequestSchema, toolsCallHandler);
}
//# sourceMappingURL=sqlTools.js.map