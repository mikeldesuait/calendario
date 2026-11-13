import { DB } from '../../storage/storage.js';
import { $, toast, fmtMinutes } from '../../utils/helpers.js';
import { Modal } from '../../utils/modal.js';
const DIAS = ['L','M','X','J','V','S','D'];
const min = (h) => { if (!h) return 0; const [a,b] = h.split(':').map(Number); return a*60+b; };
const calcDia = (d) => { if (!d || d.tipo === 'descanso') return 0; if (d.tipo === 'continuo') return Math.max(0, min(d.horaFin) - min(d.horaInicio)); if (d.tipo === 'partido') return Math.max(0, min(d.horaFin) - min(d.horaInicio)) + Math.max(0, min(d.horaFinP2) - min(d.horaInicioP2)); return 0; };

export const renderTurnos = () => {
  const cont = $('#turnos-content'); const turnos = DB.turnos.all();
  cont.innerHTML = `
    <div class="toolbar">
      <button class="btn accent" id="btn-nuevo-turno">+ Nuevo turno</button>
      <select id="sel-turno-estandar" style="padding: 8px; border-radius: 6px; border: 1px solid #ccc; font-size: 0.85rem; max-width: 300px;">
        <option value="">-- Cargar turno estándar --</option>
        <option value="partida">1. Jornada partida (L-V) 09-14 / 16-19</option>
        <option value="intensiva">2. Jornada intensiva (L-V) 08-15</option>
        <option value="manana">3. Turno mañana (L-V) 06-14</option>
        <option value="tarde">4. Turno tarde (L-V) 14-22</option>
        <option value="noche">5. Turno noche (L-V) 22-06</option>
        <option value="rotativo">6. Turno rotativo 3 turnos</option>
        <option value="finde">7. Turno fin de semana (S-D) 08-20</option>
        <option value="comercial">8. Turno comercial (L-S) 10-14 / 17-20</option>
        <option value="industrial">9. Turno industrial (L-V) 07-15</option>
        <option value="reducida">10. Jornada reducida (L-V) 09-14</option>
      </select>
      <div class="spacer"></div>
      <span style="color:var(--muted);font-size:.85rem">${turnos.length} turno(s)</span>
    </div>
    <div id="turno-form-container"></div>
    <div id="turnos-list" class="grid"></div>
  `;
  renderLista(turnos); 
  $('#btn-nuevo-turno').addEventListener('click', () => formTurno(null));
  
  // Cargar turno estándar
  $('#sel-turno-estandar').addEventListener('change', (e) => {
    const tipo = e.target.value;
    if (!tipo) return;
    
    // Estructura de los turnos estándar (con la estructura interna correcta)
    const turnosEstandar = {
      'partida': {
        nombre: 'Jornada partida (L-V)',
        dias: [
          { dia: 1, tipo: 'partido', horaInicio: '09:00', horaFin: '14:00', horaInicioP2: '16:00', horaFinP2: '19:00' },
          { dia: 2, tipo: 'partido', horaInicio: '09:00', horaFin: '14:00', horaInicioP2: '16:00', horaFinP2: '19:00' },
          { dia: 3, tipo: 'partido', horaInicio: '09:00', horaFin: '14:00', horaInicioP2: '16:00', horaFinP2: '19:00' },
          { dia: 4, tipo: 'partido', horaInicio: '09:00', horaFin: '14:00', horaInicioP2: '16:00', horaFinP2: '19:00' },
          { dia: 5, tipo: 'partido', horaInicio: '09:00', horaFin: '14:00', horaInicioP2: '16:00', horaFinP2: '19:00' },
          { dia: 6, tipo: 'descanso' },
          { dia: 7, tipo: 'descanso' }
        ]
      },
      'intensiva': {
        nombre: 'Jornada intensiva (L-V)',
        dias: [
          { dia: 1, tipo: 'continuo', horaInicio: '08:00', horaFin: '15:00' },
          { dia: 2, tipo: 'continuo', horaInicio: '08:00', horaFin: '15:00' },
          { dia: 3, tipo: 'continuo', horaInicio: '08:00', horaFin: '15:00' },
          { dia: 4, tipo: 'continuo', horaInicio: '08:00', horaFin: '15:00' },
          { dia: 5, tipo: 'continuo', horaInicio: '08:00', horaFin: '15:00' },
          { dia: 6, tipo: 'descanso' },
          { dia: 7, tipo: 'descanso' }
        ]
      },
      'manana': {
        nombre: 'Turno de mañana (L-V)',
        dias: [
          { dia: 1, tipo: 'continuo', horaInicio: '06:00', horaFin: '14:00' },
          { dia: 2, tipo: 'continuo', horaInicio: '06:00', horaFin: '14:00' },
          { dia: 3, tipo: 'continuo', horaInicio: '06:00', horaFin: '14:00' },
          { dia: 4, tipo: 'continuo', horaInicio: '06:00', horaFin: '14:00' },
          { dia: 5, tipo: 'continuo', horaInicio: '06:00', horaFin: '14:00' },
          { dia: 6, tipo: 'descanso' },
          { dia: 7, tipo: 'descanso' }
        ]
      },
      'tarde': {
        nombre: 'Turno de tarde (L-V)',
        dias: [
          { dia: 1, tipo: 'continuo', horaInicio: '14:00', horaFin: '22:00' },
          { dia: 2, tipo: 'continuo', horaInicio: '14:00', horaFin: '22:00' },
          { dia: 3, tipo: 'continuo', horaInicio: '14:00', horaFin: '22:00' },
          { dia: 4, tipo: 'continuo', horaInicio: '14:00', horaFin: '22:00' },
          { dia: 5, tipo: 'continuo', horaInicio: '14:00', horaFin: '22:00' },
          { dia: 6, tipo: 'descanso' },
          { dia: 7, tipo: 'descanso' }
        ]
      },
      'noche': {
        nombre: 'Turno de noche (L-V)',
        dias: [
          { dia: 1, tipo: 'continuo', horaInicio: '22:00', horaFin: '06:00' },
          { dia: 2, tipo: 'continuo', horaInicio: '22:00', horaFin: '06:00' },
          { dia: 3, tipo: 'continuo', horaInicio: '22:00', horaFin: '06:00' },
          { dia: 4, tipo: 'continuo', horaInicio: '22:00', horaFin: '06:00' },
          { dia: 5, tipo: 'continuo', horaInicio: '22:00', horaFin: '06:00' },
          { dia: 6, tipo: 'descanso' },
          { dia: 7, tipo: 'descanso' }
        ]
      },
      'rotativo': {
        nombre: 'Turno rotativo 3 turnos',
        dias: [
          { dia: 1, tipo: 'continuo', horaInicio: '06:00', horaFin: '14:00' },
          { dia: 2, tipo: 'continuo', horaInicio: '14:00', horaFin: '22:00' },
          { dia: 3, tipo: 'continuo', horaInicio: '22:00', horaFin: '06:00' },
          { dia: 4, tipo: 'continuo', horaInicio: '06:00', horaFin: '14:00' },
          { dia: 5, tipo: 'continuo', horaInicio: '14:00', horaFin: '22:00' },
          { dia: 6, tipo: 'descanso' },
          { dia: 7, tipo: 'descanso' }
        ]
      },
      'finde': {
        nombre: 'Turno fin de semana (S-D)',
        dias: [
          { dia: 1, tipo: 'descanso' },
          { dia: 2, tipo: 'descanso' },
          { dia: 3, tipo: 'descanso' },
          { dia: 4, tipo: 'descanso' },
          { dia: 5, tipo: 'descanso' },
          { dia: 6, tipo: 'continuo', horaInicio: '08:00', horaFin: '20:00' },
          { dia: 7, tipo: 'continuo', horaInicio: '08:00', horaFin: '20:00' }
        ]
      },
      'comercial': {
        nombre: 'Turno comercial (L-S)',
        dias: [
          { dia: 1, tipo: 'partido', horaInicio: '10:00', horaFin: '14:00', horaInicioP2: '17:00', horaFinP2: '20:00' },
          { dia: 2, tipo: 'partido', horaInicio: '10:00', horaFin: '14:00', horaInicioP2: '17:00', horaFinP2: '20:00' },
          { dia: 3, tipo: 'partido', horaInicio: '10:00', horaFin: '14:00', horaInicioP2: '17:00', horaFinP2: '20:00' },
          { dia: 4, tipo: 'partido', horaInicio: '10:00', horaFin: '14:00', horaInicioP2: '17:00', horaFinP2: '20:00' },
          { dia: 5, tipo: 'partido', horaInicio: '10:00', horaFin: '14:00', horaInicioP2: '17:00', horaFinP2: '20:00' },
          { dia: 6, tipo: 'partido', horaInicio: '10:00', horaFin: '14:00', horaInicioP2: '17:00', horaFinP2: '20:00' },
          { dia: 7, tipo: 'descanso' }
        ]
      },
      'industrial': {
        nombre: 'Turno industrial (L-V)',
        dias: [
          { dia: 1, tipo: 'continuo', horaInicio: '07:00', horaFin: '15:00' },
          { dia: 2, tipo: 'continuo', horaInicio: '07:00', horaFin: '15:00' },
          { dia: 3, tipo: 'continuo', horaInicio: '07:00', horaFin: '15:00' },
          { dia: 4, tipo: 'continuo', horaInicio: '07:00', horaFin: '15:00' },
          { dia: 5, tipo: 'continuo', horaInicio: '07:00', horaFin: '15:00' },
          { dia: 6, tipo: 'descanso' },
          { dia: 7, tipo: 'descanso' }
        ]
      },
      'reducida': {
        nombre: 'Jornada reducida (L-V)',
        dias: [
          { dia: 1, tipo: 'continuo', horaInicio: '09:00', horaFin: '14:00' },
          { dia: 2, tipo: 'continuo', horaInicio: '09:00', horaFin: '14:00' },
          { dia: 3, tipo: 'continuo', horaInicio: '09:00', horaFin: '14:00' },
          { dia: 4, tipo: 'continuo', horaInicio: '09:00', horaFin: '14:00' },
          { dia: 5, tipo: 'continuo', horaInicio: '09:00', horaFin: '14:00' },
          { dia: 6, tipo: 'descanso' },
          { dia: 7, tipo: 'descanso' }
        ]
      }
    };
    
    const datos = turnosEstandar[tipo];
    if (datos) {
      if (turnos.find(t => t.nombre === datos.nombre)) {
        toast('Ese turno ya existe', 'error');
        e.target.value = '';
        return;
      }
      DB.turnos.add(datos);
      toast('Turno "' + datos.nombre + '" cargado', 'success');
      e.target.value = '';
      renderTurnos();
    }
  });
};



const renderLista = (turnos) => {
  const list = $('#turnos-list'); if (!turnos.length) { list.innerHTML = `<div class="card empty" style="grid-column:1/-1">No hay turnos.</div>`; return; }
  list.innerHTML = turnos.map(t => { const sem = (t.dias||[]).reduce((a,d) => a + calcDia(d), 0); const filas = (t.dias||[]).map((d,i) => { let txt = '—'; if (d.tipo === 'continuo') txt = `${d.horaInicio}-${d.horaFin}`; if (d.tipo === 'partido') txt = `${d.horaInicio}-${d.horaFin} / ${d.horaInicioP2}-${d.horaFinP2}`; const color = d.tipo === 'descanso' ? 'var(--muted)' : 'var(--text)'; return `<tr><td style="padding:4px 8px;color:${color};font-size:.8rem">${DIAS[i]}</td><td style="padding:4px 8px;color:${color};font-size:.8rem">${txt}</td></tr>`; }).join(''); return `<div class="card"><h3 style="color:var(--primary);margin-bottom:8px">${t.nombre}</h3><table style="margin-bottom:10px">${filas}</table><p style="font-weight:700;color:var(--success);margin-bottom:12px">${fmtMinutes(sem)} / semana</p><div style="display:flex;gap:8px"><button class="btn ghost" data-edit="${t.id}">Editar</button><button class="btn danger" data-del="${t.id}">Eliminar</button></div></div>`; }).join('');
  list.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => formTurno(DB.turnos.find(b.dataset.edit))));
  list.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
    Modal.confirmar('Confirmación', '¿Eliminar este turno?', 'pregunta').then(ok => {
      if (ok) {
        DB.turnos.remove(b.dataset.del);
        toast('Turno eliminado', 'success');
        renderTurnos();
      }
    });
  }));
};

const formTurno = (t) => {
  const esEdicion = !!(t && t.id);
  const turno = t ? JSON.parse(JSON.stringify(t)) : { nombre: '', dias: Array.from({length:7}, (_,i) => ({ dia: i+1, tipo: 'descanso' })) };
  
  // Crear el modal si no existe
  let modalTurno = document.getElementById('modal-turno');
  if (!modalTurno) {
    modalTurno = document.createElement('div');
    modalTurno.id = 'modal-turno';
    modalTurno.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter: blur(5px); z-index:2000; align-items:center; justify-content:center; overflow-y:auto; padding: 20px;';
    document.body.appendChild(modalTurno);
  }
  
  modalTurno.innerHTML = `
    <div class="card" style="width: 100%; max-width: 900px; margin: auto; padding: 25px; position: relative;">
      <button id="btn-cerrar-modal-turno" style="position: absolute; top: 15px; right: 15px; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #999;">&times;</button>
      
      <h3 style="margin-bottom:16px;color:var(--primary);">${esEdicion ? 'Editar' : 'Nuevo'} turno</h3>
      
      <div class="field">
        <label>Nombre *</label>
        <input id="t-nombre" value="${turno.nombre}" placeholder="Ej: Horario Base">
      </div>
      
      <div style="margin-top:16px">
        <label>Horario por día</label>
        <div id="dias-editor" style="display:grid;gap:10px;margin-top:8px"></div>
      </div>
      
      <p id="t-total" style="margin-top:14px;font-weight:700;color:var(--success)"></p>
      
      <div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end;">
        <button class="btn ghost" id="btn-cancel-turno">Cancelar</button>
        <button class="btn accent" id="btn-guardar-turno">${esEdicion ? 'Actualizar' : 'Guardar'}</button>
      </div>
    </div>
  `;
  
  // Lógica del modal (igual que antes)
  const editor = document.getElementById('dias-editor');
  const estado = { dias: turno.dias };
  
  const pintar = () => {
    editor.innerHTML = estado.dias.map((d, i) => {
      const esPartido = d.tipo === 'partido';
      const esContinuo = d.tipo === 'continuo';
      const esDescanso = d.tipo === 'descanso';
      return `
        <div style="display:grid;grid-template-columns:100px 130px 1fr;gap:10px;align-items:center;background:#f8fafc;padding:10px;border-radius:8px">
          <strong style="color:var(--primary)">${DIAS[i]}</strong>
          <select data-dia="${i}" class="sel-tipo" style="padding:6px; border-radius: 4px; border: 1px solid #ccc;">
            <option value="descanso" ${esDescanso?'selected':''}>Descanso</option>
            <option value="continuo" ${esContinuo?'selected':''}>Continuo</option>
            <option value="partido"  ${esPartido?'selected':''}>Partido</option>
          </select>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${esDescanso ? '<em style="color:#888;font-size:.8rem">— sin horas —</em>' : ''}
            ${esContinuo ? `
              <input type="time" data-dia="${i}" data-campo="horaInicio" value="${d.horaInicio||''}" style="width:110px; padding: 6px; border-radius: 4px; border: 1px solid #ccc;">
              <span style="align-self:center">→</span>
              <input type="time" data-dia="${i}" data-campo="horaFin" value="${d.horaFin||''}" style="width:110px; padding: 6px; border-radius: 4px; border: 1px solid #ccc;">
            ` : ''}
            ${esPartido ? `
              <input type="time" data-dia="${i}" data-campo="horaInicio" value="${d.horaInicio||''}" style="width:110px; padding: 6px; border-radius: 4px; border: 1px solid #ccc;">
              <span style="align-self:center">→</span>
              <input type="time" data-dia="${i}" data-campo="horaFin" value="${d.horaFin||''}" style="width:110px; padding: 6px; border-radius: 4px; border: 1px solid #ccc;">
              <span style="align-self:center">|</span>
              <input type="time" data-dia="${i}" data-campo="horaInicioP2" value="${d.horaInicioP2||''}" style="width:110px; padding: 6px; border-radius: 4px; border: 1px solid #ccc;">
              <span style="align-self:center">→</span>
              <input type="time" data-dia="${i}" data-campo="horaFinP2" value="${d.horaFinP2||''}" style="width:110px; padding: 6px; border-radius: 4px; border: 1px solid #ccc;">
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    editor.querySelectorAll('.sel-tipo').forEach(sel => sel.addEventListener('change', () => {
      estado.dias[+sel.dataset.dia].tipo = sel.value;
      pintar();
      actualizarTotal();
    }));
    
    editor.querySelectorAll('input[type=time]').forEach(inp => inp.addEventListener('input', () => {
      estado.dias[+inp.dataset.dia][inp.dataset.campo] = inp.value;
      actualizarTotal();
    }));
  };
  
  const actualizarTotal = () => {
    const total = estado.dias.reduce((a,d) => a + calcDia(d), 0);
    document.getElementById('t-total').textContent = 'Total semanal: ' + fmtMinutes(total);
  };
  
  pintar();
  actualizarTotal();
  
  document.getElementById('btn-cerrar-modal-turno').onclick = () => { modalTurno.style.display = 'none'; };
  document.getElementById('btn-cancel-turno').onclick = () => { modalTurno.style.display = 'none'; };
  
  document.getElementById('btn-guardar-turno').onclick = () => {
    const nombre = document.getElementById('t-nombre').value.trim();
    if (!nombre) { toast('El nombre es obligatorio', 'error'); return; }
    
    const nuevo = { id: turno.id, nombre, dias: estado.dias };
    
    if (esEdicion) { DB.turnos.update(nuevo); toast('Turno actualizado', 'success'); }
    else { DB.turnos.add(nuevo); toast('Turno creado', 'success'); }
    
    modalTurno.style.display = 'none';
    renderTurnos();
  };
  
  modalTurno.style.display = 'flex';
};
