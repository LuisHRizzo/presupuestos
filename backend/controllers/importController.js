import * as xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// DETECCIÓN DE PROVEEDOR
// ─────────────────────────────────────────────
function detectarProveedor(workbook) {
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    for (const row of data.slice(0, 20)) {
      if (!Array.isArray(row)) continue;
      const cells = row.map(c => String(c).trim().toLowerCase());

      if (cells.includes('código') || cells.includes('codigo')) return 'BIGDIPPER';
      if (cells.includes('part number') || cells.includes('part no')) return 'HIKVISION';
      if (cells.includes('sku')) return 'ACUBOX';
    }
  }
  return 'GENERICO';
}

// ─────────────────────────────────────────────
// PARSER BIGDIPPER (formato original)
// ─────────────────────────────────────────────
function parseBigDipper(sheet) {
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const productos = [];

  let dataStartIndex = -1;
  let headerIndices = {};

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!Array.isArray(row)) continue;
    const firstCell = String(row[0]).trim().toLowerCase();

    if (firstCell === 'código' || firstCell === 'codigo') {
      dataStartIndex = i + 1;
      row.forEach((colName, index) => {
        const key = String(colName).trim().toLowerCase().replace(' %', '');
        if (key) headerIndices[key] = index;
      });
      break;
    }
  }

  if (dataStartIndex === -1) return productos;

  const parsePrice = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const cleanStr = String(val).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
    return parseFloat(cleanStr) || 0;
  };

  for (let i = dataStartIndex; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const codigoCol = headerIndices['código'] ?? headerIndices['codigo'] ?? 0;
    let codigo = String(row[codigoCol] || '').trim();

    if (!codigo || codigo.toLowerCase() === 'código' || codigo.toLowerCase() === 'codigo') continue;

    const descCol    = headerIndices['descripción'] ?? headerIndices['descripcion'] ?? 2;
    const marcaCol   = headerIndices['marca']    ?? 3;
    const partnerCol = headerIndices['partner']  ?? 4;
    const gremioCol  = headerIndices['gremio']   ?? 5;
    const pmpCol     = headerIndices['pmp']      ?? 6;
    const ivaCol     = headerIndices['iva']      ?? 7;
    const totalCol   = headerIndices['total']    ?? 14;

    const descripcion = String(row[descCol] || '').trim();
    if (!descripcion && !codigo) continue;

    const marca         = String(row[marcaCol] || '').trim();
    const precioPartner = parsePrice(row[partnerCol]);
    const precioGremio  = parsePrice(row[gremioCol]);
    const precioPmp     = parsePrice(row[pmpCol]);
    const iva           = parsePrice(row[ivaCol]);

    const rawStock = row[totalCol];
    let stockTotal = 0;
    if (typeof rawStock === 'number') {
      stockTotal = rawStock;
    } else {
      stockTotal = parseInt(String(rawStock).replace(/[^0-9-]/g, ''), 10) || 0;
    }

    productos.push({ codigo, descripcion, marca, precioPartner, precioGremio, precioPmp, iva, stockTotal });
  }

  return productos;
}

// ─────────────────────────────────────────────
// PARSER HIKVISION ("Part Number" como código)
// ─────────────────────────────────────────────
function parseHikvision(sheet) {
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const productos = [];

  let dataStartIndex = -1;
  let headerIndices = {};

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!Array.isArray(row)) continue;
    const cells = row.map(c => String(c).trim().toLowerCase());

    if (cells.includes('part number') || cells.includes('part no')) {
      dataStartIndex = i + 1;
      row.forEach((colName, index) => {
        const key = String(colName).trim().toLowerCase();
        if (key) headerIndices[key] = index;
      });
      break;
    }
  }

  if (dataStartIndex === -1) return productos;

  const parsePrice = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const cleanStr = String(val).replace(/[^0-9.,-]/g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
  };

  for (let i = dataStartIndex; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const codigoCol  = headerIndices['part number'] ?? headerIndices['part no'] ?? 0;
    const descCol    = headerIndices['description'] ?? headerIndices['descripción'] ?? headerIndices['descripcion'] ?? 1;
    const precioCol  = headerIndices['price'] ?? headerIndices['precio'] ?? headerIndices['pvp'] ?? 2;
    const stockCol   = headerIndices['stock'] ?? headerIndices['qty'] ?? -1;

    const codigo = String(row[codigoCol] || '').trim();
    if (!codigo) continue;

    const descripcion   = String(row[descCol]   || codigo).trim();
    const precioPartner = parsePrice(row[precioCol]);
    const stockTotal    = stockCol >= 0 ? (parseInt(row[stockCol]) || 0) : 0;

    productos.push({ codigo, descripcion, marca: 'Hikvision', precioPartner, precioGremio: 0, precioPmp: 0, iva: 21, stockTotal });
  }

  return productos;
}

// ─────────────────────────────────────────────
// PARSER ACUBOX ("SKU" como código)
// ─────────────────────────────────────────────
function parseAcubox(sheet) {
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const productos = [];

  let dataStartIndex = -1;
  let headerIndices = {};

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!Array.isArray(row)) continue;
    const cells = row.map(c => String(c).trim().toLowerCase());

    if (cells.includes('sku')) {
      dataStartIndex = i + 1;
      row.forEach((colName, index) => {
        const key = String(colName).trim().toLowerCase();
        if (key) headerIndices[key] = index;
      });
      break;
    }
  }

  if (dataStartIndex === -1) return productos;

  const parsePrice = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const cleanStr = String(val).replace(/[^0-9.,-]/g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
  };

  for (let i = dataStartIndex; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const codigoCol  = headerIndices['sku']                  ?? 0;
    const descCol    = headerIndices['name'] ?? headerIndices['nombre'] ?? headerIndices['descripcion'] ?? 1;
    const marcaCol   = headerIndices['brand'] ?? headerIndices['marca'] ?? -1;
    const precioCol  = headerIndices['price'] ?? headerIndices['precio'] ?? 2;
    const stockCol   = headerIndices['stock'] ?? -1;

    const codigo = String(row[codigoCol] || '').trim();
    if (!codigo) continue;

    const descripcion   = String(row[descCol]  || codigo).trim();
    const marca         = marcaCol >= 0 ? String(row[marcaCol] || '').trim() : 'Acubox';
    const precioPartner = parsePrice(row[precioCol]);
    const stockTotal    = stockCol >= 0 ? (parseInt(row[stockCol]) || 0) : 0;

    productos.push({ codigo, descripcion, marca, precioPartner, precioGremio: 0, precioPmp: 0, iva: 21, stockTotal });
  }

  return productos;
}

// ─────────────────────────────────────────────
// PARSER GENÉRICO (intenta interpretar cualquier formato tabular)
// ─────────────────────────────────────────────
function parseGenerico(sheet) {
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const productos = [];

  // Buscar primer fila con más de 2 celdas no vacías como header
  let dataStartIndex = -1;
  let headerIndices = {};

  for (let i = 0; i < Math.min(15, data.length); i++) {
    const row = data[i];
    if (!Array.isArray(row)) continue;
    const nonEmpty = row.filter(c => String(c).trim() !== '');
    if (nonEmpty.length >= 3) {
      dataStartIndex = i + 1;
      row.forEach((colName, index) => {
        const key = String(colName).trim().toLowerCase();
        if (key) headerIndices[key] = index;
      });
      break;
    }
  }

  if (dataStartIndex === -1) return productos;

  const parsePrice = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const cleanStr = String(val).replace(/[^0-9.,-]/g, '').replace(',', '.');
    return parseFloat(cleanStr) || 0;
  };

  // Intentar mapear columnas comunes
  const codigoKeys  = ['código', 'codigo', 'code', 'id', 'ref', 'referencia', 'part number', 'sku'];
  const descKeys    = ['descripción', 'descripcion', 'description', 'nombre', 'name', 'detalle'];
  const precioKeys  = ['partner', 'precio', 'price', 'pvp', 'costo', 'valor'];
  const marcaKeys   = ['marca', 'brand', 'fabricante'];

  const findCol = (keys) => {
    for (const k of keys) {
      if (headerIndices[k] !== undefined) return headerIndices[k];
    }
    return -1;
  };

  const codigoCol  = findCol(codigoKeys);
  const descCol    = findCol(descKeys);
  const precioCol  = findCol(precioKeys);
  const marcaCol   = findCol(marcaKeys);

  if (codigoCol === -1 && descCol === -1) return productos; // No se puede parsear

  for (let i = dataStartIndex; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const codigo      = codigoCol >= 0 ? String(row[codigoCol] || '').trim() : `GEN-${i}`;
    const descripcion = descCol   >= 0 ? String(row[descCol]   || '').trim() : 'Sin descripción';
    const marca       = marcaCol  >= 0 ? String(row[marcaCol]  || '').trim() : '';
    const precioPartner = precioCol >= 0 ? parsePrice(row[precioCol]) : 0;

    if (!codigo && !descripcion) continue;

    productos.push({ codigo: codigo || `GEN-${i}`, descripcion, marca, precioPartner, precioGremio: 0, precioPmp: 0, iva: 21, stockTotal: 0 });
  }

  return productos;
}

// ─────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────
export async function processImport(file) {
  const workbook = xlsx.read(file.buffer, { type: 'buffer' });
  const proveedor = detectarProveedor(workbook);

  let resultStats = {
    productosUpdated: 0,
    proveedor,
    errors: [],
  };

  const batch = await prisma.importBatch.create({
    data: {
      filename: file.originalname,
      status: 'PROCESSING',
      proveedor
    }
  });

  try {
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      let productos = [];

      switch (proveedor) {
        case 'BIGDIPPER':  productos = parseBigDipper(sheet);  break;
        case 'HIKVISION':  productos = parseHikvision(sheet);  break;
        case 'ACUBOX':     productos = parseAcubox(sheet);     break;
        default:           productos = parseGenerico(sheet);   break;
      }

      for (const p of productos) {
        try {
          await prisma.product.upsert({
            where: { codigo: p.codigo },
            update: {
              descripcion:   p.descripcion,
              marca:         p.marca,
              proveedor,
              precioPartner: p.precioPartner,
              precioGremio:  p.precioGremio,
              precioPmp:     p.precioPmp,
              iva:           p.iva,
              stockTotal:    p.stockTotal,
              importBatchId: batch.id,
            },
            create: {
              codigo:        p.codigo,
              descripcion:   p.descripcion,
              marca:         p.marca,
              proveedor,
              precioPartner: p.precioPartner,
              precioGremio:  p.precioGremio,
              precioPmp:     p.precioPmp,
              iva:           p.iva,
              stockTotal:    p.stockTotal,
              importBatchId: batch.id,
            }
          });
          resultStats.productosUpdated++;
        } catch (dbErr) {
          resultStats.errors.push(`Hoja ${sheetName}, código ${p.codigo}: ${dbErr.message}`);
        }
      }
    }

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { status: 'SUCCESS' }
    });

  } catch (error) {
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { status: 'FAILED' }
    });
    throw error;
  }

  return {
    success: true,
    batchId: batch.id,
    proveedor,
    stats: resultStats
  };
}
