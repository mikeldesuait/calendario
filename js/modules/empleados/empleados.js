import { DB } from '../../storage/storage.js';
import { $, toast } from '../../utils/helpers.js';
import { Modal } from '../../utils/modal.js';

export const renderEmpleados = () => {
  const cont = $('#empleados-content'); 
  const empleados = DB.empleados.all(); 
  const turnos = DB.turnos.all();
  
  cont.innerHTML = `
    <div class="toolbar">
      <button class="btn accent" id="btn-nuevo-emp">+ Nuevo empleado</button>
      <div class="spacer"></div>
      <span style="color:var(--muted);font-size:.85rem">${empleados.length} empleado(s)</span>
    </div>
    <div id="emp-form-container"></div>
    <div id="emp-list"></div>
    
    <!-- MODALES (Vacaciones y RLPT se mantienen igual) -->
    <div id="modal-vacaciones" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; align-items:center; justify-content:center;">
      <div class="card" style="width:700px; max-height: 85vh; display: flex; flex-direction: column; padding:20px;">
        <h3 style="margin-bottom:10px; color:var(--primary);">🌴 Vacaciones Anuales</h3>
        <div style="flex: 1; overflow-y: auto; padding-right: 5px;"><div id="mini-calendario-vac"></div></div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top: 15px; flex-shrink: 0;">
          <button class="btn ghost" id="btn-vac-cancelar">Cancelar</button>
          <button class="btn accent" id="btn-vac-guardar">Guardar</button>
        </div>
      </div>
    </div>

    <div id="modal-guardias" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; align-items:center; justify-content:center;">
      <div class="card" style="width:700px; max-height: 85vh; display: flex; flex-direction: column; padding:20px;">
        <h3 style="margin-bottom:10px; color:var(--primary);">🛡️ Programar Guardias</h3>
        <p style="color:var(--muted); font-size:0.85rem; margin-bottom:15px; flex-shrink: 0;">Haz clic en un día para seleccionar la semana completa (Lunes a Domingo).</p>
        <div style="flex: 1; overflow-y: auto; padding-right: 5px;"><div id="mini-calendario-gua"></div></div>
        <div style="margin-top: 15px; flex-shrink: 0; background: #f8fafc; padding: 10px; border-radius: 6px;">
           <div style="display:flex; gap:10px; align-items:center;">
             <select id="g-tipo" style="padding:6px; border-radius:4px; border:1px solid #ccc; flex:1;">
               <option value="7x12">Guardia 7x12</option>
               <option value="7x24">Guardia 7x24</option>
             </select>
             <button class="btn danger" id="btn-limpiar-guardias" style="padding:6px 12px; font-size:0.85rem;">Limpiar</button>
           </div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top: 15px; flex-shrink: 0;">
          <button class="btn ghost" id="btn-gua-cancelar">Cancelar</button>
          <button class="btn accent" id="btn-gua-guardar">Guardar</button>
        </div>
      </div>
    </div>

    <div id="modal-rlpt" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000; align-items:center; justify-content:center;">
      <div class="card" style="width:850px; max-height: 90vh; display: flex; flex-direction: column; padding:20px;">
        <h3 style="margin-bottom:15px; color:var(--primary);">⚖️ RLPT / Sindical</h3>
        
        <div style="margin-bottom: 15px; background: #e0e7ff; padding: 10px; border-radius: 6px; display: flex; align-items: center; gap: 10px;">
          <label style="margin:0; font-weight: bold; color: #3730a3;">Crédito de horas mensual:</label>
          <input type="number" id="rlpt-credito" value="20" style="width: 80px; padding: 5px; border-radius: 4px; border: 1px solid #818cf8;" min="0">
          <span style="color: #3730a3; font-size: 0.85rem;">horas/mes</span>
        </div>

        <div style="display:flex; border-bottom: 1px solid #ddd; margin-bottom: 15px;">
          <button class="tab-btn active" data-tab="fijo" style="background:none; border:none; padding:10px 15px; font-weight:bold; color:var(--primary); border-bottom: 2px solid var(--primary); cursor:pointer;">Fijo semanal</button>
          <button class="tab-btn" data-tab="puntual" style="background:none; border:none; padding:10px 15px; font-weight:normal; color:#777; cursor:pointer;">Citas Puntuales</button>
          <button class="tab-btn" data-tab="nodisfrutadas" style="background:none; border:none; padding:10px 15px; font-weight:normal; color:#777; cursor:pointer;">No Disfrutadas</button>
        </div>

        <div id="vista-fijo" class="vista-tab" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
          <div style="overflow-y: auto; flex: 1;"><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background: #f8fafc; text-align: left;"><th style="padding: 8px; font-size: 0.8rem;">Día</th><th style="padding: 8px; font-size: 0.8rem;">Inicio</th><th style="padding: 8px; font-size: 0.8rem;">Fin</th><th style="padding: 8px; font-size: 0.8rem;">Descripción</th><th style="padding: 8px;"></th></tr></thead><tbody id="tbody-rlpt-fijo"></tbody></table></div>
          <div style="margin-top: 10px;"><button class="btn ghost" id="btn-add-rlpt-fijo" style="font-size:0.8rem; padding:6px 12px;">+ Añadir fijo</button></div>
        </div>

        <div id="vista-puntual" class="vista-tab" style="flex: 1; display: none; flex-direction: column; overflow: hidden;">
          <div style="overflow-y: auto; flex: 1;"><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background: #f8fafc; text-align: left;"><th style="padding: 8px; font-size: 0.8rem;">Fecha</th><th style="padding: 8px; font-size: 0.8rem;">Inicio</th><th style="padding: 8px; font-size: 0.8rem;">Fin</th><th style="padding: 8px; font-size: 0.8rem;">Descripción</th><th style="padding: 8px; font-size: 0.8rem;">Cargo Emp.</th><th style="padding: 8px;"></th></tr></thead><tbody id="tbody-rlpt-puntual"></tbody></table></div>
          <div style="margin-top: 10px;"><button class="btn ghost" id="btn-add-rlpt-puntual" style="font-size:0.8rem; padding:6px 12px;">+ Añadir puntual</button></div>
        </div>

        <div id="vista-nodisfrutadas" class="vista-tab" style="flex: 1; display: none; flex-direction: column; overflow: hidden;">
          <div style="overflow-y: auto; flex: 1;"><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background: #f8fafc; text-align: left;"><th style="padding: 8px; font-size: 0.8rem;">Fecha</th><th style="padding: 8px; font-size: 0.8rem;">Horas</th><th style="padding: 8px; font-size: 0.8rem;">Motivo</th><th style="padding: 8px;"></th></tr></thead><tbody id="tbody-rlpt-nodisfrutadas"></tbody></table></div>
          <div style="margin-top: 10px;"><button class="btn ghost" id="btn-add-rlpt-nodisfrutadas" style="font-size:0.8rem; padding:6px 12px;">+ Añadir incomparecencia</button></div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top: 15px; flex-shrink: 0;">
          <button class="btn ghost" id="btn-rlpt-cancelar">Cancelar</button>
          <button class="btn accent" id="btn-rlpt-guardar">Guardar RLPT</button>
        </div>
      </div>
    </div>
  `;

  const list = $('#emp-list');
  if (!empleados.length) { list.innerHTML = '<div class="card empty">Sin empleados.</div>'; } 
  else {
    list.innerHTML = `<table><thead><tr><th>ID</th><th>Nombre</th><th>DNI</th><th>Puesto</th><th>Turno</th><th>Municipio</th><th>Acciones</th></tr></thead><tbody>
        ${empleados.map(e => {
          const t = turnos.find(x => x.id === e.turnoId);
          return `<tr>
            <td><strong>${e.codigo || '—'}</strong></td>
            <td>${e.nombre}</td>
            <td>${e.dni || '—'}</td>
            <td>${e.puesto || '—'}</td>
            <td>${t ? t.nombre : '<span style="color:var(--muted)">Sin asignar</span>'}</td>
            <td>${e.municipio || '—'}</td>
            <td>
              <button class="btn ghost" data-edit="${e.id}" style="padding:5px 10px">Editar</button> 
              <button class="btn ghost" data-vac="${e.id}" style="padding:5px 10px; color:#16a34a; border-color:#16a34a;">🌴 Vacaciones</button>
              <button class="btn ghost" data-gua="${e.id}" style="padding:5px 10px; color:#dc2626; border-color:#dc2626;">🛡️ Guardias</button>
              <button class="btn ghost" data-rlpt="${e.id}" style="padding:5px 10px; color:#4f46e5; border-color:#4f46e5;">⚖️ RLPT</button>
              <button class="btn danger" data-del="${e.id}" style="padding:5px 10px">Borrar</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody></table>`;
  }

  $('#btn-nuevo-emp').addEventListener('click', () => formEmpleado());
  list.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => formEmpleado(DB.empleados.find(b.dataset.edit))));
  list.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => {
    Modal.confirmar('Confirmación', '¿Eliminar este empleado?', 'pregunta').then(ok => {
      if (ok) {
        DB.empleados.remove(b.dataset.del);
        toast('Empleado eliminado', 'success');
        renderEmpleados();
      }
    });
  }));

  // --- VACACIONES (SIN CAMBIOS) ---
  let empVacId = null, vacArray = [];
  const renderMiniCalendario = (containerId, seleccionados, onToggle, colorSeleccion) => {
    const cal = $('#' + containerId); const anio = new Date().getFullYear();
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    let htmlCal = `<h2 style="text-align: center; color: var(--primary); margin-bottom: 15px; font-size: 1.5rem;">${anio}</h2><div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">`;
    meses.forEach((mes, indexMes) => {
      const offset = (new Date(anio, indexMes, 1).getDay() === 0 ? 6 : new Date(anio, indexMes, 1).getDay() - 1);
      const diasMes = new Date(anio, indexMes + 1, 0).getDate();
      let mesHtml = `<div style="background: #f8fafc; border-radius: 6px; padding: 8px; border: 1px solid #eee;"><div style="text-align: center; font-weight: bold; color: var(--primary); margin-bottom: 6px; font-size: 0.85rem;">${mes}</div><div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align: center; font-size: 0.6rem; color: #888; margin-bottom: 4px;">${['L','M','X','J','V','S','D'].map(d => `<div>${d}</div>`).join('')}</div><div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;">`;
      for(let i = 0; i < offset; i++) { mesHtml += `<div></div>`; }
      for(let d = 1; d <= diasMes; d++) {
        const fechaStr = `${anio}-${String(indexMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const seleccionado = seleccionados.some(s => s.fecha === fechaStr || s === fechaStr);
        mesHtml += `<div class="dia-click" data-fecha="${fechaStr}" style="padding: 3px 0; border-radius: 4px; cursor: pointer; background: ${seleccionado ? colorSeleccion : 'white'}; color: ${seleccionado ? 'white' : '#333'}; border: 1px solid ${seleccionado ? colorSeleccion : 'transparent'}; user-select: none; font-weight: ${seleccionado ? 'bold' : 'normal'};">${d}</div>`;
      }
      mesHtml += `</div></div>`; htmlCal += mesHtml;
    });
    cal.innerHTML = htmlCal + `</div>`;
    cal.querySelectorAll('.dia-click').forEach(dia => dia.addEventListener('click', () => onToggle(dia)));
  };

  list.querySelectorAll('[data-vac]').forEach(b => { b.addEventListener('click', () => { empVacId = b.dataset.vac; const emp = DB.empleados.find(empVacId); vacArray = (emp.vacaciones || []).map(f => ({ fecha: f })); renderMiniCalendario('mini-calendario-vac', vacArray, (dia) => { const fecha = dia.dataset.fecha; const idx = vacArray.findIndex(v => v.fecha === fecha); if (idx >= 0) { vacArray.splice(idx, 1); dia.style.background = 'white'; dia.style.color = '#333'; dia.style.border = '1px solid transparent'; dia.style.fontWeight = 'normal'; } else { vacArray.push({ fecha }); dia.style.background = '#22c55e'; dia.style.color = 'white'; dia.style.border = '1px solid #16a34a'; dia.style.fontWeight = 'bold'; } }, '#22c55e'); $('#modal-vacaciones').style.display = 'flex'; }); });
  $('#btn-vac-cancelar').addEventListener('click', () => { $('#modal-vacaciones').style.display = 'none'; });
  $('#btn-vac-guardar').addEventListener('click', () => { const emp = DB.empleados.find(empVacId); emp.vacaciones = vacArray.map(v => v.fecha); DB.empleados.update(emp); $('#modal-vacaciones').style.display = 'none'; toast('Vacaciones guardadas', 'success'); renderEmpleados(); });

  // --- GUARDIAS (LÓGICA DE SEMANA COMPLETA) ---
  let empGuaId = null, guaArray = [];
  
  const renderCalGuardias = () => {
    const cal = $('#mini-calendario-gua'); const anio = new Date().getFullYear();
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    let htmlCal = `<h2 style="text-align: center; color: var(--primary); margin-bottom: 15px; font-size: 1.5rem;">${anio}</h2><div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">`;
    
    meses.forEach((mes, indexMes) => {
      const offset = (new Date(anio, indexMes, 1).getDay() === 0 ? 6 : new Date(anio, indexMes, 1).getDay() - 1);
      const diasMes = new Date(anio, indexMes + 1, 0).getDate();
      let mesHtml = `<div style="background: #f8fafc; border-radius: 6px; padding: 8px; border: 1px solid #eee;"><div style="text-align: center; font-weight: bold; color: var(--primary); margin-bottom: 6px; font-size: 0.85rem;">${mes}</div><div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align: center; font-size: 0.6rem; color: #888; margin-bottom: 4px;">${['L','M','X','J','V','S','D'].map(d => `<div>${d}</div>`).join('')}</div><div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;">`;
      for(let i = 0; i < offset; i++) { mesHtml += `<div></div>`; }
      for(let d = 1; d <= diasMes; d++) {
        const fechaStr = `${anio}-${String(indexMes+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const guardia = guaArray.find(g => g.fecha === fechaStr);
        let bg = 'white', color = '#333', border = '1px solid transparent', fw = 'normal';
        if (guardia) { bg = guardia.tipo === '7x24' ? '#ef4444' : '#f59e0b'; color = 'white'; border = `1px solid ${guardia.tipo === '7x24' ? '#dc2626' : '#d97706'}`; fw = 'bold'; }
        mesHtml += `<div class="dia-gua" data-fecha="${fechaStr}" style="padding: 3px 0; border-radius: 4px; cursor: pointer; background: ${bg}; color: ${color}; border: ${border}; user-select: none; font-weight: ${fw};">${d}</div>`;
      }
      mesHtml += `</div></div>`; htmlCal += mesHtml;
    });
    cal.innerHTML = htmlCal + `</div>`;
    
    // Al hacer clic en un día, se marca la semana completa
    cal.querySelectorAll('.dia-gua').forEach(dia => {
      dia.addEventListener('click', () => {
        const fechaStr = dia.dataset.fecha;
        const fecha = new Date(fechaStr + 'T00:00:00');
        const diaSemana = fecha.getDay(); // 0=Dom, 1=Lun...
        
        // Calcular lunes de esa semana
        const lunes = new Date(fecha);
        if (diaSemana === 0) {
          lunes.setDate(fecha.getDate() - 6); // Si es domingo, el lunes es -6
        } else {
          lunes.setDate(fecha.getDate() - (diaSemana - 1));
        }
        
        // Obtener el tipo de guardia seleccionado
        const tipo = $('#g-tipo').value;
        
        // Recorrer de lunes a domingo
        for (let i = 0; i < 7; i++) {
          const diaActual = new Date(lunes);
          diaActual.setDate(lunes.getDate() + i);
          const fStr = `${diaActual.getFullYear()}-${String(diaActual.getMonth() + 1).padStart(2, '0')}-${String(diaActual.getDate()).padStart(2, '0')}`;
          
          const idx = guaArray.findIndex(g => g.fecha === fStr);
          if (idx >= 0) guaArray[idx].tipo = tipo; else guaArray.push({ fecha: fStr, tipo: tipo });
        }
        
        renderCalGuardias();
      });
    });
  };

  list.querySelectorAll('[data-gua]').forEach(b => { b.addEventListener('click', () => { empGuaId = b.dataset.gua; const emp = DB.empleados.find(empGuaId); guaArray = emp.guardias ? JSON.parse(JSON.stringify(emp.guardias)) : []; $('#g-tipo').value = '7x12'; renderCalGuardias(); $('#modal-guardias').style.display = 'flex'; }); });
  $('#btn-limpiar-guardias').addEventListener('click', () => {
    Modal.confirmar('Confirmación', '¿Quitar todas las guardias de este empleado?', 'pregunta').then(ok => {
      if (ok) {
        guaArray = [];
        renderCalGuardias();
      }
    });
  });
  $('#btn-gua-cancelar').addEventListener('click', () => { $('#modal-guardias').style.display = 'none'; });
  $('#btn-gua-guardar').addEventListener('click', () => { const emp = DB.empleados.find(empGuaId); emp.guardias = guaArray; DB.empleados.update(emp); $('#modal-guardias').style.display = 'none'; toast('Guardias guardadas', 'success'); renderEmpleados(); });

  // --- LÓGICA RLPT (SIN CAMBIOS) ---
  let empRlptId = null, rlptFijoArray = [], rlptPuntualArray = [], rlptNoDisfrutadasArray = [];
  document.querySelectorAll('.tab-btn').forEach(btn => { btn.addEventListener('click', () => { document.querySelectorAll('.tab-btn').forEach(b => { b.style.borderBottom = 'none'; b.style.color = '#777'; b.style.fontWeight = 'normal'; }); btn.style.borderBottom = '2px solid var(--primary)'; btn.style.color = 'var(--primary)'; btn.style.fontWeight = 'bold'; document.querySelectorAll('.vista-tab').forEach(v => v.style.display = 'none'); $('#vista-' + btn.dataset.tab).style.display = 'flex'; }); });
  
  const renderTablaFijo = () => { const tbody = $('#tbody-rlpt-fijo'); const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']; if (rlptFijoArray.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:10px; color:#999; font-size:0.85rem;">No hay datos.</td></tr>`; return; } tbody.innerHTML = rlptFijoArray.map((r, i) => `<tr><td style="padding: 5px;"><select data-idx="${i}" data-campo="dia" style="width:100%; padding:4px; font-size:0.8rem; border:1px solid #ccc; border-radius:4px;">${diasSemana.map((d, idx) => `<option value="${idx}" ${r.dia == idx ? 'selected' : ''}>${d}</option>`).join('')}</select></td><td style="padding: 5px;"><input type="time" value="${r.horaInicio}" data-idx="${i}" data-campo="horaInicio" style="width:100%; padding:4px; font-size:0.8rem; border:1px solid #ccc; border-radius:4px;"></td><td style="padding: 5px;"><input type="time" value="${r.horaFin}" data-idx="${i}" data-campo="horaFin" style="width:100%; padding:4px; font-size:0.8rem; border:1px solid #ccc; border-radius:4px;"></td><td style="padding: 5px;"><input type="text" value="${r.desc || ''}" placeholder="Ej: Reunión" data-idx="${i}" data-campo="desc" style="width:100%; padding:4px; font-size:0.8rem; border:1px solid #ccc; border-radius:4px;"></td><td style="padding: 5px; text-align:center;"><button class="btn danger btn-del-fijo" data-idx="${i}" style="padding:2px 8px; font-size:0.8rem;">✕</button></td></tr>`).join(''); tbody.querySelectorAll('input, select').forEach(inp => { inp.addEventListener('change', (e) => { rlptFijoArray[Number(e.target.dataset.idx)][e.target.dataset.campo] = e.target.value; }); }); tbody.querySelectorAll('.btn-del-fijo').forEach(b => { b.addEventListener('click', () => { rlptFijoArray.splice(Number(b.dataset.idx), 1); renderTablaFijo(); }); }); };
  
  const renderTablaPuntual = () => { const tbody = $('#tbody-rlpt-puntual'); if (rlptPuntualArray.length === 0) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:10px; color:#999; font-size:0.85rem;">No hay datos.</td></tr>`; return; } tbody.innerHTML = rlptPuntualArray.map((r, i) => `<tr><td style="padding: 5px;"><input type="date" value="${r.fecha}" data-idx="${i}" data-campo="fecha" style="width:100%; padding:4px; font-size:0.8rem; border:1px solid #ccc; border-radius:4px;"></td><td style="padding: 5px;"><input type="time" value="${r.horaInicio}" data-idx="${i}" data-campo="horaInicio" style="width:100%; padding:4px; font-size:0.8rem; border:1px solid #ccc; border-radius:4px;"></td><td style="padding: 5px;"><input type="time" value="${r.horaFin}" data-idx="${i}" data-campo="horaFin" style="width:100%; padding:4px; font-size:0.8rem; border:1px solid #ccc; border-radius:4px;"></td><td style="padding: 5px;"><input type="text" value="${r.desc || ''}" placeholder="Ej: Negociación" data-idx="${i}" data-campo="desc" style="width:100%; padding:4px; font-size:0.8rem; border:1px solid #ccc; border-radius:4px;"></td><td style="padding: 5px; text-align:center;"><input type="checkbox" ${r.cargoEmpresa ? 'checked' : ''} data-idx="${i}" data-campo="cargoEmpresa" style="width:18px; height:18px; cursor:pointer;"></td><td style="padding: 5px; text-align:center;"><button class="btn danger btn-del-puntual" data-idx="${i}" style="padding:2px 8px; font-size:0.8rem;">✕</button></td></tr>`).join(''); tbody.querySelectorAll('input').forEach(inp => { inp.addEventListener('change', (e) => { const idx = Number(e.target.dataset.idx); const campo = e.target.dataset.campo; rlptPuntualArray[idx][campo] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; }); }); tbody.querySelectorAll('.btn-del-puntual').forEach(b => { b.addEventListener('click', () => { rlptPuntualArray.splice(Number(b.dataset.idx), 1); renderTablaPuntual(); }); }); };

  const renderTablaNoDisfrutadas = () => { const tbody = $('#tbody-rlpt-nodisfrutadas'); if (rlptNoDisfrutadasArray.length === 0) { tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:10px; color:#999; font-size:0.85rem;">No hay datos.</td></tr>`; return; } tbody.innerHTML = rlptNoDisfrutadasArray.map((r, i) => `<tr><td style="padding: 5px;"><input type="date" value="${r.fecha}" data-idx="${i}" data-campo="fecha" style="width:100%; padding:4px; font-size:0.8rem; border:1px solid #ccc; border-radius:4px;"></td><td style="padding: 5px;"><input type="number" step="0.5" value="${r.horas}" data-idx="${i}" data-campo="horas" style="width:100%; padding:4px; font-size:0.8rem; border:1px solid #ccc; border-radius:4px;"></td><td style="padding: 5px;"><select data-idx="${i}" data-campo="motivo" style="width:100%; padding:4px; font-size:0.8rem; border:1px solid #ccc; border-radius:4px;"><option value="Vacaciones" ${r.motivo == 'Vacaciones' ? 'selected' : ''}>Vacaciones</option><option value="Baja médica" ${r.motivo == 'Baja médica' ? 'selected' : ''}>Baja médica</option><option value="No acudió" ${r.motivo == 'No acudió' ? 'selected' : ''}>No acudió</option><option value="Otros" ${r.motivo == 'Otros' ? 'selected' : ''}>Otros</option></select></td><td style="padding: 5px; text-align:center;"><button class="btn danger btn-del-nodisfrutada" data-idx="${i}" style="padding:2px 8px; font-size:0.8rem;">✕</button></td></tr>`).join(''); tbody.querySelectorAll('input, select').forEach(inp => { inp.addEventListener('change', (e) => { rlptNoDisfrutadasArray[Number(e.target.dataset.idx)][e.target.dataset.campo] = e.target.value; }); }); tbody.querySelectorAll('.btn-del-nodisfrutada').forEach(b => { b.addEventListener('click', () => { rlptNoDisfrutadasArray.splice(Number(b.dataset.idx), 1); renderTablaNoDisfrutadas(); }); }); };

  list.querySelectorAll('[data-rlpt]').forEach(b => { b.addEventListener('click', () => { empRlptId = b.dataset.rlpt; const emp = DB.empleados.find(empRlptId); rlptFijoArray = emp.rlptFijo ? JSON.parse(JSON.stringify(emp.rlptFijo)) : []; rlptPuntualArray = emp.rlptPuntual ? JSON.parse(JSON.stringify(emp.rlptPuntual)) : []; rlptNoDisfrutadasArray = emp.rlptNoDisfrutadas ? JSON.parse(JSON.stringify(emp.rlptNoDisfrutadas)) : []; $('#rlpt-credito').value = emp.rlptCredito !== undefined ? emp.rlptCredito : 20; renderTablaFijo(); renderTablaPuntual(); renderTablaNoDisfrutadas(); document.querySelector('.tab-btn[data-tab="fijo"]').click(); $('#modal-rlpt').style.display = 'flex'; }); });

  $('#btn-add-rlpt-fijo').addEventListener('click', () => { rlptFijoArray.push({ dia: 2, horaInicio: '12:00', horaFin: '14:00', desc: '' }); renderTablaFijo(); });
  $('#btn-add-rlpt-puntual').addEventListener('click', () => { const hoy = new Date().toISOString().slice(0, 10); rlptPuntualArray.push({ fecha: hoy, horaInicio: '09:00', horaFin: '10:00', desc: '', cargoEmpresa: false }); renderTablaPuntual(); });
  $('#btn-add-rlpt-nodisfrutadas').addEventListener('click', () => { const hoy = new Date().toISOString().slice(0, 10); rlptNoDisfrutadasArray.push({ fecha: hoy, horas: 2, motivo: 'No acudió' }); renderTablaNoDisfrutadas(); });

  $('#btn-rlpt-cancelar').addEventListener('click', () => { $('#modal-rlpt').style.display = 'none'; });
  $('#btn-rlpt-guardar').addEventListener('click', () => { const emp = DB.empleados.find(empRlptId); emp.rlptFijo = rlptFijoArray; emp.rlptPuntual = rlptPuntualArray; emp.rlptNoDisfrutadas = rlptNoDisfrutadasArray; emp.rlptCredito = Number($('#rlpt-credito').value) || 20; DB.empleados.update(emp); $('#modal-rlpt').style.display = 'none'; toast('RLPT guardado', 'success'); renderEmpleados(); });

  // --- FORMULARIO EMPLEADO ---
  const formEmpleado = (emp) => {
    const contForm = $('#emp-form-container'); 
    const e = emp || { nombre: '', dni: '', puesto: '', turnoId: '', municipio: '', ine: '', codigo: '', password: '' };
    const opts = turnos.map(t => `<option value="${t.id}" ${e.turnoId === t.id ? 'selected' : ''}>${t.nombre}</option>`).join('');
    
    let codigoSugerido = e.codigo;
    if (!codigoSugerido) {
      const maxId = DB.empleados.all().reduce((max, x) => {
        const num = parseInt((x.codigo || 'EMP-000').split('-')[1]);
        return num > max ? num : max;
      }, 0);
      codigoSugerido = `EMP-${String(maxId + 1).padStart(3, '0')}`;
    }

    contForm.innerHTML = `
      <div class="card">
        <h3 style="margin-bottom:16px;color:var(--primary)">${emp ? 'Editar' : 'Nuevo'} empleado</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          
          <div class="field" style="background:#eff6ff; padding:10px; border-radius:6px; border:1px dashed #3b82f6;">
            <label style="color:#1e3a8a;">ID de Empleado (Acceso)</label>
            <input id="e-codigo" value="${codigoSugerido}" placeholder="EMP-001" style="border-color:#93c5fd; font-weight:bold;">
          </div>
          <div class="field" style="background:#eff6ff; padding:10px; border-radius:6px; border:1px dashed #3b82f6;">
            <label style="color:#1e3a8a;">Contraseña</label>
            <input id="e-password" type="password" value="${e.password || ''}" placeholder="Contraseña segura" style="border-color:#93c5fd;">
          </div>

          <div class="field"><label>Nombre *</label><input id="e-nombre" value="${e.nombre}"></div>
          <div class="field"><label>DNI</label><input id="e-dni" value="${e.dni}"></div>
          <div class="field"><label>Puesto</label><input id="e-puesto" value="${e.puesto}"></div>
          <div class="field"><label>Turno por defecto</label><select id="e-turno"><option value="">— Sin asignar —</option>${opts}</select></div>
          
          <div class="field" style="background:#f0fdf4; padding:10px; border-radius:6px; border:1px dashed #22c55e;">
            <label style="color:#166534;">Municipio (Festivos Locales)</label>
            <input id="e-municipio" value="${e.municipio || ''}" placeholder="Ej: Orihuela Costa" style="border-color:#86efac;">
          </div>
          <div class="field" style="background:#eff6ff; padding:10px; border-radius:6px; border:1px dashed #3b82f6;">
            <label style="display: flex; align-items: center; gap: 8px; color: #1e3a8a; cursor: pointer; margin-bottom: 8px;">
              <input type="checkbox" id="e-representante" ${e.esRepresentante ? 'checked' : ''} style="width: auto;">
              Es representante sindical (puede fichar RLPT)
            </label>
            <label style="color:#1e3a8a; font-size: 0.8rem;">Crédito horario mensual (horas RLPT)</label>
            <input type="number" id="e-credito-rlpt" value="${e.rlptCredito || 15}" placeholder="Ej: 15" style="border-color:#93c5fd;">
          </div>
          <div class="field" style="background:#f0fdf4; padding:10px; border-radius:6px; border:1px dashed #22c55e;">
            <label style="color:#166534;">Código INE (Opcional)</label>
            <input id="e-ine" value="${e.ine || ''}" placeholder="Ej: 03991" style="border-color:#86efac;">
          </div>
        </div>
        <div style="display:flex;gap:10px;margin-top:16px">
          <button class="btn accent" id="btn-guardar-emp">${emp ? 'Actualizar' : 'Guardar'}</button>
          <button class="btn ghost" id="btn-cancel-emp">Cancelar</button>
        </div>
      </div>`;
      
    $('#btn-cancel-emp').addEventListener('click', () => contForm.innerHTML = '');
    $('#btn-guardar-emp').addEventListener('click', () => {
      const nombre = $('#e-nombre').value.trim(); 
      if (!nombre) { toast('Nombre obligatorio', 'error'); return; }
      
      const nuevo = { 
        id: e.id, 
        codigo: $('#e-codigo').value.trim(),
        password: $('#e-password').value.trim(),
        nombre, 
        dni: $('#e-dni').value.trim(), 
        puesto: $('#e-puesto').value.trim(), 
        turnoId: $('#e-turno').value,
        municipio: $('#e-municipio').value.trim(),
        ine: $('#e-ine').value.trim(),
        esRepresentante: $('#e-representante')?.checked || false,
        rlptCredito: Number($('#e-credito-rlpt')?.value) || 15,
        vacaciones: e.vacaciones || [],
        guardias: e.guardias || [],
        rlptFijo: e.rlptFijo || [],
        rlptPuntual: e.rlptPuntual || [],
        rlptNoDisfrutadas: e.rlptNoDisfrutadas || [],
        fichajes: e.fichajes || {}
      };
      
      if (emp) { DB.empleados.update(nuevo); toast('Actualizado', 'success'); } 
      else { DB.empleados.add(nuevo); toast('Creado', 'success'); }
      
      contForm.innerHTML = ''; renderEmpleados();
    });
  };
};
