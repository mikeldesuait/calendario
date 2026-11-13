const PREFIX = 'rlpt_';

export const Storage = {
  get(key, fallback = null) { 
    try { 
      const raw = localStorage.getItem(PREFIX + key); 
      return raw ? JSON.parse(raw) : fallback; 
    } catch { return fallback; } 
  },
  set(key, value) { 
    localStorage.setItem(PREFIX + key, JSON.stringify(value)); 
    return value; 
  },
  remove(key) { localStorage.removeItem(PREFIX + key); }
};

export const DB = {
  empleados: {
    all: () => Storage.get('empleados', []),
    save: (l) => Storage.set('empleados', l),
    add: (e) => { 
      e.id = e.id || crypto.randomUUID(); 
      const l = DB.empleados.all(); 
      l.push(e); 
      DB.empleados.save(l); 
      return e; 
    },
    update: (e) => DB.empleados.save(DB.empleados.all().map(x => x.id === e.id ? e : x)),
    remove: (id) => DB.empleados.save(DB.empleados.all().filter(e => e.id !== id)),
    find: (id) => DB.empleados.all().find(e => e.id === id)
  },
  turnos: {
    all: () => Storage.get('turnos', []),
    save: (l) => Storage.set('turnos', l),
    add: (t) => { 
      t.id = t.id || crypto.randomUUID(); 
      const l = DB.turnos.all(); 
      l.push(t); 
      DB.turnos.save(l); 
      return t; 
    },
    update: (t) => DB.turnos.save(DB.turnos.all().map(x => x.id === t.id ? t : x)),
    remove: (id) => DB.turnos.save(DB.turnos.all().filter(t => t.id !== id)),
    find: (id) => DB.turnos.all().find(t => t.id === id)
  },
  registros: {
    all: () => Storage.get('registros', []),
    save: (l) => Storage.set('registros', l),
    add: (r) => { 
      r.id = r.id || crypto.randomUUID(); 
      const l = DB.registros.all(); 
      l.push(r); 
      DB.registros.save(l); 
      return r; 
    },
    remove: (id) => DB.registros.save(DB.registros.all().filter(r => r.id !== id))
  },
  config: {
    get: () => Storage.get('config', { 
      empresa: 'Mi Empresa', 
      cif: '', 
      centroTrabajo: '', 
      ccc: '',
      rlpt: { horasAnuales: 1772, diasVacaciones: 22, horasSindicales: 15 },
      festivos2026: ['2026-01-01', '2026-01-06', '2026-03-19', '2026-04-03', '2026-04-06', '2026-05-01', '2026-06-24', '2026-07-17', '2026-08-15', '2026-09-08', '2026-10-09', '2026-10-12', '2026-12-08', '2026-12-25']
    }),
    save: (c) => Storage.set('config', c)
  }
};
