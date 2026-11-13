import { Storage } from '../../storage/storage.js';
import { $, toast, todayISO, fmtDate, fmtMinutes, minutesBetween } from '../../utils/helpers.js';

export const renderLibre = () => {
  const getRegistros = () => Storage.get('libre_registros', []);
  const saveRegistros = (l) => Storage.set('libre_registros', l);
  
  const cont = $('#app');
  const regs = getRegistros();
  const hoy = todayISO();
  const fichajeHoy = regs.find(r => r.fecha === hoy);
  const totalMin = regs.reduce((a, r) => a + (r.salida ? minutesBetween(r.entrada, r.salida) : 0), 0);

  // Ocultamos el header original para que quede limpio
  const header = document.querySelector('.app-header');
  if (header) header.style.display = 'none';

  cont.innerHTML = `
    <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
        <h1 style="color: var(--primary);">RLPT.es <span style="font-size:1rem; color: var(--muted); font-weight:normal;">Modo Personal</span></h1>
        <button class="btn danger" id="btn-salir-libre">Salir</button>
      </div>
      
      <div class="card" style="text-align: center; background: #1e293b; color: white;">
        <h2 style="font-size: 1.2rem; margin-bottom: 10px;">Registro de Jornada</h2>
        <p style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 20px;">Usa este modo si tu empresa no te da acceso a su registro.</p>
        
        <div style="display: flex; justify-content: center; gap: 30px; margin-bottom: 20px;">
          <div>
            <div style="font-size: 0.8rem; opacity: 0.7;">Trabajo Acumulado</div>
            <div style="font-size: 1.5rem; font-weight: bold; color: #10b981;">${fmtMinutes(totalMin)}</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; opacity: 0.7;">Días Trabajados</div>
            <div style="font-size: 1.5rem; font-weight: bold;">${regs.length}</div>
          </div>
        </div>

        <div style="display: flex; gap: 10px; justify-content: center; min-height: 50px;">
          ${!fichajeHoy ? `<button class="btn accent" id="btn-in" style="padding: 15px 30px; font-size: 1.1rem;">▶ Fichar Entrada</button>` : ''}
          ${fichajeHoy && !fichajeHoy.salida ? `<button class="btn danger" id="btn-out" style="padding: 15px 30px; font-size: 1.1rem;">⏹ Fichar Salida</button>` : ''}
          ${fichajeHoy && fichajeHoy.salida ? `<p style="color: #10b981; font-weight: bold; padding: 15px;">✅ Jornada completada hoy</p>` : ''}
        </div>
      </div>

      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
          <h3 style="margin:0; color: var(--primary);">Mis Registros</h3>
          <button class="btn ghost" id="btn-export-libre" style="font-size: 0.8rem; padding: 5px 10px;">📥 Exportar Prueba</button>
        </div>
        
        <table>
          <thead><tr><th>Fecha</th><th>Entrada</th><th>Salida</th><th>Total</th></tr></thead>
          <tbody>
            ${regs.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding: 20px; color: #999;">No hay registros aún.</td></tr>' : ''}
            ${[...regs].reverse().map(r => `
              <tr>
                <td>${fmtDate(r.fecha)}</td>
                <td>${r.entrada}</td>
                <td>${r.salida || '—'}</td>
                <td>${r.salida ? fmtMinutes(minutesBetween(r.entrada, r.salida)) : '<span style="color:var(--accent)">En curso</span>'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('btn-in')?.addEventListener('click', () => {
    const ahora = new Date();
    const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    regs.push({ fecha: hoy, entrada: hora, salida: '' });
    saveRegistros(regs);
    toast('Entrada registrada', 'success');
    renderLibre();
  });

  document.getElementById('btn-out')?.addEventListener('click', () => {
    const ahora = new Date();
    const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    const reg = regs.find(r => r.fecha === hoy);
    if (reg) reg.salida = hora;
    saveRegistros(regs);
    toast('Salida registrada', 'success');
    renderLibre();
  });

  document.getElementById('btn-export-libre')?.addEventListener('click', () => {
    let txt = "REGISTRO DE JORNADA LABORAL - PRUEBA PARA DENUNCIA\\n";
    txt += "Generado el: " + new Date().toLocaleString() + "\\n\\n";
    txt += "Fecha\\tEntrada\\tSalida\\tTotal\\n";
    txt += "--------------------------------------------------\\n";
    regs.forEach(r => {
      const total = r.salida ? fmtMinutes(minutesBetween(r.entrada, r.salida)) : 'En curso';
      txt += `${r.fecha}\\t${r.entrada}\\t${r.salida || '—'}\\t${total}\\n`;
    });
    
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Registro_Jornada_${todayISO()}.txt`;
    a.click();
    toast('Documento exportado', 'success');
  });

  document.getElementById('btn-salir-libre').addEventListener('click', () => {
    window.location.reload();
  });
};
