/**
 * Herramientas optimizadas para SAP SQL Server
 * Estas herramientas están diseñadas específicamente para trabajar con
 * SAP Business One y aprovechan las características específicas de SAP
 */
/**
 * Análisis completo de estructura de tabla (índices, claves, constraints)
 */
export declare function analyzeTableStructure(tableName: string): Promise<any>;
/**
 * Análisis de estructura de stored procedure
 */
export declare function analyzeStoredProcedure(procedureName: string): Promise<any>;
/**
 * Preview de datos con filtros opcionales
 */
export declare function previewTableData(tableName: string, limit?: number, whereClause?: string, orderBy?: string): Promise<any>;
/**
 * Estadísticas de una columna específica
 */
export declare function getColumnStatistics(tableName: string, columnName: string): Promise<any>;
/**
 * Análisis rápido de datos (row count, distribuciones, top values)
 */
export declare function quickDataAnalysis(tableName: string): Promise<any>;
/**
 * Búsqueda comprehensiva en objetos de base de datos
 */
export declare function searchDatabaseObjects(searchTerm: string, objectTypes?: string[]): Promise<any>;
/**
 * Obtener dependencias de un objeto de base de datos
 */
export declare function getObjectDependencies(objectName: string, objectType?: string): Promise<any>;
/**
 * Obtener valores de muestra de una columna
 */
export declare function getSampleValues(tableName: string, columnName: string, limit?: number): Promise<any>;
/**
 * Listar tablas agrupadas por prefijo (útil para SAP)
 */
export declare function listTablesGroupedByPrefix(): Promise<any>;
//# sourceMappingURL=sapTools.d.ts.map