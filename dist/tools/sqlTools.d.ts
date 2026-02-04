import { Server } from '@modelcontextprotocol/sdk/server/index.js';
declare const toolsListHandler: () => Promise<{
    tools: ({
        name: string;
        description: string;
        inputSchema: {
            readonly type: "object";
            readonly properties: {};
            readonly required: readonly [];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly tableName: {
                    readonly type: "string";
                    readonly description: "Nombre de la tabla de la cual se desea obtener el esquema";
                };
            };
            readonly required: readonly ["tableName"];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly query: {
                    readonly type: "string";
                    readonly description: "Consulta SQL SELECT a ejecutar";
                };
                readonly parameters: {
                    readonly type: "array";
                    readonly description: "Parámetros opcionales para la consulta (para consultas parametrizadas)";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly value: {
                                readonly type: readonly ["string", "number", "boolean", "null"];
                            };
                        };
                        readonly required: readonly ["name", "value"];
                    };
                };
            };
            readonly required: readonly ["query"];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly tableName: {
                    readonly type: "string";
                    readonly description: "Nombre de la tabla a analizar";
                };
            };
            readonly required: readonly ["tableName"];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly procedureName: {
                    readonly type: "string";
                    readonly description: "Nombre del stored procedure a analizar";
                };
            };
            readonly required: readonly ["procedureName"];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly tableName: {
                    readonly type: "string";
                    readonly description: "Nombre de la tabla";
                };
                readonly limit: {
                    readonly type: "number";
                    readonly description: "Número máximo de filas a devolver (default: 50)";
                    readonly default: 50;
                };
                readonly whereClause: {
                    readonly type: "string";
                    readonly description: "Cláusula WHERE opcional (sin la palabra WHERE)";
                };
                readonly orderBy: {
                    readonly type: "string";
                    readonly description: "Cláusula ORDER BY opcional (sin la palabra ORDER BY)";
                };
            };
            readonly required: readonly ["tableName"];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly tableName: {
                    readonly type: "string";
                    readonly description: "Nombre de la tabla";
                };
                readonly columnName: {
                    readonly type: "string";
                    readonly description: "Nombre de la columna";
                };
            };
            readonly required: readonly ["tableName", "columnName"];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly procedureName: {
                    readonly type: "string";
                    readonly description: "Nombre del stored procedure a ejecutar";
                };
                readonly parameters: {
                    readonly type: "array";
                    readonly description: "Parámetros del stored procedure";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly name: {
                                readonly type: "string";
                            };
                            readonly value: {
                                readonly type: readonly ["string", "number", "boolean", "null"];
                            };
                        };
                        readonly required: readonly ["name", "value"];
                    };
                };
            };
            readonly required: readonly ["procedureName"];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly searchTerm: {
                    readonly type: "string";
                    readonly description: "Término de búsqueda (se busca en nombres de objetos)";
                };
                readonly objectTypes: {
                    readonly type: "array";
                    readonly description: "Tipos de objetos a buscar: TABLE, VIEW, PROCEDURE, FUNCTION";
                    readonly items: {
                        readonly type: "string";
                    };
                    readonly default: readonly ["TABLE", "VIEW", "PROCEDURE", "FUNCTION"];
                };
            };
            readonly required: readonly ["searchTerm"];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly objectName: {
                    readonly type: "string";
                    readonly description: "Nombre del objeto";
                };
                readonly objectType: {
                    readonly type: "string";
                    readonly description: "Tipo de objeto: TABLE, PROCEDURE, VIEW, FUNCTION";
                    readonly default: "TABLE";
                };
            };
            readonly required: readonly ["objectName"];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly tableName: {
                    readonly type: "string";
                    readonly description: "Nombre de la tabla SAP B1 (ej: OITM, ORDR, OINV)";
                };
            };
            readonly required: readonly ["tableName"];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly itemCode: {
                    readonly type: "string";
                    readonly description: "Código del artículo";
                };
            };
            readonly required: readonly ["itemCode"];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly cardCode: {
                    readonly type: "string";
                    readonly description: "Código del socio de negocio";
                };
            };
            readonly required: readonly ["cardCode"];
        };
    } | {
        name: string;
        description: string;
        inputSchema: {
            readonly type: "object";
            readonly properties: {
                readonly searchTerm: {
                    readonly type: "string";
                    readonly description: "Término de búsqueda (número de documento, código de cliente, etc.)";
                };
                readonly docType: {
                    readonly type: "string";
                    readonly description: "Tipo de documento: invoice, order, delivery, purchase, purchaseInvoice (opcional)";
                };
            };
            readonly required: readonly ["searchTerm"];
        };
    })[];
}>;
/**
 * Registra todas las herramientas SQL en el servidor MCP
 */
export declare function registerSqlTools(server: Server): void;
export { toolsListHandler };
//# sourceMappingURL=sqlTools.d.ts.map