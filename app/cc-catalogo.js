// ============================================================
// ColoColo Football Center — Catálogo País → Liga → Equipo
// Fuente: TheSportsDB (API pública con CORS habilitado, sin proxy).
// Países se bajan una vez; ligas (por país) y equipos (por liga) se
// bajan al usarse y quedan en caché en localStorage.
// "Actualizar" (Configuración) limpia la caché y re-descarga.
// ============================================================
(function () {
  var KEY = 'cc_catalogo_v2';
  function apiKey() { try { return localStorage.getItem('cc_tsdb_key') || '3'; } catch (e) { return '3'; } }
  function base() { return 'https://www.thesportsdb.com/api/v1/json/' + apiKey(); }

  function load() {
    try { var v = JSON.parse(localStorage.getItem(KEY)); if (v && typeof v === 'object') return v; } catch (e) {}
    return { fecha: null, paises: [], ligas: {}, equipos: {} };
  }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  var data = load();

  function fetchJson(url, ms) {
    return Promise.race([
      fetch(url, { headers: { 'Accept': 'application/json' } }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status); return r.json();
      }),
      new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, ms || 12000); })
    ]);
  }
  function norm(s) { return (s || '').toString(); }
  function seed() { return window.CC_CATALOGO_SEED || {}; }
  function dedup(arr) { var seen = {}, out = []; arr.forEach(function (x) { var k = (x.nombre || '').toLowerCase(); if (k && !seen[k]) { seen[k] = 1; out.push(x); } }); return out; }

  var CC_CATALOGO = {
    fecha: function () { return data.fecha; },
    paisesCache: function () { return data.paises || []; },
    ligasCache: function (pais) { return (data.ligas || {})[pais] || null; },
    equiposCache: function (ligaId) { return (data.equipos || {})[ligaId] || null; },

    // Países (id = nombre). Curados primero, luego los de la API.
    paises: function (force) {
      var curados = Object.keys(seed()).map(function (p) { return { id: p, nombre: p, curado: true }; });
      if (!force && data.paises && data.paises.length) {
        return Promise.resolve(dedup(curados.concat(data.paises)).sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); }));
      }
      return fetchJson(base() + '/all_countries.php').then(function (j) {
        var arr = (j.countries || []).map(function (c) { var n = norm(c.name_en || c.name); return { id: n, nombre: n }; })
          .filter(function (c) { return c.nombre; });
        data.paises = arr;
        if (!data.fecha) data.fecha = new Date().toISOString();
        save(data);
        return dedup(curados.concat(arr)).sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
      }).catch(function () {
        return curados.sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
      });
    },

    // Ligas de un país: curadas primero, luego las de la API (cacheadas)
    ligas: function (pais) {
      var curadas = Object.keys((seed()[pais]) || {}).map(function (n) { return { id: n, nombre: n, curada: true }; });
      var c = (data.ligas || {})[pais];
      if (c) return Promise.resolve(dedup(curadas.concat(c)));
      return fetchJson(base() + '/search_all_leagues.php?c=' + encodeURIComponent(pais) + '&s=Soccer').then(function (j) {
        var raw = j.countries || j.leagues || [];
        var arr = raw.map(function (l) { return { id: norm(l.strLeague), nombre: norm(l.strLeague), idLeague: l.idLeague }; })
          .filter(function (l) { return l.nombre; });
        arr.sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
        data.ligas = data.ligas || {}; data.ligas[pais] = arr; save(data);
        return dedup(curadas.concat(arr));
      }).catch(function () { return curadas; });
    },

    // Equipos de una liga: si está en el seed curado, lista completa; si no,
    // la API en vivo (capada a 10 en la capa gratuita).
    equipos: function (ligaNombre, pais) {
      // Buscar en el seed (por país si se entrega, o en todos)
      var paises = pais ? [pais] : Object.keys(seed());
      for (var i = 0; i < paises.length; i++) {
        var ligasP = seed()[paises[i]] || {};
        if (ligasP[ligaNombre]) {
          return Promise.resolve(ligasP[ligaNombre].map(function (n) { return { id: n, nombre: n }; })
            .sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); }));
        }
      }
      var c = (data.equipos || {})[ligaNombre];
      if (c) return Promise.resolve(c);
      return fetchJson(base() + '/search_all_teams.php?l=' + encodeURIComponent(ligaNombre)).then(function (j) {
        var arr = (j.teams || []).map(function (t) { return { id: t.idTeam, nombre: norm(t.strTeam), logo: t.strBadge || null }; })
          .filter(function (t) { return t.nombre; });
        arr.sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
        data.equipos = data.equipos || {}; data.equipos[ligaNombre] = arr; save(data);
        return arr;
      }).catch(function () { return []; });
    },

    // ¿La liga tiene lista completa curada?
    esCurada: function (ligaNombre) {
      var s = seed();
      return Object.keys(s).some(function (p) { return s[p][ligaNombre]; });
    },

    actualizar: function () {
      data = { fecha: new Date().toISOString(), paises: [], ligas: {}, equipos: {}, regiones: {} };
      save(data);
      return CC_CATALOGO.paises(true);
    },

    regiones: function () { return data.regiones || {}; },

    // Actualiza/guarda una región completa (CONMEBOL, UEFA…) desde el seed
    // curado, persiste el snapshot y registra la fecha. No depende de la API.
    actualizarRegion: function (regionId) {
      var reg = (window.CC_CATALOGO_REGIONS || []).filter(function (r) { return r.id === regionId; })[0];
      var s = seed();
      if (reg) {
        reg.paises.forEach(function (p) {
          var ligasP = s[p] || {};
          var arr = Object.keys(ligasP).map(function (n) { return { id: n, nombre: n, curada: true }; });
          data.ligas = data.ligas || {}; data.ligas[p] = arr;
          Object.keys(ligasP).forEach(function (ln) {
            data.equipos = data.equipos || {};
            data.equipos[ln] = ligasP[ln].map(function (n) { return { id: n, nombre: n }; })
              .sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
          });
        });
      }
      data.regiones = data.regiones || {};
      data.regiones[regionId] = new Date().toISOString();
      if (!data.fecha) data.fecha = new Date().toISOString();
      save(data);
      return Promise.resolve(true);
    },

    estado: function () {
      return {
        fecha: data.fecha,
        regiones: data.regiones || {},
        paises: (data.paises || []).length,
        ligas: Object.keys(data.ligas || {}).length,
        equipos: Object.keys(data.equipos || {}).length
      };
    }
  };

  window.CC_CATALOGO = CC_CATALOGO;
})();
