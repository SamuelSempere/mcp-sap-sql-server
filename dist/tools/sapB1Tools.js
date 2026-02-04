"use strict";
/**
 * Herramientas específicas para SAP Business One
 * Consultas predefinidas y optimizadas para datos comunes de SAP B1
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSapTablesDictionary = getSapTablesDictionary;
exports.getSapTableInfo = getSapTableInfo;
exports.getItemStock = getItemStock;
exports.getBusinessPartner = getBusinessPartner;
exports.getSalesHistory = getSalesHistory;
exports.getOpenSalesOrders = getOpenSalesOrders;
exports.getOpenInvoices = getOpenInvoices;
exports.getPartnerBalance = getPartnerBalance;
exports.getTopSellingItems = getTopSellingItems;
exports.getTopCustomers = getTopCustomers;
exports.getLowStockItems = getLowStockItems;
exports.getSalesSummary = getSalesSummary;
exports.searchDocument = searchDocument;
const sqlClient_1 = require("../db/sqlClient");
const sapB1Dictionary_1 = require("./sapB1Dictionary");
/**
 * Obtiene el diccionario de tablas SAP B1
 */
async function getSapTablesDictionary() {
    return {
        tables: sapB1Dictionary_1.SAP_B1_TABLES,
        commonFields: sapB1Dictionary_1.SAP_B1_COMMON_FIELDS,
        objectTypes: sapB1Dictionary_1.SAP_B1_OBJECT_TYPES,
        relationships: sapB1Dictionary_1.SAP_B1_RELATIONSHIPS,
        totalTables: Object.keys(sapB1Dictionary_1.SAP_B1_TABLES).length,
        categories: [...new Set(Object.values(sapB1Dictionary_1.SAP_B1_TABLES).map(t => t.category))],
    };
}
/**
 * Obtiene información de una tabla SAP B1 específica
 */
async function getSapTableInfo(tableName) {
    const tableInfo = sapB1Dictionary_1.SAP_B1_TABLES[tableName.toUpperCase()];
    if (!tableInfo) {
        // Buscar tablas que coincidan parcialmente
        const matches = Object.entries(sapB1Dictionary_1.SAP_B1_TABLES)
            .filter(([key]) => key.includes(tableName.toUpperCase()))
            .map(([key, value]) => ({ tableName: key, ...value }));
        return {
            found: false,
            message: `Tabla '${tableName}' no encontrada en el diccionario SAP B1`,
            suggestions: matches.length > 0 ? matches : 'Usa getSapTablesDictionary para ver todas las tablas',
        };
    }
    // Obtener información adicional de la base de datos
    const columnsQuery = `
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = @tableName
    ORDER BY ORDINAL_POSITION
  `;
    const rowCountQuery = `SELECT COUNT(*) as total FROM [${tableName}]`;
    let columns = [];
    let rowCount = 0;
    try {
        columns = await (0, sqlClient_1.executeQuery)(columnsQuery, [{ name: 'tableName', value: tableName }]);
        rowCount = await (0, sqlClient_1.executeScalar)(rowCountQuery) || 0;
    }
    catch (e) {
        // Tabla puede no existir en la BD actual
    }
    return {
        found: true,
        tableName: tableName.toUpperCase(),
        ...tableInfo,
        rowCount,
        columns: columns.map(c => ({
            name: c.COLUMN_NAME,
            type: c.DATA_TYPE,
            nullable: c.IS_NULLABLE === 'YES',
            description: sapB1Dictionary_1.SAP_B1_COMMON_FIELDS[c.COLUMN_NAME] || null,
        })),
    };
}
/**
 * Obtiene el stock actual de un artículo
 */
async function getItemStock(itemCode) {
    const query = `
    SELECT 
      T0.ItemCode,
      T0.ItemName,
      T0.OnHand as StockTotal,
      T0.IsCommited as Comprometido,
      T0.OnOrder as EnPedido,
      T0.OnHand - T0.IsCommited as Disponible,
      T1.WhsCode as Almacen,
      T1.OnHand as StockAlmacen,
      T1.IsCommited as ComprometidoAlmacen,
      T1.OnOrder as EnPedidoAlmacen
    FROM OITM T0
    LEFT JOIN OITW T1 ON T0.ItemCode = T1.ItemCode
    WHERE T0.ItemCode = @itemCode
    ORDER BY T1.WhsCode
  `;
    const result = await (0, sqlClient_1.executeQuery)(query, [{ name: 'itemCode', value: itemCode }]);
    if (result.length === 0) {
        return { found: false, message: `Artículo '${itemCode}' no encontrado` };
    }
    const item = result[0];
    return {
        found: true,
        itemCode: item.ItemCode,
        itemName: item.ItemName,
        stockTotal: item.StockTotal,
        comprometido: item.Comprometido,
        enPedido: item.EnPedido,
        disponible: item.Disponible,
        stockPorAlmacen: result.filter(r => r.Almacen).map(r => ({
            almacen: r.Almacen,
            stock: r.StockAlmacen,
            comprometido: r.ComprometidoAlmacen,
            enPedido: r.EnPedidoAlmacen,
        })),
    };
}
/**
 * Obtiene información de un socio de negocio (cliente/proveedor)
 */
async function getBusinessPartner(cardCode) {
    const query = `
    SELECT 
      T0.CardCode,
      T0.CardName,
      T0.CardType,
      CASE T0.CardType WHEN 'C' THEN 'Cliente' WHEN 'S' THEN 'Proveedor' ELSE 'Lead' END as TipoSocio,
      T0.Phone1,
      T0.Phone2,
      T0.Cellular,
      T0.E_Mail,
      T0.Balance,
      T0.Currency,
      T0.CreditLine,
      T0.DebtLine,
      T0.SlpCode,
      T0.GroupCode,
      T0.Address,
      T0.City,
      T0.Country
    FROM OCRD T0
    WHERE T0.CardCode = @cardCode
  `;
    const result = await (0, sqlClient_1.executeQuery)(query, [{ name: 'cardCode', value: cardCode }]);
    if (result.length === 0) {
        return { found: false, message: `Socio de negocio '${cardCode}' no encontrado` };
    }
    return {
        found: true,
        ...result[0],
    };
}
/**
 * Obtiene el historial de ventas de un artículo
 */
async function getSalesHistory(itemCode, year) {
    const currentYear = year || new Date().getFullYear();
    const query = `
    SELECT 
      YEAR(T0.DocDate) as Anio,
      MONTH(T0.DocDate) as Mes,
      SUM(T1.Quantity) as CantidadVendida,
      SUM(T1.LineTotal) as TotalVentas,
      COUNT(DISTINCT T0.DocEntry) as NumFacturas
    FROM OINV T0
    INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
    WHERE T1.ItemCode = @itemCode
      AND YEAR(T0.DocDate) = @year
      AND T0.CANCELED = 'N'
    GROUP BY YEAR(T0.DocDate), MONTH(T0.DocDate)
    ORDER BY Anio, Mes
  `;
    const result = await (0, sqlClient_1.executeQuery)(query, [
        { name: 'itemCode', value: itemCode },
        { name: 'year', value: currentYear },
    ]);
    const totalQuery = `
    SELECT 
      SUM(T1.Quantity) as TotalCantidad,
      SUM(T1.LineTotal) as TotalImporte
    FROM OINV T0
    INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
    WHERE T1.ItemCode = @itemCode
      AND YEAR(T0.DocDate) = @year
      AND T0.CANCELED = 'N'
  `;
    const totals = await (0, sqlClient_1.executeQuery)(totalQuery, [
        { name: 'itemCode', value: itemCode },
        { name: 'year', value: currentYear },
    ]);
    return {
        itemCode,
        year: currentYear,
        ventasPorMes: result,
        totales: totals[0] || { TotalCantidad: 0, TotalImporte: 0 },
    };
}
/**
 * Obtiene los pedidos de venta pendientes/abiertos
 */
async function getOpenSalesOrders(cardCode) {
    let query = `
    SELECT 
      T0.DocEntry,
      T0.DocNum,
      T0.DocDate,
      T0.DocDueDate,
      T0.CardCode,
      T0.CardName,
      T0.DocTotal,
      T0.DocCur,
      T0.Comments,
      DATEDIFF(day, T0.DocDueDate, GETDATE()) as DiasVencido
    FROM ORDR T0
    WHERE T0.DocStatus = 'O'
      AND T0.CANCELED = 'N'
  `;
    const params = [];
    if (cardCode) {
        query += ` AND T0.CardCode = @cardCode`;
        params.push({ name: 'cardCode', value: cardCode });
    }
    query += ` ORDER BY T0.DocDueDate`;
    const result = await (0, sqlClient_1.executeQuery)(query, params);
    return {
        totalPedidos: result.length,
        pedidos: result,
        totalImporte: result.reduce((sum, r) => sum + (r.DocTotal || 0), 0),
    };
}
/**
 * Obtiene las facturas pendientes de cobro
 */
async function getOpenInvoices(cardCode) {
    let query = `
    SELECT 
      T0.DocEntry,
      T0.DocNum,
      T0.DocDate,
      T0.DocDueDate,
      T0.CardCode,
      T0.CardName,
      T0.DocTotal,
      T0.PaidToDate,
      T0.DocTotal - T0.PaidToDate as Pendiente,
      T0.DocCur,
      DATEDIFF(day, T0.DocDueDate, GETDATE()) as DiasVencido
    FROM OINV T0
    WHERE T0.DocStatus = 'O'
      AND T0.CANCELED = 'N'
      AND T0.DocTotal > T0.PaidToDate
  `;
    const params = [];
    if (cardCode) {
        query += ` AND T0.CardCode = @cardCode`;
        params.push({ name: 'cardCode', value: cardCode });
    }
    query += ` ORDER BY T0.DocDueDate`;
    const result = await (0, sqlClient_1.executeQuery)(query, params);
    return {
        totalFacturas: result.length,
        facturas: result,
        totalPendiente: result.reduce((sum, r) => sum + (r.Pendiente || 0), 0),
        facturasVencidas: result.filter(r => r.DiasVencido > 0).length,
    };
}
/**
 * Obtiene el saldo de un cliente/proveedor
 */
async function getPartnerBalance(cardCode) {
    const balanceQuery = `
    SELECT 
      CardCode,
      CardName,
      CardType,
      Balance,
      Currency
    FROM OCRD
    WHERE CardCode = @cardCode
  `;
    const partner = await (0, sqlClient_1.executeQuery)(balanceQuery, [{ name: 'cardCode', value: cardCode }]);
    if (partner.length === 0) {
        return { found: false, message: `Socio de negocio '${cardCode}' no encontrado` };
    }
    // Obtener detalle de documentos abiertos
    const openDocsQuery = `
    SELECT 
      'Factura' as TipoDoc,
      DocNum,
      DocDate,
      DocDueDate,
      DocTotal - PaidToDate as Pendiente
    FROM OINV
    WHERE CardCode = @cardCode AND DocStatus = 'O' AND CANCELED = 'N'
    UNION ALL
    SELECT 
      'Abono' as TipoDoc,
      DocNum,
      DocDate,
      DocDueDate,
      -(DocTotal - PaidToDate) as Pendiente
    FROM ORIN
    WHERE CardCode = @cardCode AND DocStatus = 'O' AND CANCELED = 'N'
    ORDER BY DocDate
  `;
    const openDocs = await (0, sqlClient_1.executeQuery)(openDocsQuery, [{ name: 'cardCode', value: cardCode }]);
    return {
        found: true,
        ...partner[0],
        documentosAbiertos: openDocs,
        totalDocumentos: openDocs.length,
    };
}
/**
 * Obtiene los artículos más vendidos
 */
async function getTopSellingItems(top = 10, year) {
    const currentYear = year || new Date().getFullYear();
    const query = `
    SELECT TOP ${top}
      T1.ItemCode,
      MAX(T1.Dscription) as ItemName,
      SUM(T1.Quantity) as CantidadTotal,
      SUM(T1.LineTotal) as ImporteTotal,
      COUNT(DISTINCT T0.DocEntry) as NumFacturas,
      COUNT(DISTINCT T0.CardCode) as NumClientes
    FROM OINV T0
    INNER JOIN INV1 T1 ON T0.DocEntry = T1.DocEntry
    WHERE YEAR(T0.DocDate) = @year
      AND T0.CANCELED = 'N'
    GROUP BY T1.ItemCode
    ORDER BY SUM(T1.LineTotal) DESC
  `;
    const result = await (0, sqlClient_1.executeQuery)(query, [{ name: 'year', value: currentYear }]);
    return {
        year: currentYear,
        top,
        items: result,
    };
}
/**
 * Obtiene los mejores clientes
 */
async function getTopCustomers(top = 10, year) {
    const currentYear = year || new Date().getFullYear();
    const query = `
    SELECT TOP ${top}
      T0.CardCode,
      T0.CardName,
      SUM(T0.DocTotal) as TotalFacturado,
      COUNT(T0.DocEntry) as NumFacturas,
      AVG(T0.DocTotal) as PromedioFactura
    FROM OINV T0
    WHERE YEAR(T0.DocDate) = @year
      AND T0.CANCELED = 'N'
    GROUP BY T0.CardCode, T0.CardName
    ORDER BY SUM(T0.DocTotal) DESC
  `;
    const result = await (0, sqlClient_1.executeQuery)(query, [{ name: 'year', value: currentYear }]);
    return {
        year: currentYear,
        top,
        customers: result,
    };
}
/**
 * Obtiene artículos con stock bajo (por debajo del mínimo)
 */
async function getLowStockItems() {
    const query = `
    SELECT 
      T0.ItemCode,
      T0.ItemName,
      T0.OnHand as StockActual,
      T0.MinLevel as StockMinimo,
      T0.MaxLevel as StockMaximo,
      T0.OnHand - T0.MinLevel as Diferencia,
      T0.ItmsGrpCod,
      T1.ItmsGrpNam as GrupoArticulo
    FROM OITM T0
    LEFT JOIN OITB T1 ON T0.ItmsGrpCod = T1.ItmsGrpCod
    WHERE T0.OnHand < T0.MinLevel
      AND T0.MinLevel > 0
      AND T0.InvntItem = 'Y'
      AND T0.validFor = 'Y'
    ORDER BY T0.OnHand - T0.MinLevel
  `;
    const result = await (0, sqlClient_1.executeQuery)(query);
    return {
        totalItems: result.length,
        items: result,
    };
}
/**
 * Obtiene el resumen de ventas por período
 */
async function getSalesSummary(year, month) {
    const currentYear = year || new Date().getFullYear();
    let dateFilter = `YEAR(T0.DocDate) = @year`;
    const params = [{ name: 'year', value: currentYear }];
    if (month) {
        dateFilter += ` AND MONTH(T0.DocDate) = @month`;
        params.push({ name: 'month', value: month });
    }
    const query = `
    SELECT 
      COUNT(T0.DocEntry) as NumFacturas,
      SUM(T0.DocTotal) as TotalVentas,
      SUM(T0.VatSum) as TotalIVA,
      AVG(T0.DocTotal) as PromedioFactura,
      COUNT(DISTINCT T0.CardCode) as NumClientes
    FROM OINV T0
    WHERE ${dateFilter}
      AND T0.CANCELED = 'N'
  `;
    const result = await (0, sqlClient_1.executeQuery)(query, params);
    // Comparar con período anterior
    const prevParams = month
        ? [{ name: 'year', value: month === 1 ? currentYear - 1 : currentYear }, { name: 'month', value: month === 1 ? 12 : month - 1 }]
        : [{ name: 'year', value: currentYear - 1 }];
    const prevDateFilter = month
        ? `YEAR(T0.DocDate) = @year AND MONTH(T0.DocDate) = @month`
        : `YEAR(T0.DocDate) = @year`;
    const prevQuery = `
    SELECT SUM(T0.DocTotal) as TotalVentas
    FROM OINV T0
    WHERE ${prevDateFilter}
      AND T0.CANCELED = 'N'
  `;
    const prevResult = await (0, sqlClient_1.executeQuery)(prevQuery, prevParams);
    const current = result[0] || {};
    const previous = prevResult[0] || {};
    const variacion = previous.TotalVentas
        ? ((current.TotalVentas - previous.TotalVentas) / previous.TotalVentas * 100).toFixed(2)
        : null;
    return {
        periodo: month ? `${currentYear}-${month.toString().padStart(2, '0')}` : currentYear.toString(),
        ...current,
        periodoAnterior: previous.TotalVentas,
        variacionPorcentaje: variacion,
    };
}
/**
 * Busca documentos por número o referencia
 */
async function searchDocument(searchTerm, docType) {
    const docTypes = {
        'invoice': { table: 'OINV', name: 'Factura de Cliente' },
        'order': { table: 'ORDR', name: 'Pedido de Venta' },
        'delivery': { table: 'ODLN', name: 'Entrega' },
        'purchase': { table: 'OPOR', name: 'Pedido de Compra' },
        'purchaseInvoice': { table: 'OPCH', name: 'Factura de Proveedor' },
    };
    const results = [];
    const tablesToSearch = docType && docTypes[docType]
        ? [{ key: docType, ...docTypes[docType] }]
        : Object.entries(docTypes).map(([key, value]) => ({ key, ...value }));
    for (const doc of tablesToSearch) {
        const query = `
      SELECT TOP 10
        '${doc.name}' as TipoDocumento,
        DocEntry,
        DocNum,
        DocDate,
        CardCode,
        CardName,
        DocTotal,
        DocStatus,
        CANCELED
      FROM ${doc.table}
      WHERE DocNum LIKE @searchTerm
         OR CAST(DocEntry AS VARCHAR) LIKE @searchTerm
         OR CardCode LIKE @searchTerm
         OR CardName LIKE @searchTerm
      ORDER BY DocDate DESC
    `;
        try {
            const docResults = await (0, sqlClient_1.executeQuery)(query, [{ name: 'searchTerm', value: `%${searchTerm}%` }]);
            results.push(...docResults);
        }
        catch (e) {
            // Ignorar errores de tablas que no existen
        }
    }
    return {
        searchTerm,
        totalResults: results.length,
        results,
    };
}
//# sourceMappingURL=sapB1Tools.js.map