import { DB } from '../../storage/storage.js';
import { $, fmtMinutes, fmtDate, toast } from '../../utils/helpers.js';

let fechaActual = new Date();
let empleadoSeleccionado = '';

const calcMinutos = (inicio, fin) => {
  if (!inicio || !fin) return 0;
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fin.split(':').map(Number);
  return (h2 * 60 + m2) - (h1 * 60 + m1);
};

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export const renderCalendario = () => {
  const cont = $('#calendario-content');
  const empleados = DB.empleados.all();
  const idForzado = window.empLogueadoId || '';
  const esAdmin = !idForzado;

  cont.innerHTML = `
    <div class="card" style="padding:10px; max-width: 950px; margin: 0 auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <button class="btn ghost" id="btn-mes-prev" style="padding:2px 10px; font-size:0.8rem;">&larr; Ant</button>
          <button class="btn ghost" id="btn-mes-next" style="padding:2px 10px; font-size:0.8rem;">Sig &rarr;</button>
          <button class="btn ghost" id="btn-hoy" style="padding:2px 10px; font-size:0.8rem;">Hoy</button>
          <select id="sel-anio" style="padding:4px; border-radius:4px; border:1px solid #ccc; font-size:0.8rem;">
            ${[2024, 2025, 2026, 2027, 2028].map(y => `<option value="${y}">${y}</option>`).join('')}
          </select>
        </div>
        <h3 id="mes-titulo" style="margin:0; color:var(--primary); font-size:1rem;"></h3>
        <button class="btn ghost" id="btn-exportar-pdf" style="padding:2px 10px; font-size:0.8rem;">Exportar mes</button>
      </div>
      
      <div style="margin-bottom: 10px; display: ${esAdmin ? 'flex' : 'none'}; align-items: center; gap: 10px;">
        <label style="margin:0; font-size: 0.85rem;">Empleado:</label>
        <select id="sel-empleado-cal" style="padding: 5px; border-radius: 4px; border: 1px solid #ccc; min-width: 200px;">
          <option value="">-- Todo el equipo (General) --</option>
          ${empleados.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('')}
        </select>
      </div>

      <div id="resumen-mensual" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px;">
          <div style="background: white; padding: 8px; border-radius: 4px; border-left: 3px solid #10b981;">
            <div style="font-size: 0.65rem; color: #666;">Trabajo</div>
            <div style="font-size: 1rem; font-weight: bold; color: #065f46;" id="res-trabajo">0h 0m</div>
          </div>
          <div style="background: white; padding: 8px; border-radius: 4px; border-left: 3px solid #f59e0b;">
            <div style="font-size: 0.65rem; color: #666;">Extras</div>
            <div style="font-size: 1rem; font-weight: bold; color: #78350f;" id="res-extras">0h 0m</div>
          </div>
          <div style="background: white; padding: 8px; border-radius: 4px; border-left: 3px solid #ef4444;">
            <div style="font-size: 0.65rem; color: #666;">Guardias</div>
            <div style="font-size: 1rem; font-weight: bold; color: #991b1b;" id="res-guardias">0</div>
          </div>
          <div style="background: white; padding: 8px; border-radius: 4px; border-left: 3px solid #4f46e5;">
            <div style="font-size: 0.65rem; color: #666;">Representación</div>
            <div style="font-size: 1rem; font-weight: bold; color: #3730a3;" id="res-representacion">0h 0m</div>
          </div>
          <div style="background: white; padding: 8px; border-radius: 4px; border-left: 3px solid #8b5cf6;">
            <div style="font-size: 0.65rem; color: #666;">Negociación</div>
            <div style="font-size: 1rem; font-weight: bold; color: #4c1d95;" id="res-negociacion">0h 0m</div>
          </div>
        </div>
      </div>

      <div style="display:flex; gap:12px; margin-bottom:8px; font-size:0.7rem; color:#666; flex-wrap:wrap;">
        <span><span style="display:inline-block; width:10px; height:10px; background:#0a3d62; border-radius:2px;"></span> Turno</span>
        <span><span style="display:inline-block; width:10px; height:10px; background:#4f46e5; border-radius:2px;"></span> RLPT</span>
        <span><span style="display:inline-block; width:10px; height:10px; background:#ef4444; border-radius:2px;"></span> Guardia 7x24</span>
        <span><span style="display:inline-block; width:10px; height:10px; background:#f59e0b; border-radius:2px;"></span> Guardia 7x12</span>
        <span><span style="display:inline-block; width:10px; height:10px; background:#22c55e; border-radius:2px;"></span> Vacaciones</span>
        <span><span style="display:inline-block; width:6px; height:6px; background:#3b82f6; border-radius:50%;"></span> Con fichajes</span>
      </div>

      <div id="calendario-grid" style="display:grid; grid-template-columns:repeat(7, 1fr); gap:3px; align-items: stretch;"></div>
    </div>

    <div id="modal-detalle-dia" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:2000; align-items:center; justify-content:center;">
      <div class="card" style="width: 450px; max-height: 85vh; overflow-y: auto; padding: 20px; position: relative;">
        <button id="btn-close-detalle" style="position:absolute; top:10px; right:15px; background:none; border:none; font-size:1.5rem; cursor:pointer; color:#999;">&times;</button>
        <h3 id="detalle-fecha" style="color: var(--primary); margin-bottom: 15px; font-size: 1rem;"></h3>
        <div id="detalle-contenido"></div>
      </div>
    </div>
  `;

  $('#btn-mes-prev').onclick = () => { fechaActual.setMonth(fechaActual.getMonth() - 1); pintarCalendario(); };
  $('#btn-mes-next').onclick = () => { fechaActual.setMonth(fechaActual.getMonth() + 1); pintarCalendario(); };
  $('#btn-hoy').onclick = () => { fechaActual = new Date(); pintarCalendario(); };
  $('#btn-exportar-pdf').onclick = () => exportarPDF();

  const selAnio = $('#sel-anio');
  if (selAnio) {
    selAnio.value = fechaActual.getFullYear();
    selAnio.onchange = (e) => { fechaActual.setFullYear(Number(e.target.value)); pintarCalendario(); };
  }

  const selEmp = $('#sel-empleado-cal');
  if (selEmp) {
    if (idForzado) selEmp.value = idForzado;
    selEmp.onchange = (e) => { empleadoSeleccionado = e.target.value; pintarCalendario(); };
  }

  document.getElementById('btn-close-detalle').onclick = () => {
    document.getElementById('modal-detalle-dia').style.display = 'none';
  };

  pintarCalendario();
};

const pintarCalendario = () => {
  const grid = $('#calendario-grid');
  const anio = fechaActual.getFullYear();
  const mes = fechaActual.getMonth();
  $('#mes-titulo').textContent = `${MESES[mes]} ${anio}`;

  const primerDia = new Date(anio, mes, 1).getDay();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const offset = (primerDia === 0 ? 6 : primerDia - 1);

  let html = DIAS.map(d => `<div style="text-align:center; font-weight:bold; color:var(--primary); font-size:0.8rem; padding-bottom:4px;">${d}</div>`).join('');

  for (let i = 0; i < offset; i++) { html += `<div style="background:#f8fafc; border-radius:3px; min-height:50px;"></div>`; }

  const turnos = DB.turnos.all();
  const idAVer = window.empLogueadoId || empleadoSeleccionado;
  let emp = null;
  if (idAVer) emp = DB.empleados.find(idAVer);

  const vacaciones = emp && emp.vacaciones ? emp.vacaciones : [];
  const guardias = emp && emp.guardias ? emp.guardias : [];
  const rlptFijo = emp && emp.rlptFijo ? emp.rlptFijo : [];
  const rlptPuntual = emp && emp.rlptPuntual ? emp.rlptPuntual : [];
  const fichajes = emp && emp.fichajes ? emp.fichajes : {};
  const excepciones = emp && emp.excepcionesTurno ? emp.excepcionesTurno : {};
  const turnoDefectoId = emp ? emp.turnoId : '';

  let totalTrabajoMin = 0, totalExtrasMin = 0, totalRepresentacionMin = 0, totalNegociacionMin = 0, numGuardias = 0;

  for (let d = 1; d <= diasEnMes; d++) {
    const fechaObj = new Date(anio, mes, d);
    const diaSemana = fechaObj.getDay();
    const fechaStr = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    // Totales reales (fichajes)
    const fichajesDia = fichajes[fechaStr];
    if (fichajesDia && Array.isArray(fichajesDia)) {
      fichajesDia.forEach(f => {
        if (f.entrada && f.salida) {
          const mins = calcMinutos(f.entrada, f.salida);
          const tipo = f.tipo || (f.esExtra ? 'extra' : 'normal');
          if (tipo === 'extra') totalExtrasMin += mins;
          else if (tipo === 'rlpt') totalRepresentacionMin += mins;
          else if (tipo === 'negociacion') totalNegociacionMin += mins;
          else totalTrabajoMin += mins;
        }
      });
    }

    // Guardia
    const gDia = guardias.find(g => g.fecha === fechaStr);
    if (gDia) numGuardias++;

    // Turno (con excepción por día)
    let turnoIdDia = turnoDefectoId;
    if (excepciones[fechaStr]) turnoIdDia = excepciones[fechaStr].turnoId;
    const turnoInfo = turnos.find(t => t.id === turnoIdDia);

    // RLPT planificado (si no hay fichaje RLPT real ese día)
    const tieneFichajeRlpt = fichajesDia && Array.isArray(fichajesDia) && fichajesDia.some(f => f.tipo === 'rlpt' || f.tipo === 'negociacion');
    if (!tieneFichajeRlpt) {
      rlptFijo.forEach(rf => { if (Number(rf.dia) === diaSemana) totalRepresentacionMin += calcMinutos(rf.horaInicio, rf.horaFin); });
      rlptPuntual.forEach(rp => { if (rp.fecha === fechaStr) { if (rp.cargoEmpresa) totalNegociacionMin += calcMinutos(rp.horaInicio, rp.horaFin); else totalRepresentacionMin += calcMinutos(rp.horaInicio, rp.horaFin); } });
    }

    const esVacaciones = vacaciones.includes(fechaStr);
    const tipoGuardia = gDia ? gDia.tipo : '';

    let colorFondo = 'white', colorBorde = 'var(--border)';
    if (esVacaciones) { colorFondo = '#dcfce7'; colorBorde = '#22c55e'; }
    else if (tipoGuardia) { colorFondo = tipoGuardia === '7x24' ? '#fee2e2' : '#fef3c7'; colorBorde = tipoGuardia === '7x24' ? '#ef4444' : '#f59e0b'; }

    let contenido = '';
    if (esVacaciones) {
      contenido = `<div style="font-size:0.6rem; background:#22c55e; color:white; padding:1px; border-radius:2px; text-align:center; font-weight:bold;">Vacaciones</div>`;
    } else {
      if (turnoInfo) {
        const indiceDia = diaSemana === 0 ? 6 : diaSemana - 1;
        const dt = turnoInfo.dias[indiceDia];
        if (dt && dt.tipo !== 'descanso') {
          const horas = dt.tipo === 'continuo' ? `${dt.horaInicio}-${dt.horaFin}` : `${dt.horaInicio}-${dt.horaFin} / ${dt.horaInicioP2}-${dt.horaFinP2}`;
          contenido += `<div style="font-size:0.55rem; background:#0a3d62; color:white; padding:1px; border-radius:2px; text-align:center;">${turnoInfo.nombre.substring(0, 10)}</div><div style="font-size:0.5rem; text-align:center; margin-top:1px;">${horas}</div>`;
        }
      }
      const tieneRlpt = rlptFijo.some(rf => Number(rf.dia) === diaSemana) || rlptPuntual.some(rp => rp.fecha === fechaStr);
      if (tieneRlpt && !esVacaciones) {
        contenido += `<div style="font-size:0.55rem; background:#4f46e5; color:white; padding:1px; border-radius:2px; margin-top:1px; text-align:center;">RLPT</div>`;
      }
      if (tipoGuardia) {
        contenido += `<div style="font-size:0.55rem; background:${tipoGuardia === '7x24' ? '#ef4444' : '#f59e0b'}; color:white; padding:1px; border-radius:2px; margin-top:1px; text-align:center;">Guardia ${tipoGuardia}</div>`;
      }
    }

    const tieneFichajes = fichajesDia && Array.isArray(fichajesDia) && fichajesDia.length > 0;
    const punto = tieneFichajes ? `<div style="position:absolute; top:3px; right:3px; width:6px; height:6px; background:#3b82f6; border-radius:50%;"></div>` : '';

    html += `
      <div class="dia-calendario" data-fecha="${fechaStr}" data-fecha-texto="${d} de ${MESES[mes]} de ${anio}" style="position:relative; background:${colorFondo}; border:1px solid ${colorBorde}; border-radius:3px; padding:2px; min-height:50px; display:flex; flex-direction:column; cursor:pointer;">
        <div style="font-size:0.65rem; font-weight:bold; color:var(--muted);">${d}</div>
        <div style="flex:1;">${contenido}</div>
        ${punto}
      </div>
    `;
  }

  const totalCeldas = offset + diasEnMes;
  const resto = totalCeldas % 7;
  if (resto !== 0) { for (let i = 0; i < 7 - resto; i++) { html += `<div style="background:#f8fafc; border-radius:3px; min-height:50px;"></div>`; } }

  grid.innerHTML = html;

  if (emp) {
    $('#res-trabajo').textContent = fmtMinutes(totalTrabajoMin);
    $('#res-extras').textContent = fmtMinutes(totalExtrasMin);
    $('#res-guardias').textContent = `${numGuardias} días`;
    $('#res-representacion').textContent = fmtMinutes(totalRepresentacionMin);
    $('#res-negociacion').textContent = fmtMinutes(totalNegociacionMin);
  } else {
    $('#res-trabajo').textContent = '0h 0m';
    $('#res-extras').textContent = '0h 0m';
    $('#res-guardias').textContent = '0';
    $('#res-representacion').textContent = '0h 0m';
    $('#res-negociacion').textContent = '0h 0m';
  }

  grid.querySelectorAll('.dia-calendario').forEach(celda => {
    celda.onclick = () => abrirDetalleDia(celda.dataset.fecha, celda.dataset.fechaTexto, emp, turnos);
  });
};

const abrirDetalleDia = (fechaStr, fechaTexto, emp, turnos) => {
  const modal = document.getElementById('modal-detalle-dia');
  const titulo = document.getElementById('detalle-fecha');
  const contenido = document.getElementById('detalle-contenido');

  titulo.textContent = fechaTexto;
  contenido.innerHTML = '';

  if (!emp) {
    contenido.innerHTML = '<p style="color:#999; text-align:center;">Selecciona un empleado para ver los detalles.</p>';
    modal.style.display = 'flex';
    return;
  }

  const fechaObj = new Date(fechaStr + 'T00:00:00');
  const diaSemana = fechaObj.getDay();
  const indiceDia = diaSemana === 0 ? 6 : diaSemana - 1;
  const excepciones = emp.excepcionesTurno || {};
  const turnoIdDia = excepciones[fechaStr] ? excepciones[fechaStr].turnoId : emp.turnoId;
  const turnoInfo = turnos.find(t => t.id === turnoIdDia);

  let html = '';

  // Sección planificada
  let planHtml = '';
  if (turnoInfo) {
    const dt = turnoInfo.dias[indiceDia];
    if (dt && dt.tipo !== 'descanso') {
      const horas = dt.tipo === 'continuo' ? `${dt.horaInicio} - ${dt.horaFin}` : `${dt.horaInicio} - ${dt.horaFin} / ${dt.horaInicioP2} - ${dt.horaFinP2}`;
      planHtml += `<div><strong>${turnoInfo.nombre}</strong></div><div style="color:#666;">${horas}</div>`;
    } else {
      planHtml += `<div style="color:#888;">Día de descanso</div>`;
    }
  } else {
    planHtml += `<div style="color:#888;">Sin turno asignado</div>`;
  }

  if ((emp.vacaciones || []).includes(fechaStr)) planHtml += `<div style="color:#22c55e; font-weight:bold; margin-top:4px;">Vacaciones</div>`;
  const guardia = (emp.guardias || []).find(g => g.fecha === fechaStr);
  if (guardia) planHtml += `<div style="color:${guardia.tipo === '7x24' ? '#ef4444' : '#f59e0b'}; font-weight:bold; margin-top:4px;">Guardia ${guardia.tipo}</div>`;
  (emp.rlptFijo || []).forEach(rf => { if (Number(rf.dia) === diaSemana) planHtml += `<div style="color:#4f46e5; margin-top:4px;">RLPT fijo: ${rf.horaInicio} - ${rf.horaFin}</div>`; });
  (emp.rlptPuntual || []).forEach(rp => { if (rp.fecha === fechaStr) planHtml += `<div style="color:#4f46e5; margin-top:4px;">RLPT puntual: ${rp.horaInicio} - ${rp.horaFin}</div>`; });

  html += `<div style="margin-bottom:12px; padding:10px; background:#f8fafc; border-radius:4px; font-size:0.85rem;"><div style="font-weight:bold; color:var(--primary); margin-bottom:6px;">Planificado</div>${planHtml}</div>`;

  // Sección real
  const f = emp.fichajes ? emp.fichajes[fechaStr] : null;
  let realHtml = '';
  if (f && Array.isArray(f) && f.length > 0) {
    f.forEach(fichaje => {
      const tipo = fichaje.tipo || (fichaje.esExtra ? 'extra' : 'normal');
      const tipoTxt = tipo === 'rlpt' ? 'RLPT' : tipo === 'negociacion' ? 'Negociación' : tipo === 'extra' ? 'Extra' : 'Normal';
      const color = tipo === 'rlpt' ? '#4f46e5' : tipo === 'negociacion' ? '#8b5cf6' : tipo === 'extra' ? '#f59e0b' : '#10b981';
      realHtml += `<div style="margin-bottom:6px; font-size:0.8rem;"><span style="color:${color}; font-weight:bold;">${tipoTxt}</span> · ${fichaje.entrada || '—'} → ${fichaje.salida || '—'}</div>`;
    });
  } else {
    realHtml = '<div style="color:#888; font-size:0.85rem;">Sin fichajes</div>';
  }
  html += `<div style="margin-bottom:12px; padding:10px; background:white; border:1px solid #e2e8f0; border-radius:4px; font-size:0.85rem;"><div style="font-weight:bold; color:var(--primary); margin-bottom:6px;">Real</div>${realHtml}</div>`;

  // Botones
  const esAdmin = !window.empLogueadoId;
  html += `<div style="display:flex; gap:8px; justify-content:flex-end;">`;
  if (esAdmin) {
    html += `<button class="btn ghost" id="btn-editar-turno-dia" style="padding:6px 12px; font-size:0.8rem;">Editar turno del día</button>`;
  }
  html += `</div>`;

  contenido.innerHTML = html;
  modal.style.display = 'flex';

  if (esAdmin) {
    document.getElementById('btn-editar-turno-dia').onclick = () => editarTurnoDia(emp, fechaStr, turnos);
  }
};

const editarTurnoDia = (emp, fechaStr, turnos) => {
  const actual = emp.excepcionesTurno && emp.excepcionesTurno[fechaStr] ? emp.excepcionesTurno[fechaStr].turnoId : emp.turnoId;
  const opciones = turnos.map(t => `<option value="${t.id}" ${t.id === actual ? 'selected' : ''}>${t.nombre}</option>`).join('');
  const tieneExcepcion = emp.excepcionesTurno && emp.excepcionesTurno[fechaStr];

  const modal = document.getElementById('modal-detalle-dia');
  const contenido = document.getElementById('detalle-contenido');

  contenido.innerHTML = `
    <div style="margin-bottom:15px;">
      <label style="display:block; font-size:0.85rem; font-weight:bold; color:var(--primary); margin-bottom:6px;">Turno para este día</label>
      <select id="sel-turno-dia" style="width:100%; padding:8px; border-radius:4px; border:1px solid #ccc;">
        ${opciones}
      </select>
    </div>
    <div style="display:flex; gap:8px; justify-content:flex-end;">
      ${tieneExcepcion ? `<button class="btn danger" id="btn-quitar-excepcion" style="padding:6px 12px; font-size:0.8rem;">Quitar excepción</button>` : ''}
      <button class="btn ghost" id="btn-cancelar-edicion" style="padding:6px 12px; font-size:0.8rem;">Cancelar</button>
      <button class="btn accent" id="btn-guardar-edicion" style="padding:6px 12px; font-size:0.8rem;">Guardar</button>
    </div>
  `;

  document.getElementById('btn-cancelar-edicion').onclick = () => {
    modal.style.display = 'none';
  };

  document.getElementById('btn-guardar-edicion').onclick = () => {
    const turnoId = document.getElementById('sel-turno-dia').value;
    const empDB = DB.empleados.find(emp.id);
    if (!empDB.excepcionesTurno) empDB.excepcionesTurno = {};
    empDB.excepcionesTurno[fechaStr] = { turnoId };
    DB.empleados.update(empDB);
    toast('Turno del día actualizado', 'success');
    modal.style.display = 'none';
    pintarCalendario();
  };

  if (tieneExcepcion) {
    document.getElementById('btn-quitar-excepcion').onclick = () => {
      const empDB = DB.empleados.find(emp.id);
      delete empDB.excepcionesTurno[fechaStr];
      DB.empleados.update(empDB);
      toast('Excepción eliminada', 'success');
      modal.style.display = 'none';
      pintarCalendario();
    };
  }
};

const exportarPDF = () => {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) { toast('Libreria PDF no disponible', 'error'); return; }

  const empId = window.empLogueadoId || empleadoSeleccionado;
  if (!empId) { toast('Selecciona un empleado para exportar', 'error'); return; }

  const emp = DB.empleados.find(empId);
  if (!emp) return;

  const config = DB.config.get();
  const doc = new jsPDF();
  const anio = fechaActual.getFullYear();
  const mes = fechaActual.getMonth();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();

  // Cabecera legal
  doc.setFillColor(10, 61, 98);
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('REGISTRO DE JORNADA LABORAL', 14, 15);
  doc.setFontSize(10);
  doc.text('Conforme al Real Decreto-ley 8/2019, de 8 de marzo', 14, 23);
  doc.text('Art. 34.9 del Estatuto de los Trabajadores', 14, 29);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text('Periodo: ' + MESES[mes] + ' ' + anio, 14, 48);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text('Empresa: ' + (config.empresa || 'Mi Empresa'), 14, 56);
  doc.text('CIF: ' + (config.cif || '—'), 14, 62);
  doc.text('Empleado: ' + emp.nombre, 14, 68);
  doc.text('DNI: ' + (emp.dni || '—'), 14, 74);
  doc.text('Puesto: ' + (emp.puesto || '—'), 14, 80);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 86, 196, 86);

  // Calcular fichajes reales del mes
  const fichajes = emp.fichajes || {};
  const registrosPDF = [];
  let totalTrabajoMin = 0, totalExtrasMin = 0, totalRepresentacionMin = 0, totalNegociacionMin = 0;

  for (let d = 1; d <= diasEnMes; d++) {
    const fechaStr = anio + '-' + String(mes + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const fichajesDia = fichajes[fechaStr];

    if (fichajesDia && Array.isArray(fichajesDia)) {
      fichajesDia.forEach(f => {
        if (f.entrada && f.salida) {
          let mins = calcMinutos(f.entrada, f.salida);
          // Si cruza medianoche (salida < entrada), sumar 24h
          if (mins < 0) mins += 24 * 60;
          const tipo = f.tipo || (f.esExtra ? 'extra' : 'normal');
          if (tipo === 'extra') totalExtrasMin += mins;
          else if (tipo === 'rlpt') totalRepresentacionMin += mins;
          else if (tipo === 'negociacion') totalNegociacionMin += mins;
          else totalTrabajoMin += mins;
          registrosPDF.push({ fecha: fechaStr, tipo: tipo, entrada: f.entrada, salida: f.salida, total: mins });
        }
      });
    }
  }

  // Totales
  doc.setFontSize(11);
  doc.setTextColor(10, 61, 98);
  doc.text('Resumen de horas del mes', 14, 96);

  doc.setFontSize(9);
  doc.setTextColor(0);
  doc.text('Horas de trabajo efectivo: ' + fmtMinutes(totalTrabajoMin), 14, 104);
  doc.text('Horas complementarias / extras: ' + fmtMinutes(totalExtrasMin), 14, 110);
  doc.text('Horas de representacion sindical (RLPT): ' + fmtMinutes(totalRepresentacionMin), 14, 116);
  doc.text('Horas de negociacion colectiva: ' + fmtMinutes(totalNegociacionMin), 14, 122);
  doc.setFontSize(10);
  doc.setTextColor(10, 61, 98);
  const totalGeneral = totalTrabajoMin + totalExtrasMin + totalRepresentacionMin + totalNegociacionMin;
  doc.text('TOTAL HORAS REGISTRADAS: ' + fmtMinutes(totalGeneral), 14, 132);

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 138, 196, 138);

  // Tabla de fichajes
  doc.setFontSize(11);
  doc.setTextColor(10, 61, 98);
  doc.text('Detalle de fichajes registrados', 14, 148);

  let y = 156;
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.setFillColor(10, 61, 98);
  doc.rect(14, y - 5, 182, 7, 'F');
  doc.text('Fecha', 16, y);
  doc.text('Tipo', 48, y);
  doc.text('Entrada', 88, y);
  doc.text('Salida', 118, y);
  doc.text('Total', 148, y);
  y += 6;

  doc.setTextColor(0);
  if (registrosPDF.length === 0) {
    doc.text('No hay fichajes registrados en este periodo.', 16, y);
    y += 6;
  } else {
    registrosPDF.forEach((r, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      if (i % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y - 5, 182, 6, 'F');
      }
      const tipoTxt = r.tipo === 'rlpt' ? 'RLPT' : r.tipo === 'negociacion' ? 'Negociacion' : r.tipo === 'extra' ? 'Extra' : 'Normal';
      doc.text(fmtDate(r.fecha), 16, y);
      doc.text(tipoTxt, 48, y);
      doc.text(r.entrada, 88, y);
      doc.text(r.salida, 118, y);
      doc.text(fmtMinutes(r.total), 148, y);
      y += 6;
    });
  }

  // Pie legal
  y += 10;
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('Este documento constituye el registro diario de jornada exigido por el', 14, y);
  doc.text('Real Decreto-ley 8/2019. La empresa debe conservarlo durante 4 anos', 14, y + 4);
  doc.text('y ponerlo a disposicion del trabajador y de la Inspeccion de Trabajo.', 14, y + 8);
  y += 16;
  doc.text('Generado por RLPT.es el ' + new Date().toLocaleString('es-ES'), 14, y);

  const nombreLimpio = emp.nombre.replace(/ /g, '_');
  doc.save('registro_jornada_' + anio + '-' + String(mes + 1).padStart(2, '0') + '_' + nombreLimpio + '.pdf');
  toast('Registro de jornada exportado', 'success');
};;;
