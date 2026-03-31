/**
 * File Handler Module
 * Manages drag & drop and file input for Excel file uploads
 */

import { isValidExcelFile } from '../utils/helpers.js';

/**
 * Initialize file handling with drag & drop and click-to-select
 * @param {Object} options
 * @param {HTMLElement} options.dropZone - The drop zone element
 * @param {HTMLInputElement} options.fileInput - The file input element
 * @param {Function} options.onFileLoaded - Callback when file is loaded: (file, arrayBuffer) => void
 * @param {Function} options.onError - Callback on error: (message) => void
 */
export function initFileHandler({ dropZone, fileInput, onFileLoaded, onError }) {
  // Click to open file dialog
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  // File input change
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file, onFileLoaded, onError);
    }
  });

  // Drag & drop events
  let dragCounter = 0;

  dropZone.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter++;
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter--;
    if (dragCounter === 0) {
      dropZone.classList.remove('drag-over');
    }
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter = 0;
    dropZone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0], onFileLoaded, onError);
    }
  });
}

/**
 * Process a selected file: validate and read as ArrayBuffer
 * @param {File} file
 * @param {Function} onFileLoaded
 * @param {Function} onError
 */
function handleFile(file, onFileLoaded, onError) {
  if (!isValidExcelFile(file.name)) {
    onError('Formato no soportado. Por favor seleccioná un archivo .xls o .xlsx');
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    onFileLoaded(file, e.target.result);
  };

  reader.onerror = () => {
    onError('Error al leer el archivo. Por favor intentá de nuevo.');
  };

  reader.readAsArrayBuffer(file);
}
