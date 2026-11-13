export const $ = (sel) => document.querySelector(sel);
export const toast = (msg, type = '') => { 
  const el = document.getElementById('toast'); 
  if (!el) return;
  el.textContent = msg; 
  el.className = 'toast show ' + type; 
  clearTimeout(window.__t); 
  window.__t = setTimeout(() => el.className = 'toast ' + type, 2800); 
};
export const fmtDate = (iso) => { 
  if (!iso) return '—'; 
  const d = new Date(iso); 
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }); 
};
export const todayISO = () => new Date().toISOString().slice(0, 10);
export const minutesBetween = (s, e) => { 
  if (!s || !e) return 0; 
  const [sh, sm] = s.split(':').map(Number); 
  const [eh, em] = e.split(':').map(Number); 
  return (eh * 60 + em) - (sh * 60 + sm); 
};
export const fmtMinutes = (min) => { 
  if (!min || min < 0) return '0h 00m'; 
  const h = Math.floor(min / 60); 
  const m = min % 60; 
  return `${h}h ${String(m).padStart(2, '0')}m`; 
};
