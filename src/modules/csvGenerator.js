/**
 * CSV Generator Module
 * Generates CSV files and packages them into a ZIP for download
 */

import JSZip from 'jszip';
import { sheetToCsv } from './excelParser.js';
import { sanitizeFilename, estimateCsvSize } from '../utils/helpers.js';

export function downloadBlob(blob, fileName) {
  // Crear URL del Blob
  const url = window.URL.createObjectURL(blob);
  
  // Crear elemento enlace invisible
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  
  // Agregar al DOM
  document.body.appendChild(a);
  
  // Simular click para iniciar descarga
  a.click();
  
  // Limpieza: dar más tiempo (2 segundos) para que el navegador registre la descarga
  // antes de revocar la URL y remover el elemento.
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    window.URL.revokeObjectURL(url);
  }, 2000);
}

/**
 * Generate CSV files from selected sheets and download as ZIP
 * @param {Object} options
 * @param {Object} options.workbook - The XLSX workbook object
 * @param {string[]} options.selectedSheets - Array of sheet names to convert
 * @param {string} options.originalFileName - Original Excel file name (without extension)
 * @param {string} options.separator - CSV field separator
 * @param {boolean} options.includeBom - Whether to include UTF-8 BOM
 * @param {Function} options.onProgress - Progress callback: (percent, detail) => void
 * @returns {Promise<Object>} Result with generated file info
 */
export async function generateAndDownloadCsvs({
  workbook,
  selectedSheets,
  originalFileName,
  separator = ';',
  includeBom = true,
  onProgress = () => {},
}) {
  const zip = new JSZip();
  const results = [];
  const bom = includeBom ? '\uFEFF' : '';
  const total = selectedSheets.length;

  for (let i = 0; i < total; i++) {
    const sheetName = selectedSheets[i];
    const progress = Math.round(((i + 1) / total) * 100);
    onProgress(progress, `Convirtiendo hoja: ${sheetName}`);

    // Convert sheet to CSV
    const csvString = bom + sheetToCsv(workbook, sheetName, { separator });
    const safeName = sanitizeFilename(sheetName);
    const fileName = `${sanitizeFilename(originalFileName)}_${safeName}.csv`;

    // Add to ZIP
    zip.file(fileName, csvString);

    // Track result
    results.push({
      sheetName,
      fileName,
      size: estimateCsvSize(csvString),
      csvContent: csvString,
    });

    // Small delay to allow UI updates
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  onProgress(100, 'Generando archivo ZIP...');

  // Generate and download ZIP
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const zipFileName = `${sanitizeFilename(originalFileName)}_csv.zip`;

  return {
    results,
    zipFileName,
    zipSize: zipBlob.size,
    zipBlob,
  };
}

/**
 * Download a single CSV file
 * @param {string} csvContent - The CSV string content
 * @param {string} fileName - The file name to save as
 */
export function downloadSingleCsv(csvContent, fileName) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  downloadBlob(blob, fileName);
}
