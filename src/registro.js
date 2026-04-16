import './styles/index.css';
import { isAuthenticated, register } from './modules/authManager.js';

document.addEventListener('DOMContentLoaded', () => {
  if (isAuthenticated()) {
    window.location.href = '/';
  } else {
    initRegister();
  }
});

function initRegister() {
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
      window.location.href = '/';
    } else {
      regErr.textContent = result.error;
      regErr.classList.remove('hidden');
    }
  });

  [regNombre, regEmail, regPass].forEach(el => {
    el?.addEventListener('keydown', e => { if (e.key === 'Enter') btnRegister?.click(); });
  });
}
