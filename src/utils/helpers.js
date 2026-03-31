/**
 * Utility helpers for the Excel → CSV converter
 */

/**
 * Format bytes into a human-readable file size string
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const units = ['Bytes', 'KB', 'MB', 'GB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${size} ${units[i]}`;
}

/**
 * Sanitize a filename by removing/replacing invalid characters
 * @param {string} name
 * @returns {string}
 */
export function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 200);
}

/**
 * Get the file extension from a filename
 * @param {string} filename
 * @returns {string}
 */
export function getFileExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Get the filename without its extension
 * @param {string} filename
 * @returns {string}
 */
export function getFileBaseName(filename) {
  const lastDot = filename.lastIndexOf('.');
  return lastDot > 0 ? filename.substring(0, lastDot) : filename;
}

/**
 * Check if a file has a valid Excel extension
 * @param {string} filename
 * @returns {boolean}
 */
export function isValidExcelFile(filename) {
  const ext = getFileExtension(filename);
  return ['xls', 'xlsx'].includes(ext);
}

/**
 * Estimate the size of a CSV string in bytes
 * @param {string} csvString
 * @returns {number}
 */
export function estimateCsvSize(csvString) {
  return new Blob([csvString]).size;
}
