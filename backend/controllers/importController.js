import * as xlsx from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function processImport(file) {
  const workbook = xlsx.read(file.buffer, { type: 'buffer' });
  
  let resultStats = {
    productosUpdated: 0,
    proveedoresUpdated: 0, // Left to prevent UI breaking
    errors: [],
  };

  // 1. Create a new Import Batch
  const batch = await prisma.importBatch.create({
    data: {
      filename: file.originalname,
      status: 'PROCESSING'
    }
  });

  try {
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      // Extract raw rows
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      let dataStartIndex = -1;
      let headerIndices = {};

      // Find the row containing "Código" as the first element
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!Array.isArray(row)) continue;

        const firstCell = String(row[0]).trim().toLowerCase();
        
        // Allow variations like 'Código', 'codigo', 'código'
        if (firstCell === 'código' || firstCell === 'codigo') {
          dataStartIndex = i + 1; // Content starts the row right after headers
          row.forEach((colName, index) => {
             const key = String(colName).trim().toLowerCase().replace(' %', '');
             if (key) headerIndices[key] = index;
          });
          break;
        }
      }

      if (dataStartIndex === -1) {
        // Did not find "Código". We can either skip or try to parse flat. For BigDipper, we skip.
        continue;
      }

      // Iterate through the actual products
      for (let i = dataStartIndex; i < data.length; i++) {
        const row = data[i];
        
        if (!row || row.length === 0) continue;
        
        const codigoCol = headerIndices['código'] ?? headerIndices['codigo'] ?? 0;
        let codigo = String(row[codigoCol] || '').trim();
        
        // Skip subcategories titles which are repeated exactly as headers or blank
        if (!codigo || codigo.toLowerCase() === 'código' || codigo.toLowerCase() === 'codigo') {
          continue; 
        }

        const descCol = headerIndices['descripción'] ?? headerIndices['descripcion'] ?? 2;
        const marcaCol = headerIndices['marca'] ?? 3;
        const partnerCol = headerIndices['partner'] ?? 4;
        const gremioCol = headerIndices['gremio'] ?? 5;
        const pmpCol = headerIndices['pmp'] ?? 6;
        const ivaCol = headerIndices['iva'] ?? 7;
        const totalCol = headerIndices['total'] ?? 14;

        const descripcion = String(row[descCol] || '').trim();
        if (!descripcion && !codigo) continue; 

        const marca = String(row[marcaCol] || '').trim();

        // Custom function to parse strings like "13,20" to floats
        const parsePrice = (val) => {
          if (!val) return 0;
          if (typeof val === 'number') return val;
          const cleanStr = String(val).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
          return parseFloat(cleanStr) || 0;
        };

        const precioPartner = parsePrice(row[partnerCol]);
        const precioGremio = parsePrice(row[gremioCol]);
        const precioPmp = parsePrice(row[pmpCol]);
        const iva = parsePrice(row[ivaCol]);

        const rawStock = row[totalCol];
        let stockTotal = 0;
        if (typeof rawStock === 'number') {
           stockTotal = rawStock;
        } else {
           stockTotal = parseInt(String(rawStock).replace(/[^0-9-]/g, ''), 10) || 0;
        }

        try {
          await prisma.product.upsert({
            where: { codigo },
            update: {
              descripcion,
              marca,
              precioPartner,
              precioGremio,
              precioPmp,
              iva,
              stockTotal,
              importBatchId: batch.id,
            },
            create: {
              codigo,
              descripcion,
              marca,
              precioPartner,
              precioGremio,
              precioPmp,
              iva,
              stockTotal,
              importBatchId: batch.id,
            }
          });
          resultStats.productosUpdated++;
        } catch (dbErr) {
          resultStats.errors.push(`Error en hoja ${sheetName}, código ${codigo}: ${dbErr.message}`);
        }
      }
    }

    // Mark as SUCCESS
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { status: 'SUCCESS' }
    });

  } catch (error) {
    // Mark as FAILED
    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { status: 'FAILED' }
    });
    throw error;
  }

  return {
    success: true,
    batchId: batch.id,
    stats: resultStats
  };
}
