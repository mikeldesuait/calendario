import { renderDashboard } from './modules/dashboard/dashboard.js';
import { renderEmpleados } from './modules/empleados/empleados.js';
import { renderTurnos } from './modules/turnos/turnos.js';
import { renderRegistros } from './modules/registros/registros.js';
import { renderConfiguracion } from './modules/configuracion/configuracion.js';
import { Storage } from './storage/storage.js';
import { Modal } from './utils/modal.js';

// Por defecto, NO somos admin
let esAdmin = false;

// 1. Configurar la contraseña de admin por defecto si no existe
const inicializarAdmin = () => {
  const adminPass = Storage.get('admin_password', null);
  if (!adminPass) {
    Storage.set('admin_password', 'admin'); // Contraseña por defecto
  }
};
inicializarAdmin();

// 2. Función para mostrar/ocultar pestañas de admin
const actualizarVistaAdmin = () => {
  const adminTabs = document.querySelectorAll('.admin-only');
  const btnAdminLogin = document.getElementById('btn-admin-login');
  const btnLogout = document.getElementById('btn-logout');
  const btnPanel = document.getElementById('btn-panel-nav');
  const navCalendario = document.querySelector('.nav-btn[data-view="calendario"]');
  const navRegistros = document.querySelector('.nav-btn[data-view="registros"]');

  const hayTrabajador = sessionStorage.getItem('rlpt_active_user') !== null;

  if (esAdmin) {
    // MODO ADMIN
    adminTabs.forEach(t => t.style.display = 'inline-block');
    if (btnAdminLogin) btnAdminLogin.style.display = 'none';
    if (btnLogout) btnLogout.style.display = 'inline-block';
    if (btnPanel) btnPanel.style.display = 'none';
    if (navCalendario) navCalendario.style.display = 'inline-block';
    if (navRegistros) navRegistros.style.display = 'inline-block';
  } else if (hayTrabajador) {
    // MODO TRABAJADOR
    adminTabs.forEach(t => t.style.display = 'none');
    if (btnAdminLogin) btnAdminLogin.style.display = 'none';
    if (btnLogout) btnLogout.style.display = 'none';
    if (btnPanel) btnPanel.style.display = 'inline-block';
    if (navCalendario) navCalendario.style.display = 'inline-block';
    if (navRegistros) navRegistros.style.display = 'inline-block';
  } else {
    // MODO PÚBLICO (sin sesión)
    adminTabs.forEach(t => t.style.display = 'none');
    if (btnAdminLogin) btnAdminLogin.style.display = 'inline-block';
    if (btnLogout) btnLogout.style.display = 'none';
    if (btnPanel) btnPanel.style.display = 'none';
    if (navCalendario) navCalendario.style.display = 'none';
    if (navRegistros) navRegistros.style.display = 'none';
  }
};

// Escuchar el evento 'sesion-cambiada' que dispara el dashboard al entrar/salir un trabajador
window.addEventListener('sesion-cambiada', actualizarVistaAdmin);

// 3. Lógica del Modal de Admin
const modal = document.getElementById('modal-admin-login');
const btnAdminLogin = document.getElementById('btn-admin-login');
const btnCloseAdmin = document.getElementById('btn-close-admin-login');
const btnDoLogin = document.getElementById('btn-do-admin-login');

// Recuperación con PIN (con bloqueo exponencial)
setTimeout(() => {
  const btnRecuperar = document.getElementById('btn-recuperar-pin');
  if (btnRecuperar) {
    btnRecuperar.addEventListener('click', async (e) => {
      e.preventDefault();
      
      // Comprobar bloqueo
      const bloqueoHasta = parseInt(localStorage.getItem('rlpt_pin_bloqueo_hasta') || '0');
      const ahora = Date.now();
      
      if (ahora < bloqueoHasta) {
        const segundos = Math.ceil((bloqueoHasta - ahora) / 1000);
        const mins = Math.ceil(segundos / 60);
        Modal.alerta('Bloqueado', `Has fallado demasiadas veces. Espera ${mins} minuto(s) antes de volver a intentarlo.`, 'peligro');
        return;
      }
      
      const pinInput = await Modal.pedirPIN('Introduce tu PIN de recuperación');
      if (!pinInput) return;
      
      const storedPin = localStorage.getItem('rlpt_admin_pin');
      
      if (pinInput === storedPin) {
        localStorage.removeItem('rlpt_pin_intentos');
        localStorage.removeItem('rlpt_pin_bloqueo_hasta');
        
        const newPass = Modal.pedirTexto('Nueva Contraseña', 'Escribe tu nueva contraseña', 'Mínimo 4 caracteres', 'password');
        if (newPass && newPass.length >= 4) {
          localStorage.setItem('rlpt_admin_pass', newPass);
          Modal.alerta('Contraseña actualizada', 'Ya puedes entrar con la nueva contraseña.', 'exito');
          location.reload();
        } else {
          Modal.alerta('Error', 'La contraseña debe tener al menos 4 caracteres.', 'peligro');
        }
      } else {
        let intentos = parseInt(localStorage.getItem('rlpt_pin_intentos') || '0') + 1;
        localStorage.setItem('rlpt_pin_intentos', intentos);
        
        const mins = Math.pow(2, intentos - 1);
        const nuevoBloqueo = Date.now() + (mins * 60 * 1000);
        localStorage.setItem('rlpt_pin_bloqueo_hasta', nuevoBloqueo);
        
        Modal.alerta('PIN incorrecto', `Intento ${intentos}. Espera ${mins} minuto(s) antes de volver a intentarlo.`, 'peligro');
      }
    });
  }
}, 500);
const adminPassInput = document.getElementById('admin-pass-input');
const adminError = document.getElementById('admin-login-error');

btnAdminLogin.addEventListener('click', () => {
  modal.style.display = 'flex';
  adminPassInput.value = '';
  adminError.style.display = 'none';
  adminPassInput.focus();
});

btnCloseAdmin.addEventListener('click', () => {
  modal.style.display = 'none';
});

btnDoLogin.addEventListener('click', () => {
  const adminUserInput = document.getElementById('admin-user-input');
  const user = adminUserInput ? adminUserInput.value.trim() : '';
  const pass = adminPassInput.value;
  
  const storedUser = localStorage.getItem('rlpt_admin_user') || 'admin';
  const storedPass = localStorage.getItem('rlpt_admin_pass') || 'admin';
  
  if (user === storedUser && pass === storedPass) {
    esAdmin = true;
    modal.style.display = 'none';
    actualizarVistaAdmin();
    switchView('empleados'); // Llevarlo a Empleados para que empiece a configurar
    // El botón de salir ya tiene su propio listener configurado globalmente abajo
    // Disparar el evento de clic en el nuevo botón de logout
    // (Lo manejamos abajo globalmente)
  } else {
    adminError.style.display = 'block';
  }
});

// 4. Botón Salir
const btnLogoutGlobal = document.getElementById('btn-logout');
if (btnLogoutGlobal) {
  btnLogoutGlobal.addEventListener('click', () => {
    esAdmin = false;
    actualizarVistaAdmin();
    switchView('dashboard');
  });
}

// 5. Renderizadores de vistas
const renderers = { 
  dashboard: renderDashboard, 
  empleados: renderEmpleados, 
  turnos: renderTurnos, 
  registros: renderRegistros, 
  configuracion: renderConfiguracion,
  calendario: () => {
    import('./modules/calendario/calendario.js').then(mod => mod.renderCalendario());
  },
  
};

// 6. Cambio de pestañas
const switchView = (v) => {
  // Seguridad: Si no es admin e intenta ir a una ruta protegida, no le dejamos
  if (!esAdmin && ['empleados', 'turnos', 'configuracion'].includes(v)) {
    return; 
  }

  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  
  const view = document.getElementById('view-' + v);
  const btn = document.querySelector(`.nav-btn[data-view="${v}"]`);
  
  if (view) view.classList.add('active');
  if (btn) btn.classList.add('active');
  
  if (v === 'calendario') {
    import('./modules/calendario/calendario.js?v=' + Date.now()).then(mod => mod.renderCalendario());
  } else if (renderers[v]) { 
    try { renderers[v](); } catch (e) { console.error(e); } 
  }
};

document.querySelectorAll('.nav-btn').forEach(b => {
  if (b.dataset.view) {
    b.addEventListener('click', () => switchView(b.dataset.view));
  }
});

// 7. Arrancar la aplicación en modo público
actualizarVistaAdmin();
switchView('dashboard');


// --- LÓGICA MÓVIL (menú lateral + barra inferior) ---
document.addEventListener('DOMContentLoaded', () => {
  const esMovil = () => window.innerWidth <= 768;
  
  const menuBtn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-side-menu');
  const overlay = document.getElementById('mobile-overlay');
  const closeBtn = document.getElementById('mobile-side-menu-close');
  const bottomNav = document.getElementById('mobile-bottom-nav');
  
  // Mostrar/ocultar según el tamaño
  const aplicarVisibilidad = () => {
    if (esMovil()) {
      if (menuBtn) menuBtn.style.display = 'flex';
      if (bottomNav) bottomNav.style.display = 'flex';
    } else {
      if (menuBtn) menuBtn.style.display = 'none';
      if (bottomNav) bottomNav.style.display = 'none';
      if (menu) menu.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
    }
  };
  
  const abrirMenu = () => {
    if (menu) { menu.style.display = 'flex'; setTimeout(() => menu.classList.add('open'), 10); }
    if (overlay) { overlay.style.display = 'block'; setTimeout(() => overlay.classList.add('open'), 10); }
  };
  const cerrarMenu = () => {
    if (menu) menu.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    setTimeout(() => {
      if (menu) menu.style.display = 'none';
      if (overlay) overlay.style.display = 'none';
    }, 300);
  };
  
  if (menuBtn) menuBtn.addEventListener('click', abrirMenu);
  if (closeBtn) closeBtn.addEventListener('click', cerrarMenu);
  if (overlay) overlay.addEventListener('click', cerrarMenu);
  
  // Sincronizar con las pestañas originales
  const sincronizar = (view) => {
    // Marcar activo en bottom nav
    document.querySelectorAll('.mobile-bottom-nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === view);
    });
    // Marcar activo en el menú lateral
    document.querySelectorAll('#mobile-side-menu .nav-btn[data-view]').forEach(b => {
      b.classList.toggle('active', b.dataset.view === view);
    });
    // Disparar el botón original del nav de escritorio
    const originalMap = {
      panel: 'dashboard',
      calendario: 'calendario',
      registros: 'registros',
      empleados: 'empleados',
      turnos: 'turnos',
      configuracion: 'configuracion'
    };
    const originalView = originalMap[view] || view;
    const originalBtn = document.querySelector(`.main-nav .nav-btn[data-view="${originalView}"]`);
    if (originalBtn) originalBtn.click();
  };
  
  // Bottom nav
  document.querySelectorAll('.mobile-bottom-nav-btn').forEach(b => {
    b.addEventListener('click', () => {
      sincronizar(b.dataset.view);
    });
  });
  
  // Side menu
  document.querySelectorAll('#mobile-side-menu .nav-btn[data-view]').forEach(b => {
    b.addEventListener('click', () => {
      sincronizar(b.dataset.view);
      cerrarMenu();
    });
  });
  
  // Botones admin móviles (redirigen a los originales)
  const btnAdminMob = document.getElementById('btn-mobile-admin-login');
  const btnLogoutMob = document.getElementById('btn-mobile-logout');
  const btnAdminOrig = document.getElementById('btn-admin-login');
  const btnLogoutOrig = document.getElementById('btn-logout');
  
  if (btnAdminMob && btnAdminOrig) {
    btnAdminMob.addEventListener('click', () => { btnAdminOrig.click(); cerrarMenu(); });
  }
  if (btnLogoutMob && btnLogoutOrig) {
    btnLogoutMob.addEventListener('click', () => { btnLogoutOrig.click(); cerrarMenu(); });
  }
  
  // Sincronizar visibilidad de admin
  const observer = new MutationObserver(() => {
    const esAdmin = btnLogoutOrig && btnLogoutOrig.style.display !== 'none';
    if (btnAdminMob) btnAdminMob.style.display = esAdmin ? 'none' : 'flex';
    if (btnLogoutMob) btnLogoutMob.style.display = esAdmin ? 'flex' : 'none';
    document.querySelectorAll('#mobile-side-menu .admin-only').forEach(el => {
      el.style.display = esAdmin ? 'flex' : 'none';
    });
  });
  if (btnLogoutOrig) {
    observer.observe(btnLogoutOrig, { attributes: true, attributeFilter: ['style'] });
  }
  
  aplicarVisibilidad();
  window.addEventListener('resize', aplicarVisibilidad);
});


// --- VISIBILIDAD DE BOTONES EN MENÚ MÓVIL ---
const actualizarVisibilidadMenuMovil = () => {
  const hayTrabajador = sessionStorage.getItem('rlpt_active_user') !== null;
  const esAdmin = document.getElementById('btn-logout') && document.getElementById('btn-logout').style.display !== 'none';
  
  const btnCalendarioMob = document.getElementById('btn-mobile-calendario');
  const btnRegistrosMob = document.getElementById('btn-mobile-registros');
  const btnEmpleadosMob = document.getElementById('btn-mobile-empleados');
  const btnTurnosMob = document.getElementById('btn-mobile-turnos');
  const btnConfigMob = document.getElementById('btn-mobile-configuracion');
  
  if (esAdmin) {
    if (btnCalendarioMob) btnCalendarioMob.style.display = 'flex';
    if (btnRegistrosMob) btnRegistrosMob.style.display = 'flex';
    if (btnEmpleadosMob) btnEmpleadosMob.style.display = 'flex';
    if (btnTurnosMob) btnTurnosMob.style.display = 'flex';
    if (btnConfigMob) btnConfigMob.style.display = 'flex';
  } else if (hayTrabajador) {
    if (btnCalendarioMob) btnCalendarioMob.style.display = 'flex';
    if (btnRegistrosMob) btnRegistrosMob.style.display = 'flex';
    if (btnEmpleadosMob) btnEmpleadosMob.style.display = 'none';
    if (btnTurnosMob) btnTurnosMob.style.display = 'none';
    if (btnConfigMob) btnConfigMob.style.display = 'none';
  } else {
    if (btnCalendarioMob) btnCalendarioMob.style.display = 'none';
    if (btnRegistrosMob) btnRegistrosMob.style.display = 'none';
    if (btnEmpleadosMob) btnEmpleadosMob.style.display = 'none';
    if (btnTurnosMob) btnTurnosMob.style.display = 'none';
    if (btnConfigMob) btnConfigMob.style.display = 'none';
  }
  
  const bnCalendario = document.getElementById('bn-calendario');
  const bnRegistros = document.getElementById('bn-registros');
  if (bnCalendario) bnCalendario.style.display = hayTrabajador || esAdmin ? 'flex' : 'none';
  if (bnRegistros) bnRegistros.style.display = hayTrabajador || esAdmin ? 'flex' : 'none';
};

window.addEventListener('load', actualizarVisibilidadMenuMovil);
window.addEventListener('sesion-cambiada', actualizarVisibilidadMenuMovil);
setInterval(actualizarVisibilidadMenuMovil, 1000);

const menuBtn = document.getElementById('mobile-menu-btn');
if (menuBtn) {
  menuBtn.addEventListener('click', () => {
    setTimeout(actualizarVisibilidadMenuMovil, 50);
  });
}
