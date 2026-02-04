"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeQuery = executeQuery;
exports.executeScalar = executeScalar;
exports.executeProcedure = executeProcedure;
exports.closePool = closePool;
const mssql_1 = __importDefault(require("mssql"));
const env_1 = require("../config/env");
// Configuración del pool de conexiones a SQL Server
// Compatible con SAP Business One y Claude Desktop
const sqlConfig = {
    user: env_1.config.sql.user,
    password: env_1.config.sql.password,
    server: env_1.config.sql.host,
    port: env_1.config.sql.port,
    database: env_1.config.sql.database,
    options: {
        encrypt: env_1.config.sql.encrypt,
        enableArithAbort: true,
        trustServerCertificate: env_1.config.sql.trustServerCertificate, // Configurable desde variables de entorno
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
    connectionTimeout: 30000,
    requestTimeout: 60000, // 60 segundos para consultas complejas de SAP
};
// Pool de conexiones global (se inicializa al primer uso)
let pool = null;
let poolPromise = null;
/**
 * Obtiene o crea el pool de conexiones a SQL Server
 */
async function getPool() {
    if (pool && pool.connected) {
        return pool;
    }
    if (!poolPromise) {
        poolPromise = new mssql_1.default.ConnectionPool(sqlConfig)
            .connect()
            .then((p) => {
            console.log('✅ Conectado a SQL Server:', {
                server: env_1.config.sql.host,
                database: env_1.config.sql.database,
            });
            pool = p;
            return p;
        })
            .catch((err) => {
            console.error('❌ Error al conectar a SQL Server:', err);
            poolPromise = null;
            throw err;
        });
    }
    return poolPromise;
}
/**
 * Ejecuta una consulta SQL y devuelve los resultados
 * @param query - Consulta SQL a ejecutar
 * @param parameters - Parámetros opcionales para la consulta
 * @returns Array de objetos con los resultados
 */
async function executeQuery(query, parameters) {
    const connectionPool = await getPool();
    const request = connectionPool.request();
    // Agregar parámetros si se proporcionan
    if (parameters && parameters.length > 0) {
        parameters.forEach((param) => {
            if (param.type) {
                request.input(param.name, param.type, param.value);
            }
            else {
                // Inferir tipo automáticamente
                request.input(param.name, param.value);
            }
        });
    }
    try {
        const result = await request.query(query);
        return result.recordset || [];
    }
    catch (error) {
        // Mejorar mensajes de error para el usuario
        if (error instanceof Error) {
            throw new Error(`Error SQL: ${error.message}`);
        }
        throw error;
    }
}
/**
 * Ejecuta una consulta SQL y devuelve un solo resultado (útil para COUNT, etc.)
 */
async function executeScalar(query, parameters) {
    const results = await executeQuery(query, parameters);
    if (results.length === 0) {
        return null;
    }
    const firstRow = results[0];
    const firstKey = Object.keys(firstRow)[0];
    return firstRow[firstKey];
}
/**
 * Ejecuta un stored procedure y devuelve los resultados
 * @param procedureName - Nombre del stored procedure
 * @param parameters - Parámetros opcionales para el stored procedure
 * @returns Array de objetos con los resultados (puede haber múltiples result sets)
 */
async function executeProcedure(procedureName, parameters) {
    const connectionPool = await getPool();
    const request = connectionPool.request();
    // Agregar parámetros si se proporcionan
    if (parameters && parameters.length > 0) {
        parameters.forEach((param) => {
            if (param.type) {
                request.input(param.name, param.type, param.value);
            }
            else {
                request.input(param.name, param.value);
            }
        });
    }
    try {
        const result = await request.execute(procedureName);
        // Los stored procedures pueden devolver múltiples result sets
        const resultSets = [];
        if (result.recordsets) {
            // recordsets puede ser un array o un objeto
            if (Array.isArray(result.recordsets)) {
                resultSets.push(...result.recordsets);
            }
            else {
                // Si es un objeto, convertir a array
                const recordsetsArray = Object.values(result.recordsets);
                resultSets.push(...recordsetsArray);
            }
        }
        else if (result.recordset) {
            resultSets.push(result.recordset);
        }
        return {
            resultSets,
            returnValue: result.returnValue,
        };
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Error ejecutando stored procedure ${procedureName}: ${error.message}`);
        }
        throw error;
    }
}
/**
 * Cierra el pool de conexiones (útil para shutdown graceful)
 */
async function closePool() {
    if (pool) {
        try {
            await pool.close();
            console.log('✅ Pool de conexiones cerrado');
            pool = null;
            poolPromise = null;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('❌ Error al cerrar el pool:', errorMessage);
        }
    }
}
//# sourceMappingURL=sqlClient.js.map