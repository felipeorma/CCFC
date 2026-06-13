// ============================================================
// ColoColo Football Center — Datos en vivo desde Sofascore
// Tabla de posiciones, fixture/resultados y forma (últimos 5)
// Torneo 11653 · Temporada 88493 · caché 1 hora
// ============================================================
(function () {
  var TORNEO = 11653;
  var TEMPORADA = 88493;
  var CACHE_KEY = 'cc_sofa_v1';
  var CACHE_TTL = 3600 * 1000;

  function norm(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  var ALIAS = {
    'colo colo': 'colo colo',
    'universidad de concepcion': 'u de concepcion',
    'everton de vina del mar': 'everton',
    'deportes la serena': 'deportes la serena',
    'la serena': 'deportes la serena'
  };

  function canonico(sofaName) {
    var q = norm(sofaName);
    q = ALIAS[q] || q;
    var equipos = (window.CC_DATA && window.CC_DATA.equipos) || [];
    for (var i = 0; i < equipos.length; i++) {
      var k = norm(equipos[i].nombre);
      var k2 = ALIAS[k] || k;
      if (k === q || k2 === q || k.indexOf(q) !== -1 || q.indexOf(k) !== -1 || k2.indexOf(q) !== -1 || q.indexOf(k2) !== -1) {
        return equipos[i].nombre;
      }
    }
    return sofaName;
  }

  window.CC_SOFA = { listo: false, tabla: null, fixtureCC: null, proximoCC: null, error: null, fuente: null, fechaSnapshot: null };

  function emitir() {
    window.CC_SOFA.listo = true;
    try { window.dispatchEvent(new Event('cc-sofa-ready')); } catch (e) {}
  }

  // Proxy propio del usuario (Vercel/Netlify) — se configura en Configuración.
  // Formato: https://tu-app.vercel.app/api/sofascore  (acepta ?path=…)
  var PROXY_KEY = 'cc_proxy_url_v1';
  function proxyUrl() {
    try { return (localStorage.getItem(PROXY_KEY) || '').trim().replace(/\/+$/, ''); } catch (e) { return ''; }
  }
  window.CC_PROXY = {
    get: proxyUrl,
    set: function (url) {
      try { localStorage.setItem(PROXY_KEY, (url || '').trim()); } catch (e) {}
    },
    test: function () {
      var px = proxyUrl();
      if (!px) return Promise.reject(new Error('Sin URL de proxy configurada'));
      return fetch(px + '?path=' + encodeURIComponent('/unique-tournament/' + TORNEO + '/season/' + TEMPORADA + '/standings/total'))
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        })
        .then(function (j) {
          var filas = (j.standings && j.standings[0] && j.standings[0].rows) || [];
          if (!filas.length) throw new Error('Respuesta sin tabla');
          return { ok: true, equipos: filas.length };
        });
    }
  };

  function fetchJson(path) {
    var directas = [];
    var px = proxyUrl();
    if (px) directas.push(px + '?path=' + encodeURIComponent(path));
    directas.push(
      'https://www.sofascore.com/api/v1' + path,
      'https://api.sofascore.com/api/v1' + path,
      // Proxies CORS públicos: última opción
      'https://corsproxy.io/?url=' + encodeURIComponent('https://www.sofascore.com/api/v1' + path),
      'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://api.sofascore.com/api/v1' + path)
    );
    var i = 0;
    function intento() {
      if (i >= directas.length) return Promise.reject(new Error('sin respuesta'));
      var url = directas[i++];
      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).catch(function () { return intento(); });
    }
    return intento();
  }
  window.ccSofaFetch = fetchJson;

  function fetchPaginado(tipo, maxPaginas) {
    var todos = [];
    function pagina(p) {
      if (p >= maxPaginas) return Promise.resolve(todos);
      return fetchJson('/unique-tournament/' + TORNEO + '/season/' + TEMPORADA + '/events/' + tipo + '/' + p)
        .then(function (data) {
          var evs = (data && data.events) || [];
          todos = todos.concat(evs);
          if (data && data.hasNextPage) return pagina(p + 1);
          return todos;
        })
        .catch(function () { return todos; });
    }
    return pagina(0);
  }

  function procesar(standings, pasados, futuros) {
    var filas = [];
    (standings.standings || []).forEach(function (s) { (s.rows || []).forEach(function (r) { filas.push(r); }); });

    // Tabla
    var tabla = filas.map(function (r) {
      var t = r.team || {};
      return {
        id: t.id,
        nombre: canonico(t.name),
        pj: r.matches, g: r.wins, e: r.draws, p: r.losses,
        gf: r.scoresFor, gc: r.scoresAgainst,
        dg: (r.scoresFor || 0) - (r.scoresAgainst || 0),
        pts: r.points, pos: r.position, forma: []
      };
    });
    var porId = {};
    tabla.forEach(function (t) { porId[t.id] = t; });

    // Forma (últimos 5) desde eventos finalizados
    var fin = pasados.filter(function (e) { return e.status && e.status.type === 'finished'; });
    fin.sort(function (a, b) { return (a.startTimestamp || 0) - (b.startTimestamp || 0); });
    fin.forEach(function (e) {
      var hs = (e.homeScore || {}).current, as = (e.awayScore || {}).current;
      if (hs == null || as == null) return;
      var hid = e.homeTeam && e.homeTeam.id, aid = e.awayTeam && e.awayTeam.id;
      if (porId[hid]) porId[hid].forma.push(hs > as ? 'V' : hs === as ? 'E' : 'D');
      if (porId[aid]) porId[aid].forma.push(as > hs ? 'V' : hs === as ? 'E' : 'D');
    });
    tabla.forEach(function (t) { t.forma = t.forma.slice(-5); });

    // Fixture de Colo-Colo (pasados + próximos)
    var cc = tabla.filter(function (t) { return t.nombre === 'Colo-Colo'; })[0];
    var ccId = cc ? cc.id : null;
    var fixtureCC = [];
    if (ccId) {
      fin.concat(futuros).forEach(function (e) {
        var hid = e.homeTeam && e.homeTeam.id, aid = e.awayTeam && e.awayTeam.id;
        if (hid !== ccId && aid !== ccId) return;
        var local = hid === ccId;
        var rivalT = local ? e.awayTeam : e.homeTeam;
        var hs = (e.homeScore || {}).current, as = (e.awayScore || {}).current;
        var terminado = e.status && e.status.type === 'finished';
        var d = new Date((e.startTimestamp || 0) * 1000);
        fixtureCC.push({
          ts: e.startTimestamp || 0,
          fecha: d.toISOString().slice(0, 10),
          hora: d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
          rival: canonico(rivalT ? rivalT.name : ''),
          local: local,
          resultado: terminado && hs != null ? (local ? hs + '-' + as : as + '-' + hs) : null,
          ronda: e.roundInfo ? e.roundInfo.round : null
        });
      });
      fixtureCC.sort(function (a, b) { return a.ts - b.ts; });
    }
    var ahora = Date.now() / 1000;
    var proximoCC = fixtureCC.filter(function (m) { return !m.resultado && m.ts > ahora - 7200; })[0] || null;

    tabla.sort(function (a, b) { return (a.pos || 99) - (b.pos || 99); });
    return { tabla: tabla, fixtureCC: fixtureCC, proximoCC: proximoCC };
  }

  function aplicar(res, fuente) {
    window.CC_SOFA.tabla = res.tabla;
    window.CC_SOFA.fixtureCC = res.fixtureCC;
    window.CC_SOFA.proximoCC = res.proximoCC;
    window.CC_SOFA.fuente = fuente || 'live';
    emitir();
  }

  // Respaldo 1: CSV de standings subido en Configuración (flujo Python del usuario)
  function leerCSVGuardado() {
    try {
      var raw = localStorage.getItem('cc_standings_csv_v1');
      if (raw) { var d = JSON.parse(raw); if (d && d.rows && d.rows.length) return d; }
    } catch (e) {}
    return null;
  }

  function aplicarRespaldo() {
    var csv = leerCSVGuardado();
    if (csv) {
      window.CC_SOFA.fechaSnapshot = csv.fecha || null;
      aplicar({ tabla: csv.rows, fixtureCC: null, proximoCC: null }, 'csv');
      return;
    }
    aplicarSnapshot();
  }

  // Carga un CSV generado por get_league_standings (position, team, matches,
  // wins, draws, losses, goals_for, goals_against, points)
  window.CC_SOFA_CARGAR_CSV = function (text) {
    var limpio = text.replace(/^\uFEFF/, '');
    var lineas = limpio.split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (lineas.length < 2) return { ok: false, error: 'El archivo está vacío.' };
    var sep = lineas[0].indexOf(';') > -1 && lineas[0].indexOf(',') === -1 ? ';' : ',';
    var head = lineas[0].split(sep).map(function (h) { return h.trim().toLowerCase().replace(/^"|"$/g, ''); });
    var col = function (n) { return head.indexOf(n); };
    var ic = { pos: col('position'), team: col('team'), pj: col('matches'), g: col('wins'), e: col('draws'), p: col('losses'), gf: col('goals_for'), gc: col('goals_against'), pts: col('points') };
    if (ic.team < 0 || ic.pts < 0) return { ok: false, error: 'Columnas no reconocidas. Se esperan: position, team, matches, wins, draws, losses, goals_for, goals_against, points.' };
    var rows = [];
    for (var i = 1; i < lineas.length; i++) {
      var c = lineas[i].split(sep).map(function (v) { return v.replace(/^"|"$/g, '').trim(); });
      if (!c[ic.team]) continue;
      var num = function (j) { if (j < 0) return null; var v = parseFloat(c[j]); return isNaN(v) ? null : v; };
      var gf = num(ic.gf) || 0, gc = num(ic.gc) || 0;
      rows.push({ pos: num(ic.pos), nombre: canonico(c[ic.team]), pj: num(ic.pj), g: num(ic.g), e: num(ic.e), p: num(ic.p), gf: gf, gc: gc, dg: gf - gc, pts: num(ic.pts), forma: [] });
    }
    if (!rows.length) return { ok: false, error: 'El archivo no tiene filas válidas.' };
    rows.sort(function (a, b) { return (a.pos || 99) - (b.pos || 99); });
    var fecha = new Date().toISOString().slice(0, 10);
    try { localStorage.setItem('cc_standings_csv_v1', JSON.stringify({ t: Date.now(), fecha: fecha, rows: rows })); } catch (e) {}
    if (window.CC_SOFA.fuente !== 'live') {
      window.CC_SOFA.fechaSnapshot = fecha;
      aplicar({ tabla: rows, fixtureCC: window.CC_SOFA.fixtureCC, proximoCC: window.CC_SOFA.proximoCC }, 'csv');
    }
    return { ok: true, filas: rows.length };
  };

  // Respaldo 2: instantánea empaquetada (solo pos/PJ/DIF/PTS)
  function aplicarSnapshot() {
    var snap = window.CC_SOFA_SNAPSHOT;
    if (!snap || !snap.tabla) { emitir(); return; }
    window.CC_SOFA.fechaSnapshot = snap.fecha;
    aplicar({
      tabla: snap.tabla.map(function (r) {
        return {
          pos: r.pos, nombre: r.nombre, pj: r.pj, dg: r.dg, pts: r.pts,
          g: r.g != null ? r.g : null, e: r.e != null ? r.e : null, p: r.p != null ? r.p : null,
          gf: r.gf != null ? r.gf : null, gc: r.gc != null ? r.gc : null, forma: []
        };
      }),
      fixtureCC: null,
      proximoCC: null
    }, 'snapshot');
  }

  function cargar() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        var c = JSON.parse(raw);
        if (c && c.res && (Date.now() - c.t) < CACHE_TTL) { aplicar(c.res, 'live'); return; }
      }
    } catch (e) {}

    Promise.all([
      fetchJson('/unique-tournament/' + TORNEO + '/season/' + TEMPORADA + '/standings/total'),
      fetchPaginado('last', 6),
      fetchPaginado('next', 2)
    ]).then(function (r) {
      var res = procesar(r[0] || {}, r[1] || [], r[2] || []);
      if (!res.tabla.length) throw new Error('tabla vacía');
      try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), res: res })); } catch (e) {}
      aplicar(res, 'live');
    }).catch(function (err) {
      window.CC_SOFA.error = String(err && err.message || err);
      aplicarRespaldo();
    });
  }

  if (window.CC_DATA) cargar();
  else window.addEventListener('DOMContentLoaded', cargar);
})();
