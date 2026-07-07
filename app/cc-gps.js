// ============================================================
// ColoColo Football Center — GPS Catapult (parser + store)
// Lee los dos exports de Catapult (entrenamiento separado por comas
// con metadata arriba; partido separado por ";") y los normaliza a
// un esquema común de métricas GPS de élite. Los nombres se enlazan
// al plantel actual (alias editable por archivo) y alimentan el ACWR
// y la pestaña Físico de Dirección Técnica.
// ============================================================
(function () {
  var KEY = 'cc_gps_v1';

  function leer() {
    try { var v = JSON.parse(localStorage.getItem(KEY)); if (v && v.sesiones) return v; } catch (e) {}
    return { sesiones: [], alias: {} };
  }
  var db = leer();
  db.alias = db.alias || {};
  if (db.sesiones.some(function (s) { return s.demo; })) {
    db.sesiones = db.sesiones.filter(function (s) { return !s.demo; });
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
  }
  function guardar() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
    feedFisico();
    try { window.dispatchEvent(new Event('cc-gps-change')); } catch (e) {}
    try { window.dispatchEvent(new Event('cc-dt-change')); } catch (e) {}
  }

  // ---------- utilidades ----------
  function parseLine(line, sep) {
    var out = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (c === '"') { q = !q; continue; }
      if (c === sep && !q) { out.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    out.push(cur.trim());
    return out;
  }
  function t2min(t) {
    if (!t) return 0;
    var p = String(t).trim().split(':').map(Number);
    if (p.length === 3) return p[0] * 60 + p[1] + p[2] / 60;
    if (p.length === 2) return p[0] + p[1] / 60;
    return Number(t) || 0;
  }
  function num(v) { var n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; }
  function findIdx(hdr, names) {
    for (var k = 0; k < names.length; k++)
      for (var i = 0; i < hdr.length; i++) if (hdr[i].toLowerCase() === names[k].toLowerCase()) return i;
    for (var k2 = 0; k2 < names.length; k2++)
      for (var i2 = 0; i2 < hdr.length; i2++) if (hdr[i2].toLowerCase().indexOf(names[k2].toLowerCase()) >= 0) return i2;
    return -1;
  }
  function normVel(v) { return v > 0 && v < 15 ? Math.round(v * 3.6 * 10) / 10 : v; }
  function gv(c, i) { return i >= 0 ? num(c[i]) : null; }

  // ---------- detección + parseo ----------
  function parse(texto, nombreArchivo) {
    var lineas = texto.split(/\r?\n/);
    var esPartido = /;/.test(lineas[0]) && /player name/i.test(lineas[0]);
    return esPartido ? parsePartido(lineas, nombreArchivo) : parseEntreno(lineas, nombreArchivo);
  }

  function parseEntreno(lineas, arch) {
    var fecha = '', hdrRow = -1;
    for (var i = 0; i < lineas.length; i++) {
      if (/^Date:,/i.test(lineas[i])) fecha = (lineas[i].split(',')[1] || '').trim();
      if (/^"?Player Name"?/i.test(lineas[i])) { hdrRow = i; break; }
    }
    if (hdrRow < 0) return null;
    var h = parseLine(lineas[hdrRow], ',');
    var ix = {
      name: findIdx(h, ['Player Name']), pos: findIdx(h, ['Position Name']),
      dur: findIdx(h, ['Total Duration']), dist: findIdx(h, ['Distancia Total', 'Total Distance']),
      pl: findIdx(h, ['Total Player Load']), plMin: findIdx(h, ['Player Load Per Minute']),
      mMin: findIdx(h, ['Metros x minuto', 'Meterage Per Minute']), vmax: findIdx(h, ['Maximum Velocity', 'Max Velocity']),
      b198: findIdx(h, ['DT +19,8 a 25 km/h']), b25: findIdx(h, ['DT +25 Km/h']),
      spr: findIdx(h, ['Sprint Efforts', 'Sprints', 'Esfuerzos de Sprint']),
      acc: findIdx(h, ['Acceleration Efforts', 'Aceleraciones', 'Accel Efforts']),
      dec: findIdx(h, ['Deceleration Efforts', 'Desaceleraciones', 'Decel Efforts'])
    };
    var filas = [];
    for (var r = hdrRow + 1; r < lineas.length; r++) {
      if (!lineas[r] || !lineas[r].trim()) continue;
      var c = parseLine(lineas[r], ',');
      if (!c[ix.name] || (c[1] || '').toLowerCase() !== 'session') continue;
      filas.push(fila(c[ix.name], c[ix.pos], t2min(c[ix.dur]), num(c[ix.dist]), num(c[ix.pl]),
        num(c[ix.plMin]), num(c[ix.mMin]), normVel(num(c[ix.vmax])),
        num(c[ix.b198]) + num(c[ix.b25]), num(c[ix.b25]),
        gv(c, ix.spr), gv(c, ix.acc), gv(c, ix.dec)));
    }
    return { id: 'g' + Date.now(), fecha: iso(fecha), tipo: 'Entrenamiento', titulo: arch || 'Entrenamiento', filas: filas };
  }

  function parsePartido(lineas, arch) {
    var h = parseLine(lineas[0], ';');
    var ix = {
      name: findIdx(h, ['Player Name']), period: findIdx(h, ['Period Name']), fecha: findIdx(h, ['Date']),
      pos: findIdx(h, ['Position']), field: findIdx(h, ['Field Time', 'Duration']), odo: findIdx(h, ['Odometer', 'Total Distance']),
      pl: findIdx(h, ['Player Load']), vmax: findIdx(h, ['Max Velocity']),
      b198: findIdx(h, ['Velocity Band 6 Total Distance']), b7: findIdx(h, ['Velocity Band 7 Total Distance']), b8: findIdx(h, ['Velocity Band 8 Total Distance']),
      spr: findIdx(h, ['Velocity Band 8 Total Efforts', 'Sprint Efforts', 'Sprints']),
      acc: findIdx(h, ['Acceleration Efforts', 'Aceleraciones', 'Accel Efforts', 'Acceleration B3 Efforts']),
      dec: findIdx(h, ['Deceleration Efforts', 'Desaceleraciones', 'Decel Efforts', 'Deceleration B3 Efforts'])
    };
    var filas = [], fecha = '';
    for (var r = 1; r < lineas.length; r++) {
      if (!lineas[r] || !lineas[r].trim()) continue;
      var c = parseLine(lineas[r], ';');
      if (!c[ix.name]) continue;
      var per = (c[ix.period] || '').trim();
      if (/tiempo|1er|2do|1t|2t/i.test(per) && !/session|sesi/i.test(per)) continue;
      fecha = fecha || (c[ix.fecha] || '').trim();
      var dur = t2min(c[ix.field]);
      var dist = num(c[ix.odo]);
      var pl = num(c[ix.pl]);
      var hsr = ix.b198 >= 0 ? (num(c[ix.b198]) + num(c[ix.b7]) + num(c[ix.b8])) : null;
      filas.push(fila(c[ix.name], c[ix.pos], dur, dist, pl,
        dur ? pl / dur : 0, dur ? dist / dur : 0, normVel(num(c[ix.vmax])),
        hsr, ix.b8 >= 0 ? num(c[ix.b8]) : null,
        gv(c, ix.spr), gv(c, ix.acc), gv(c, ix.dec)));
    }
    return { id: 'g' + Date.now(), fecha: iso(fecha), tipo: 'Partido', titulo: arch || 'Partido', filas: filas };
  }

  function fila(name, pos, dur, dist, pl, plMin, mMin, vmax, hsr, sprint, spr, acc, dec) {
    return {
      name: (name || '').trim(), pos: (pos || '').trim(),
      dur: Math.round(dur), dist: Math.round(dist), pl: Math.round(pl),
      plMin: Math.round(plMin * 10) / 10, mMin: Math.round(mMin), vmax: Math.round(vmax * 10) / 10,
      hsr: hsr == null ? null : Math.round(hsr), sprint: sprint == null ? null : Math.round(sprint),
      spr: spr == null ? null : Math.round(spr), acc: acc == null ? null : Math.round(acc), dec: dec == null ? null : Math.round(dec)
    };
  }
  function iso(f) {
    if (!f) return new Date().toISOString().slice(0, 10);
    var m = f.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
    return f;
  }

  // ---------- enlace de nombres con el plantel ----------
  function plantelNombres() {
    try { return (window.CC_DT ? CC_DT.plantelCC() : []).map(function (s) { return s.nombre; }); } catch (e) { return []; }
  }
  function normname(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z ]/g, '').trim();
  }
  function autoMatch(nomArchivo) {
    if (Object.prototype.hasOwnProperty.call(db.alias, nomArchivo)) return db.alias[nomArchivo];   // '' = desenlazado explícito
    var na = normname(nomArchivo), mejor = null, mejorSc = 0;
    plantelNombres().forEach(function (p) {
      var np = normname(p), toksP = np.split(' ');
      var comunes = na.split(' ').filter(function (t) { return t.length > 2 && toksP.indexOf(t) >= 0; }).length;
      if (comunes > mejorSc) { mejorSc = comunes; mejor = p; }
    });
    return mejorSc > 0 ? mejor : null;
  }
  function resolver(nomArchivo) {
    if (Object.prototype.hasOwnProperty.call(db.alias, nomArchivo)) return db.alias[nomArchivo] || null;
    return autoMatch(nomArchivo);
  }

  // ---------- alimenta Físico / ACWR (distancia por jugador) ----------
  function feedFisico() {
    if (!window.CC_DT) return;
    var hoy = new Date(), porJug = {};
    db.sesiones.forEach(function (s) {
      var dias = Math.round((hoy - new Date(s.fecha + 'T12:00')) / 864e5);
      if (dias < 0 || dias > 28) return;
      s.filas.forEach(function (f) {
        var nombre = resolver(f.name);
        if (!nombre) return;
        porJug[nombre] = porJug[nombre] || { a7: 0, d28: 0 };
        porJug[nombre].d28 += f.dist;
        if (dias <= 7) porJug[nombre].a7 += f.dist;
      });
    });
    Object.keys(porJug).forEach(function (n) {
      var v = porJug[n];
      CC_DT.setGps(n, { aguda: Math.round(v.a7 / 1000 * 10) / 10, cronica: Math.round(v.d28 / 1000 / 4 * 10) / 10, fuente: 'catapult' });
    });
  }

  // Resumen por sesión (para gráficos de evolución del equipo)
  function resumenSesiones() {
    return db.sesiones.slice().sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; }).map(function (s) {
      var val = s.filas.filter(function (f) { return f.dur >= 20; });
      var n = val.length || 1;
      var sum = function (k) { return val.reduce(function (a, f) { return a + (f[k] || 0); }, 0); };
      return {
        id: s.id, fecha: s.fecha, tipo: s.tipo, titulo: s.titulo, demo: !!s.demo, nJug: val.length,
        distKm: Math.round(sum('dist') / 1000 * 10) / 10,
        mMin: Math.round(sum('mMin') / n),
        sprints: sum('spr'),
        acc: Math.round(sum('acc') / n * 10) / 10,
        dec: Math.round(sum('dec') / n * 10) / 10,
        hayAccDec: val.some(function (f) { return f.acc != null || f.dec != null; }),
        haySpr: val.some(function (f) { return f.spr != null; })
      };
    });
  }

  window.CC_GPS = {
    sesiones: function () { return db.sesiones.slice(); },
    resumenSesiones: resumenSesiones,
    parseTexto: parse,
    agregar: function (texto, nombreArchivo, meta) {
      var s = parse(texto, nombreArchivo);
      if (!s || !s.filas.length) return { ok: false, error: 'No se reconocieron filas de jugador' };
      if (meta) {
        if (meta.tipo) s.tipo = meta.tipo;
        if (meta.fecha) s.fecha = meta.fecha;
        if (meta.titulo) s.titulo = meta.titulo;
      }
      db.sesiones.unshift(s);
      guardar();
      return { ok: true, sesion: s };
    },
    eliminar: function (id) { db.sesiones = db.sesiones.filter(function (s) { return s.id !== id; }); guardar(); },
    setAlias: function (nomArchivo, nomPlantel) { db.alias[nomArchivo] = nomPlantel || ''; guardar(); },
    getAlias: function () { return Object.assign({}, db.alias); },
    match: resolver,
    filasResueltas: function (id) {
      var s = id ? db.sesiones.filter(function (x) { return x.id === id; })[0] : db.sesiones[0];
      if (!s) return [];
      return s.filas.map(function (f) { return Object.assign({}, f, { plantel: resolver(f.name) }); });
    }
  };
  feedFisico();
})();
