"use strict";
/**
 * Diccionario de tablas y campos de SAP Business One
 * Información para ayudar a Claude a entender la estructura de SAP B1
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAP_B1_RELATIONSHIPS = exports.SAP_B1_OBJECT_TYPES = exports.SAP_B1_COMMON_FIELDS = exports.SAP_B1_TABLES = void 0;
exports.getTableInfo = getTableInfo;
exports.getFieldDescription = getFieldDescription;
exports.getObjectTypeDescription = getObjectTypeDescription;
// Diccionario de tablas principales de SAP B1
exports.SAP_B1_TABLES = {
    // === MAESTROS ===
    'OITM': { description: 'Maestro de Artículos (Items Master Data)', category: 'Maestros', relatedTables: ['OITW', 'ITM1', 'OITB'] },
    'OITW': { description: 'Stock de Artículos por Almacén (Item Warehouse Data)', category: 'Maestros', relatedTables: ['OITM', 'OWHS'] },
    'OITB': { description: 'Grupos de Artículos (Item Groups)', category: 'Maestros', relatedTables: ['OITM'] },
    'OCRD': { description: 'Maestro de Socios de Negocio (Business Partners - Clientes/Proveedores)', category: 'Maestros', relatedTables: ['CRD1', 'OCPR', 'OCRG'] },
    'CRD1': { description: 'Direcciones de Socios de Negocio', category: 'Maestros', relatedTables: ['OCRD'] },
    'OCPR': { description: 'Personas de Contacto', category: 'Maestros', relatedTables: ['OCRD'] },
    'OCRG': { description: 'Grupos de Socios de Negocio', category: 'Maestros', relatedTables: ['OCRD'] },
    'OWHS': { description: 'Almacenes (Warehouses)', category: 'Maestros', relatedTables: ['OITW'] },
    'OPLN': { description: 'Listas de Precios', category: 'Maestros', relatedTables: ['ITM1'] },
    'ITM1': { description: 'Precios de Artículos por Lista', category: 'Maestros', relatedTables: ['OITM', 'OPLN'] },
    'OHEM': { description: 'Empleados', category: 'Maestros' },
    'OSLP': { description: 'Vendedores (Sales Employees)', category: 'Maestros' },
    // === VENTAS ===
    'OQUT': { description: 'Ofertas de Venta (Sales Quotations)', category: 'Ventas', relatedTables: ['QUT1'] },
    'QUT1': { description: 'Líneas de Ofertas de Venta', category: 'Ventas', relatedTables: ['OQUT'] },
    'ORDR': { description: 'Pedidos de Venta (Sales Orders)', category: 'Ventas', relatedTables: ['RDR1'] },
    'RDR1': { description: 'Líneas de Pedidos de Venta', category: 'Ventas', relatedTables: ['ORDR'] },
    'ODLN': { description: 'Entregas/Albaranes de Venta (Deliveries)', category: 'Ventas', relatedTables: ['DLN1'] },
    'DLN1': { description: 'Líneas de Entregas de Venta', category: 'Ventas', relatedTables: ['ODLN'] },
    'OINV': { description: 'Facturas de Cliente (A/R Invoices)', category: 'Ventas', relatedTables: ['INV1'] },
    'INV1': { description: 'Líneas de Facturas de Cliente', category: 'Ventas', relatedTables: ['OINV'] },
    'ORIN': { description: 'Abonos/Notas de Crédito de Cliente (A/R Credit Memos)', category: 'Ventas', relatedTables: ['RIN1'] },
    'RIN1': { description: 'Líneas de Abonos de Cliente', category: 'Ventas', relatedTables: ['ORIN'] },
    'ORDN': { description: 'Devoluciones de Cliente (Returns)', category: 'Ventas', relatedTables: ['RDN1'] },
    'RDN1': { description: 'Líneas de Devoluciones de Cliente', category: 'Ventas', relatedTables: ['ORDN'] },
    // === COMPRAS ===
    'OPRQ': { description: 'Solicitudes de Compra (Purchase Requests)', category: 'Compras', relatedTables: ['PRQ1'] },
    'PRQ1': { description: 'Líneas de Solicitudes de Compra', category: 'Compras', relatedTables: ['OPRQ'] },
    'OPQT': { description: 'Ofertas de Compra (Purchase Quotations)', category: 'Compras', relatedTables: ['PQT1'] },
    'PQT1': { description: 'Líneas de Ofertas de Compra', category: 'Compras', relatedTables: ['OPQT'] },
    'OPOR': { description: 'Pedidos de Compra (Purchase Orders)', category: 'Compras', relatedTables: ['POR1'] },
    'POR1': { description: 'Líneas de Pedidos de Compra', category: 'Compras', relatedTables: ['OPOR'] },
    'OPDN': { description: 'Entradas de Mercancía (Goods Receipt PO)', category: 'Compras', relatedTables: ['PDN1'] },
    'PDN1': { description: 'Líneas de Entradas de Mercancía', category: 'Compras', relatedTables: ['OPDN'] },
    'OPCH': { description: 'Facturas de Proveedor (A/P Invoices)', category: 'Compras', relatedTables: ['PCH1'] },
    'PCH1': { description: 'Líneas de Facturas de Proveedor', category: 'Compras', relatedTables: ['OPCH'] },
    'ORPC': { description: 'Abonos de Proveedor (A/P Credit Memos)', category: 'Compras', relatedTables: ['RPC1'] },
    'RPC1': { description: 'Líneas de Abonos de Proveedor', category: 'Compras', relatedTables: ['ORPC'] },
    'ORPD': { description: 'Devoluciones a Proveedor', category: 'Compras', relatedTables: ['RPD1'] },
    'RPD1': { description: 'Líneas de Devoluciones a Proveedor', category: 'Compras', relatedTables: ['ORPD'] },
    // === INVENTARIO ===
    'OIGN': { description: 'Entradas de Mercancía (Goods Receipt)', category: 'Inventario', relatedTables: ['IGN1'] },
    'IGN1': { description: 'Líneas de Entradas de Mercancía', category: 'Inventario', relatedTables: ['OIGN'] },
    'OIGE': { description: 'Salidas de Mercancía (Goods Issue)', category: 'Inventario', relatedTables: ['IGE1'] },
    'IGE1': { description: 'Líneas de Salidas de Mercancía', category: 'Inventario', relatedTables: ['OIGE'] },
    'OWTR': { description: 'Transferencias de Stock (Stock Transfers)', category: 'Inventario', relatedTables: ['WTR1'] },
    'WTR1': { description: 'Líneas de Transferencias de Stock', category: 'Inventario', relatedTables: ['OWTR'] },
    'OINC': { description: 'Recuentos de Inventario (Inventory Counting)', category: 'Inventario', relatedTables: ['INC1'] },
    'INC1': { description: 'Líneas de Recuentos de Inventario', category: 'Inventario', relatedTables: ['OINC'] },
    'OILM': { description: 'Movimientos de Inventario (Inventory Postings)', category: 'Inventario' },
    'OBTQ': { description: 'Lotes (Batches)', category: 'Inventario', relatedTables: ['OITM'] },
    'OSRN': { description: 'Números de Serie (Serial Numbers)', category: 'Inventario', relatedTables: ['OITM'] },
    // === PRODUCCIÓN ===
    'OWOR': { description: 'Órdenes de Fabricación (Production Orders)', category: 'Producción', relatedTables: ['WOR1'] },
    'WOR1': { description: 'Líneas/Componentes de Órdenes de Fabricación', category: 'Producción', relatedTables: ['OWOR'] },
    'OITT': { description: 'Listas de Materiales (Bills of Materials)', category: 'Producción', relatedTables: ['ITT1'] },
    'ITT1': { description: 'Componentes de Listas de Materiales', category: 'Producción', relatedTables: ['OITT'] },
    // === FINANZAS ===
    'OJDT': { description: 'Asientos Contables (Journal Entries)', category: 'Finanzas', relatedTables: ['JDT1'] },
    'JDT1': { description: 'Líneas de Asientos Contables', category: 'Finanzas', relatedTables: ['OJDT'] },
    'OACT': { description: 'Plan de Cuentas (Chart of Accounts)', category: 'Finanzas' },
    'ORCT': { description: 'Cobros (Incoming Payments)', category: 'Finanzas', relatedTables: ['RCT1', 'RCT2'] },
    'RCT1': { description: 'Líneas de Cobros - Facturas', category: 'Finanzas', relatedTables: ['ORCT'] },
    'RCT2': { description: 'Líneas de Cobros - Medios de Pago', category: 'Finanzas', relatedTables: ['ORCT'] },
    'OVPM': { description: 'Pagos (Outgoing Payments)', category: 'Finanzas', relatedTables: ['VPM1', 'VPM2'] },
    'VPM1': { description: 'Líneas de Pagos - Facturas', category: 'Finanzas', relatedTables: ['OVPM'] },
    'VPM2': { description: 'Líneas de Pagos - Medios de Pago', category: 'Finanzas', relatedTables: ['OVPM'] },
    // === BANKING ===
    'OBNK': { description: 'Extractos Bancarios', category: 'Banca' },
    'ODSC': { description: 'Cuentas Bancarias de la Empresa', category: 'Banca' },
    // === SERVICIO ===
    'OSCL': { description: 'Llamadas de Servicio (Service Calls)', category: 'Servicio', relatedTables: ['SCL1'] },
    'SCL1': { description: 'Líneas de Llamadas de Servicio', category: 'Servicio', relatedTables: ['OSCL'] },
    'OCNT': { description: 'Contratos de Servicio', category: 'Servicio' },
    'OINS': { description: 'Tarjetas de Equipo de Cliente', category: 'Servicio' },
    // === CONFIGURACIÓN ===
    'OADM': { description: 'Configuración de la Empresa (Administration)', category: 'Configuración' },
    'OUSR': { description: 'Usuarios', category: 'Configuración' },
    'OCRY': { description: 'Países', category: 'Configuración' },
    'OCST': { description: 'Estados/Provincias', category: 'Configuración' },
    'OCRN': { description: 'Monedas', category: 'Configuración' },
};
// Campos comunes en SAP B1 con sus descripciones
exports.SAP_B1_COMMON_FIELDS = {
    'DocEntry': 'ID interno único del documento (clave primaria)',
    'DocNum': 'Número de documento visible para el usuario',
    'DocDate': 'Fecha del documento',
    'DocDueDate': 'Fecha de vencimiento',
    'TaxDate': 'Fecha de impuesto/contabilización',
    'CardCode': 'Código del socio de negocio (cliente/proveedor)',
    'CardName': 'Nombre del socio de negocio',
    'ItemCode': 'Código del artículo',
    'ItemName': 'Descripción del artículo (Dscription en algunas tablas)',
    'Dscription': 'Descripción del artículo en líneas de documento',
    'Quantity': 'Cantidad',
    'Price': 'Precio unitario',
    'LineTotal': 'Total de línea',
    'DocTotal': 'Total del documento',
    'VatSum': 'Total de IVA/impuestos',
    'DiscPrcnt': 'Porcentaje de descuento',
    'DiscSum': 'Importe de descuento',
    'WhsCode': 'Código de almacén',
    'SlpCode': 'Código de vendedor',
    'OwnerCode': 'Código del empleado propietario',
    'Comments': 'Comentarios/observaciones',
    'DocStatus': 'Estado del documento (O=Abierto, C=Cerrado)',
    'CANCELED': 'Documento cancelado (Y/N)',
    'Printed': 'Documento impreso (Y/N)',
    'OnHand': 'Stock disponible',
    'IsCommited': 'Stock comprometido',
    'OnOrder': 'Stock en pedido',
    'LineNum': 'Número de línea',
    'VisOrder': 'Orden visual de la línea',
    'ObjType': 'Tipo de objeto/documento',
    'CreateDate': 'Fecha de creación',
    'UpdateDate': 'Fecha de última actualización',
    'UserSign': 'ID del usuario que creó el registro',
    'UserSign2': 'ID del usuario que modificó el registro',
    'Series': 'Serie de numeración',
    'Indicator': 'Indicador de documento',
    'U_*': 'Campos de usuario (UDF - User Defined Fields)',
};
// Tipos de objeto (ObjType) comunes en SAP B1
exports.SAP_B1_OBJECT_TYPES = {
    '2': 'Maestro de Artículos (OITM)',
    '4': 'Maestro de Socios de Negocio (OCRD)',
    '13': 'Facturas de Cliente (OINV)',
    '14': 'Abonos de Cliente (ORIN)',
    '15': 'Entregas (ODLN)',
    '16': 'Devoluciones de Cliente (ORDN)',
    '17': 'Pedidos de Venta (ORDR)',
    '18': 'Facturas de Proveedor (OPCH)',
    '19': 'Abonos de Proveedor (ORPC)',
    '20': 'Entradas de Mercancía PO (OPDN)',
    '21': 'Devoluciones a Proveedor (ORPD)',
    '22': 'Pedidos de Compra (OPOR)',
    '23': 'Ofertas de Venta (OQUT)',
    '24': 'Cobros (ORCT)',
    '25': 'Depósitos',
    '30': 'Asientos Contables (OJDT)',
    '46': 'Pagos (OVPM)',
    '59': 'Entradas de Mercancía (OIGN)',
    '60': 'Salidas de Mercancía (OIGE)',
    '67': 'Transferencias de Stock (OWTR)',
    '112': 'Borrador de Documentos',
    '202': 'Órdenes de Fabricación (OWOR)',
    '1250000001': 'Recuentos de Inventario (OINC)',
};
// Relaciones principales entre tablas
exports.SAP_B1_RELATIONSHIPS = [
    { from: 'OITM', to: 'OITW', key: 'ItemCode', description: 'Artículo -> Stock por almacén' },
    { from: 'OITM', to: 'ITM1', key: 'ItemCode', description: 'Artículo -> Precios por lista' },
    { from: 'OITM', to: 'OITB', key: 'ItmsGrpCod', description: 'Artículo -> Grupo de artículos' },
    { from: 'OCRD', to: 'CRD1', key: 'CardCode', description: 'Socio de negocio -> Direcciones' },
    { from: 'OCRD', to: 'OCPR', key: 'CardCode', description: 'Socio de negocio -> Contactos' },
    { from: 'ORDR', to: 'RDR1', key: 'DocEntry', description: 'Pedido de venta -> Líneas' },
    { from: 'OINV', to: 'INV1', key: 'DocEntry', description: 'Factura de cliente -> Líneas' },
    { from: 'OPOR', to: 'POR1', key: 'DocEntry', description: 'Pedido de compra -> Líneas' },
    { from: 'OPCH', to: 'PCH1', key: 'DocEntry', description: 'Factura de proveedor -> Líneas' },
    { from: 'ODLN', to: 'DLN1', key: 'DocEntry', description: 'Entrega -> Líneas' },
    { from: 'OWOR', to: 'WOR1', key: 'DocEntry', description: 'Orden de fabricación -> Componentes' },
    { from: 'OITT', to: 'ITT1', key: 'Code', description: 'Lista de materiales -> Componentes' },
];
// Función para obtener información de una tabla SAP
function getTableInfo(tableName) {
    return exports.SAP_B1_TABLES[tableName.toUpperCase()] || null;
}
// Función para obtener descripción de un campo
function getFieldDescription(fieldName) {
    return exports.SAP_B1_COMMON_FIELDS[fieldName] || null;
}
// Función para obtener el tipo de objeto
function getObjectTypeDescription(objType) {
    return exports.SAP_B1_OBJECT_TYPES[objType] || null;
}
//# sourceMappingURL=sapB1Dictionary.js.map