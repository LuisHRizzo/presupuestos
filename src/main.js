/**
 * Main Application Entry Point
 * Orchestrates the Excel → CSV conversion flow
 */

import './styles/index.css';
import { initFileHandler } from './modules/fileHandler.js';
import { initQuoteManager } from './modules/quoteManager.js';
import { initWizardManager } from './modules/wizardManager.js';
import {
  cacheDomElements,
  getDom,
  showSection,
  hideSection,
  showFileInfo,
  hideFileInfo,
  renderResults,
  showProgress,
  updateProgress,
  hideProgress,
  showToast,
  resetApp,
} from './modules/uiManager.js';
import { getFileBaseName } from './utils/helpers.js';

// --- Application State ---
let appState = {
  file: null,
  lastResults: null,
};

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
  const dom = cacheDomElements();

  initQuoteManager();
  initWizardManager();

  // Initialize file handler (drag & drop + input)
  initFileHandler({
    dropZone: dom.dropZone,
    fileInput: dom.fileInput,
    onFileLoaded: handleFileLoaded,
    onError: (msg) => showToast(msg, 'error'),
  });

  // Button: Remove file
  dom.btnRemoveFile.addEventListener('click', (e) => {
    e.stopPropagation();
    appState = { file: null, lastResults: null };
    resetApp();
  });

  // Button: Convert (Now Import)
  dom.btnConvert.addEventListener('click', handleConvert);

  // Button: New conversion
  dom.btnNewConversion.addEventListener('click', () => {
    appState = { file: null, lastResults: null };
    resetApp();
  });
});

/**
 * Handle file loaded from drag & drop or file input
 * @param {File} file
 * @param {ArrayBuffer} arrayBuffer
 */
function handleFileLoaded(file, arrayBuffer) {
  try {
    appState.file = file;
    showFileInfo(file);
    
    // Bypass preview and show a fake "ready" state for the whole file
    hideSection('section-upload');
    showSection('section-preview');

    const dom = cacheDomElements();
    if (dom.btnConvert) {
      dom.btnConvert.textContent = 'Importar a Base de Datos';
    }

  } catch (err) {
    showToast('Error inesperado al procesar el archivo.', 'error');
    console.error('File load error:', err);
  }
}

/**
 * Handle the convert button click
 */
// --- Main Conversion Flow ---
async function handleConvert() {
  if (!appState.file) return;

  try {
    showProgress();
    updateProgress(10, 'Enviando archivo...');

    const formData = new FormData();
    formData.append('file', appState.file);

    updateProgress(40, 'Procesando en la Base de Datos...');

    const response = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al importar datos.');
    }

    updateProgress(100, '¡Importación completada!');
    
    setTimeout(() => {
      hideProgress();
      hideSection('section-preview'); // Hide upload view

      // Show results
      appState.lastResults = result;
      renderResults(result.stats);
      showSection('section-results');

      showToast(`¡Importación exitosa! Lote #${result.batchId}`, 'success');
    }, 500);

  } catch (err) {
    hideProgress();
    showToast('Error en la importación: ' + err.message, 'error');
    console.error('Import error:', err);
  }
}
