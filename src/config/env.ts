import dotenv from 'dotenv';
import { z } from 'zod';

// Cargar variables de entorno desde .env (solo si existe)
dotenv.config();

/**
 * Schema de validación para variables de entorno
 * 
 * Soporta dos formatos de configuración:
 * 
 * 1. Formato Claude Desktop (DB_*):
 *    DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT, DB_ENCRYPT, DB_TRUST_SERVER_CERTIFICATE
 * 
 * 2. Formato legacy (SQL_SERVER_*):
 *    SQL_SERVER_HOST, SQL_SERVER_DATABASE, SQL_SERVER_USER, SQL_SERVER_PASSWORD, SQL_SERVER_PORT, SQL_SERVER_ENCRYPT
 */
const envSchema = z.object({
  // Formato Claude Desktop (preferido)
  DB_SERVER: z.string().optional(),
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_PORT: z.string().optional(),
  DB_ENCRYPT: z.string().optional(),
  DB_TRUST_SERVER_CERTIFICATE: z.string().optional(),
  DB_AUTHENTICATION_TYPE: z.string().optional(), // 'sql' o 'windows'
  
  // Formato legacy (compatibilidad hacia atrás)
  SQL_SERVER_HOST: z.string().optional(),
  SQL_SERVER_PORT: z.string().optional(),
  SQL_SERVER_DATABASE: z.string().optional(),
  SQL_SERVER_USER: z.string().optional(),
  SQL_SERVER_PASSWORD: z.string().optional(),
  SQL_SERVER_ENCRYPT: z.string().optional(),
  
  // Configuración del servidor HTTP (solo para modo HTTP)
  PORT: z.string().default("3000"),
  MCP_AUTH_TOKEN: z.string().optional(),
  MCP_API_KEY: z.string().optional(),
  MAX_QUERY_ROWS: z.string().optional(),
});

// Validar variables de entorno
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Error de validación de variables de entorno:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

// Resolver configuración (priorizar formato Claude Desktop sobre legacy)
const resolveConfig = () => {
  const host = env.DB_SERVER || env.SQL_SERVER_HOST;
  const database = env.DB_NAME || env.SQL_SERVER_DATABASE;
  const user = env.DB_USER || env.SQL_SERVER_USER;
  const password = env.DB_PASSWORD || env.SQL_SERVER_PASSWORD;
  const port = env.DB_PORT || env.SQL_SERVER_PORT || "1433";
  const encrypt = env.DB_ENCRYPT || env.SQL_SERVER_ENCRYPT || "false";
  const trustServerCertificate = env.DB_TRUST_SERVER_CERTIFICATE || "true";

  // Validar que tenemos los campos requeridos
  if (!host) {
    console.error('❌ Error: DB_SERVER o SQL_SERVER_HOST es requerido');
    process.exit(1);
  }
  if (!database) {
    console.error('❌ Error: DB_NAME o SQL_SERVER_DATABASE es requerido');
    process.exit(1);
  }
  if (!user) {
    console.error('❌ Error: DB_USER o SQL_SERVER_USER es requerido');
    process.exit(1);
  }
  if (!password) {
    console.error('❌ Error: DB_PASSWORD o SQL_SERVER_PASSWORD es requerido');
    process.exit(1);
  }

  return {
    host,
    database,
    user,
    password,
    port: parseInt(port, 10),
    encrypt: encrypt === 'true' || encrypt === '1',
    trustServerCertificate: trustServerCertificate === 'true' || trustServerCertificate === '1',
  };
};

const sqlConfig = resolveConfig();

export const config = {
  sql: {
    host: sqlConfig.host,
    port: sqlConfig.port,
    database: sqlConfig.database,
    user: sqlConfig.user,
    password: sqlConfig.password,
    encrypt: sqlConfig.encrypt,
    trustServerCertificate: sqlConfig.trustServerCertificate,
  },
  server: {
    port: parseInt(env.PORT, 10),
  },
  auth: {
    token: env.MCP_AUTH_TOKEN,
    apiKey: env.MCP_API_KEY,
  },
  limits: {
    maxQueryRows: env.MAX_QUERY_ROWS ? parseInt(env.MAX_QUERY_ROWS, 10) : 100000,
    defaultPreviewRows: 50,
    defaultSampleValues: 50,
  },
};

// Función helper para cargar y validar (útil para tests)
export function loadEnv(): typeof config {
  return config;
}

