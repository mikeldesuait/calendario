import { DB } from '../../storage/storage.js';
import { $, toast, todayISO, fmtDate, fmtMinutes, minutesBetween } from '../../utils/helpers.js';

let intervalReloj = null;
let empLogueado = null;
let modalExtraAbierto = false;

const calcMinutos = (inicio, fin) => {
  if (!inicio || !fin) return 0;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
};

export const renderDashboard = () => {
  if (intervalReloj) clearInterval(intervalReloj);
  
  const cont = $('#dashboard-content');
  const hoy = todayISO();
  const esAdmin = document.getElementById('btn-logout') && document.getElementById('btn-logout').style.display !== 'none';
  const empleados = DB.empleados.all();
  const config = DB.config.get();
  const turnos = DB.turnos.all();

  // Recuperar sesión
  const savedUser = sessionStorage.getItem('rlpt_active_user');
  if (savedUser && !empLogueado) {
    const empEncontrado = DB.empleados.find(savedUser);
    if (empEncontrado) empLogueado = empEncontrado;
  }
  if (!savedUser) empLogueado = null;

  if (empLogueado) {
    const empActualizado = DB.empleados.find(empLogueado.id);
    if (empActualizado) empLogueado = empActualizado;
  }

  // Leer fichaje del día (soporta formato array y objeto antiguo)
  let fichajeHoy = null;
  let fichajesDelDia = [];
  
  if (empLogueado && empLogueado.fichajes && empLogueado.fichajes[hoy]) {
    const raw = empLogueado.fichajes[hoy];
    if (Array.isArray(raw)) {
      fichajesDelDia = raw;
      fichajeHoy = raw.find(f => !f.salida) || raw[raw.length - 1];
    } else {
      fichajesDelDia = [raw];
      fichajeHoy = raw;
    }
  }
  
  const tieneEntrada = fichajeHoy && fichajeHoy.entrada;
  const tieneSalida = fichajeHoy && fichajeHoy.salida;
  const enHoraExtra = fichajeHoy && fichajeHoy.esExtra && !fichajeHoy.salida;
  const extraTerminada = fichajeHoy && fichajeHoy.esExtra && fichajeHoy.salida;

  let esHorarioTeorico = false;
  if (empLogueado) {
    const ahora = new Date();
    const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
    const diaSemana = ahora.getDay() === 0 ? 6 : ahora.getDay() - 1;
    const turnoInfo = turnos.find(t => t.id === empLogueado.turnoId);
    if (turnoInfo) {
      const d = turnoInfo.dias[diaSemana];
      if (d && d.tipo !== 'descanso') {
        if (d.tipo === 'continuo') {
          if (horaActual >= calcMinutos(d.horaInicio, '00:00') && horaActual <= calcMinutos(d.horaFin, '00:00')) esHorarioTeorico = true;
        } else if (d.tipo === 'partido') {
          if (horaActual >= calcMinutos(d.horaInicio, '00:00') && horaActual <= calcMinutos(d.horaFin, '00:00')) esHorarioTeorico = true;
          if (horaActual >= calcMinutos(d.horaInicioP2, '00:00') && horaActual <= calcMinutos(d.horaFinP2, '00:00')) esHorarioTeorico = true;
        }
      }
    }
  }

  let widgetEstado = '';
  let botonesFichaje = '';
  let botonSalir = '';

  if (empLogueado) {
    const ahora = new Date();
    let minsTrabajados = 0;
    let minsExtras = 0;

    fichajesDelDia.forEach(f => {
      const m = f.salida ? calcMinutos(f.entrada, f.salida) : calcMinutos(f.entrada, ahora.toTimeString().slice(0,5));
      if (f.esExtra) minsExtras += m;
      else minsTrabajados += m;
    });

    let mensaje = '';
    let color = '#10b981';

    if (enHoraExtra) { mensaje = '⏱️ Estás en Horas Extra'; color = '#f59e0b'; }
    else if (!fichajeHoy) { mensaje = '🔵 Todo listo para empezar'; color = '#3b82f6'; }
    else if (tieneSalida) { mensaje = '✅ Jornada finalizada. Puedes iniciar otra.'; color = '#10b981'; }
    else if (esHorarioTeorico) { mensaje = '✅ Estás dentro de tu horario'; color = '#10b981'; }
    else { mensaje = '⚠️ Fuera de horario. Son horas extra.'; color = '#ef4444'; }

    widgetEstado = `
      <div style="margin-top: 10px; background: rgba(0,0,0,0.2); border-radius: 10px; padding: 10px; display: inline-block; min-width: 280px;">
        <div style="font-size: 0.9rem; font-weight: bold; color: ${color}; margin-bottom: 3px;">${mensaje}</div>
        ${minsTrabajados > 0 ? `<div style="font-size: 0.85rem; opacity: 0.9;">Trabajado: <strong>${fmtMinutes(minsTrabajados)}</strong></div>` : ''}
        ${minsExtras > 0 ? `<div style="font-size: 0.85rem; color: #fca5a5; margin-top: 3px;">Horas Extra: <strong>${fmtMinutes(minsExtras)}</strong></div>` : ''}
      </div>
    `;

    if (enHoraExtra) {
      botonesFichaje = `<button class="btn danger" id="btn-extra-stop" style="padding: 10px 20px; font-size: 1rem; border-radius: 50px; background: #f59e0b; color: #1a1a1a;">⏹ Terminar Horas Extra</button>`;
    } else if (!fichajeHoy || tieneSalida) {
      botonesFichaje = `<button class="btn accent" id="btn-start" style="padding: 12px 30px; font-size: 1.1rem; border-radius: 50px;">▶ Iniciar Jornada</button>`;
    } else {
      botonesFichaje = `<button class="btn danger" id="btn-stop" style="padding: 12px 30px; font-size: 1.1rem; border-radius: 50px;">⏹ Terminar Jornada</button>`;
    }
    
    botonSalir = `<div style="margin-top: 20px;"><button id="btn-salir-sesion" style="padding: 10px 25px; background: transparent; border: 1px solid rgba(255,255,255,0.6); color: white; border-radius: 50px; cursor: pointer; font-size: 0.9rem;">🚪 Cerrar Sesión</button></div>`;
  } else {
    botonesFichaje = `<button class="btn accent" id="btn-fichar-publico" style="padding: 12px 30px; font-size: 1.1rem; border-radius: 50px;">▶ Entrar a mi área</button>`;
  }

  let widgetDerechos = '';
  if (empLogueado) {
    const vacacionesTotales = config.rlpt?.diasVacaciones || 22;
    const vacacionesUsadas = (empLogueado.vacaciones || []).length;
    const vacacionesRestantes = vacacionesTotales - vacacionesUsadas;
    
    const rlptTotales = (empLogueado.rlptCredito !== undefined ? empLogueado.rlptCredito : 15) * 60;
    let rlptUsadasMin = 0;
    const prefijoMes = `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;
    (empLogueado.rlptPuntual || []).forEach(rp => { if (rp.fecha.startsWith(prefijoMes) && !rp.cargoEmpresa) rlptUsadasMin += calcMinutos(rp.horaInicio, rp.horaFin); });
    (empLogueado.rlptFijo || []).forEach(rf => { rlptUsadasMin += calcMinutos(rf.horaInicio, rf.horaFin) * 4; });
    const rlptRestantes = Math.max(0, rlptTotales - rlptUsadasMin);

    widgetDerechos = `
      <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
        <div style="background: rgba(255,255,255,0.1); padding: 6px 15px; border-radius: 20px; font-size: 0.85rem;">🌴 Vacaciones: <strong>${vacacionesRestantes} días</strong> (de ${vacacionesTotales})</div>
        <div style="background: rgba(255,255,255,0.1); padding: 6px 15px; border-radius: 20px; font-size: 0.85rem;">🗣️ Crédito Sindical: <strong>${fmtMinutes(rlptRestantes)}</strong></div>
      </div>
    `;
  }

  cont.innerHTML = `
    <div class="card" style="text-align: center; background: linear-gradient(135deg, #0a3d62, #1e5f8c); color: white; border: none; padding: 20px 15px; margin-bottom: 20px; box-shadow: 0 10px 25px rgba(10,61,98,0.3);">
      <h2 style="font-size: 1.2rem; margin-bottom: 5px; opacity: 0.9;">${empLogueado ? 'Hola, ' + empLogueado.nombre : 'Bienvenido a RLPT.es'}</h2>
      <div id="reloj-grande" style="font-size: 3rem; font-weight: bold; font-family: monospace; letter-spacing: 2px; margin: 10px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">00:00:00</div>
      <p id="reloj-fecha" style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 15px;"></p>
      
      <div id="zona-fichaje">
        ${botonesFichaje}
      </div>

      ${widgetEstado}
      ${widgetDerechos}
      ${botonSalir}
    </div>

    <!-- MODAL DE TIPO DE FICHAJE -->
    <div id="modal-confirm-extra" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter: blur(5px); z-index:2000; align-items:center; justify-content:center;">
      <div class="card" style="width: 440px; padding: 30px; text-align: center;">
        <h3 id="modal-extra-titulo" style="color: #f59e0b; margin-bottom: 15px;">¿Qué tipo de tiempo es?</h3>
        <p id="modal-extra-mensaje" style="color: var(--muted); font-size: 0.9rem; margin-bottom: 20px; line-height: 1.5;">
          Selecciona el tipo de fichaje que vas a registrar.
        </p>
        
        <div style="display: flex; flex-direction: column; gap: 10px;">
          <button class="btn" id="btn-tipo-normal" style="width: 100%; padding: 12px; background: #10b981; color: white; font-weight: bold;">
            ⏱️ Trabajo Normal
          </button>
          
          <div id="opciones-representante" style="display: none; flex-direction: column; gap: 10px;">
            <button class="btn" id="btn-tipo-rlpt" style="width: 100%; padding: 12px; background: #4f46e5; color: white; font-weight: bold;">
              🗣️ Representación Sindical (RLPT)
            </button>
            <button class="btn" id="btn-tipo-negociacion" style="width: 100%; padding: 12px; background: #8b5cf6; color: white; font-weight: bold;">
              🤝 Negociación Colectiva
            </button>
          </div>
          
          <div id="opciones-extra" style="display: none;">
            <button class="btn" id="btn-tipo-extra" style="width: 100%; padding: 12px; background: #f59e0b; color: #1a1a1a; font-weight: bold;">
              ⚠️ Hora Extra
            </button>
          </div>
        </div>
        
        <button class="btn ghost" id="btn-confirm-extra-no" style="width: 100%; padding: 12px; margin-top: 15px;">Cancelar</button>
      </div>
    </div>
  `;

  const actualizarReloj = () => {
    if (modalExtraAbierto) return;
    const ahora = new Date();
    const relojEl = document.getElementById('reloj-grande');
    if (relojEl) relojEl.textContent = ahora.toLocaleTimeString('es-ES');
    const fechaEl = document.getElementById('reloj-fecha');
    if (fechaEl) fechaEl.textContent = ahora.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  actualizarReloj();
  intervalReloj = setInterval(actualizarReloj, 1000);

  document.getElementById('btn-fichar-publico')?.addEventListener('click', () => {
    document.getElementById('modal-fichaje-publico').style.display = 'flex';
    document.getElementById('fichaje-user-input').value = '';
    document.getElementById('fichaje-pass-input').value = '';
    document.getElementById('fichaje-login-error').style.display = 'none';
  });

  // INICIAR JORNADA NORMAL
  document.getElementById('btn-start')?.addEventListener('click', () => {
    const ahora = new Date();
    const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    
    // Si es representante, SIEMPRE mostrar el modal de opciones
    if (empLogueado.esRepresentante) {
      const titulo = document.getElementById('modal-extra-titulo');
      const mensaje = document.getElementById('modal-extra-mensaje');
      const opcionesRep = document.getElementById('opciones-representante');
      const opcionesExtra = document.getElementById('opciones-extra');
      const btnNormal = document.getElementById('btn-tipo-normal');
      
      // Mostrar las opciones de representante SIEMPRE
      if (opcionesRep) opcionesRep.style.display = 'flex';
      
      if (esHorarioTeorico) {
        // Dentro de horario: Normal, RLPT, Negociación
        if (titulo) { titulo.textContent = '¿Qué tipo de fichaje es?'; titulo.style.color = '#10b981'; }
        if (mensaje) mensaje.textContent = 'Estás dentro de tu horario. Elige si es trabajo normal, representación o negociación.';
        if (opcionesExtra) opcionesExtra.style.display = 'none';
        if (btnNormal) btnNormal.style.display = 'block';
      } else {
        // Fuera de horario: Extra, RLPT, Negociación
        if (titulo) { titulo.textContent = '⚠️ Fuera de Horario'; titulo.style.color = '#f59e0b'; }
        if (mensaje) mensaje.textContent = 'Estás fuera de tu horario. Elige si es hora extra, representación o negociación.';
        if (opcionesExtra) opcionesExtra.style.display = 'block';
        if (btnNormal) btnNormal.style.display = 'none';
      }
      
      modalExtraAbierto = true;
      document.getElementById('modal-confirm-extra').style.display = 'flex';
      return;
    }
    
    // Si NO es representante, lógica normal
    if (!esHorarioTeorico) {
      // Fuera de horario: solo opción Extra
      const titulo = document.getElementById('modal-extra-titulo');
      const mensaje = document.getElementById('modal-extra-mensaje');
      const opcionesRep = document.getElementById('opciones-representante');
      const opcionesExtra = document.getElementById('opciones-extra');
      const btnNormal = document.getElementById('btn-tipo-normal');
      
      if (titulo) { titulo.textContent = '⚠️ Fuera de Horario'; titulo.style.color = '#f59e0b'; }
      if (mensaje) mensaje.textContent = 'Estás fuera de tu horario. Este fichaje se registrará como Hora Extra.';
      if (opcionesRep) opcionesRep.style.display = 'none';
      if (opcionesExtra) opcionesExtra.style.display = 'block';
      if (btnNormal) btnNormal.style.display = 'none';
      
      modalExtraAbierto = true;
      document.getElementById('modal-confirm-extra').style.display = 'flex';
    } else {
      // Dentro de horario: fichaje normal directo
      const empDB = DB.empleados.find(empLogueado.id);
      if (!empDB.fichajes) empDB.fichajes = {};
      if (!empDB.fichajes[hoy]) empDB.fichajes[hoy] = [];
      if (!Array.isArray(empDB.fichajes[hoy])) empDB.fichajes[hoy] = [empDB.fichajes[hoy]];
      
      empDB.fichajes[hoy].push({ 
        entrada: hora, 
        timestamp_entrada: new Date().toISOString(), 
        esExtra: false,
        tipo: 'normal'
      });
      DB.empleados.update(empDB);
      empLogueado = DB.empleados.find(empLogueado.id);
      toast('Jornada iniciada', 'success');
      renderDashboard();
    }
  });

  // MODAL HORAS EXTRA - SI ACEPTA
  document.getElementById('btn-confirm-extra-si')?.addEventListener('click', () => {
    const empDB = DB.empleados.find(empLogueado.id);
    const ahora = new Date();
    const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    if (!empDB.fichajes) empDB.fichajes = {};
    if (!empDB.fichajes[hoy]) empDB.fichajes[hoy] = [];
    if (!Array.isArray(empDB.fichajes[hoy])) empDB.fichajes[hoy] = [empDB.fichajes[hoy]];
    empDB.fichajes[hoy].push({ entrada: hora, timestamp_entrada: new Date().toISOString(), esExtra: true });
    DB.empleados.update(empDB);
    empLogueado = DB.empleados.find(empLogueado.id);
    modalExtraAbierto = false;
    document.getElementById('modal-confirm-extra').style.display = 'none';
    toast('Horas Extra iniciadas', 'success');
    renderDashboard();
  });

  document.getElementById('btn-confirm-extra-no')?.addEventListener('click', () => {
    modalExtraAbierto = false;
    document.getElementById('modal-confirm-extra').style.display = 'none';
  });

  // --- LISTENERS DE LOS BOTONES DE TIPO DE FICHAJE ---
  const guardarFichajeConTipo = (tipo) => {
    const empDB = DB.empleados.find(empLogueado.id);
    const ahora = new Date();
    const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    if (!empDB.fichajes) empDB.fichajes = {};
    if (!empDB.fichajes[hoy]) empDB.fichajes[hoy] = [];
    if (!Array.isArray(empDB.fichajes[hoy])) empDB.fichajes[hoy] = [empDB.fichajes[hoy]];
    
    empDB.fichajes[hoy].push({ 
      entrada: hora, 
      timestamp_entrada: new Date().toISOString(), 
      esExtra: tipo === 'extra',
      tipo: tipo
    });
    DB.empleados.update(empDB);
    empLogueado = DB.empleados.find(empLogueado.id);
    
    modalExtraAbierto = false;
    document.getElementById('modal-confirm-extra').style.display = 'none';
    
    const mensajes = {
      normal: 'Jornada normal iniciada',
      extra: 'Hora Extra iniciada',
      rlpt: 'Representación sindical iniciada',
      negociacion: 'Negociación colectiva iniciada'
    };
    toast(mensajes[tipo] || 'Fichaje iniciado', 'success');
    renderDashboard();
  };

  document.getElementById('btn-tipo-normal')?.addEventListener('click', () => guardarFichajeConTipo('normal'));
  document.getElementById('btn-tipo-extra')?.addEventListener('click', () => guardarFichajeConTipo('extra'));
  document.getElementById('btn-tipo-rlpt')?.addEventListener('click', () => guardarFichajeConTipo('rlpt'));
  document.getElementById('btn-tipo-negociacion')?.addEventListener('click', () => guardarFichajeConTipo('negociacion'));

  // TERMINAR JORNADA NORMAL
  document.getElementById('btn-stop')?.addEventListener('click', () => {
    const empDB = DB.empleados.find(empLogueado.id);
    const ahora = new Date();
    const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    if (Array.isArray(empDB.fichajes[hoy])) {
      const abierto = empDB.fichajes[hoy].find(f => !f.salida);
      if (abierto) {
        abierto.salida = hora;
        abierto.timestamp_salida = new Date().toISOString();
      }
    }
    DB.empleados.update(empDB);
    empLogueado = DB.empleados.find(empLogueado.id);
    toast('Jornada finalizada', 'success');
    renderDashboard();
  });

  // TERMINAR HORAS EXTRA
  document.getElementById('btn-extra-stop')?.addEventListener('click', () => {
    const empDB = DB.empleados.find(empLogueado.id);
    const ahora = new Date();
    const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    if (Array.isArray(empDB.fichajes[hoy])) {
      const abiertoExtra = empDB.fichajes[hoy].find(f => f.esExtra && !f.salida);
      if (abiertoExtra) {
        abiertoExtra.salida = hora;
        abiertoExtra.timestamp_salida = new Date().toISOString();
      }
    }
    DB.empleados.update(empDB);
    empLogueado = DB.empleados.find(empLogueado.id);
    toast('Horas Extra registradas', 'success');
    renderDashboard();
  });

  const btnLoginFichaje = document.getElementById('btn-do-fichaje-login');
  if (btnLoginFichaje) {
    const newBtn = btnLoginFichaje.cloneNode(true);
    btnLoginFichaje.parentNode.replaceChild(newBtn, btnLoginFichaje);
    newBtn.addEventListener('click', () => {
      const user = document.getElementById('fichaje-user-input').value.trim();
      const pass = document.getElementById('fichaje-pass-input').value.trim();
      const emp = empleados.find(e => e.codigo === user && e.password === pass);
      if (emp) {
        document.getElementById('modal-fichaje-publico').style.display = 'none';
        empLogueado = DB.empleados.find(emp.id);
        window.empLogueadoId = empLogueado.id;
        sessionStorage.setItem('rlpt_active_user', empLogueado.id);
        window.dispatchEvent(new Event('sesion-cambiada'));
        toast('¡Bienvenido, ' + empLogueado.nombre + '!', 'success');
        renderDashboard();
      } else {
        document.getElementById('fichaje-login-error').style.display = 'block';
      }
    });
  }

  document.getElementById('btn-close-fichaje')?.addEventListener('click', () => {
    document.getElementById('modal-fichaje-publico').style.display = 'none';
  });

  document.getElementById('btn-salir-sesion')?.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.removeItem('rlpt_active_user');
    window.dispatchEvent(new Event('sesion-cambiada'));
    empLogueado = null;
    window.empLogueadoId = null;
    window.location.replace(window.location.pathname);
  });
};
