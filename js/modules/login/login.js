import { DB } from '../../storage/storage.js';
import { $ } from '../../utils/helpers.js';

export const renderLogin = (onSuccess) => {
  const modal = document.getElementById('modal-login');
  const landing = document.getElementById('landing-screen');
  const mainApp = document.getElementById('main-app');

  if (landing) landing.style.display = 'flex';
  if (mainApp) mainApp.style.display = 'none';

  // Abrir modal Empresa
  document.getElementById('btn-open-modal-empresa').onclick = () => {
    document.getElementById('modal-title').textContent = 'Acceso Empresa';
    document.getElementById('modal-login').style.display = 'flex';
    document.getElementById('login-user').focus();
  };

  // Abrir modal Libre
  document.getElementById('btn-open-modal-libre').onclick = () => {
    // En este caso, como no queremos pedir login para el modo libre, entramos directo
    onSuccess({ role: 'libre', id: 'libre' });
  };

  // Cerrar modal
  document.getElementById('btn-close-modal').onclick = () => {
    document.getElementById('modal-login').style.display = 'none';
  };

  // Botón Entrar del Modal
  const btnLogin = document.getElementById('btn-login');
  const newBtn = btnLogin.cloneNode(true);
  btnLogin.parentNode.replaceChild(newBtn, btnLogin);

  newBtn.onclick = () => {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();

    if (user.toLowerCase() === 'admin' && pass === 'admin') {
      document.getElementById('modal-login').style.display = 'none';
      onSuccess({ role: 'admin', id: 'admin' });
      return;
    }

    const empleados = DB.empleados.all();
    const emp = empleados.find(e => e.codigo === user && e.password === pass);

    if (emp) {
      document.getElementById('modal-login').style.display = 'none';
      onSuccess({ role: 'user', id: emp.id });
    } else {
      document.getElementById('login-error').style.display = 'block';
    }
  };
};
