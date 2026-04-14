/**
 * Main Application Entry Point — IOTEC / 01Infinito
 * Incluye gate de autenticación JWT antes de cargar la app
 */

import './styles/index.css';
import { initFileHandler } from './modules/fileHandler.js';
import { initQuoteManager } from './modules/quoteManager.js';
import { initWizardManager } from './modules/wizardManager.js';
import {
  cacheDomElements,
  showSection,
  hideSection,
  showFileInfo,
  renderResults,
  showProgress,
  updateProgress,
  hideProgress,
  showToast,
  resetApp,
} from './modules/uiManager.js';
import {
  isAuthenticated,
  getAgente,
  login,
  register,
  logout,
  authFetch,
} from './modules/authManager.js';

// --- Application State ---
let appState = {
  file: null,
  lastResults: null,
};

// ─── Auth Gate ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (isAuthenticated()) {
    showApp();
  } else {
    showLoginOverlay();
  }
});

function showApp() {
  const overlay    = document.getElementById('login-overlay');
  const appEl      = document.getElementById('app-container');
  const agenteEl   = document.getElementById('agente-nombre');
  const btnLogout  = document.getElementById('btn-logout');

  if (overlay)   overlay.style.display  = 'none';
  if (appEl)     appEl.style.display    = '';

  // Mostrar nombre del agente en header
  const agente = getAgente();
  if (agente && agenteEl) {
    agenteEl.textContent = agente.nombre;
  }

  // Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      if (confirm(`¿Cerrar sesión de ${agente?.nombre ?? 'agente'}?`)) logout();
    });
  }

  // Inicializar app
  initApp();
}

function showLoginOverlay() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) overlay.style.display = 'flex';

  // ── Login ─────────────────────────────────────────────
  const btnLogin    = document.getElementById('btn-login');
  const loginErr    = document.getElementById('login-error');
  const loginEmail  = document.getElementById('login-email');
  const loginPass   = document.getElementById('login-password');

  btnLogin?.addEventListener('click', async () => {
    loginErr.classList.add('hidden');
    btnLogin.disabled   = true;
    btnLogin.textContent = 'Ingresando...';

    const result = await login(loginEmail.value.trim(), loginPass.value);

    btnLogin.disabled    = false;
    btnLogin.textContent = 'Ingresar';

    if (result.ok) {
      showApp();
    } else {
      loginErr.textContent = result.error;
      loginErr.classList.remove('hidden');
    }
  });

  // Enter en los campos de login
  [loginEmail, loginPass].forEach(el => {
    el?.addEventListener('keydown', e => { if (e.key === 'Enter') btnLogin?.click(); });
  });

  // ── Register ──────────────────────────────────────────
  const btnRegister = document.getElementById('btn-register');
  const regErr      = document.getElementById('register-error');
  const regNombre   = document.getElementById('reg-nombre');
  const regEmail    = document.getElementById('reg-email');
  const regPass     = document.getElementById('reg-password');

  btnRegister?.addEventListener('click', async () => {
    regErr.classList.add('hidden');
    btnRegister.disabled    = true;
    btnRegister.textContent = 'Creando cuenta...';

    const result = await register(
      regNombre.value.trim(),
      regEmail.value.trim(),
      regPass.value
    );

    btnRegister.disabled    = false;
    btnRegister.textContent = 'Crear cuenta';

    if (result.ok) {
      showApp();
    } else {
      regErr.textContent = result.error;
      regErr.classList.remove('hidden');
    }
  });

  // ── Toggle login ↔ register ──────────────────────────
  document.getElementById('go-register')?.addEventListener('click', () => {
    document.getElementById('login-mode').classList.add('hidden');
    document.getElementById('register-mode').classList.remove('hidden');
  });

  document.getElementById('go-login')?.addEventListener('click', () => {
    document.getElementById('register-mode').classList.add('hidden');
    document.getElementById('login-mode').classList.remove('hidden');
  });
}

// ─── App Initialization ───────────────────────────────────
function initApp() {
  const dom = cacheDomElements();

  initQuoteManager();
  initWizardManager();

  initFileHandler({
    dropZone: dom.dropZone,
    fileInput: dom.fileInput,
    onFileLoaded: handleFileLoaded,
    onError: (msg) => showToast(msg, 'error'),
  });

  dom.btnRemoveFile?.addEventListener('click', (e) => {
    e.stopPropagation();
    appState = { file: null, lastResults: null };
    resetApp();
  });

  dom.btnConvert?.addEventListener('click', handleConvert);

  dom.btnNewConversion?.addEventListener('click', () => {
    appState = { file: null, lastResults: null };
    resetApp();
  });
}

// ─── File Handlers ────────────────────────────────────────
function handleFileLoaded(file) {
  try {
    appState.file = file;
    showFileInfo(file);
    hideSection('section-upload');
    showSection('section-preview');

    const dom = cacheDomElements();
    if (dom.btnConvert) dom.btnConvert.textContent = 'Importar a Base de Datos';
  } catch (err) {
    showToast('Error inesperado al procesar el archivo.', 'error');
    console.error('File load error:', err);
  }
}

async function handleConvert() {
  if (!appState.file) return;

  try {
    showProgress();
    updateProgress(10, 'Enviando archivo...');

    const formData = new FormData();
    formData.append('file', appState.file);

    updateProgress(40, 'Procesando en la Base de Datos...');

    // authFetch agrega el header Authorization automáticamente
    const response = await authFetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Error al importar datos.');
    }

    updateProgress(100, '¡Importación completada!');

    setTimeout(() => {
      hideProgress();
      hideSection('section-preview');
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
