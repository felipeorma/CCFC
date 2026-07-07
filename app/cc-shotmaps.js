// ============================================================
// ColoColo Football Center — Shotmaps automáticos desde Sofascore
// Torneo: Chile Primera División / Liga de Primera
// tournamentId = 11653
// seasonId = 88493
// teamId Colo-Colo = 3155
//
// Este archivo:
// 1) Recorre las rondas de la temporada.
// 2) Filtra todos los partidos de Colo-Colo, jugados y futuros.
// 3) Guarda links de todos los partidos.
// 4) Para partidos finalizados, baja /event/{id}/shotmap.
// 5) Normaliza coordenadas para el shotmap React.
//
// Sistema interno:
// depth 0-100 · 100 = línea de gol rival
// width 0-100 · 50 = centro del arco
// distancia = desde el centro del arco rival
// ============================================================

(function () {
  var TORNEO = 11653;
  var TEMPORADA = 88493;
  var CC_ID = 3155;

  var CACHE_KEY = 'cc_shotmaps_auto_v5';
  var MATCHES_KEY = 'cc_sofa_matches_v5';

  var FIELD_LENGTH_M = 105;
  var FIELD_WIDTH_M = 68;

  var datos = {};              // j -> { fuente, eventId, shots }
  var partidosSofa = {};       // j -> partido SofaScore
  var estado = 'cargando';     // cargando | ok | bloqueado
  var error = null;
  var URLS_CONOCIDAS = {
    '15': 'https://www.sofascore.com/football/match/cobresal-colo-colo/fnbsrnb#id:15353054'
  };

  function emitir() {
    try {
      window.dispatchEvent(new Event('cc-shotmaps-ready'));
    } catch (e) {}
  }

  function guardarCache() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        t: Date.now(),
        datos: datos
      }));
      localStorage.setItem(MATCHES_KEY, JSON.stringify({
        t: Date.now(),
        partidos: partidosSofa
      }));
    } catch (e) {}
  }

  function leerCache() {
    try {
      var d = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (d && d.datos) datos = d.datos;

      var m = JSON.parse(localStorage.getItem(MATCHES_KEY) || 'null');
      if (m && m.partidos) partidosSofa = m.partidos;
    } catch (e) {}
  }

  // xG estimado por distancia y parte del cuerpo (Sofascore no publica
  // xG en esta liga). Modelo simple: decae exponencial con los metros.
  function estimarXg(x, y, bodyPart, situation, shotType) {
    var dx = Math.max(0.5, Number(x) || 12) * 1.05;          // metros al arco
    var dy = Math.abs(50 - (Number(y) || 50)) * 0.68;        // metros del centro
    var d = Math.sqrt(dx * dx + dy * dy);
    var xg = 1.1 * Math.exp(-d / 7.5);
    if (bodyPart === 'head') xg *= 0.65;
    if (situation === 'penalty') xg = 0.76;
    return Math.max(0.02, Math.min(0.85, Math.round(xg * 100) / 100));
  }

  // Siembra los shotmaps reales empaquetados en la app (cc-shotmaps-data.js)
  function sembrarBundle() {
    var b = window.CC_SHOTMAPS_BUNDLE;
    if (!b) return;
    Object.keys(b).forEach(function (j) {
      var actual = datos[String(j)];
      if (actual && actual.fuente === 'manual') return; // respeta cargas manuales
      var m = b[j];
      datos[String(j)] = {
        fuente: 'auto',
        eventId: m.eventId,
        shots: (m.shots || []).map(function (s) {
          return transformar({
            isHome: !!s[0],
            player: { name: s[1] },
            time: s[2],
            playerCoordinates: { x: s[3], y: s[4] },
            shotType: s[5],
            situation: s[6],
            goalMouthCoordinates: s[7] != null ? { x: 0, y: s[7] } : null,
            xg: estimarXg(s[3], s[4], s[8] || null, s[6], s[5])
          }, !!m.homeEsCC);
        })
      };
    });
  }

  function clamp(v, min, max) {
    v = Number(v);
    if (!isFinite(v)) return min;
    return Math.max(min, Math.min(max, v));
  }

  function num(v, fallback) {
    var n = Number(v);
    return isFinite(n) ? n : fallback;
  }

  function toPct100(v, fallback) {
    var n = num(v, fallback);
    if (n >= 0 && n <= 1.05) n = n * 100;
    return clamp(n, 0, 100);
  }

  function distanciaTiroM(depth, width) {
    var d = clamp(depth, 0, 100);
    var w = clamp(width, 0, 100);

    var dx = (100 - d) * (FIELD_LENGTH_M / 100);
    var dy = Math.abs(50 - w) * (FIELD_WIDTH_M / 100);

    return Math.round(Math.sqrt(dx * dx + dy * dy) * 100) / 100;
  }

  function estaEnArea(depth, width) {
    var d = clamp(depth, 0, 100);
    var w = clamp(width, 0, 100);

    var boxDepth = 100 - (16.5 / FIELD_LENGTH_M) * 100;
    var halfBoxWidth = (20.16 / FIELD_WIDTH_M) * 100;

    return (
      d >= boxDepth &&
      w >= 50 - halfBoxWidth &&
      w <= 50 + halfBoxWidth
    );
  }

  function zonaTiro(depth, width) {
    if (estaEnArea(depth, width)) return 'Área';
    if (depth >= 80) return 'Borde del área / zona 14';
    if (depth >= 65) return 'Media distancia';
    return 'Lejana';
  }

  function resultadoDe(s) {
    if (s.isOwnGoal) return 'autogol';

    var r = String(s.shotType || s.resultado || '').toLowerCase();

    if (r === 'goal' || r === 'gol') return 'gol';
    if (r === 'save' || r === 'saved' || r === 'atajado') return 'atajado';
    if (r === 'block' || r === 'blocked' || r === 'bloqueado') return 'bloqueado';
    if (r === 'post' || r === 'woodwork' || r === 'palo') return 'palo';
    if (r === 'miss' || r === 'missed' || r === 'fuera' || r === 'desviado') return 'fuera';

    return 'fuera';
  }

  var SITUACION = {
    regular: 'Jugada',
    'fast-break': 'Contraataque',
    'set-piece': 'Balón parado',
    corner: 'Córner',
    'free-kick': 'Tiro libre',
    penalty: 'Penal',
    'throw-in-set-piece': 'Lateral'
  };

  function coordenadasInicio(shot) {
    // Ya normalizado.
    if (shot.depth != null && shot.width != null) {
      return {
        depth: clamp(shot.depth, 0, 100),
        width: clamp(shot.width, 0, 100),
        fuenteCoord: shot.fuenteCoord || 'normalizado'
      };
    }

    // Formato notebook: draw.start.x/y.
    // Notebook: depth = 100 - y ; width = 100 - x
    if (shot.draw && shot.draw.start) {
      var sx = toPct100(shot.draw.start.x, 50);
      var sy = toPct100(shot.draw.start.y, 88);

      return {
        depth: clamp(100 - sy, 0, 100),
        width: clamp(100 - sx, 0, 100),
        fuenteCoord: 'draw.start'
      };
    }

    // Formato API SofaScore shotmap.
    // playerCoordinates.x = distancia al arco atacado, 0 cerca del arco.
    // playerCoordinates.y = ancho.
    var c = shot.playerCoordinates || {};
    var x = toPct100(c.x, 12);
    var y = toPct100(c.y, 50);

    return {
      depth: clamp(100 - x, 0, 100),
      width: clamp(y, 0, 100),
      fuenteCoord: 'playerCoordinates'
    };
  }

  function coordenadasFinal(shot) {
    if (shot.endDepth != null && shot.endWidth != null) {
      return {
        endDepth: clamp(shot.endDepth, 0, 100),
        endWidth: clamp(shot.endWidth, 0, 100)
      };
    }

    if (shot.draw && shot.draw.end) {
      var ex = toPct100(shot.draw.end.x, 50);
      var ey = toPct100(shot.draw.end.y, 0);

      return {
        endDepth: clamp(100 - ey, 0, 100),
        endWidth: clamp(100 - ex, 0, 100)
      };
    }

    // goalMouthCoordinates no es pitch completo; lo proyectamos a línea de gol.
    var g = shot.goalMouthCoordinates || null;
    if (g) {
      return {
        endDepth: 100,
        endWidth: toPct100(g.y, 50)
      };
    }

    return {
      endDepth: null,
      endWidth: null
    };
  }

  function ladoDe(shot, homeEsCC) {
    if (shot.lado === 'cc' || shot.lado === 'rv') return shot.lado;
    return (!!shot.isHome) === !!homeEsCC ? 'cc' : 'rv';
  }

  function transformar(shot, homeEsCC) {
    var inicio = coordenadasInicio(shot);
    var fin = coordenadasFinal(shot);
    var sit = String(shot.situation || '').toLowerCase();

    var depth = inicio.depth;
    var width = inicio.width;

    var xg = num(shot.xg, NaN);
    if (!isFinite(xg)) xg = num(shot.expectedGoals, NaN);
    if (!isFinite(xg)) xg = 0.05;
    xg = clamp(xg, 0, 0.95);

    return {
      depth: depth,
      width: width,
      endDepth: fin.endDepth,
      endWidth: fin.endWidth,

      distanciaM: distanciaTiroM(depth, width),
      enArea: estaEnArea(depth, width),
      zona: zonaTiro(depth, width),
      central: width >= 40 && width <= 60,

      xg: xg,
      resultado: resultadoDe(shot),
      jugador: shot.player && shot.player.name ? shot.player.name : (shot.jugador || shot.playerName || null),
      minuto: shot.time != null && !isNaN(Number(shot.time)) ? Math.round(Number(shot.time)) : (shot.minuto || null),
      situacion: SITUACION[sit] || shot.situacion || null,
      bodyPart: shot.bodyPart || shot.body_part || null,

      lado: ladoDe(shot, homeEsCC),
      fuenteCoord: inicio.fuenteCoord,

      raw: {
        playerCoordinates: shot.playerCoordinates || null,
        goalMouthCoordinates: shot.goalMouthCoordinates || null,
        draw: shot.draw || null
      }
    };
  }

  function sofaFetch(path) {
    if (typeof window.ccSofaFetch === 'function') {
      return window.ccSofaFetch(path);
    }

    estado = 'bloqueado';
    error = 'No existe window.ccSofaFetch. Falta el proxy/fetcher de SofaScore.';
    return Promise.reject(new Error(error));
  }

  // Descarga directa (sin proxy): intenta los hosts públicos de Sofascore.
  function fetchDirecto(path) {
    var hosts = ['https://www.sofascore.com/api/v1', 'https://api.sofascore.com/api/v1'];
    var ultimoError = null;
    function intentar(i) {
      if (i >= hosts.length) {
        var msg = String((ultimoError && ultimoError.message) || '');
        if (/HTTP (403|429)/.test(msg)) {
          return Promise.reject(new Error('Sofascore bloqueó la consulta (HTTP ' + msg.match(/HTTP (403|429)/)[1] + ' / anti-bot). No se cargó el shotmap para no inventar datos; reintenta más tarde o sube el JSON real del evento.'));
        }
        return Promise.reject(new Error('Sofascore no respondió desde el navegador (bloqueo CORS / anti-bot). No se cargó el shotmap para no inventar datos.'));
      }
      return fetch(hosts[i] + path, { headers: { accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .catch(function (err) { ultimoError = err; return intentar(i + 1); });
    }
    return intentar(0);
  }

  // Usa el proxy si existe; si no, intenta la descarga directa.
  function sofaFetchAny(path) {
    if (typeof window.ccSofaFetch === 'function') {
      return window.ccSofaFetch(path).catch(function () { return fetchDirecto(path); });
    }
    return fetchDirecto(path);
  }

  // Extrae el eventId de una URL de Sofascore (varios formatos).
  function parseEventId(url) {
    var s = String(url || '');
    var m = s.match(/#id:(\d+)/) ||
            s.match(/\/event\/(\d+)/) ||
            s.match(/event\/(\d+)\/shotmap/) ||
            s.match(/(\d{6,})/);
    return m ? Number(m[1]) : null;
  }

  function safeDate(timestamp) {
    if (!timestamp) return null;
    try {
      return new Date(timestamp * 1000).toISOString().slice(0, 10);
    } catch (e) {
      return null;
    }
  }

  function buildMatchUrl(ev) {
    var eventId = ev.id;
    var customId = ev.customId;
    var slug = ev.slug;

    if (slug && customId && eventId) {
      return 'https://www.sofascore.com/football/match/' + slug + '/' + customId + '#id:' + eventId;
    }

    if (eventId) {
      return 'https://www.sofascore.com/event/' + eventId;
    }

    return null;
  }

  function eventoEsColoColo(ev) {
    var h = ev.homeTeam || {};
    var a = ev.awayTeam || {};

    return h.id === CC_ID || a.id === CC_ID;
  }

  function normalizarPartidoSofa(ev, roundFallback) {
    var h = ev.homeTeam || {};
    var a = ev.awayTeam || {};
    var status = ev.status || {};
    var roundInfo = ev.roundInfo || {};
    var homeScore = ev.homeScore || {};
    var awayScore = ev.awayScore || {};

    var homeEsCC = h.id === CC_ID;

    return {
      j: roundInfo.round || roundFallback,
      round: roundInfo.round || roundFallback,
      roundName: roundInfo.name || null,

      eventId: ev.id,
      customId: ev.customId || null,
      slug: ev.slug || null,
      matchUrl: buildMatchUrl(ev),

      startTimestamp: ev.startTimestamp || null,
      fecha: safeDate(ev.startTimestamp),

      status: status.type || null,
      statusDescription: status.description || null,

      homeTeam: h.name || null,
      homeTeamId: h.id || null,
      awayTeam: a.name || null,
      awayTeamId: a.id || null,

      homeScore: homeScore.current,
      awayScore: awayScore.current,
      winnerCode: ev.winnerCode || null,

      homeEsCC: homeEsCC,
      local: homeEsCC,
      rival: homeEsCC ? (a.name || null) : (h.name || null)
    };
  }

  function buscarJornadaFixture(partidoSofa) {
    var fixture =
      (window.CC_DATA && window.CC_DATA.fixture) ||
      (window.CC_DATA && window.CC_DATA.partidos) ||
      [];

    if (!fixture.length) return partidoSofa.round;

    var mejor = null;
    var mejorScore = 999;

    fixture.forEach(function (m) {
      var score = 0;

      // 1) Mismo número de jornada.
      if (m.j != null && partidoSofa.round != null) {
        score += Math.abs(Number(m.j) - Number(partidoSofa.round)) * 10;
      }

      // 2) Misma fecha o cercana.
      if (m.fecha && partidoSofa.fecha) {
        var dif = Math.abs(new Date(m.fecha) - new Date(partidoSofa.fecha)) / 86400000;
        score += dif;
      }

      // 3) Mismo rival.
      if (m.rival && partidoSofa.rival) {
        var a = String(m.rival).toLowerCase();
        var b = String(partidoSofa.rival).toLowerCase();
        if (a === b) score -= 20;
        else if (a.includes(b) || b.includes(a)) score -= 10;
      }

      if (score < mejorScore) {
        mejorScore = score;
        mejor = m;
      }
    });

    if (mejor && mejor.j != null) return mejor.j;
    return partidoSofa.round;
  }

  function fetchRound(roundNumber) {
    return sofaFetch('/unique-tournament/' + TORNEO + '/season/' + TEMPORADA + '/events/round/' + roundNumber)
      .then(function (data) {
        return (data && data.events) || [];
      });
  }

  function cargarEventosPorRondas(maxRounds) {
    var todos = [];
    var emptyRounds = 0;

    function siguiente(roundNumber) {
      if (roundNumber > maxRounds) return Promise.resolve(todos);

      return fetchRound(roundNumber)
        .then(function (events) {
          if (!events.length) {
            emptyRounds += 1;
            if (emptyRounds >= 6) return todos;
            return siguiente(roundNumber + 1);
          }

          emptyRounds = 0;
          todos = todos.concat(events);
          return siguiente(roundNumber + 1);
        })
        .catch(function () {
          emptyRounds += 1;
          if (emptyRounds >= 6) return todos;
          return siguiente(roundNumber + 1);
        });
    }

    return siguiente(1);
  }

  function guardarPartidosColoColo(eventos) {
    var vistos = {};
    var partidos = [];

    eventos.forEach(function (ev) {
      if (!ev || !ev.id) return;
      if (vistos[ev.id]) return;
      vistos[ev.id] = true;

      if (!eventoEsColoColo(ev)) return;

      var p = normalizarPartidoSofa(ev, null);
      p.j = buscarJornadaFixture(p);

      partidos.push(p);
      partidosSofa[String(p.j)] = p;
    });

    partidos.sort(function (a, b) {
      var ra = Number(a.round || a.j || 0);
      var rb = Number(b.round || b.j || 0);
      if (ra !== rb) return ra - rb;
      return Number(a.startTimestamp || 0) - Number(b.startTimestamp || 0);
    });

    return partidos;
  }

  function cargarShotmapPartido(partido) {
    if (!partido || !partido.eventId) return Promise.resolve(false);

    // Los partidos futuros no tienen shotmap.
    if (partido.status !== 'finished') return Promise.resolve(false);

    // Si ya lo tenemos, no se repite.
    if (datos[String(partido.j)] && datos[String(partido.j)].shots) {
      return Promise.resolve(true);
    }

    return sofaFetch('/event/' + partido.eventId + '/shotmap')
      .then(function (data) {
        var shots = (data && data.shotmap) || [];

        if (!shots.length) return false;

        datos[String(partido.j)] = {
          fuente: 'auto',
          eventId: partido.eventId,
          matchUrl: partido.matchUrl,
          shots: shots.map(function (s) {
            return transformar(s, partido.homeEsCC);
          })
        };

        guardarCache();
        emitir();

        return true;
      })
      .catch(function () {
        return false;
      });
  }

  function cargarShotmapsSecuencial(partidos) {
    var alguno = false;

    function siguiente(i) {
      if (i >= partidos.length) return Promise.resolve(alguno);

      return cargarShotmapPartido(partidos[i])
        .then(function (ok) {
          if (ok) alguno = true;
          return siguiente(i + 1);
        });
    }

    return siguiente(0);
  }

  function cargar() {
    leerCache();
    sembrarBundle();
    sembrarPartidosFixture();

    if (Object.keys(partidosSofa).length || Object.keys(datos).length) {
      emitir();
    }

    // No recorremos todas las rondas de Sofascore al abrir la app: eso puede
    // gatillar el bloqueo anti-bot. Los datos empaquetados y los eventId del
    // snapshot alcanzan para mostrar lo existente y para que la cola intente
    // solo los pendientes en lotes pequeños.
    estado = 'ok';
    error = null;
    guardarCache();
    emitir();
  }

  // ---------- Cola de actualización por lotes (anti-bloqueo) ----------
  // Sofascore aplica bloqueos temporales si se le pide demasiado seguido.
  // La cola descarga los shotmaps pendientes en lotes pequeños (máx 3),
  // espaciados 5 s, y ante el primer fallo se detiene y reintenta en N horas.
  var COLA_KEY = 'cc_shotmaps_cola_v1';
  var colaProcesando = false;

  function leerCola() {
    try { var c = JSON.parse(localStorage.getItem(COLA_KEY)); if (c && typeof c === 'object') return c; } catch (e) {}
    return { proximo: 0, horas: 3, ultimo: null };
  }
  function guardarCola(c) { try { localStorage.setItem(COLA_KEY, JSON.stringify(c)); } catch (e) {} }

  function eventIdDe(j) {
    var p = partidosSofa[String(j)];
    if (p && p.eventId) return p.eventId;
    try { return ((window.CC_SOFA_SNAPSHOT || {}).eventIds || {})[String(j)] || null; } catch (e) { return null; }
  }

  function urlConocidaDe(j, id) {
    return URLS_CONOCIDAS[String(j)] || (id ? 'https://www.sofascore.com/event/' + id : '');
  }

  function matchUrlDe(j) {
    var p = partidosSofa[String(j)];
    if (p && p.matchUrl) return p.matchUrl;
    var id = eventIdDe(j);
    return urlConocidaDe(j, id);
  }

  function scoreDe(resultado, local) {
    var m = String(resultado || '').match(/(\d+)\s*-\s*(\d+)/);
    if (!m) return { homeScore: null, awayScore: null };
    var a = Number(m[1]);
    var b = Number(m[2]);
    return local ? { homeScore: a, awayScore: b } : { homeScore: b, awayScore: a };
  }

  function sembrarPartidosFixture() {
    var fx = (window.CC_DATA && (CC_DATA.fixture || CC_DATA.partidos)) || [];
    fx.forEach(function (m) {
      if (!m || m.j == null || partidosSofa[String(m.j)]) return;
      var id = eventIdDe(m.j);
      if (!id) return;
      var score = scoreDe(m.resultado, !!m.local);
      partidosSofa[String(m.j)] = {
        j: m.j,
        round: m.j,
        eventId: id,
        matchUrl: urlConocidaDe(m.j, id),
        fecha: m.fecha || null,
        status: m.resultado ? 'finished' : 'notstarted',
        homeTeam: m.local ? 'Colo-Colo' : m.rival,
        awayTeam: m.local ? m.rival : 'Colo-Colo',
        homeScore: score.homeScore,
        awayScore: score.awayScore,
        homeEsCC: !!m.local,
        local: !!m.local,
        rival: m.rival || null
      };
    });
  }

  function partidosJugados() {
    var fx = (window.CC_DATA && (CC_DATA.fixture || CC_DATA.partidos)) || [];
    return fx.filter(function (m) { return m && m.resultado; });
  }

  function tieneTeamStats(j) {
    return !!(window.CC_DATA && (CC_DATA.partidos || []).some(function (p) {
      return String(p.j) === String(j);
    }));
  }

  function tieneShotmap(j) {
    var d = datos[String(j)];
    return !!(d && Array.isArray(d.shots) && d.shots.length);
  }

  function tieneDatosCompletos(j) {
    return tieneTeamStats(j) && tieneShotmap(j);
  }

  function partidosConTeamStats() {
    return partidosJugados().filter(function (m) { return tieneTeamStats(m.j); });
  }

  function resumenShotmaps() {
    var jugados = partidosConTeamStats();
    var todosJugados = partidosJugados();
    var cargados = jugados.filter(function (m) { return tieneDatosCompletos(m.j); });
    var pendientes = jugados
      .filter(function (m) { return !tieneShotmap(m.j) && eventIdDe(m.j); })
      .map(function (m) { return m.j; });
    var pendientesCargaDatos = todosJugados
      .filter(function (m) { return !tieneDatosCompletos(m.j); })
      .map(function (m) { return m.j; });
    return {
      totalJugados: jugados.length,
      cargados: cargados.length,
      pendientes: pendientes,
      pendientesCargaDatos: pendientesCargaDatos,
      jugados: jugados
    };
  }

  function colaPendientes() {
    var out = [];
    partidosConTeamStats().forEach(function (m) {
      if (m && !tieneShotmap(m.j) && eventIdDe(m.j)) out.push(m.j);
    });
    return out;
  }

  function procesarCola(forzar) {
    if (colaProcesando) return Promise.resolve('procesando');
    var c = leerCola();
    var ahora = Date.now();
    if (!forzar && ahora < (c.proximo || 0)) return Promise.resolve('en-espera');
    var pend = colaPendientes();
    if (!pend.length) {
      c.ultimo = 'Al día: todos los partidos con Team Stats tienen shotmap.';
      guardarCola(c); emitir();
      return Promise.resolve('al-dia');
    }
    colaProcesando = true;
    var fx = (window.CC_DATA && CC_DATA.fixture) || [];
    var lote = pend.slice(0, 3);
    var ok = 0;

    function fin(msg, bloqueado) {
      colaProcesando = false;
      c = leerCola();
      c.horas = c.horas || 3;
      // tras éxito parcial o bloqueo, el próximo intento espera N horas
      c.proximo = (bloqueado || colaPendientes().length) ? (Date.now() + c.horas * 3600e3) : 0;
      c.ultimo = msg + ' · ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      guardarCola(c);
      if (ok) guardarCache();
      emitir();
      return ok;
    }

    function paso(i) {
      if (i >= lote.length) return Promise.resolve(fin('Lote completo: ' + ok + ' shotmap(s) nuevos', false));
      var j = lote[i];
      var id = eventIdDe(j);
      var m = null;
      fx.forEach(function (x) { if (x && x.j === j) m = x; });
      return sofaFetchAny('/event/' + id + '/shotmap')
        .then(function (data) {
          var arr = (data && data.shotmap) || [];
          if (!arr.length) throw new Error('sin tiros');
          datos[String(j)] = {
            fuente: 'auto',
            eventId: id,
            shots: arr.map(function (s) { return transformar(s, !!(m && m.local)); })
          };
          ok += 1;
          return new Promise(function (r) { setTimeout(r, 5000); }).then(function () { return paso(i + 1); });
        })
        .catch(function (err) {
          return fin('Bloqueado por Sofascore (' + String((err && err.message) || err).slice(0, 60) + '). ' + ok + ' descargado(s) antes del corte', true);
        });
    }
    return paso(0);
  }

  // Intento automático discreto al abrir la app (respeta el enfriamiento)
  setTimeout(function () { try { procesarCola(false); } catch (e) {} }, 9000);

  window.CC_SHOTMAPS = {
    get: function (j) {
      var d = datos[String(j)];
      return d ? d.shots : null;
    },

    fuente: function (j) {
      var d = datos[String(j)];
      return d ? d.fuente : null;
    },

    partido: function (j) {
      return partidosSofa[String(j)] || null;
    },

    partidos: function () {
      return Object.keys(partidosSofa)
        .map(function (k) { return partidosSofa[k]; })
        .sort(function (a, b) {
          return Number(a.round || a.j || 0) - Number(b.round || b.j || 0);
        });
    },

    links: function () {
      return this.partidos().map(function (p) {
        return {
          j: p.j,
          round: p.round,
          fecha: p.fecha,
          local: p.homeTeam,
          visita: p.awayTeam,
          rival: p.rival,
          status: p.status,
          eventId: p.eventId,
          matchUrl: p.matchUrl
        };
      });
    },

    estado: function () {
      return estado;
    },

    cuantos: function () {
      return resumenShotmaps().cargados;
    },

    resumen: resumenShotmaps,

    eventId: eventIdDe,

    matchUrl: matchUrlDe,

    // --- cola por lotes ---
    cola: function () {
      var c = leerCola();
      return { pendientes: colaPendientes(), proximo: c.proximo || 0, horas: c.horas || 3, ultimo: c.ultimo || null, procesando: colaProcesando };
    },
    setColaHoras: function (h) {
      var c = leerCola();
      c.horas = Math.max(1, Math.min(12, Number(h) || 3));
      guardarCola(c); emitir();
    },
    intentarCola: function () { return procesarCola(true); },

    error: error,

    cargarManual: function (j, texto, partidoLocal) {
      var arr = null;

      try {
        var json = JSON.parse(String(texto).replace(/^\uFEFF/, ''));
        arr = Array.isArray(json) ? json : (json.shotmap || json.shots || null);
      } catch (e) {
        return { ok: false, error: 'JSON inválido.' };
      }

      if (!arr || !arr.length) {
        return {
          ok: false,
          error: 'El archivo no contiene tiros. Se espera JSON de /event/{id}/shotmap o un export con shots/shotmap.'
        };
      }

      var homeEsCC = !!partidoLocal;

      datos[String(j)] = {
        fuente: 'manual',
        shots: arr.map(function (s) {
          return transformar(s, homeEsCC);
        })
      };

      guardarCache();
      emitir();

      return { ok: true, tiros: arr.length };
    },

    quitar: function (j) {
      delete datos[String(j)];
      guardarCache();
      emitir();
    },

    parseEventId: parseEventId,

    // Carga el shotmap de un partido a partir de la URL de Sofascore.
    // Extrae el eventId, descarga /event/{id}/shotmap y lo guarda como 'manual'.
    cargarDesdeUrl: function (j, url, partidoLocal) {
      var eventId = parseEventId(url);
      if (!eventId) {
        return Promise.reject(new Error('No pude extraer el ID del partido. Pega solo el ID, una URL de Sofascore con #id:NNNNN, o una URL /event/NNN/shotmap.'));
      }
      var homeEsCC = !!partidoLocal;
      return sofaFetchAny('/event/' + eventId + '/shotmap').then(function (data) {
        var arr = (data && data.shotmap) || (Array.isArray(data) ? data : null);
        if (!arr || !arr.length) {
          throw new Error('La respuesta de Sofascore no contiene tiros para ese partido.');
        }
        datos[String(j)] = {
          fuente: 'manual',
          eventId: eventId,
          shots: arr.map(function (s) { return transformar(s, homeEsCC); })
        };
        guardarCache();
        emitir();
        return { ok: true, tiros: arr.length, eventId: eventId };
      });
    },

    limpiarCache: function () {
      datos = {};
      partidosSofa = {};
      error = null;

      try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(MATCHES_KEY);
        localStorage.removeItem('cc_shotmaps_auto_v2');
        localStorage.removeItem('cc_shotmaps_auto_v3');
        localStorage.removeItem('cc_shotmaps_auto_v4');
      } catch (e) {}

      emitir();
    },

    reload: function () {
      this.limpiarCache();
      cargar();
    },

    transformar: transformar
  };

  if (window.CC_DATA) cargar();
  else window.addEventListener('DOMContentLoaded', cargar);
})();
