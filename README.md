# MCP SAP SQL Server

Servidor MCP (Model Context Protocol) para SAP Business One SQL Server - Compatible con **Claude Desktop** y ChatGPT Desktop.

## Modos de Operación

Este MCP soporta dos modos de operación:

1. **Modo STDIO** (recomendado para Claude Desktop) - Comunicación directa por entrada/salida estándar
2. **Modo HTTP** (para ChatGPT Desktop/remoto) - Servidor HTTP con Cloudflare Tunnel

## Características

- Protocolo MCP completo (initialize, tools/list, tools/call)
- Herramientas SQL optimizadas para SAP Business One
- Compatible con Claude Desktop (stdio) y ChatGPT Desktop (HTTP)
- Sin credenciales hardcodeadas

### Herramientas Disponibles

| Herramienta | Descripción |
|-------------|-------------|
| `listTables` | Lista todas las tablas de la base de datos |
| `getTableSchema` | Obtiene el esquema de una tabla específica |
| `runSqlQuery` | Ejecuta consultas SQL SELECT |
| `listDatabases` | Lista todas las bases de datos del servidor |
| `describeDatabase` | Información general de la base de datos |
| `analyzeTable` | Análisis completo de estructura de tabla (SAP) |
| `analyzeStoredProcedure` | Analiza stored procedures |
| `previewData` | Vista previa de datos con filtros |
| `getColumnStats` | Estadísticas de una columna |
| `executeStoredProcedure` | Ejecuta stored procedures |
| `quickDataAnalysis` | Análisis rápido estadístico |
| `searchDatabaseObjects` | Búsqueda en objetos de BD |
| `getObjectDependencies` | Dependencias de objetos |
| `getSampleValues` | Valores de muestra de columna |
| `listTablesByPrefix` | Tablas agrupadas por prefijo (SAP) |

---

## Configuración para Claude Desktop (Modo STDIO)

### Paso 1: Instalar Dependencias

```bash
npm install
npm run build
```

### Paso 2: Configurar Claude Desktop

Edita el archivo de configuración de Claude Desktop:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

Añade la configuración del MCP:

```json
{
  "mcpServers": {
    "sap-sql": {
      "command": "npx",
      "args": ["-y", "mcp-sapb1-sql"],
      "env": {
        "DB_SERVER": "tu-servidor-sql",
        "DB_NAME": "tu-base-de-datos",
        "DB_USER": "tu-usuario",
        "DB_PASSWORD": "tu-password",
        "DB_PORT": "1433",
        "DB_ENCRYPT": "false",
        "DB_TRUST_SERVER_CERTIFICATE": "true"
      }
    }
  }
}
```

### Variables de Entorno Disponibles

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `DB_SERVER` | Servidor SQL Server | (requerido) |
| `DB_NAME` | Nombre de la base de datos | (requerido) |
| `DB_USER` | Usuario de SQL Server | (requerido) |
| `DB_PASSWORD` | Contraseña | (requerido) |
| `DB_PORT` | Puerto SQL Server | `1433` |
| `DB_ENCRYPT` | Cifrar conexión | `false` |
| `DB_TRUST_SERVER_CERTIFICATE` | Confiar en certificado | `true` |
| `DB_AUTHENTICATION_TYPE` | Tipo de autenticación | `sql` |

### Paso 3: Reiniciar Claude Desktop

Cierra y vuelve a abrir Claude Desktop. El MCP debería aparecer en la lista de herramientas disponibles.

### Ejemplo de Uso en Claude

Una vez configurado, puedes hacer preguntas como:

- "Lista todas las tablas de SAP"
- "Muéstrame el esquema de la tabla OITM"
- "Dame los primeros 10 registros de OITW"
- "Busca tablas que contengan 'INV' en el nombre"
- "Analiza las estadísticas de la columna ItemCode en OITM"

---

## Configuración para ChatGPT Desktop (Modo HTTP)

Si prefieres usar el modo HTTP (por ejemplo, con ChatGPT Desktop o acceso remoto):

### Paso 1: Configurar Variables de Entorno

Crea un archivo `.env`:

```env
SQL_SERVER_HOST=tu-servidor-sql
SQL_SERVER_PORT=1433
SQL_SERVER_DATABASE=tu-base-de-datos
SQL_SERVER_USER=tu-usuario
SQL_SERVER_PASSWORD=tu-password
SQL_SERVER_ENCRYPT=false

PORT=3333
LISTEN_HOST=0.0.0.0
MCP_API_KEY=tu-api-key-secreta
NODE_ENV=production
```

### Paso 2: Iniciar Servidor HTTP

```bash
npm run start:http
```

El servidor escuchará en `http://0.0.0.0:3333`.

### Paso 3: Exponer con Cloudflare Tunnel (opcional)

Para acceso remoto, configura Cloudflare Tunnel según las instrucciones del archivo `README-HTTP.md`.

---

## Desarrollo

### Scripts Disponibles

```bash
# Desarrollo (modo stdio)
npm run dev

# Desarrollo (modo HTTP)
npm run dev:http

# Compilar
npm run build

# Producción (modo stdio)
npm start

# Producción (modo HTTP)
npm run start:http
```

### Estructura del Proyecto

```
.
├── src/
│   ├── config/
│   │   └── env.ts              # Configuración de variables de entorno
│   ├── db/
│   │   └── sqlClient.ts        # Cliente SQL Server
│   ├── mcp/
│   │   └── handler.ts          # Handler MCP (modo HTTP)
│   ├── tools/
│   │   ├── sqlTools.ts         # Herramientas SQL básicas
│   │   └── sapTools.ts         # Herramientas optimizadas para SAP
│   ├── server.ts               # Servidor HTTP (ChatGPT Desktop)
│   └── stdio-server.ts         # Servidor STDIO (Claude Desktop)
├── dist/                       # Código compilado
├── .env                        # Variables de entorno (no commitear)
├── package.json
├── tsconfig.json
└── README.md
```

---

## Troubleshooting

### Error: "DB_SERVER o SQL_SERVER_HOST es requerido"

Verifica que las variables de entorno estén configuradas correctamente en `claude_desktop_config.json`.

### Claude Desktop no detecta el MCP

1. Verifica que la ruta al archivo `stdio-server.js` sea correcta
2. Asegúrate de haber ejecutado `npm run build`
3. Reinicia Claude Desktop completamente

### Error de conexión a SQL Server

1. Verifica que el servidor SQL Server esté accesible
2. Verifica las credenciales
3. Si usas SSL/TLS, ajusta `DB_ENCRYPT` y `DB_TRUST_SERVER_CERTIFICATE`

### Timeout en consultas

El timeout por defecto es de 60 segundos. Para consultas más largas, considera usar filtros o paginación.

---

## Licencia

MIT
