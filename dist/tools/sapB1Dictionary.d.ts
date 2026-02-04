/**
 * Diccionario de tablas y campos de SAP Business One
 * Información para ayudar a Claude a entender la estructura de SAP B1
 */
export declare const SAP_B1_TABLES: Record<string, {
    description: string;
    category: string;
    relatedTables?: string[];
}>;
export declare const SAP_B1_COMMON_FIELDS: Record<string, string>;
export declare const SAP_B1_OBJECT_TYPES: Record<string, string>;
export declare const SAP_B1_RELATIONSHIPS: {
    from: string;
    to: string;
    key: string;
    description: string;
}[];
export declare function getTableInfo(tableName: string): {
    description: string;
    category: string;
    relatedTables?: string[];
} | null;
export declare function getFieldDescription(fieldName: string): string | null;
export declare function getObjectTypeDescription(objType: string): string | null;
//# sourceMappingURL=sapB1Dictionary.d.ts.map