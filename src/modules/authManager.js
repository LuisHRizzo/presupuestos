// ─────────────────────────────────────────────────────────
// authManager.js — Gestión de autenticación JWT en el frontend
// ─────────────────────────────────────────────────────────

const TOKEN_KEY  = 'iotec_token';
const API = '/api';

// ── Token helpers ──────────────────────────────────────

function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Decodifica el payload del JWT (sin verificar firma — eso es trabajo del servidor).
 * Devuelve { id, nombre, email, exp } o null si el token es inválido.
 */
function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/**
 * Verifica si hay un token válido y no expirado en localStorage.
 */
export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  const payload = decodeToken(token);
  if (!payload) return false;
  // exp viene en segundos
  return payload.exp * 1000 > Date.now();
}

/**
 * Devuelve los datos del agente autenticado { id, nombre, email }.
 */
export function getAgente() {
  const token = getToken();
  if (!token) return null;
  const payload = decodeToken(token);
  if (!payload) return null;
  return { id: payload.id, nombre: payload.nombre, email: payload.email };
}

// ── API calls ──────────────────────────────────────────

/**
 * Intenta hacer login. Guarda el token si tiene éxito.
 * @returns {{ ok: boolean, error?: string }}
 */
export async function login(email, password) {
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || 'Error de autenticación' };
    saveToken(data.token);
    return { ok: true, user: data.user };
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor.' };
  }
}

/**
 * Registra un nuevo agente. Guarda el token si tiene éxito.
 * @returns {{ ok: boolean, error?: string }}
 */
export async function register(nombre, email, password) {
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, password })
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || 'Error al registrarse' };
    saveToken(data.token);
    return { ok: true, user: data.user };
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor.' };
  }
}

export function logout() {
  clearToken();
  window.location.reload();
}

/**
 * fetch() con Authorization header automático.
 * Si el token expiró, hace logout y recarga.
 */
export async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const res = await fetch(url, { ...options, headers });

  // Token expirado o inválido → logout
  if (res.status === 401) {
    const data = await res.json().catch(() => ({}));
    if (data.expired || data.error?.includes('expirada')) {
      logout();
      return res;
    }
  }

  return res;
}
