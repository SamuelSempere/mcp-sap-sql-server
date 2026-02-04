import sql from 'mssql';
import { config } from '../config/env';

// Configuración del pool de conexiones a SQL Server
// Compatible con SAP Business One y Claude Desktop
const sqlConfig: sql.config = {
  user: config.sql.user,
  password: config.sql.password,
  server: config.sql.host,
  port: config.sql.port,
  database: config.sql.database,
  options: {
    encrypt: config.sql.encrypt,
    enableArithAbort: true,
    trustServerCertificate: config.sql.trustServerCertificate, // Configurable desde variables de entorno
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
let pool: sql.ConnectionPool | null = null;
let poolPromise: Promise<sql.ConnectionPool> | null = null;

/**
 * Obtiene o crea el pool de conexiones a SQL Server
 */
async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }

  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(sqlConfig)
      .connect()
      .then((p: sql.ConnectionPool) => {
        pool = p;
        return p;
      })
      .catch((err: Error) => {
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
export async function executeQuery(
  query: string,
  parameters?: Array<{ name: string; value: any; type?: sql.ISqlType }>
): Promise<any[]> {
  const connectionPool = await getPool();
  const request = connectionPool.request();

  // Agregar parámetros si se proporcionan
  if (parameters && parameters.length > 0) {
    parameters.forEach((param) => {
      if (param.type) {
        request.input(param.name, param.type, param.value);
      } else {
        // Inferir tipo automáticamente
        request.input(param.name, param.value);
      }
    });
  }

  try {
    const result = await request.query(query);
    return result.recordset || [];
  } catch (error) {
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
export async function executeScalar(
  query: string,
  parameters?: Array<{ name: string; value: any; type?: sql.ISqlType }>
): Promise<any> {
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
export async function executeProcedure(
  procedureName: string,
  parameters?: Array<{ name: string; value: any; type?: sql.ISqlType }>
): Promise<{ resultSets: any[][]; returnValue?: any }> {
  const connectionPool = await getPool();
  const request = connectionPool.request();

  // Agregar parámetros si se proporcionan
  if (parameters && parameters.length > 0) {
    parameters.forEach((param) => {
      if (param.type) {
        request.input(param.name, param.type, param.value);
      } else {
        request.input(param.name, param.value);
      }
    });
  }

  try {
    const result = await request.execute(procedureName);
    
    // Los stored procedures pueden devolver múltiples result sets
    const resultSets: any[][] = [];
    if (result.recordsets) {
      // recordsets puede ser un array o un objeto
      if (Array.isArray(result.recordsets)) {
        resultSets.push(...result.recordsets);
      } else {
        // Si es un objeto, convertir a array
        const recordsetsArray = Object.values(result.recordsets);
        resultSets.push(...recordsetsArray);
      }
    } else if (result.recordset) {
      resultSets.push(result.recordset);
    }

    return {
      resultSets,
      returnValue: result.returnValue,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error ejecutando stored procedure ${procedureName}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Cierra el pool de conexiones (útil para shutdown graceful)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    try {
      await pool.close();
      pool = null;
      poolPromise = null;
    } catch (error: unknown) {
      // Silenciar errores de cierre
    }
  }
}

