// ============================================================
// ColoColo Football Center — Logos vía Sofascore CDN
// Torneo: Primera División Chile (unique-tournament 11653)
// Temporada: 88493 · Mapea nombre de equipo → id → logo PNG
// ============================================================
(function () {
  var TORNEO = 11653;
  var TEMPORADA = 88493;
  var CACHE_KEY = 'cc_logos_v1';
  var CACHE_TTL = 7 * 24 * 3600 * 1000; // 7 días

  function norm(s) {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Nombres de la plataforma → forma esperada en Sofascore
  var ALIAS = {
    'u de concepcion': 'universidad de concepcion',
    'la serena': 'deportes la serena',
    'everton': 'everton de vina del mar',
    'd concepcion': 'deportes concepcion',
    'u catolica': 'universidad catolica',
    'u de chile': 'universidad de chile'
  };

  // Logos manuales (Configuración): { nombreNormalizado: url }
  var MANUAL_KEY = 'cc_logos_manual_v1';
  function leerManuales() {
    try { return JSON.parse(localStorage.getItem(MANUAL_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  var manuales = leerManuales();

  var mapa = null;   // { nombreNormalizado: { id, nombre } }
  var listo = false;

  // Semilla inmediata desde el snapshot empaquetado: los logos funcionan
  // aunque la API de Sofascore bloquee el fetch (HTTP 403 anti-bot).
  function sembrar() {
    var snap = window.CC_SOFA_SNAPSHOT;
    if (!snap || !snap.ids) return;
    mapa = mapa || {};
    Object.keys(snap.ids).forEach(function (nombre) {
      var k = norm(nombre);
      if (k && !mapa[k]) mapa[k] = { id: snap.ids[nombre], nombre: nombre };
    });
  }

  function construirMapa(filas) {
    var m = {};
    filas.forEach(function (row) {
      var t = row.team || {};
      if (!t.id) return;
      var entrada = { id: t.id, nombre: t.name || '' };
      [t.name, t.shortName, (t.slug || '').replace(/-/g, ' ')].forEach(function (n) {
        var k = norm(n);
        if (k && !m[k]) m[k] = entrada;
      });
    });
    return m;
  }

  function buscar(nombre) {
    if (!mapa) return null;
    var q = norm(nombre);
    if (!q) return null;
    if (mapa[q]) return mapa[q];
    if (ALIAS[q] && mapa[ALIAS[q]]) return mapa[ALIAS[q]];
    var claves = Object.keys(mapa);
    for (var i = 0; i < claves.length; i++) {
      var k = claves[i];
      if (k.indexOf(q) !== -1 || q.indexOf(k) !== -1) return mapa[k];
    }
    return null;
  }

  function emitir() {
    listo = true;
    try { window.dispatchEvent(new Event('cc-logos-ready')); } catch (e) {}
  }

  function guardarCache(filas) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        t: Date.now(),
        filas: filas.map(function (r) {
          var t = r.team || {};
          return { team: { id: t.id, name: t.name, shortName: t.shortName, slug: t.slug } };
        })
      }));
    } catch (e) {}
  }

  function leerCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      if (!d || !d.filas || (Date.now() - d.t) > CACHE_TTL) return null;
      return d.filas;
    } catch (e) { return null; }
  }

  function fetchJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function extraerFilas(data) {
    var st = (data && data.standings) || [];
    var filas = [];
    st.forEach(function (s) { (s.rows || []).forEach(function (r) { filas.push(r); }); });
    return filas;
  }

  function cargar() {
    sembrar();
    var cache = leerCache();
    if (cache && cache.length) {
      mapa = construirMapa(cache);
      sembrar(); // completa nombres que falten en el caché
      emitir();
      return;
    }
    var urls = [
      'https://www.sofascore.com/api/v1/unique-tournament/' + TORNEO + '/season/' + TEMPORADA + '/standings/total',
      'https://api.sofascore.com/api/v1/unique-tournament/' + TORNEO + '/season/' + TEMPORADA + '/standings/total'
    ];
    var intento = 0;

    function siguiente() {
      if (intento >= urls.length) return intentarTemporadaActual();
      var url = urls[intento++];
      fetchJson(url).then(function (data) {
        var filas = extraerFilas(data);
        if (!filas.length) throw new Error('sin filas');
        mapa = construirMapa(filas);
        sembrar();
        guardarCache(filas);
        emitir();
      }).catch(siguiente);
    }

    // Respaldo: pedir la lista de temporadas y usar la más reciente
    function intentarTemporadaActual() {
      fetchJson('https://www.sofascore.com/api/v1/unique-tournament/' + TORNEO + '/seasons')
        .then(function (data) {
          var s = (data && data.seasons && data.seasons[0]) || null;
          if (!s) throw new Error('sin temporadas');
          return fetchJson('https://www.sofascore.com/api/v1/unique-tournament/' + TORNEO + '/season/' + s.id + '/standings/total');
        })
        .then(function (data) {
          var filas = extraerFilas(data);
          if (!filas.length) throw new Error('sin filas');
          mapa = construirMapa(filas);
          sembrar();
          guardarCache(filas);
          emitir();
        })
        .catch(function () { emitir(); }); // mapa queda con la semilla del snapshot
    }

    siguiente();
  }

  window.CC_LOGOS = {
    teamUrl: function (nombre) {
      var q = norm(nombre);
      if (manuales[q]) return manuales[q];
      var e = buscar(nombre);
      return e ? 'https://img.sofascore.com/api/v1/team/' + e.id + '/image' : null;
    },
    setManual: function (nombre, url) {
      var q = norm(nombre);
      if (url) manuales[q] = url; else delete manuales[q];
      try { localStorage.setItem(MANUAL_KEY, JSON.stringify(manuales)); } catch (e) {}
      try { window.dispatchEvent(new Event('cc-logos-ready')); } catch (e) {}
    },
    getManual: function (nombre) { return manuales[norm(nombre)] || ''; },
    tournamentUrl: function () {
      return 'https://img.sofascore.com/api/v1/unique-tournament/' + TORNEO + '/image';
    },
    status: function () {
      return {
        listo: listo,
        equipos: mapa ? Object.keys(mapa).length : 0,
        mapeados: mapa
          ? (window.CC_DATA ? window.CC_DATA.equipos.filter(function (e) { return !!buscar(e.nombre); }).length : 0)
          : 0
      };
    }
  };

  cargar();
})();
