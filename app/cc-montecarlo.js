// ============================================================
// ColoColo Football Center — Simulación Monte Carlo del campeonato
// Proyecta el cierre de la temporada simulando los partidos
// restantes miles de veces y contando cuántas veces cada equipo
// termina campeón, en zona de Libertadores, Sudamericana o descenso.
//
// Datos usados (todos reales de la plataforma):
//  · Tabla actual (Sofascore): PJ, PTS, GF, GC, DG.
//  · Fuerza de ataque/defensa por partido (goles a favor/contra).
//  · xG de Wyscout (métricas de equipo) como ajuste fino.
//  · Fixture real de Colo-Colo: sus 16 rivales restantes y localía,
//    con ajuste por los enfrentamientos previos (head-to-head).
//
// Reglas ANFP 2026 (clasificación a torneos CONMEBOL):
//  · Campeón (1°) → Copa Libertadores (fase de grupos), "Chile 1".
//  · 2°, 3° y 4° → Copa Libertadores (Chile 2 grupos; Chile 3 y 4 fase previa).
//  · 5° a 9° → Copa Sudamericana (5 cupos).
//  · 15° y 16° → Descenso a Primera B.
//  Nota: el campeón de Copa Chile toma un cupo de Libertadores ("Chile 4"),
//  lo que puede correr un lugar los cupos internacionales. Como esa copa
//  se juega aparte, la simulación proyecta solo la tabla del campeonato.
// ============================================================
(function () {
  // Torneo chileno 2026: 16 equipos, 30 fechas.
  var TOTAL_FECHAS = 30;
  var LIGA_GOLES_LOCAL = 1.35;   // media histórica goles del local por partido
  var LIGA_GOLES_VISITA = 1.05;  // media histórica goles de la visita

  // RNG con semilla (Mulberry32) para resultados reproducibles entre corridas
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function poisson(lambda, rand) {
    var L = Math.exp(-lambda), k = 0, p = 1;
    do { k++; p *= rand(); } while (p > L);
    return k - 1;
  }

  function tablaActual() {
    var t = (window.CC_SOFA && CC_SOFA.tabla && CC_SOFA.tabla.length) ? CC_SOFA.tabla
      : (window.CC_SOFA_SNAPSHOT && CC_SOFA_SNAPSHOT.tabla) || [];
    return t;
  }

  // Nivel del plantel por equipo (players stats de Wyscout): promedio ponderado
  // por minutos de un índice de rendimiento por jugador. Devuelve un factor ~1.
  function nivelPlantel() {
    var byTeam = {};
    try {
      (CC_DATA.jugadores || []).forEach(function (j) {
        if (!j.equipo || (j.min || 0) < 200) return;   // sólo con minutos relevantes
        // Índice de jugador: combina finalización, creación, duelos y def. por-90
        var idx = (j.xgP90 || 0) * 3 + (j.xaP90 || 0) * 3 + (j.golesP90 || 0) * 2
          + (j.jugadasClaveP90 || 0) * 0.6 + (j.pasesProgP90 || 0) * 0.08
          + (j.duelosPct || 0) * 0.02 + (j.accDefP90 || 0) * 0.05;
        byTeam[j.equipo] = byTeam[j.equipo] || { s: 0, w: 0 };
        byTeam[j.equipo].s += idx * (j.min || 0);
        byTeam[j.equipo].w += (j.min || 0);
      });
    } catch (e) {}
    var vals = [], out = {};
    Object.keys(byTeam).forEach(function (t) { out[t] = byTeam[t].w ? byTeam[t].s / byTeam[t].w : 0; vals.push(out[t]); });
    // Normaliza a z-score → factor multiplicativo suave (0.9–1.1 aprox)
    var mean = vals.reduce(function (a, b) { return a + b; }, 0) / (vals.length || 1);
    var sd = Math.sqrt(vals.reduce(function (a, b) { return a + (b - mean) * (b - mean); }, 0) / (vals.length || 1)) || 1;
    var factor = {};
    Object.keys(out).forEach(function (t) { factor[t] = 1 + Math.max(-2, Math.min(2, (out[t] - mean) / sd)) * 0.05; });
    return factor;
  }

  // Ataque/defensa por partido, mezclando goles reales con métricas Wyscout
  // de equipo (xG, tiros al arco, posesión, PPDA, pases último tercio) y el
  // nivel del plantel (players stats).
  function fuerzas(tabla) {
    var f = {}, sumGF = 0, sumPJ = 0;
    tabla.forEach(function (r) { sumGF += (r.gf || 0); sumPJ += (r.pj || 0); });
    var ligaGpg = sumPJ ? sumGF / sumPJ : 1.2;
    var nivel = nivelPlantel();
    var ME = (window.CC_DATA && CC_DATA.metricasEquipo) || {};

    // Medias de liga para las métricas de equipo (para normalizar)
    var claves = ['xG', 'Tiros al arco %', 'Posesión %', 'PPDA', 'Pases precisos %', 'Goles en contra', 'Duelos def. ganados %'];
    var med = {};
    claves.forEach(function (k) {
      var vs = Object.keys(ME).filter(function (n) { return n !== 'Promedio adversarios'; })
        .map(function (n) { return ME[n][k]; }).filter(function (v) { return typeof v === 'number'; });
      med[k] = vs.length ? vs.reduce(function (a, b) { return a + b; }, 0) / vs.length : 0;
    });

    tabla.forEach(function (r) {
      var pj = r.pj || 1;
      var atk = (r.gf != null ? r.gf : ligaGpg * pj) / pj;
      var def = (r.gc != null ? r.gc : ligaGpg * pj) / pj;
      var m = ME[r.nombre];
      if (m) {
        // Ajuste ofensivo: xG, tiros al arco %, posesión, pases último tercio
        var offAdj = 1;
        if (typeof m.xG === 'number' && med.xG) offAdj *= (0.6 + 0.4 * (m.xG / med.xG));
        if (typeof m['Tiros al arco %'] === 'number' && med['Tiros al arco %']) offAdj *= (0.85 + 0.15 * (m['Tiros al arco %'] / med['Tiros al arco %']));
        if (typeof m['Posesión %'] === 'number' && med['Posesión %']) offAdj *= (0.9 + 0.1 * (m['Posesión %'] / med['Posesión %']));
        atk = atk * 0.6 + (atk * offAdj) * 0.4;
        // Ajuste defensivo: goles en contra, PPDA (menos = mejor presión), duelos def.
        var defAdj = 1;
        if (typeof m['Goles en contra'] === 'number' && med['Goles en contra']) defAdj *= (0.6 + 0.4 * (m['Goles en contra'] / med['Goles en contra']));
        if (typeof m.PPDA === 'number' && med.PPDA) defAdj *= (0.9 + 0.1 * (m.PPDA / med.PPDA));
        if (typeof m['Duelos def. ganados %'] === 'number' && med['Duelos def. ganados %']) defAdj *= (1.1 - 0.1 * (m['Duelos def. ganados %'] / med['Duelos def. ganados %']));
        def = def * 0.6 + (def * defAdj) * 0.4;
      }
      // Nivel del plantel (players stats): sube ataque, baja defensa recibida
      var nf = nivel[r.nombre] || 1;
      atk *= nf;
      def /= nf;
      f[r.nombre] = { atk: Math.max(0.3, atk), def: Math.max(0.3, def), liga: ligaGpg, nivel: nf };
    });
    return f;
  }

  // Head-to-head de Colo-Colo: balance de goles vs cada rival (histórico Wyscout)
  function h2hColoColo() {
    var h = {};
    try {
      (CC_DATA.fixture || []).forEach(function (m) {
        if (!m.resultado) return;
        var p = m.resultado.split('-').map(Number);
        var gf = p[0], gc = p[1];
        h[m.rival] = h[m.rival] || { gf: 0, gc: 0, n: 0 };
        h[m.rival].gf += gf; h[m.rival].gc += gc; h[m.rival].n++;
      });
    } catch (e) {}
    return h;
  }

  // Goles esperados en un partido i (local?) vs j, con fuerzas relativas
  function lambdas(fi, fj, local, ajuste) {
    var baseL = local ? LIGA_GOLES_LOCAL : LIGA_GOLES_VISITA;
    var baseV = local ? LIGA_GOLES_VISITA : LIGA_GOLES_LOCAL;
    var li = baseL * (fi.atk / fi.liga) * (fj.def / fj.liga) * (ajuste || 1);
    var lj = baseV * (fj.atk / fj.liga) * (fi.def / fi.liga) / (ajuste || 1);
    return [Math.max(0.15, li), Math.max(0.15, lj)];
  }

  function simular(nSims) {
    var tabla = tablaActual();
    if (!tabla.length) return null;
    var f = fuerzas(tabla);
    var h2h = h2hColoColo();
    var nombres = tabla.map(function (r) { return r.nombre; });
    var idx = {}; nombres.forEach(function (n, i) { idx[n] = i; });

    // Fixture restante REAL de Colo-Colo (rival + localía)
    var ccRest = [];
    try {
      (CC_DATA.fixture || []).forEach(function (m) {
        if (!m.resultado && idx[m.rival] != null) ccRest.push({ rival: m.rival, local: !!m.local });
      });
    } catch (e) {}
    var CC = 'Colo-Colo';

    // Acumuladores
    var cont = {};
    nombres.forEach(function (n) { cont[n] = { campeon: 0, libert: 0, sudam: 0, descenso: 0, sumPts: 0, sumPos: 0 }; });

    var rand = rng(20260713);
    for (var s = 0; s < nSims; s++) {
      var pts = {}, dg = {}, gfN = {};
      tabla.forEach(function (r) { pts[r.nombre] = r.pts || 0; dg[r.nombre] = r.dg || 0; gfN[r.nombre] = r.gf || 0; });

      // 1) Partidos restantes de Colo-Colo (rivales reales)
      var jugadosCC = {};
      ccRest.forEach(function (g) {
        var aj = 1;
        var hh = h2h[g.rival];
        if (hh && hh.n) { var bal = (hh.gf - hh.gc) / hh.n; aj = Math.exp(bal * 0.12); } // nudge por historial
        var lam = lambdas(f[CC], f[g.rival], g.local, aj);
        var gc1 = poisson(lam[0], rand), gc2 = poisson(lam[1], rand);
        aplicar(pts, dg, gfN, CC, g.rival, gc1, gc2);
        jugadosCC[g.rival] = (jugadosCC[g.rival] || 0) + 1;
      });

      // 2) Resto de equipos: sus partidos restantes vs rival promedio de la liga
      var avg = { atk: f[CC].liga, def: f[CC].liga, liga: f[CC].liga };
      tabla.forEach(function (r) {
        if (r.nombre === CC) return;
        var jugados = r.pj || 0;
        // Colo-Colo ya enfrentó a este equipo en su fixture restante → descontar
        var resta = TOTAL_FECHAS - jugados - (jugadosCC[r.nombre] || 0);
        for (var k = 0; k < resta; k++) {
          var local = (k % 2 === 0);
          var lam = lambdas(f[r.nombre], avg, local, 1);
          var g1 = poisson(lam[0], rand), g2 = poisson(lam[1], rand);
          aplicar(pts, dg, gfN, r.nombre, '__avg__', g1, g2);
        }
      });

      // 3) Ordenar tabla final (pts, luego dg, luego gf)
      var fin = nombres.slice().sort(function (a, b) {
        return (pts[b] - pts[a]) || (dg[b] - dg[a]) || (gfN[b] - gfN[a]) || (rand() - 0.5);
      });
      fin.forEach(function (n, pos) {
        var c = cont[n];
        c.sumPts += pts[n]; c.sumPos += (pos + 1);
        if (pos === 0) c.campeon++;
        if (pos <= 3) c.libert++;
        else if (pos <= 8) c.sudam++;
        if (pos >= 14) c.descenso++;
      });
    }

    function aplicar(pts, dg, gfN, A, B, gA, gB) {
      gfN[A] += gA; dg[A] += (gA - gB);
      if (B !== '__avg__') { gfN[B] += gB; dg[B] += (gB - gA); }
      if (gA > gB) { pts[A] += 3; }
      else if (gA < gB) { if (B !== '__avg__') pts[B] += 3; }
      else { pts[A] += 1; if (B !== '__avg__') pts[B] += 1; }
    }

    var res = nombres.map(function (n) {
      var c = cont[n], base = tabla[idx[n]];
      return {
        nombre: n, posActual: base.pos || (idx[n] + 1), ptsActual: base.pts, pj: base.pj,
        campeon: c.campeon / nSims, libert: c.libert / nSims, sudam: c.sudam / nSims, descenso: c.descenso / nSims,
        ptsProy: Math.round(c.sumPts / nSims), posProy: c.sumPos / nSims
      };
    }).sort(function (a, b) { return a.posProy - b.posProy; });

    return { nSims: nSims, restantesCC: ccRest.length, filas: res, fecha: new Date().toISOString() };
  }

  window.CC_MONTECARLO = { simular: simular, TOTAL_FECHAS: TOTAL_FECHAS };
})();
