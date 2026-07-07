// ============================================================
// ColoColo Football Center — Dirección Técnica (motor de estado)
// Fuente única de verdad del estado de cada jugador. Combina:
//   · datos REALES del dataset (minutos, PJ, amarillas, rojas,
//     edad, altura, pie)
//   · el plantel editable de Gestión (lesiones, cesiones)
//   · registros manuales del staff (moral, suspensión, peso,
//     wellness diario, plan nutricional, ajuste físico)
// La condición física es una ESTIMACIÓN determinista:
//   carga de minutos + foco de entrenamiento + último wellness
//   + ajuste manual. Se etiqueta como estimación en la UI.
// Propagación: campograma, inicio (alertas), gestión y mercado.
// ============================================================
(function () {
  var KEY = 'cc_dt_v1';

  function leer() {
    try { var v = JSON.parse(localStorage.getItem(KEY)); if (v && typeof v === 'object') return v; } catch (e) {}
    return {};
  }
  var st = Object.assign({ jug: {}, fis: {}, well: {}, nutri: {}, plan: { presion: '', linea: '', amplitud: '', nota: '' }, entren: { foco: 'tactico' } }, leer());
  st.jug = st.jug || {}; st.fis = st.fis || {}; st.well = st.well || {}; st.nutri = st.nutri || {}; st.gps = st.gps || {};
  st.plan = Object.assign({ presion: '', linea: '', amplitud: '', nota: '', torneo: '', rival: '' }, st.plan || {});
  // Historial de wellness por fecha: { nombre: { 'AAAA-MM-DD': {sueno..} } }
  st.wellH = st.wellH || {};
  var dtMigro = false;
  Object.keys(st.well).forEach(function (n) {   // migra el formato antiguo (1 registro) y LIMPIA la fuente
    var w = st.well[n];
    if (w && w.fecha) {
      st.wellH[n] = st.wellH[n] || {};
      if (!st.wellH[n][w.fecha]) st.wellH[n][w.fecha] = { sueno: w.sueno, fatiga: w.fatiga, dolor: w.dolor, estres: w.estres, animo: w.animo };
    }
    delete st.well[n];                          // sin esto, los registros borrados resucitaban al recargar
    dtMigro = true;
  });
  if (dtMigro) { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  // Migración a la escala de estrellas (v2): los registros antiguos guardaban
  // fatiga/dolor/estrés con 1 = mejor; se invierten una sola vez (v → 6-v)
  // para que el historial conserve su significado con la escala 5 = mejor.
  if (!st.wellPolV2) {
    Object.keys(st.wellH).forEach(function (n) {
      var dias = st.wellH[n] || {};
      Object.keys(dias).forEach(function (f) {
        var r = dias[f] || {};
        ['fatiga', 'dolor', 'estres'].forEach(function (k) {
          if (r[k] != null && r[k] >= 1 && r[k] <= 5) r[k] = 6 - r[k];
        });
      });
    });
    st.wellPolV2 = true;
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
  }
  function guardar() {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {}
    try { window.dispatchEvent(new Event('cc-dt-change')); } catch (e) {}
  }

  function statsCC() {
    try { return (window.CC_DATA.jugadores || []).filter(function (j) { return j.equipo === 'Colo-Colo'; }); } catch (e) { return []; }
  }
  function plantelGestion() {
    var ed = [];
    try { ed = JSON.parse(localStorage.getItem('cc_plantel_v1')) || []; } catch (e) {}
    if ((!Array.isArray(ed) || !ed.length) && window.CC_GESTION) ed = (CC_GESTION.plantel || []);
    var m = {};
    (ed || []).forEach(function (p) { if (p && p.nombre) m[p.nombre] = p; });
    return m;
  }

  var FOCOS = {
    recuperacion: { label: 'Recuperación', delta: 4 },
    tactico:      { label: 'Táctico',      delta: 0 },
    fisico:       { label: 'Físico intensivo', delta: -5 },
    balonparado:  { label: 'Balón parado', delta: -1 }
  };
  var MORAL = ['Muy baja', 'Baja', 'Normal', 'Alta', 'Muy alta'];
  // Escala uniforme: 1 bajo · 5 mejor en TODOS los ítems (estrellas)
  var WELL_ITEMS = [
    { k: 'sueno',  label: 'Sueño' },
    { k: 'fatiga', label: 'Energía' },
    { k: 'dolor',  label: 'Estado muscular' },
    { k: 'estres', label: 'Calma' },
    { k: 'animo',  label: 'Ánimo' }
  ];

  function hoyISO() { return new Date().toISOString().slice(0, 10); }

  // Puntaje wellness 0-100 (escala uniforme: 1 bajo · 5 mejor)
  function wellScore(w) {
    if (!w) return null;
    var tot = 0, n = 0;
    WELL_ITEMS.forEach(function (it) {
      var v = Number(w[it.k]);
      if (!v) return;
      tot += v; n++;
    });
    if (!n) return null;
    return Math.round((tot / n) / 5 * 100);
  }
  function wellVigente(w) {
    if (!w || !w.fecha) return false;
    var dias = Math.round((new Date(hoyISO() + 'T12:00') - new Date(w.fecha + 'T12:00')) / 864e5);
    return dias >= 0 && dias <= 4;
  }

  function estadoDe(nombre) {
    var stats = null;
    statsCC().forEach(function (j) { if (j.nombre === nombre) stats = j; });
    var pl = plantelGestion()[nombre] || null;
    var ju = st.jug[nombre] || {};
    var fis = st.fis[nombre] || {};
    var gps = st.gps[nombre] || null;
    var hist = st.wellH[nombre] || {};
    var fechasW = Object.keys(hist).sort();
    var well = fechasW.length ? Object.assign({ fecha: fechasW[fechasW.length - 1] }, hist[fechasW[fechasW.length - 1]]) : null;
    var nutri = st.nutri[nombre] || {};
    var min = stats ? (stats.min || 0) : 0;
    var maxMin = 1;
    statsCC().forEach(function (j) { maxMin = Math.max(maxMin, j.min || 0); });
    var carga = min / maxMin;                                   // 0..1 sobre el más usado
    var foco = FOCOS[st.entren.foco] || FOCOS.tactico;
    var ws = wellScore(well);
    var wellDelta = (ws != null && wellVigente(well)) ? Math.round((ws - 60) / 13) : 0;  // ±3 aprox
    var cond = Math.round(96 - 14 * carga + foco.delta + wellDelta + (ju.condAjuste || 0));
    cond = Math.max(55, Math.min(99, cond));
    // Carga GPS reciente (ACWR: relación aguda 7d / crónica 28d). >1.5 = pico de riesgo.
    var acwr = (gps && gps.aguda && gps.cronica) ? Math.round(gps.aguda / gps.cronica * 100) / 100 : null;
    var gpsVigente = gps && gps.fecha && Math.round((new Date(hoyISO() + 'T12:00') - new Date(gps.fecha + 'T12:00')) / 864e5) <= 7;
    var gpsRiesgo = acwr != null && gpsVigente && (acwr > 1.5 || acwr < 0.8);

    // Índice de disponibilidad AUTOMÁTICO (0-100): combina wellness, carga de
    // minutos y carga GPS reciente (ACWR). Cae a 0 si no está disponible.
    var readiness;
    if (lesionadoCalc() || cedidoCalc() || suspendidoCalc()) {
      readiness = 0;
    } else {
      var rw = (ws != null && wellVigente(well)) ? ws : 70;      // wellness (o neutro 70)
      var rc = Math.max(0, 100 - Math.max(0, carga - 0.55) / 0.45 * 45);  // carga minutos
      var rg = 100;
      if (acwr != null && gpsVigente) {
        var dev = Math.abs(acwr - 1.0);                          // óptimo ~1.0 (zona 0.8–1.3)
        rg = Math.max(35, 100 - dev * 90);
      }
      readiness = Math.round(rw * 0.4 + rc * 0.3 + rg * 0.3);
      readiness = Math.max(1, Math.min(100, readiness));
    }
    function lesionadoCalc() { return !!(pl && (pl.estado === 'Lesionado' || pl.lesion)); }
    function cedidoCalc() { return !!(pl && pl.cesion && pl.cesion.direccion === 'sale'); }
    function suspendidoCalc() { return !!ju.susp || !!ju.suspTipo; }
    var estadoAuto = readiness === 0 ? 'No disponible'
      : readiness >= 82 ? 'Óptimo'
      : readiness >= 66 ? 'Apto'
      : readiness >= 50 ? 'En gestión' : 'Riesgo';

    var am = stats ? (stats.amarillas || 0) : 0;
    var ro = stats ? (stats.rojas || 0) : 0;
    var lesionado = !!(pl && (pl.estado === 'Lesionado' || pl.lesion));
    var cedido = !!(pl && pl.cesion && pl.cesion.direccion === 'sale');
    var suspendido = !!ju.susp || !!ju.suspTipo;
    var altura = stats ? (stats.altura || null) : null;
    var peso = fis.peso ? Number(fis.peso) : null;
    return {
      nombre: nombre,
      posicion: stats ? stats.posicion : (pl ? (pl.posicionStat || pl.posicion) : ''),
      grupo: stats ? stats.grupo : '',
      edad: stats ? (stats.edad || null) : null,
      altura: altura, pie: stats ? (stats.pie || '') : '',
      peso: peso,
      imc: (peso && altura) ? Math.round(peso / Math.pow(altura / 100, 2) * 10) / 10 : null,
      min: min, pj: stats ? (stats.pj || 0) : 0,
      minPJ: stats && stats.pj ? Math.round(min / stats.pj) : 0,
      carga: Math.round(carga * 100),
      cargaNivel: carga >= 0.85 ? 'Alta' : carga >= 0.55 ? 'Media' : 'Baja',
      riesgoCarga: carga >= 0.85,
      gps: gps, acwr: acwr, gpsVigente: !!gpsVigente, gpsRiesgo: gpsRiesgo,
      readiness: readiness, estadoAuto: estadoAuto,
      condicion: cond, condAjuste: ju.condAjuste || 0,
      moral: typeof ju.moral === 'number' ? ju.moral : 2,
      moralLabel: MORAL[typeof ju.moral === 'number' ? ju.moral : 2],
      amarillas: am, rojas: ro,
      riesgo: am > 0 && am % 5 === 4,
      suspendido: suspendido, suspNota: ju.suspNota || '',
      suspTipo: ju.suspTipo || '', suspFechas: ju.suspFechas || null,
      wellRegistros: fechasW.length,
      lesionado: lesionado, lesion: pl ? pl.lesion : null,
      cedido: cedido, cesion: pl ? pl.cesion : null,
      mercado: ju.mercado || null,
      well: well, wellScore: ws, wellVigente: wellVigente(well),
      wellAlerta: ws != null && wellVigente(well) && ws < 55,
      nutri: nutri,
      disponible: !lesionado && !suspendido && !cedido,
      motivo: lesionado ? 'lesión' : suspendido ? 'suspensión' : cedido ? 'cesión' : ''
    };
  }

  function plantelCC() {
    var vistos = {}, nombres = [];
    statsCC().forEach(function (j) { if (!vistos[j.nombre]) { vistos[j.nombre] = 1; nombres.push(j.nombre); } });
    Object.keys(plantelGestion()).forEach(function (n) { if (!vistos[n]) { vistos[n] = 1; nombres.push(n); } });
    var lista = nombres.map(estadoDe);
    lista.sort(function (a, b) { return b.min - a.min; });
    return lista;
  }

  // Materializa el estado "en mercado" en la lista de Jugadores para ofrecer
  function syncMercado(nombre, tipo) {
    var MKEY = 'cc_para_ofrecer_v1';
    var lista = null;
    try { lista = JSON.parse(localStorage.getItem(MKEY)); } catch (e) {}
    if (!Array.isArray(lista)) {
      lista = [];
      try { if (window.CC_GESTION) lista = JSON.parse(JSON.stringify(CC_GESTION.paraOfrecer || [])); } catch (e) {}
    }
    var idx = -1;
    lista.forEach(function (o, i) { if (o && o.origen === 'dt' && o.jugador === nombre) idx = i; });
    if (tipo) {
      var est = estadoDe(nombre);
      var item = {
        jugador: nombre, posicion: est.posicion || '', edad: est.edad || '', tipo: tipo,
        motivo: 'Decisión de Dirección Técnica', interesados: '', agente: '',
        estado: 'Ofrecido', nota: '', informe: '', videos: [], origen: 'dt'
      };
      if (idx >= 0) lista[idx] = Object.assign({}, lista[idx], { tipo: tipo });
      else lista.unshift(item);
    } else if (idx >= 0) {
      lista.splice(idx, 1);
    }
    try { localStorage.setItem(MKEY, JSON.stringify(lista)); } catch (e) {}
  }

  window.CC_DT = {
    MORAL: MORAL,
    FOCOS: FOCOS,
    WELL_ITEMS: WELL_ITEMS,
    wellScore: wellScore,
    estadoDe: estadoDe,
    plantelCC: plantelCC,
    setJugador: function (nombre, patch) {
      st.jug[nombre] = Object.assign({}, st.jug[nombre] || {}, patch);
      if ('mercado' in patch) syncMercado(nombre, patch.mercado || null);
      guardar();
    },
    setFis: function (nombre, patch) {
      st.fis[nombre] = Object.assign({}, st.fis[nombre] || {}, patch);
      guardar();
    },
    setGps: function (nombre, patch) {
      st.gps[nombre] = Object.assign({ fecha: hoyISO() }, st.gps[nombre] || {}, patch);
      guardar();
    },
    setWell: function (nombre, patch) { window.CC_DT.setWellDia(nombre, hoyISO(), patch); },
    setWellDia: function (nombre, fecha, patch) {
      if (!fecha) fecha = hoyISO();
      st.wellH[nombre] = st.wellH[nombre] || {};
      st.wellH[nombre][fecha] = Object.assign({}, st.wellH[nombre][fecha] || {}, patch);
      guardar();
    },
    delWellDia: function (nombre, fecha) {
      if (st.wellH[nombre]) {
        delete st.wellH[nombre][fecha];
        if (!Object.keys(st.wellH[nombre]).length) delete st.wellH[nombre];
      }
      guardar();
    },
    wellHist: function (nombre) {
      var h = st.wellH[nombre] || {};
      return Object.keys(h).sort().reverse().map(function (f) { return Object.assign({ fecha: f }, h[f]); });
    },
    setNutri: function (nombre, patch) {
      st.nutri[nombre] = Object.assign({}, st.nutri[nombre] || {}, patch);
      guardar();
    },
    getPlan: function () { return Object.assign({}, st.plan); },
    setPlan: function (patch) { st.plan = Object.assign({}, st.plan, patch); guardar(); },
    getEntrenamiento: function () { return Object.assign({}, st.entren); },
    setEntrenamiento: function (patch) { st.entren = Object.assign({}, st.entren, patch); guardar(); }
  };
})();
