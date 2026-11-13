import { DB } from '../../storage/storage.js';
import { $, toast, todayISO, fmtDate, minutesBetween, fmtMinutes } from '../../utils/helpers.js';

export const renderRegistros = () => {
  const cont = $('#registros-content');
  const empleados = DB.empleados.all();
  const config = DB.config.get();
  
  // Seguridad: leer la sesión de sessionStorage
  const sessionTrabajador = sessionStorage.getItem('rlpt_active_user');
  const idForzado = window.empLogueadoId || sessionTrabajador || '';
  const esAdmin = !idForzado;

  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
  const hoyStr = todayISO();

  cont.innerHTML = `
    <div class="card">
      <h3 style="margin-bottom:14px;color:var(--primary)">Filtros de búsqueda</h3>
      <div style="display:grid; grid-template-columns: 1fr 1fr 2fr auto; gap:12px; align-items:end;">
        <div class="field" style="margin:0">
          <label>Desde</label>
          <input type="date" id="f-desde" value="${primerDiaMes}">
        </div>
        <div class="field" style="margin:0">
          <label>Hasta</label>
          <input type="date" id="f-hasta" value="${hoyStr}">
        </div>
        <div class="field" style="margin:0">
          <label>Empleado</label>
          <select id="f-empleado" ${!esAdmin ? 'disabled' : ''}>
            ${esAdmin ? '<option value="">-- Todos --</option>' : ''}
            ${empleados.map(e => `<option value="${e.id}" ${idForzado === e.id ? 'selected' : ''}>${e.nombre}</option>`).join('')}
          </select>
        </div>
        <button class="btn accent" id="btn-descargar-pdf" style="padding:10px 20px; font-size:1rem;">📥 Descargar PDF</button>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-bottom:14px;color:var(--primary)">Registros de Jornada</h3>
      <div id="tabla-registros" style="overflow-x: auto;"></div>
    </div>
  `;

  const renderTabla = () => {
    const desde = $('#f-desde').value;
    const hasta = $('#f-hasta').value;
    const empFiltro = esAdmin ? $('#f-empleado').value : idForzado;

    let regs = [];
    
    empleados.forEach(emp => {
      if (empFiltro && emp.id !== empFiltro) return;
      const f = emp.fichajes || {};
      Object.keys(f).forEach(fecha => {
        if (fecha >= desde && fecha <= hasta) {
          const datos = f[fecha];
          if (Array.isArray(datos)) {
            datos.forEach(fichaje => {
              if (fichaje.entrada || fichaje.salida) {
                regs.push({ ...fichaje, fecha, empleado: emp });
              }
            });
          } else if (datos.entrada || datos.salida) {
            regs.push({ ...datos, fecha, empleado: emp });
          }
        }
      });
    });

    regs.sort((a, b) => b.fecha.localeCompare(a.fecha));

    if (regs.length === 0) {
      $('#tabla-registros').innerHTML = '<p style="text-align:center; color:#999; padding:20px;">No hay registros en este rango de fechas.</p>';
      return;
    }

    let html = `<table style="width:100%; border-collapse:collapse;">
      <thead><tr style="background:#f8fafc; text-align:left;">
        <th style="padding:10px; font-size:0.85rem;">Fecha</th>
        <th style="padding:10px; font-size:0.85rem;">Empleado</th>
        <th style="padding:10px; font-size:0.85rem;">Entrada</th>
        <th style="padding:10px; font-size:0.85rem;">Salida</th>
        <th style="padding:10px; font-size:0.85rem;">Total</th>
        <th style="padding:10px; font-size:0.85rem;">Tipo</th>
      </tr></thead><tbody>`;

    regs.forEach(r => {
      const total = r.entrada && r.salida ? fmtMinutes(minutesBetween(r.entrada, r.salida)) : (r.entrada ? 'En curso' : '—');
      
      // Determinar el tipo real (usando el campo 'tipo' si existe, si no, 'esExtra')
      let tipo;
      const tipoReal = r.tipo || (r.esExtra ? 'extra' : 'normal');
      switch (tipoReal) {
        case 'rlpt':
          tipo = '<span style="color:#4f46e5; font-weight:bold;">RLPT</span>';
          break;
        case 'negociacion':
          tipo = '<span style="color:#8b5cf6; font-weight:bold;">Negociación</span>';
          break;
        case 'extra':
          tipo = '<span style="color:#f59e0b; font-weight:bold;">Extra</span>';
          break;
        default:
          tipo = '<span style="color:#10b981;">Normal</span>';
      }
      const modificado = r.modificado ? '<span style="color:#dc2626; font-size:0.75rem;" title="' + (r.causaModificacion || '') + '">✏️ Modificado</span>' : '';
      
      html += `<tr style="border-bottom:1px solid #eee;">
        <td style="padding:8px; font-size:0.85rem;">${fmtDate(r.fecha)} ${modificado}</td>
        <td style="padding:8px; font-size:0.85rem;">${r.empleado.nombre}</td>
        <td style="padding:8px; font-size:0.85rem;">${r.entrada || '—'}</td>
        <td style="padding:8px; font-size:0.85rem;">${r.salida || '—'}</td>
        <td style="padding:8px; font-size:0.85rem;"><strong>${total}</strong></td>
        <td style="padding:8px; font-size:0.85rem;">${tipo}</td>
      </tr>`;
    });

    html += `</tbody></table>`;
    $('#tabla-registros').innerHTML = html;
  };

  $('#f-desde').addEventListener('change', renderTabla);
  $('#f-hasta').addEventListener('change', renderTabla);
  $('#f-empleado').addEventListener('change', renderTabla);

  // PDF
  $('#btn-descargar-pdf').addEventListener('click', () => {
    // (Se puede implementar después con jsPDF)
    toast('Función de PDF próximamente', 'success');
  });

  renderTabla();
};
