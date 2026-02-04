import { executeQuery, executeScalar, executeProcedure } from '../db/sqlClient';

/**
 * Herramientas optimizadas para SAP SQL Server
 * Estas herramientas están diseñadas específicamente para trabajar con
 * SAP Business One y aprovechan las características específicas de SAP
 */

/**
 * Análisis completo de estructura de tabla (índices, claves, constraints)
 */
export async function analyzeTableStructure(tableName: string): Promise<any> {
  // Obtener información de columnas
  const columnsQuery = `
    SELECT 
      c.COLUMN_NAME,
      c.DATA_TYPE,
      c.CHARACTER_MAXIMUM_LENGTH,
      c.NUMERIC_PRECISION,
      c.NUMERIC_SCALE,
      c.IS_NULLABLE,
      c.COLUMN_DEFAULT,
      c.ORDINAL_POSITION
    FROM INFORMATION_SCHEMA.COLUMNS c
    WHERE c.TABLE_NAME = @tableName
    ORDER BY c.ORDINAL_POSITION
  `;

  // Obtener claves primarias
  const primaryKeysQuery = `
    SELECT 
      kcu.COLUMN_NAME,
      kcu.ORDINAL_POSITION
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
    INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
      ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
    WHERE tc.TABLE_NAME = @tableName
      AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
    ORDER BY kcu.ORDINAL_POSITION
  `;

  // Obtener claves foráneas
  const foreignKeysQuery = `
    SELECT 
      fk.name AS FK_NAME,
      OBJECT_NAME(fk.parent_object_id) AS TABLE_NAME,
      COL_NAME(fc.parent_object_id, fc.parent_column_id) AS COLUMN_NAME,
      OBJECT_NAME(fk.referenced_object_id) AS REFERENCED_TABLE_NAME,
      COL_NAME(fc.referenced_object_id, fc.referenced_column_id) AS REFERENCED_COLUMN_NAME
    FROM sys.foreign_keys AS fk
    INNER JOIN sys.foreign_key_columns AS fc
      ON fk.object_id = fc.constraint_object_id
    WHERE OBJECT_NAME(fk.parent_object_id) = @tableName
  `;

  // Obtener índices (usando STUFF para compatibilidad con SQL Server 2012+)
  const indexesQuery = `
    SELECT 
      i.name AS INDEX_NAME,
      i.type_desc AS INDEX_TYPE,
      i.is_unique,
      i.is_primary_key,
      STUFF((
        SELECT ', ' + c.name
        FROM sys.index_columns ic2
        INNER JOIN sys.columns c ON ic2.object_id = c.object_id AND ic2.column_id = c.column_id
        WHERE ic2.object_id = i.object_id 
          AND ic2.index_id = i.index_id
        ORDER BY ic2.key_ordinal
        FOR XML PATH('')
      ), 1, 2, '') AS COLUMNS
    FROM sys.indexes i
    WHERE OBJECT_NAME(i.object_id) = @tableName
      AND i.name IS NOT NULL
    ORDER BY i.is_primary_key DESC, i.name
  `;

  // Obtener constraints (CHECK, UNIQUE, etc.)
  const constraintsQuery = `
    SELECT 
      tc.CONSTRAINT_NAME,
      tc.CONSTRAINT_TYPE,
      cc.CHECK_CLAUSE
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
    LEFT JOIN INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc
      ON tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
    WHERE tc.TABLE_NAME = @tableName
      AND tc.CONSTRAINT_TYPE IN ('CHECK', 'UNIQUE')
  `;

  const [columns, primaryKeys, foreignKeys, indexes, constraints] = await Promise.all([
    executeQuery(columnsQuery, [{ name: 'tableName', value: tableName }]),
    executeQuery(primaryKeysQuery, [{ name: 'tableName', value: tableName }]),
    executeQuery(foreignKeysQuery, [{ name: 'tableName', value: tableName }]),
    executeQuery(indexesQuery, [{ name: 'tableName', value: tableName }]),
    executeQuery(constraintsQuery, [{ name: 'tableName', value: tableName }]),
  ]);

  return {
    tableName,
    columns: columns.map((c: any) => ({
      name: c.COLUMN_NAME,
      dataType: c.DATA_TYPE,
      maxLength: c.CHARACTER_MAXIMUM_LENGTH,
      precision: c.NUMERIC_PRECISION,
      scale: c.NUMERIC_SCALE,
      nullable: c.IS_NULLABLE === 'YES',
      defaultValue: c.COLUMN_DEFAULT,
      position: c.ORDINAL_POSITION,
    })),
    primaryKeys: primaryKeys.map((pk: any) => ({
      column: pk.COLUMN_NAME,
      position: pk.ORDINAL_POSITION,
    })),
    foreignKeys: foreignKeys.map((fk: any) => ({
      name: fk.FK_NAME,
      column: fk.COLUMN_NAME,
      referencedTable: fk.REFERENCED_TABLE_NAME,
      referencedColumn: fk.REFERENCED_COLUMN_NAME,
    })),
    indexes: indexes.map((idx: any) => ({
      name: idx.INDEX_NAME,
      type: idx.INDEX_TYPE,
      unique: idx.is_unique,
      primaryKey: idx.is_primary_key,
      columns: idx.COLUMNS,
    })),
    constraints: constraints.map((c: any) => ({
      name: c.CONSTRAINT_NAME,
      type: c.CONSTRAINT_TYPE,
      checkClause: c.CHECK_CLAUSE,
    })),
  };
}

/**
 * Análisis de estructura de stored procedure
 */
export async function analyzeStoredProcedure(procedureName: string): Promise<any> {
  // Obtener parámetros del stored procedure
  const parametersQuery = `
    SELECT 
      p.name AS PARAMETER_NAME,
      t.name AS DATA_TYPE,
      p.max_length,
      p.precision,
      p.scale,
      p.is_output,
      p.has_default_value,
      p.default_value
    FROM sys.parameters p
    INNER JOIN sys.types t ON p.user_type_id = t.user_type_id
    WHERE OBJECT_NAME(p.object_id) = @procedureName
      AND p.name IS NOT NULL
    ORDER BY p.parameter_id
  `;

  // Obtener dependencias
  const dependenciesQuery = `
    SELECT DISTINCT
      OBJECT_NAME(referenced_major_id) AS REFERENCED_OBJECT,
      OBJECT_SCHEMA_NAME(referenced_major_id) AS REFERENCED_SCHEMA
    FROM sys.sql_dependencies
    WHERE object_id = OBJECT_ID(@procedureName)
  `;

  // Obtener código fuente
  const sourceQuery = `
    SELECT 
      OBJECT_DEFINITION(OBJECT_ID(@procedureName)) AS SOURCE_CODE
  `;

  const [parameters, dependencies, source] = await Promise.all([
    executeQuery(parametersQuery, [{ name: 'procedureName', value: procedureName }]),
    executeQuery(dependenciesQuery, [{ name: 'procedureName', value: procedureName }]),
    executeQuery(sourceQuery, [{ name: 'procedureName', value: procedureName }]),
  ]);

  return {
    procedureName,
    parameters: parameters.map((p: any) => ({
      name: p.PARAMETER_NAME,
      dataType: p.DATA_TYPE,
      maxLength: p.max_length,
      precision: p.precision,
      scale: p.scale,
      isOutput: p.is_output === 1,
      hasDefault: p.has_default_value === 1,
      defaultValue: p.default_value,
    })),
    dependencies: dependencies.map((d: any) => ({
      object: d.REFERENCED_OBJECT,
      schema: d.REFERENCED_SCHEMA,
    })),
    sourceCode: source[0]?.SOURCE_CODE || null,
  };
}

/**
 * Preview de datos con filtros opcionales
 */
export async function previewTableData(
  tableName: string,
  limit: number = 50,
  whereClause?: string,
  orderBy?: string
): Promise<any> {
  let query = `SELECT TOP ${limit} * FROM [${tableName}]`;
  
  if (whereClause) {
    query += ` WHERE ${whereClause}`;
  }
  
  if (orderBy) {
    query += ` ORDER BY ${orderBy}`;
  }

  const result = await executeQuery(query);
  const rowCount = await executeScalar(`SELECT COUNT(*) FROM [${tableName}]${whereClause ? ` WHERE ${whereClause}` : ''}`);

  return {
    tableName,
    rowCount: rowCount || 0,
    previewRows: result.length,
    data: result,
  };
}

/**
 * Estadísticas de una columna específica
 */
export async function getColumnStatistics(tableName: string, columnName: string): Promise<any> {
  // Estadísticas básicas
  const statsQuery = `
    SELECT 
      COUNT(*) AS total_rows,
      COUNT([${columnName}]) AS non_null_count,
      COUNT(*) - COUNT([${columnName}]) AS null_count,
      COUNT(DISTINCT [${columnName}]) AS distinct_count,
      MIN([${columnName}]) AS min_value,
      MAX([${columnName}]) AS max_value,
      AVG(CAST([${columnName}] AS FLOAT)) AS avg_value
    FROM [${tableName}]
  `;

  // Top 10 valores más frecuentes
  const topValuesQuery = `
    SELECT TOP 10
      [${columnName}] AS value,
      COUNT(*) AS frequency,
      CAST(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM [${tableName}]) AS DECIMAL(5,2)) AS percentage
    FROM [${tableName}]
    WHERE [${columnName}] IS NOT NULL
    GROUP BY [${columnName}]
    ORDER BY frequency DESC
  `;

  const [stats, topValues] = await Promise.all([
    executeQuery(statsQuery),
    executeQuery(topValuesQuery),
  ]);

  return {
    tableName,
    columnName,
    statistics: stats[0] || {},
    topValues: topValues.map((v: any) => ({
      value: v.value,
      frequency: v.frequency,
      percentage: v.percentage,
    })),
  };
}

/**
 * Análisis rápido de datos (row count, distribuciones, top values)
 */
export async function quickDataAnalysis(tableName: string): Promise<any> {
  // Obtener número de filas
  const rowCount = await executeScalar(`SELECT COUNT(*) FROM [${tableName}]`);

  // Obtener columnas numéricas para análisis
  const numericColumnsQuery = `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = @tableName
      AND DATA_TYPE IN ('int', 'bigint', 'decimal', 'numeric', 'float', 'real', 'money', 'smallmoney')
  `;

  const numericColumns = await executeQuery(numericColumnsQuery, [
    { name: 'tableName', value: tableName },
  ]);

  // Obtener distribuciones básicas para cada columna numérica
  const distributions: any[] = [];
  for (const col of numericColumns.slice(0, 5)) { // Limitar a 5 columnas para no sobrecargar
    const colName = col.COLUMN_NAME;
    const distQuery = `
      SELECT 
        COUNT(*) AS total,
        COUNT([${colName}]) AS non_null,
        MIN([${colName}]) AS min_val,
        MAX([${colName}]) AS max_val,
        AVG(CAST([${colName}] AS FLOAT)) AS avg_val
      FROM [${tableName}]
    `;
    const dist = await executeQuery(distQuery);
    if (dist[0]) {
      distributions.push({
        column: colName,
        ...dist[0],
      });
    }
  }

  return {
    tableName,
    rowCount: rowCount || 0,
    numericColumnsCount: numericColumns.length,
    distributions,
  };
}

/**
 * Búsqueda comprehensiva en objetos de base de datos
 */
export async function searchDatabaseObjects(
  searchTerm: string,
  objectTypes: string[] = ['TABLE', 'VIEW', 'PROCEDURE', 'FUNCTION']
): Promise<any> {
  const results: any[] = [];

  // Buscar en tablas
  if (objectTypes.includes('TABLE')) {
    const tablesQuery = `
      SELECT 
        'TABLE' AS object_type,
        TABLE_SCHEMA AS schema_name,
        TABLE_NAME AS object_name,
        NULL AS definition
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME LIKE @searchTerm
        AND TABLE_TYPE = 'BASE TABLE'
    `;
    const tables = await executeQuery(tablesQuery, [
      { name: 'searchTerm', value: `%${searchTerm}%` },
    ]);
    results.push(...tables);
  }

  // Buscar en stored procedures
  if (objectTypes.includes('PROCEDURE')) {
    const proceduresQuery = `
      SELECT 
        'PROCEDURE' AS object_type,
        OBJECT_SCHEMA_NAME(object_id) AS schema_name,
        name AS object_name,
        OBJECT_DEFINITION(object_id) AS definition
      FROM sys.procedures
      WHERE name LIKE @searchTerm
    `;
    const procedures = await executeQuery(proceduresQuery, [
      { name: 'searchTerm', value: `%${searchTerm}%` },
    ]);
    results.push(...procedures);
  }

  // Buscar en vistas
  if (objectTypes.includes('VIEW')) {
    const viewsQuery = `
      SELECT 
        'VIEW' AS object_type,
        TABLE_SCHEMA AS schema_name,
        TABLE_NAME AS object_name,
        VIEW_DEFINITION AS definition
      FROM INFORMATION_SCHEMA.VIEWS
      WHERE TABLE_NAME LIKE @searchTerm
    `;
    const views = await executeQuery(viewsQuery, [
      { name: 'searchTerm', value: `%${searchTerm}%` },
    ]);
    results.push(...views);
  }

  return {
    searchTerm,
    results: results.map((r: any) => ({
      type: r.object_type,
      schema: r.schema_name,
      name: r.object_name,
      hasDefinition: !!r.definition,
    })),
    totalCount: results.length,
  };
}

/**
 * Obtener dependencias de un objeto de base de datos
 */
export async function getObjectDependencies(objectName: string, objectType: string = 'TABLE'): Promise<any> {
  let query = '';
  
  if (objectType === 'TABLE') {
    query = `
      SELECT 
        'DEPENDS_ON' AS dependency_type,
        OBJECT_NAME(referenced_major_id) AS referenced_object,
        OBJECT_SCHEMA_NAME(referenced_major_id) AS referenced_schema,
        'TABLE' AS referenced_type
      FROM sys.sql_dependencies
      WHERE object_id = OBJECT_ID(@objectName)
      
      UNION ALL
      
      SELECT 
        'USED_BY' AS dependency_type,
        OBJECT_NAME(object_id) AS referenced_object,
        OBJECT_SCHEMA_NAME(object_id) AS referenced_schema,
        OBJECT_TYPE_NAME(object_id) AS referenced_type
      FROM sys.sql_dependencies
      WHERE referenced_major_id = OBJECT_ID(@objectName)
    `;
  } else if (objectType === 'PROCEDURE') {
    query = `
      SELECT 
        'DEPENDS_ON' AS dependency_type,
        OBJECT_NAME(referenced_major_id) AS referenced_object,
        OBJECT_SCHEMA_NAME(referenced_major_id) AS referenced_schema,
        OBJECT_TYPE_NAME(referenced_major_id) AS referenced_type
      FROM sys.sql_dependencies
      WHERE object_id = OBJECT_ID(@objectName)
    `;
  }

  if (!query) {
    throw new Error(`Tipo de objeto no soportado: ${objectType}`);
  }

  const dependencies = await executeQuery(query, [{ name: 'objectName', value: objectName }]);

  return {
    objectName,
    objectType,
    dependencies: dependencies.map((d: any) => ({
      type: d.dependency_type,
      object: d.referenced_object,
      schema: d.referenced_schema,
      objectType: d.referenced_type,
    })),
  };
}

/**
 * Obtener valores de muestra de una columna
 */
export async function getSampleValues(
  tableName: string,
  columnName: string,
  limit: number = 50
): Promise<any> {
  // Usar TOP solo si el límite es razonable, sino usar DISTINCT sin límite
  let query: string;
  if (limit > 0 && limit < 10000) {
    query = `
      SELECT DISTINCT TOP ${limit}
        [${columnName}] AS value
      FROM [${tableName}]
      WHERE [${columnName}] IS NOT NULL
      ORDER BY [${columnName}]
    `;
  } else {
    // Si el límite es muy alto o 0, no usar TOP (para obtener todos los valores únicos)
    query = `
      SELECT DISTINCT
        [${columnName}] AS value
      FROM [${tableName}]
      WHERE [${columnName}] IS NOT NULL
      ORDER BY [${columnName}]
    `;
  }

  const result = await executeQuery(query);
  const distinctCount = await executeScalar(
    `SELECT COUNT(DISTINCT [${columnName}]) FROM [${tableName}] WHERE [${columnName}] IS NOT NULL`
  );

  return {
    tableName,
    columnName,
    sampleValues: result.map((r: any) => r.value),
    distinctCount: distinctCount || 0,
    sampleSize: result.length,
  };
}

/**
 * Listar tablas agrupadas por prefijo (útil para SAP)
 */
export async function listTablesGroupedByPrefix(): Promise<any> {
  const query = `
    SELECT 
      TABLE_SCHEMA,
      TABLE_NAME,
      CASE 
        WHEN TABLE_NAME LIKE 'O%' THEN SUBSTRING(TABLE_NAME, 1, 3)
        WHEN TABLE_NAME LIKE 'A%' THEN SUBSTRING(TABLE_NAME, 1, 3)
        ELSE 'OTHER'
      END AS prefix
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE'
    ORDER BY prefix, TABLE_NAME
  `;

  const result = await executeQuery(query);
  
  // Agrupar por prefijo
  const grouped: Record<string, any[]> = {};
  result.forEach((row: any) => {
    const prefix = row.prefix || 'OTHER';
    if (!grouped[prefix]) {
      grouped[prefix] = [];
    }
    grouped[prefix].push({
      schema: row.TABLE_SCHEMA,
      name: row.TABLE_NAME,
      fullName: `${row.TABLE_SCHEMA}.${row.TABLE_NAME}`,
    });
  });

  return {
    totalTables: result.length,
    prefixes: Object.keys(grouped).sort(),
    tablesByPrefix: grouped,
  };
}

