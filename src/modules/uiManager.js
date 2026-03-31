/**
 * UI Manager Module
 * Handles all DOM updates, rendering, and visual state management
 */

import { formatFileSize } from '../utils/helpers.js';
import { getSheetPreview } from './excelParser.js';

// --- DOM Element Cache ---
const dom = {};

export function cacheDomElements() {
  dom.sectionUpload = document.getElementById('section-upload');
  dom.sectionPreview = document.getElementById('section-preview');
  dom.sectionResults = document.getElementById('section-results');
  dom.dropZone = document.getElementById('drop-zone');
  dom.fileInput = document.getElementById('file-input');
  dom.fileInfo = document.getElementById('file-info');
  dom.fileName = document.getElementById('file-name');
  dom.fileSize = document.getElementById('file-size');
  dom.btnRemoveFile = document.getElementById('btn-remove-file');
  dom.btnSelectAll = document.getElementById('btn-select-all');
  dom.btnDeselectAll = document.getElementById('btn-deselect-all');
  dom.sheetsCount = document.getElementById('sheets-count');
  dom.sheetsList = document.getElementById('sheets-list');
  dom.csvSeparator = document.getElementById('csv-separator');
  dom.includeBom = document.getElementById('include-bom');
  dom.btnConvert = document.getElementById('btn-convert');
  dom.resultsSummary = document.getElementById('results-summary');
  dom.resultsList = document.getElementById('results-list');
  dom.btnDownloadZip = document.getElementById('btn-download-zip');
  dom.btnNewConversion = document.getElementById('btn-new-conversion');
  dom.toastContainer = document.getElementById('toast-container');
  dom.progressOverlay = document.getElementById('progress-overlay');
  dom.progressBar = document.getElementById('progress-bar');
  dom.progressDetail = document.getElementById('progress-detail');

  return dom;
}

export function getDom() {
  return dom;
}

// --- Section Visibility ---

export function showSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.remove('hidden');
    section.style.display = 'block';
    section.style.animation = 'none';
    // Trigger reflow
    section.offsetHeight;
    section.style.animation = '';
  }
}

export function hideSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.add('hidden');
    section.style.display = 'none';
  }
}

// --- File Info ---

export function showFileInfo(file) {
  dom.fileName.textContent = file.name;
  dom.fileSize.textContent = formatFileSize(file.size);
  dom.fileInfo.classList.remove('hidden');
  dom.dropZone.style.display = 'none';
}

export function hideFileInfo() {
  dom.fileInfo.classList.add('hidden');
  dom.dropZone.style.display = '';
  dom.fileInput.value = '';
}

// --- Sheets List ---

/**
 * Render the list of sheets as selectable cards
 * @param {Array} sheets - Array of sheet info objects
 * @param {Object} workbook - The parsed workbook
 */
export function renderSheetsList(sheets, workbook) {
  dom.sheetsList.innerHTML = '';

  sheets.forEach((sheet, index) => {
    const card = document.createElement('div');
    card.className = `sheet-card ${sheet.isEmpty ? '' : 'selected'}`;
    card.dataset.sheetName = sheet.name;
    card.dataset.index = index;

    card.innerHTML = `
      <div class="sheet-checkbox">
        <input type="checkbox" id="sheet-cb-${index}" ${sheet.isEmpty ? '' : 'checked'} />
        <span class="checkmark"></span>
      </div>
      <div class="sheet-info">
        <div class="sheet-name">${escapeHtml(sheet.name)}</div>
        <div class="sheet-meta">
          <span>${sheet.rows} filas</span>
          <span>${sheet.cols} columnas</span>
          ${sheet.isEmpty ? '<span style="color: var(--color-warning);">⚠ Vacía</span>' : ''}
        </div>
      </div>
      <button class="sheet-preview-toggle" data-sheet="${escapeHtml(sheet.name)}" title="Vista previa">
        👁 Preview
      </button>
    `;

    // Add preview wrapper
    const previewWrapper = document.createElement('div');
    previewWrapper.className = 'sheet-preview-wrapper';
    previewWrapper.id = `preview-${index}`;

    // Toggle checkbox on card click
    card.addEventListener('click', (e) => {
      if (e.target.closest('.sheet-preview-toggle')) return;
      const checkbox = card.querySelector('input[type="checkbox"]');
      checkbox.checked = !checkbox.checked;
      card.classList.toggle('selected', checkbox.checked);
      updateConvertButton();
    });

    // Preview toggle
    const previewBtn = card.querySelector('.sheet-preview-toggle');
    previewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSheetPreview(index, sheet.name, workbook, previewWrapper);
    });

    dom.sheetsList.appendChild(card);
    dom.sheetsList.appendChild(previewWrapper);
  });

  // Update count
  const nonEmptyCount = sheets.filter((s) => !s.isEmpty).length;
  dom.sheetsCount.textContent = `${sheets.length} hoja${sheets.length !== 1 ? 's' : ''} (${nonEmptyCount} con datos)`;

  updateConvertButton();
}

function toggleSheetPreview(index, sheetName, workbook, wrapper) {
  if (wrapper.classList.contains('expanded')) {
    wrapper.classList.remove('expanded');
    setTimeout(() => { wrapper.innerHTML = ''; }, 300);
    return;
  }

  const preview = getSheetPreview(workbook, sheetName, 5);
  if (preview.length === 0) {
    showToast('Esta hoja está vacía', 'warning');
    return;
  }

  let tableHtml = '<table class="sheet-preview-table"><thead><tr>';
  // Header row
  preview[0].forEach((_, ci) => {
    tableHtml += `<th>Col ${ci + 1}</th>`;
  });
  tableHtml += '</tr></thead><tbody>';

  preview.forEach((row) => {
    tableHtml += '<tr>';
    row.forEach((cell) => {
      tableHtml += `<td>${escapeHtml(String(cell))}</td>`;
    });
    tableHtml += '</tr>';
  });

  tableHtml += '</tbody></table>';
  wrapper.innerHTML = tableHtml;
  wrapper.classList.add('expanded');
}

// --- Selection Controls ---

export function selectAllSheets() {
  dom.sheetsList.querySelectorAll('.sheet-card').forEach((card) => {
    const cb = card.querySelector('input[type="checkbox"]');
    cb.checked = true;
    card.classList.add('selected');
  });
  updateConvertButton();
}

export function deselectAllSheets() {
  dom.sheetsList.querySelectorAll('.sheet-card').forEach((card) => {
    const cb = card.querySelector('input[type="checkbox"]');
    cb.checked = false;
    card.classList.remove('selected');
  });
  updateConvertButton();
}

function updateConvertButton() {
  dom.btnConvert.textContent = 'Importar a Base de Datos';
  dom.btnConvert.disabled = false;
  dom.btnConvert.style.opacity = '1';
  dom.btnConvert.style.pointerEvents = 'auto';
}

// --- Results ---

/**
 * Render conversion results
 * @param {Array} results - Array of conversion result objects
 * @param {number} zipSize - Size of the ZIP file
 */
/**
 * Render database import results
 * @param {Object} stats - Array of conversion result objects
 */
export function renderResults(stats) {
  dom.resultsSummary.textContent = `Importación en Base de Datos Finalizada`;
  dom.resultsList.innerHTML = '';

  const total = stats.productosUpdated;
  
  if (total === 0) {
    dom.resultsList.innerHTML = '<div style="color: var(--color-warning);">No se encontró información válida para importar. Revisá el formato del Excel.</div>';
    return;
  }

  if (stats.productosUpdated > 0) {
    dom.resultsList.appendChild(createStatItem('Productos agregados / actualizados', stats.productosUpdated));
  }
  
  if (stats.errors && stats.errors.length > 0) {
    dom.resultsList.appendChild(createStatItem('Filas con errores/omitidas', stats.errors.length, 'warning'));
  }

  if (dom.btnDownloadZip) {
    dom.btnDownloadZip.style.display = 'none';
  }
}

function createStatItem(title, count, modifier = 'success') {
  const item = document.createElement('div');
  item.className = 'result-item';
  item.style.justifyContent = 'space-between';
  item.style.padding = '1.5rem';
  item.innerHTML = `
    <div class="result-info">
      <div class="result-name" style="font-size: 1.1rem; font-weight: 500;">
        <svg style="width: 1.5rem; height: 1.5rem; margin-right: 0.5rem; vertical-align: bottom; stroke: var(--color-${modifier});" viewBox="0 0 24 24" fill="none" stroke-width="2">
          ${modifier === 'success' ? '<polyline points="20 6 9 17 4 12"/>' : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
        </svg>
        ${escapeHtml(title)}
      </div>
    </div>
    <div style="font-size: 1.25rem; font-weight: 700; color: var(--color-${modifier});">
      ${count} registros
    </div>
  `;
  return item;
}

// --- Progress ---

export function showProgress() {
  dom.progressOverlay.classList.remove('hidden');
  dom.progressBar.style.width = '0%';
  dom.progressDetail.textContent = 'Iniciando...';
}

export function updateProgress(percent, detail) {
  dom.progressBar.style.width = `${percent}%`;
  if (detail) dom.progressDetail.textContent = detail;
}

export function hideProgress() {
  dom.progressOverlay.classList.add('hidden');
}

// --- Toast Notifications ---

export function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --- Reset ---

export function resetApp() {
  hideFileInfo();
  hideSection('section-preview');
  hideSection('section-results');
  showSection('section-upload');
  dom.sheetsList.innerHTML = '';
}

// --- Helpers ---

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
