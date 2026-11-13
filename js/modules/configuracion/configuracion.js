import { DB } from '../../storage/storage.js';
import { $, toast } from '../../utils/helpers.js';
import { Modal } from '../../utils/modal.js';

export const renderConfiguracion = () => {
  const cont = $('#configuracion-content');
  const cfg = DB.config.get();
  const rlpt = cfg.rlpt || { horasAnuales: 1772, diasVacaciones: 22, horasSindicales: 15 };
  
  const festivos2026 = cfg.festivos2026 || [
    '2026-01-01', '2026-01-06', '2026-03-19', '2026-04-03', '2026-04-06',
    '2026-05-01', '2026-06-24', '2026-07-17', '2026-08-15', '2026-09-08',
    '2026-10-09', '2026-10-12', '2026-12-08', '2026-12-25'
  ];

  const adminUser = localStorage.getItem('rlpt_admin_user') || 'admin';
  const adminPin = localStorage.getItem('rlpt_admin_pin') || '';

  cont.innerHTML = `
    <div class="card">
      <h3 style="margin-bottom:16px;color:var(--primary)">Datos de la empresa</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="field"><label>Razón social</label><input id="c-empresa" value="${cfg.empresa || ''}"></div>
        <div class="field"><label>CIF</label><input id="c-cif" value="${cfg.cif || ''}"></div>
        <div class="field"><label>Centro de trabajo</label><input id="c-centro" value="${cfg.centroTrabajo || ''}"></div>
        <div class="field"><label>CCC</label><input id="c-ccc" value="${cfg.ccc || ''}"></div>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-bottom:16px;color:var(--primary)">Registro de Jornada y Límites Anuales</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="field"><label>Cómputo anual (horas) *</label><input type="number" id="r-anuales" value="${rlpt.horasAnuales}"></div>
        <div class="field"><label>Días de vacaciones al año *</label><input type="number" id="r-diasvac" value="${rlpt.diasVacaciones}"></div>
        <div class="field"><label>Horas RLPT al mes</label><input type="number" id="r-horassind" value="${rlpt.horasSindicales}"></div>
      </div>
      <button class="btn accent" id="btn-save-rlpt" style="margin-top:16px">Guardar Configuración</button>
    </div>

    <div class="card">
      <h3 style="margin-bottom:16px;color:var(--primary)">Festivos 2026 (Orihuela Costa)</h3>
      <div id="lista-festivos" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:15px;">
        ${festivos2026.map(f => `<span class="tag" style="background:#e2e8f0; color:#334155; padding:4px 8px; border-radius:4px; font-size:0.8rem;">${f}</span>`).join('')}
      </div>
    </div>

    <div class="card" style="border-left: 4px solid #3b82f6;">
      <h3 style="margin-bottom:16px;color:var(--primary)">🔐 Credenciales de Administrador (2FA)</h3>
      <p style="color:var(--muted);font-size:.85rem;margin-bottom:12px">Cambia tu usuario, contraseña y PIN. Si cambias algo, se generará un nuevo backup cifrado automáticamente.</p>
      
      <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px;">
        <div class="field"><label>Usuario</label><input id="admin-user" value="${adminUser}"></div>
        <div class="field"><label>Nueva Contraseña</label><input type="password" id="admin-pass" placeholder="Dejar en blanco para mantener"></div>
        <div class="field"><label>Nuevo PIN (4 dígitos)</label><input type="password" id="admin-pin" maxlength="4" value="${adminPin}" placeholder="Ej: 1234"></div>
      </div>
      <button class="btn accent" id="btn-save-admin" style="margin-top:12px; background: #3b82f6; color: white;">Actualizar Credenciales</button>
    </div>

    <div class="card">
      <h3 style="margin-bottom:12px;color:var(--primary)">Copia de Seguridad Encriptada</h3>
      <p style="color:var(--muted);font-size:.85rem;margin-bottom:12px">Los backups se encriptan con tu contraseña + PIN actuales. Si cambias las credenciales, los backups antiguos ya no se podrán importar.</p>
      <div style="display:flex;gap:10px">
        <button class="btn ghost" id="btn-export">📥 Exportar Backup Seguro</button>
        <button class="btn ghost" id="btn-import">📤 Importar Backup Seguro</button>
        <input type="file" id="file-import" accept=".json" style="display:none">
      </div>
    </div>

    <div class="card" style="border-left: 4px solid var(--danger);">
      <h3 style="margin-bottom:12px;color:var(--danger)">Zona de Peligro</h3>
      <button class="btn danger" id="btn-reset-all">🗑️ Borrar todos los datos</button>
    </div>
  `;

  // === FUNCIONES DE CIFRADO ===
  const derivarClave = async (password, pin) => {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      'raw', encoder.encode(password + pin), { name: 'PBKDF2' }, false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: encoder.encode('rlpt_salt'), iterations: 100000, hash: 'SHA-256' },
      baseKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
  };

  const cifrar = async (texto, password, pin) => {
    const key = await derivarClave(password, pin);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const cifrado = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(texto));
    return { iv: Array.from(iv), data: Array.from(new Uint8Array(cifrado)) };
  };

  const descifrar = async (payload, password, pin) => {
    const key = await derivarClave(password, pin);
    const iv = new Uint8Array(payload.iv);
    const data = new Uint8Array(payload.data);
    const descifrado = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(descifrado);
  };

  // === GUARDAR CONFIGURACIÓN ===
  $('#btn-save-rlpt').addEventListener('click', () => {
    const nuevaCfg = { 
      ...cfg, 
      empresa: $('#c-empresa').value.trim(),
      cif: $('#c-cif').value.trim(),
      centroTrabajo: $('#c-centro').value.trim(),
      ccc: $('#c-ccc').value.trim(),
      rlpt: { ...rlpt, horasAnuales: Number($('#r-anuales').value) || 1772, diasVacaciones: Number($('#r-diasvac').value) || 22, horasSindicales: Number($('#r-horassind').value) || 15 }
    };
    DB.config.save(nuevaCfg);
    toast('Configuración guardada', 'success');
  });

  // === GUARDAR CREDENCIALES Y AUTO-BACKUP ===
  $('#btn-save-admin').addEventListener('click', async () => {
    const user = $('#admin-user').value.trim();
    const passNueva = $('#admin-pass').value;
    const pinNuevo = $('#admin-pin').value.trim();
    
    if (!user) { toast('El usuario no puede estar vacío', 'error'); return; }
    if (pinNuevo.length !== 4 || isNaN(pinNuevo)) { toast('El PIN debe ser de 4 dígitos', 'error'); return; }
    
    const passActual = localStorage.getItem('rlpt_admin_pass') || 'admin';
    const pinActual = localStorage.getItem('rlpt_admin_pin') || '';
    
    const passFinal = passNueva || passActual;
    const cambioCredenciales = (passNueva && passNueva !== passActual) || pinNuevo !== pinActual;
    
    // Guardar credenciales
    localStorage.setItem('rlpt_admin_user', user);
    localStorage.setItem('rlpt_admin_pin', pinNuevo);
    if (passNueva) localStorage.setItem('rlpt_admin_pass', passNueva);
    
    toast('Credenciales actualizadas', 'success');
    
    if (cambioCredenciales) {
      await new Promise(r => setTimeout(r, 300));
      
      let modalBackup = document.getElementById('modal-auto-backup');
      if (!modalBackup) {
        modalBackup = document.createElement('div');
        modalBackup.id = 'modal-auto-backup';
        modalBackup.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter: blur(5px); z-index:2000; align-items:center; justify-content:center;';
        modalBackup.innerHTML = `
          <div class="card" style="width: 420px; padding: 30px; text-align: center;">
            <h3 style="color: #3b82f6; margin-bottom: 15px;">🔄 Cambio de Credenciales</h3>
            <p style="color: var(--muted); font-size: 0.9rem; margin-bottom: 10px; line-height: 1.5;">
              Has cambiado las credenciales de acceso.<br>
              Se va a generar un <strong>NUEVO backup cifrado</strong> con las nuevas credenciales.
            </p>
            <p style="color: var(--danger); font-size: 0.85rem; margin-bottom: 25px; background: #fee2e2; padding: 10px; border-radius: 6px;">
              ⚠️ Los backups antiguos dejarán de ser válidos.
            </p>
            <button class="btn accent" id="btn-confirmar-backup" style="width: 100%; padding: 12px;">Sí, generar backup ahora</button>
            <button class="btn ghost" id="btn-cancelar-backup" style="width: 100%; padding: 12px; margin-top: 10px;">Cancelar</button>
          </div>
        `;
        document.body.appendChild(modalBackup);
      }
      
      modalBackup.style.display = 'flex';
      
      const respuesta = await new Promise(resolve => {
        document.getElementById('btn-confirmar-backup').onclick = () => { modalBackup.style.display = 'none'; resolve(true); };
        document.getElementById('btn-cancelar-backup').onclick = () => { modalBackup.style.display = 'none'; resolve(false); };
      });
      
      if (respuesta) {
        try {
          const backup = {};
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k.startsWith('rlpt_')) backup[k] = localStorage.getItem(k);
          }
          
          const jsonStr = JSON.stringify(backup);
          const encriptado = await cifrar(jsonStr, passFinal, pinNuevo);
          
          const hbAuto = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(passFinal + pinNuevo));
          encriptado.huella = Array.from(new Uint8Array(hbAuto)).map(b => b.toString(16).padStart(2, '0')).join('');
          
          const blob = new Blob([JSON.stringify(encriptado)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `rlpt_backup_seguro_${new Date().toISOString().slice(0,10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
          
          toast('Backup cifrado generado con las nuevas credenciales', 'success');
        } catch (e) {
          console.error(e);
          toast('Error al generar el backup', 'error');
        }
      }
    }
  });

  // === EXPORTAR ===
  $('#btn-export').addEventListener('click', async () => {
    const pin = await Modal.pedirPIN('Introduce tu PIN para cifrar el backup');
    if (!pin) return;
    
    const storedPin = localStorage.getItem('rlpt_admin_pin');
    const storedPass = localStorage.getItem('rlpt_admin_pass') || 'admin';
    
    if (pin !== storedPin) { toast('PIN incorrecto', 'error'); return; }
    
    try {
      const backup = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith('rlpt_')) backup[k] = localStorage.getItem(k);
      }
      
      const jsonStr = JSON.stringify(backup);
      const encriptado = await cifrar(jsonStr, storedPass, pin);
      
      const hbManual = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(storedPass + pin));
      encriptado.huella = Array.from(new Uint8Array(hbManual)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const blob = new Blob([JSON.stringify(encriptado)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rlpt_backup_seguro_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast('Backup cifrado exportado', 'success');
    } catch (e) {
      console.error(e);
      toast('Error al exportar', 'error');
    }
  });

  // === IMPORTAR ===
  $('#btn-import').addEventListener('click', () => $('#file-import').click());
  
  $('#file-import').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    
    const pin = await Modal.pedirPIN('Introduce el PIN con el que se cifró el backup');
    if (!pin) return;
    
    const storedPass = localStorage.getItem('rlpt_admin_pass') || 'admin';
    
    try {
      const texto = await f.text();
      const payload = JSON.parse(texto);
      
      if (!payload.huella) {
        toast('Este backup es de una versión anterior y no es seguro. Genera uno nuevo.', 'error');
        return;
      }
      
      const huellaActual = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(storedPass + pin)).then(h => Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join(''));
      
      if (huellaActual !== payload.huella) {
        toast('El backup fue creado con credenciales diferentes. No se puede importar.', 'error');
        return;
      }
      
      const jsonDescifrado = await descifrar(payload, storedPass, pin);
      const datos = JSON.parse(jsonDescifrado);
      
      Object.keys(datos).forEach(k => { if (k.startsWith('rlpt_')) localStorage.setItem(k, datos[k]); });
      toast('Backup importado correctamente', 'success');
      setTimeout(() => location.reload(), 1000);
    } catch (e) {
      console.error(e);
      toast('Error: PIN incorrecto o archivo dañado', 'error');
    }
  });

  // === BORRAR TODO ===
  $('#btn-reset-all').addEventListener('click', async () => {
    const ok1 = Modal.confirmar('Borrar todos los datos', '¿Seguro que quieres borrar TODOS los datos? Esta acción no se puede deshacer.', 'peligro');
    if (!ok1) return;
    
    const ok2 = Modal.confirmar('Última advertencia', '¿Confirmas el borrado total? No habrá vuelta atrás.', 'peligro');
    if (!ok2) return;
    
    localStorage.clear();
    sessionStorage.clear();
    toast('Todos los datos han sido borrados', 'success');
    setTimeout(() => { window.location.href = window.location.pathname; }, 1000);
  });
};
