/**
 * Herramientas específicas para SAP Business One
 * Consultas predefinidas y optimizadas para datos comunes de SAP B1
 */
/**
 * Obtiene el diccionario de tablas SAP B1
 */
export declare function getSapTablesDictionary(): Promise<any>;
/**
 * Obtiene información de una tabla SAP B1 específica
 */
export declare function getSapTableInfo(tableName: string): Promise<any>;
/**
 * Obtiene el stock actual de un artículo
 */
export declare function getItemStock(itemCode: string): Promise<any>;
/**
 * Obtiene información de un socio de negocio (cliente/proveedor)
 */
export declare function getBusinessPartner(cardCode: string): Promise<any>;
/**
 * Obtiene el historial de ventas de un artículo
 */
export declare function getSalesHistory(itemCode: string, year?: number): Promise<any>;
/**
 * Obtiene los pedidos de venta pendientes/abiertos
 */
export declare function getOpenSalesOrders(cardCode?: string): Promise<any>;
/**
 * Obtiene las facturas pendientes de cobro
 */
export declare function getOpenInvoices(cardCode?: string): Promise<any>;
/**
 * Obtiene el saldo de un cliente/proveedor
 */
export declare function getPartnerBalance(cardCode: string): Promise<any>;
/**
 * Obtiene los artículos más vendidos
 */
export declare function getTopSellingItems(top?: number, year?: number): Promise<any>;
/**
 * Obtiene los mejores clientes
 */
export declare function getTopCustomers(top?: number, year?: number): Promise<any>;
/**
 * Obtiene artículos con stock bajo (por debajo del mínimo)
 */
export declare function getLowStockItems(): Promise<any>;
/**
 * Obtiene el resumen de ventas por período
 */
export declare function getSalesSummary(year?: number, month?: number): Promise<any>;
/**
 * Busca documentos por número o referencia
 */
export declare function searchDocument(searchTerm: string, docType?: string): Promise<any>;
//# sourceMappingURL=sapB1Tools.d.ts.map