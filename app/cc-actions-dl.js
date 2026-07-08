// ============================================================
// ColoColo Football Center — Descargador de acciones por jugador
// DESDE LA PLATAFORMA. Usa la misma vía que la tabla/fixture y los
// shotmaps (window.ccSofaFetch: proxy propio → directo → proxies
// CORS públicos). Por cada partido baja la alineación (ids reales)
// y los eventos espaciales de cada jugador con minutos, en el
// MISMO formato compacto de app/cc-actions-data.js. Persiste en
// localStorage, se fusiona con el paquete al cargar, permite
// agregar partidos nuevos por link (+ jornada) y exportar el
// archivo para dejarlo permanente.
// ============================================================
(function () {
  var KEY = 'cc_actions_dl_v1';

  function leer() {
    try { var v = JSON.parse(localStorage.getItem(KEY)); return (v && typeof v === 'object') ? v : {}; } catch (e) { return {}; }
  }
  var store = leer();
  var estado = { activo: false, cancelar: false, msg: '', quota: false, error: null };

  function emitir() { try { window.dispatchEvent(new Event('cc-actions-dl')); } catch (e) {} }

  function guardar() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); estado.quota = false; return true; }
    catch (e) { estado.quota = true; return false; }
  }

  function cuentaActions(m) {
    if (!m || !m.actions) return 0;
    var n = 0;
    Object.keys(m.actions).forEach(function (p) { if (Array.isArray(m.actions[p]) && m.actions[p].length) n++; });
    return n;
  }

  // Fusiona lo descargado en el paquete global que lee la app
  function merge() {
    window.CC_ACTIONS_BUNDLE = window.CC_ACTIONS_BUNDLE || {};
    Object.keys(store).forEach(function (k) {
      var actual = window.CC_ACTIONS_BUNDLE[k];
      if (!actual || cuentaActions(store[k]) >= cuentaActions(actual)) {
        window.CC_ACTIONS_BUNDLE[k] = store[k];
      }
    });
  }

  // Partidos conocidos: los 15 empaquetados + los agregados por link
  function partidos() {
    var map = {};
    var bundle = window.CC_LINEUPS_BUNDLE || {};
    Object.keys(bundle).forEach(function (j) {
      var m = bundle[j] || {};
      if (m.eventId) map[String(m.eventId)] = { j: Number(j), eventId: Number(m.eventId), homeEsCC: m.ccEs === 'home' };
    });
    Object.keys(store).forEach(function (k) {
      var it = store[k];
      if (it && it.eventId && !map[String(it.eventId)]) {
        map[String(it.eventId)] = { j: Number(it.j), eventId: Number(it.eventId), homeEsCC: !!it.homeEsCC };
      }
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return a.j - b.j; });
  }

  function itemDe(eventId) {
    return (window.CC_ACTIONS_BUNDLE || {})[String(eventId)] || store[String(eventId)] || null;
  }

  // 'completo' = todos los jugadores con minutos tienen su lista de eventos
  function estadoPartido(p) {
    var it = itemDe(p.eventId);
    if (!it) return 'pendiente';
    var jug = (it.cc || []).concat(it.rv || []).filter(function (x) { return x && (x.minutos || 0) > 0; });
    if (!jug.length) return 'pendiente';
    var acc = it.actions || {};
    var done = jug.every(function (x) { return Array.isArray(acc[String(x.id)]); });
    if (done) return it.avgPos ? 'completo' : 'parcial'; // sin posiciones promedio aún: falta 1 descarga
    var alguno = jug.some(function (x) { return Array.isArray(acc[String(x.id)]) && acc[String(x.id)].length; });
    return alguno ? 'parcial' : 'pendiente';
  }

  function lista() {
    return partidos().map(function (p) {
      return { j: p.j, eventId: p.eventId, homeEsCC: p.homeEsCC, estado: estadoPartido(p) };
    });
  }

  function pendientes() {
    return partidos().filter(function (p) { return estadoPartido(p) !== 'completo'; });
  }

  function fetchApi(path) {
    if (typeof window.ccSofaFetch === 'function') return window.ccSofaFetch(path);
    return Promise.reject(new Error('La conexión con la fuente no está disponible.'));
  }

  function espera(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function jitter(base) { return base + Math.random() * 400; }

  function compactPlayer(item, side) {
    var player = item.player || {};
    var stats = item.statistics || {};
    var jugo = (!item.substitute) || Object.keys(stats).length > 0;
    if (!jugo || !player.id || !player.name) return null;
    return {
      id: player.id,
      nombre: player.name,
      posicion: item.position || player.position || '',
      dorsal: item.jerseyNumber || item.shirtNumber || '',
      minutos: stats.minutesPlayed != null ? stats.minutesPlayed : null,
      titular: !item.substitute,
      lado: side
    };
  }

  function num(v) { var n = Number(v); return isFinite(n) ? Math.round(n * 100) / 100 : null; }

  // Posiciones promedio del partido → { cc: [{i,n,d,x,y,c,s}], rv: [...] }
  function compactAvg(data, homeEsCC) {
    function lado(arr) {
      return (arr || []).map(function (it) {
        var pl = (it && it.player) || {};
        if (pl.id == null || !pl.name) return null;
        var x = Number(it.averageX), y = Number(it.averageY);
        if (!isFinite(x) || !isFinite(y)) return null;
        return { i: pl.id, n: pl.name, d: pl.jerseyNumber || it.jerseyNumber || '', x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, c: it.pointsCount || 0, s: !!it.isSubstitute };
      }).filter(Boolean);
    }
    var home = lado((data || {}).home), away = lado((data || {}).away);
    return homeEsCC ? { cc: home, rv: away } : { cc: away, rv: home };
  }

  function compactEvents(data) {
    var eventos = [];
    Object.keys(data || {}).forEach(function (categoria) {
      var listaEv = data[categoria];
      if (!Array.isArray(listaEv) || /shot/i.test(categoria)) return; // remates: ya vienen del shotmap real
      listaEv.forEach(function (raw) {
        if (!raw || typeof raw !== 'object') return;
        var ini = raw.playerCoordinates || {};
        var fin = raw.passEndCoordinates || {};
        var x = num(ini.x != null ? ini.x : raw.x);
        var y = num(ini.y != null ? ini.y : raw.y);
        if (x == null || y == null) return;
        eventos.push({
          c: categoria,
          a: raw.eventActionType || raw.actionType || '',
          o: raw.outcome,
          l: raw.isLongBall,
          i: raw.isAssist,
          x: x, y: y,
          ex: num(fin.x != null ? fin.x : raw.end_x),
          ey: num(fin.y != null ? fin.y : raw.end_y),
          t: raw.time != null ? raw.time : (raw.minute != null ? raw.minute : null)
        });
      });
    });
    return eventos;
  }

  // Descarga todo lo pendiente, o solo un partido si se pasa su eventId
  async function descargar(soloEventId) {
    if (estado.activo) return;
    estado.activo = true; estado.cancelar = false; estado.error = null; estado.msg = 'Preparando…';
    emitir();
    try {
      var cola = pendientes().filter(function (p) { return !soloEventId || String(p.eventId) === String(soloEventId); });
      if (!cola.length) { estado.msg = 'Sin pendientes: ese partido ya está completo.'; return; }
      for (var pi = 0; pi < cola.length; pi++) {
        if (estado.cancelar) { estado.msg = 'Descarga pausada — lo bajado quedó guardado.'; return; }
        var p = cola[pi];
        var clave = String(p.eventId);
        var previo = store[clave] || itemDe(p.eventId) || {};
        var item = {
          j: p.j, eventId: p.eventId, homeEsCC: p.homeEsCC,
          cc: [], rv: [],
          actions: (previo.actions && typeof previo.actions === 'object') ? previo.actions : {},
          avgPos: previo.avgPos || null,
          errors: {},
          updatedAt: null
        };

        estado.msg = 'F' + p.j + ' · descargando alineación…'; emitir();
        var lineups = await fetchApi('/event/' + p.eventId + '/lineups');
        var ladoHome = p.homeEsCC ? 'cc' : 'rv';
        var ladoAway = p.homeEsCC ? 'rv' : 'cc';
        var jugadores = ((((lineups || {}).home || {}).players) || [])
          .map(function (raw) { return compactPlayer(raw, ladoHome); })
          .concat(((((lineups || {}).away || {}).players) || []).map(function (raw) { return compactPlayer(raw, ladoAway); }))
          .filter(Boolean);
        if (!jugadores.length) throw new Error('La alineación llegó vacía — reintenta más tarde.');
        item.cc = jugadores.filter(function (x) { return x.lado === 'cc'; });
        item.rv = jugadores.filter(function (x) { return x.lado === 'rv'; });

        if (!item.avgPos) {
          estado.msg = 'F' + p.j + ' · posiciones promedio…'; emitir();
          try {
            var ap = await fetchApi('/event/' + p.eventId + '/average-positions');
            item.avgPos = compactAvg(ap, p.homeEsCC);
          } catch (e3) {
            item.errors._avgpos = 'posiciones: ' + String((e3 && e3.message) || e3);
          }
        }

        var conMin = jugadores.filter(function (x) { return (x.minutos || 0) > 0; });
        for (var k = 0; k < conMin.length; k++) {
          if (estado.cancelar) break;
          var jug = conMin[k];
          var pid = String(jug.id);
          if (Array.isArray(item.actions[pid])) continue; // ya bajado antes
          estado.msg = 'F' + p.j + ' · ' + jug.nombre + ' (' + (k + 1) + '/' + conMin.length + ')'; emitir();
          try {
            var detalle = await fetchApi('/event/' + p.eventId + '/player/' + jug.id + '/rating-breakdown');
            item.actions[pid] = compactEvents(detalle);
          } catch (e2) {
            item.errors[pid] = jug.nombre + ': ' + String((e2 && e2.message) || e2);
          }
          await espera(jitter(650));
        }

        item.updatedAt = new Date().toISOString();
        store[clave] = item;
        guardar();
        merge();
        var faltan = Object.keys(item.errors).length;
        estado.msg = 'F' + p.j + ' lista: ' + cuentaActions(item) + ' jugadores con eventos' +
          (faltan ? ' · ' + faltan + ' con error (reintenta luego)' : '');
        emitir();
        if (pi < cola.length - 1) await espera(jitter(3500));
      }
      var quedan = pendientes().length;
      estado.msg = quedan
        ? 'Corrida terminada. Quedan ' + quedan + ' partido(s): pulsa Descargar de nuevo.'
        : '¡Completo! Todos los partidos tienen sus acciones. Exporta el archivo para dejarlo permanente.';
    } catch (err) {
      estado.error = String((err && err.message) || err);
      estado.msg = 'La fuente rechazó la conexión (' + estado.error + '). Reintenta en un rato — lo bajado quedó guardado.';
    } finally {
      estado.activo = false; estado.cancelar = false;
      emitir();
    }
  }

  // Agrega un partido nuevo por link (+ jornada del fixture) y lo descarga
  function agregarPorLink(url, j) {
    var m = /id:(\d+)/.exec(url || '');
    if (!m) return Promise.reject(new Error('El link no trae el id del partido (…#id:15353060).'));
    var eventId = Number(m[1]);
    var fx = null;
    try { ((window.CC_DATA && CC_DATA.fixture) || []).forEach(function (x) { if (x && String(x.j) === String(j)) fx = x; }); } catch (e) {}
    var homeEsCC = fx ? !!fx.local : true;
    if (!store[String(eventId)]) {
      store[String(eventId)] = { j: Number(j), eventId: eventId, homeEsCC: homeEsCC, cc: [], rv: [], actions: {}, errors: {} };
      guardar();
    }
    merge(); emitir();
    return descargar(eventId);
  }

  function exportar() {
    merge();
    var bundle = window.CC_ACTIONS_BUNDLE || {};
    var contenido = '// Datos reales de acciones por jugador.\n' +
      '// Generado desde la plataforma (Configuración → Datos Sofascore).\n' +
      '// Reemplaza app/cc-actions-data.js con este archivo.\n' +
      'window.CC_ACTIONS_BUNDLE = ' + JSON.stringify(bundle) + ';\n';
    var blob = new Blob([contenido], { type: 'text/javascript' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cc-actions-data.js';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }

  function resumen() {
    merge();
    var todos = lista();
    return {
      total: todos.length,
      conEventos: todos.filter(function (x) { return x.estado !== 'pendiente'; }).length,
      completos: todos.filter(function (x) { return x.estado === 'completo'; }).length,
      pendientes: todos.filter(function (x) { return x.estado !== 'completo'; }).length
    };
  }

  window.CC_ACTIONS_DL = {
    estado: function () { return estado; },
    resumen: resumen,
    lista: lista,
    pendientes: pendientes,
    descargar: descargar,
    agregarPorLink: agregarPorLink,
    cancelar: function () { if (estado.activo) { estado.cancelar = true; estado.msg = 'Pausando…'; emitir(); } },
    exportar: exportar,
    limpiar: function () { store = {}; guardar(); emitir(); }
  };

  merge();
})();
