/**
 * Excel Parser Module
 * Parses Excel workbooks and extracts sheet data using SheetJS
 */

import * as XLSX from 'xlsx';

/**
 * Parse an Excel file from an ArrayBuffer
 * @param {ArrayBuffer} arrayBuffer - The file content
 * @returns {Object} Parsed workbook info
 */
export function parseExcelFile(arrayBuffer) {
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const sheets = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');

    const rows = range.e.r - range.s.r + 1;
    const cols = range.e.c - range.s.c + 1;

    // Check if the sheet is essentially empty
    const isEmpty = !sheet['!ref'] || (rows === 1 && cols === 1 && !sheet['A1']);

    return {
      name,
      rows: isEmpty ? 0 : rows,
      cols: isEmpty ? 0 : cols,
      isEmpty,
    };
  });

  return {
    workbook,
    sheets,
    sheetCount: sheets.length,
  };
}

/**
 * Get a preview of the first N rows of a sheet
 * @param {Object} workbook - The XLSX workbook object
 * @param {string} sheetName - Name of the sheet
 * @param {number} maxRows - Maximum number of rows to preview (default: 5)
 * @returns {Array<Array<string>>} 2D array of cell values
 */
export function getSheetPreview(workbook, sheetName, maxRows = 5) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet || !sheet['!ref']) return [];

  const range = XLSX.utils.decode_range(sheet['!ref']);
  const endRow = Math.min(range.s.r + maxRows - 1, range.e.r);

  const preview = [];
  for (let r = range.s.r; r <= endRow; r++) {
    const row = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddress = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[cellAddress];
      row.push(cell ? XLSX.utils.format_cell(cell) : '');
    }
    preview.push(row);
  }

  return preview;
}

/**
 * Convert a sheet to CSV string
 * @param {Object} workbook - The XLSX workbook object
 * @param {string} sheetName - Name of the sheet to convert
 * @param {Object} options - Conversion options
 * @param {string} options.separator - Field separator (default: ';')
 * @returns {string} CSV string
 */
export function sheetToCsv(workbook, sheetName, options = {}) {
  const { separator = ';' } = options;
  const sheet = workbook.Sheets[sheetName];

  return XLSX.utils.sheet_to_csv(sheet, {
    FS: separator,
    RS: '\n',
    blankrows: false,
  });
}
