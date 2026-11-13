// Gestor centralizado de modales para toda la aplicación
export const Modal = {
  // Crear un modal genérico
  crear: (opciones) => {
    const { id, titulo, mensaje, tipo = 'info', inputs = [], botones = [] } = opciones;
    
    // Si ya existe, eliminarlo
    const existente = document.getElementById('modal-custom-' + id);
    if (existente) existente.remove();
    
    const colores = {
      info: { borde: '#3b82f6', icono: 'ℹ️' },
      exito: { borde: '#10b981', icono: '✅' },
      peligro: { borde: '#dc2626', icono: '⚠️' },
      warning: { borde: '#f59e0b', icono: '⚠️' },
      pregunta: { borde: '#8b5cf6', icono: '❓' }
    };
    
    const color = colores[tipo] || colores.info;
    
    const modal = document.createElement('div');
    modal.id = 'modal-custom-' + id;
    modal.style.cssText = 'display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter: blur(5px); z-index:9999; align-items:center; justify-content:center;';
    
    let inputsHtml = '';
    inputs.forEach(inp => {
      inputsHtml += `
        <div style="margin-bottom: 12px; text-align: left;">
          <label style="display: block; font-size: 0.85rem; font-weight: bold; color: #0a3d62; margin-bottom: 5px;">${inp.label}</label>
          <input id="modal-input-${inp.id}" type="${inp.type || 'text'}" ${inp.maxlength ? `maxlength="${inp.maxlength}"` : ''} placeholder="${inp.placeholder || ''}" value="${inp.valor || ''}" style="padding: 10px; width: 100%; box-sizing: border-box; border: 1px solid #ccc; border-radius: 6px;">
        </div>
      `;
    });
    
    let botonesHtml = '';
    botones.forEach(btn => {
      const btnClass = btn.tipo === 'peligro' ? 'danger' : (btn.tipo === 'exito' ? 'accent' : 'ghost');
      botonesHtml += `
        <button class="btn ${btnClass}" id="modal-btn-${id}-${btn.id}" style="width: 100%; padding: 12px; margin-top: ${botonesHtml ? '10px' : '0'};">${btn.texto}</button>
      `;
    });
    
    modal.innerHTML = `
      <div class="card" style="width: 420px; padding: 30px; text-align: center; border-top: 4px solid ${color.borde};">
        <div style="font-size: 2.5rem; margin-bottom: 10px;">${color.icono}</div>
        <h3 style="color: #0a3d62; margin-bottom: 15px; font-size: 1.2rem;">${titulo}</h3>
        ${mensaje ? `<p style="color: #666; font-size: 0.9rem; margin-bottom: 20px; line-height: 1.5;">${mensaje}</p>` : ''}
        ${inputsHtml}
        <div style="margin-top: 20px;">${botonesHtml}</div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Asignar eventos a los botones
    return new Promise((resolve) => {
      botones.forEach(btn => {
        document.getElementById(`modal-btn-${id}-${btn.id}`).addEventListener('click', () => {
          const valores = {};
          inputs.forEach(inp => {
            valores[inp.id] = document.getElementById(`modal-input-${inp.id}`).value.trim();
          });
          
          modal.remove();
          
          if (btn.accion) {
            btn.accion(valores);
          } else {
            resolve({ boton: btn.id, valores });
          }
        });
      });
    });
  },

  // Atajos para casos comunes
  alerta: (titulo, mensaje, tipo = 'info') => {
    return Modal.crear({
      id: 'alerta-' + Date.now(),
      titulo,
      mensaje,
      tipo,
      botones: [{ id: 'ok', texto: 'Aceptar', tipo: 'exito' }]
    });
  },

  confirmar: (titulo, mensaje, tipo = 'pregunta') => {
    return Modal.crear({
      id: 'confirmar-' + Date.now(),
      titulo,
      mensaje,
      tipo,
      botones: [
        { id: 'cancelar', texto: 'Cancelar', tipo: 'ghost' },
        { id: 'aceptar', texto: 'Aceptar', tipo: 'exito' }
      ]
    }).then(res => res.boton === 'aceptar');
  },

  pedirTexto: (titulo, label, placeholder = '', tipo = 'text') => {
    return Modal.crear({
      id: 'pedir-' + Date.now(),
      titulo,
      inputs: [{ id: 'valor', label, placeholder, type: tipo }],
      botones: [
        { id: 'cancelar', texto: 'Cancelar', tipo: 'ghost' },
        { id: 'aceptar', texto: 'Aceptar', tipo: 'exito' }
      ]
    }).then(res => res.boton === 'aceptar' ? res.valores.valor : null);
  },

  pedirPIN: (titulo = 'PIN de Seguridad') => {
    return Modal.pedirTexto(titulo, 'PIN (4 dígitos)', 'Ej: 1234', 'password');
  }
};
