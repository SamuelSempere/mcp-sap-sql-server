import sql from 'mssql';
/**
 * Ejecuta una consulta SQL y devuelve los resultados
 * @param query - Consulta SQL a ejecutar
 * @param parameters - Parámetros opcionales para la consulta
 * @returns Array de objetos con los resultados
 */
export declare function executeQuery(query: string, parameters?: Array<{
    name: string;
    value: any;
    type?: sql.ISqlType;
}>): Promise<any[]>;
/**
 * Ejecuta una consulta SQL y devuelve un solo resultado (útil para COUNT, etc.)
 */
export declare function executeScalar(query: string, parameters?: Array<{
    name: string;
    value: any;
    type?: sql.ISqlType;
}>): Promise<any>;
/**
 * Ejecuta un stored procedure y devuelve los resultados
 * @param procedureName - Nombre del stored procedure
 * @param parameters - Parámetros opcionales para el stored procedure
 * @returns Array de objetos con los resultados (puede haber múltiples result sets)
 */
export declare function executeProcedure(procedureName: string, parameters?: Array<{
    name: string;
    value: any;
    type?: sql.ISqlType;
}>): Promise<{
    resultSets: any[][];
    returnValue?: any;
}>;
/**
 * Cierra el pool de conexiones (útil para shutdown graceful)
 */
export declare function closePool(): Promise<void>;
//# sourceMappingURL=sqlClient.d.ts.map