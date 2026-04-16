import './styles/index.css';
import { isAuthenticated, login } from './modules/authManager.js';

document.addEventListener('DOMContentLoaded', () => {
  if (isAuthenticated()) {
    window.location.href = '/';
  } else {
    initLogin();
  }
});

function initLogin() {
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
      window.location.href = '/';
    } else {
      loginErr.textContent = result.error;
      loginErr.classList.remove('hidden');
    }
  });

  [loginEmail, loginPass].forEach(el => {
    el?.addEventListener('keydown', e => { if (e.key === 'Enter') btnLogin?.click(); });
  });
}
