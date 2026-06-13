// ============================================================
// ColoColo Football Center — Página 5: Reporte Post-Partido
// + Campograma v2 (once editable con drag & drop)
// ============================================================
/* global React, CC_DATA, Icon, Card, PageHeader, StatCard, Select, SegTabs, Localia, CCTeamLogo, CCTournamentLogo, ResultPill */

const { useState: p5State, useMemo: p5Memo, useEffect: p5Effect } = React;

// ---------- RNG determinista (mismo partido → mismo mapa) ----------
function ccMulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ---------- Media cancha vertical Opta / SofaScore ----------
// Sistema interno:
// depth: 0-100 · 100 = línea de gol rival
// width: 0-100 · 50 = centro del arco
// En pantalla:
// x = width
// y = 2 + (100 - depth) * K
//
// Distancia:
// Se calcula desde el centro del arco rival, no desde el centro del campo.
// Campo estándar: 105m x 68m.
// Misma lógica del notebook Python:
// dx = (100 - depth) * 1.05
// dy = abs(50 - width) * 0.68
// distancia = sqrt(dx² + dy²)
// ------------------------------------------------------------
const CC_PITCH_K = 0.77;
const CC_FIELD_LENGTH_M = 105;
const CC_FIELD_WIDTH_M = 68;

function ccClamp(v, min, max) {
  v = Number(v);
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

function ccShotX(width) {
  return ccClamp(width, 0, 100);
}

function ccShotY(depth) {
  const d = ccClamp(depth, 50, 100);
  return 2 + (100 - d) * CC_PITCH_K;
}

function ccShotDistanceM(depth, width) {
  const d = ccClamp(depth, 0, 100);
  const w = ccClamp(width, 0, 100);

  const dx = (100 - d) * (CC_FIELD_LENGTH_M / 100);
  const dy = Math.abs(50 - w) * (CC_FIELD_WIDTH_M / 100);

  return Math.round(Math.sqrt(dx * dx + dy * dy) * 100) / 100;
}

function ccShotInBox(depth, width) {
  const d = ccClamp(depth, 0, 100);
  const w = ccClamp(width, 0, 100);

  // Área grande real: 16.5m de profundidad, 40.32m de ancho.
  const boxDepth = 100 - (16.5 / CC_FIELD_LENGTH_M) * 100;
  const halfBoxWidth = (20.16 / CC_FIELD_WIDTH_M) * 100;

  return (
    d >= boxDepth &&
    w >= 50 - halfBoxWidth &&
    w <= 50 + halfBoxWidth
  );
}

function ccShotZone(depth, width) {
  if (ccShotInBox(depth, width)) return 'Área';
  if (depth >= 80) return 'Borde del área / zona 14';
  if (depth >= 65) return 'Media distancia';
  return 'Lejana';
}

function ccShotRadius(xg) {
  const v = Number(xg);
  const safe = Number.isFinite(v) ? v : 0.05;

  // Más estable visualmente que r = 1.3 + xg * 4.
  // Evita que tiros de bajo xG desaparezcan.
  return Math.max(1.35, Math.min(4.8, 1.4 + Math.sqrt(safe) * 4.8));
}

// ---------- Generador de tiros por partido ----------
// Respeta los totales reales Wyscout (tiros, al arco, goles, xG);
// las POSICIONES son ilustrativas cuando no hay shotmap real.
function ccGenerarTiros(partido, lado) {
  const st = lado === 'cc' ? partido.cc : partido.rv;
  const goles = lado === 'cc' ? partido.gf : partido.gc;
  const nTiros = Math.max(Math.round(st.tiros || 0), goles);
  const alArco = Math.min(nTiros, Math.max(Math.round(st.tirosArco || 0), goles));
  const xgTotal = st.xg || 0;
  const rnd = ccMulberry32(partido.j * 7919 + (lado === 'cc' ? 13 : 31));

  // Pesos de xG (los goles pesan más)
  const pesos = [];
  for (let i = 0; i < nTiros; i++) {
    pesos.push(Math.pow(rnd(), 2) + (i < goles ? 0.55 : 0.04));
  }
  const suma = pesos.reduce((a, b) => a + b, 0) || 1;

  // Jugadores de Colo-Colo, ponderados por volumen real de remates
  let plantel = [];
  if (lado === 'cc') {
    plantel = CC_DATA.jugadores
      .filter(j => j.equipo === 'Colo-Colo' && j.min > 0 && j.grupo !== 'Arquero')
      .map(j => ({ nombre: j.nombre, w: j.tirosP90 * j.min / 90 + 0.1, wGol: j.goles + 0.25 }));
  }

  const elegir = (arr, key) => {
    const tot = arr.reduce((a, x) => a + x[key], 0);
    let r = rnd() * tot;
    for (const x of arr) {
      r -= x[key];
      if (r <= 0) return x.nombre;
    }
    return arr[arr.length - 1].nombre;
  };

  const tiros = [];

  for (let i = 0; i < nTiros; i++) {
    const xg = Math.min(0.92, (pesos[i] / suma) * xgTotal);
    const esGol = i < goles;
    const esAlArco = i < alArco;

    let resultado;
    if (esGol) resultado = 'gol';
    else if (esAlArco) resultado = 'atajado';
    else resultado = rnd() < 0.32 ? 'bloqueado' : 'fuera';

    // Coordenadas Opta: depth 0-100 con 100 = línea de gol rival.
    const cerca = Math.min(1, xg * 2.4 + (esGol ? 0.18 : 0));
    const distU = 6 + (1 - cerca) * 34 + (rnd() - 0.5) * 6; // unidades Opta desde el arco
    const anchoU = 18 + Math.min(distU, 30) * 1.3;
    const widthRandom = 50 + (rnd() - 0.5) * anchoU;

    const depth = ccClamp(100 - distU, 52, 96);
    const width = ccClamp(widthRandom, 6, 94);

    tiros.push({
      depth,
      width,
      endDepth: null,
      endWidth: null,
      distanciaM: ccShotDistanceM(depth, width),
      enArea: ccShotInBox(depth, width),
      zona: ccShotZone(depth, width),
      xg,
      resultado,
      jugador: lado === 'cc' && plantel.length ? elegir(plantel, esGol ? 'wGol' : 'w') : null,
      lado,
      fuenteCoord: 'ilustrativo'
    });
  }

  return tiros;
}

const CC_RES_TIRO = {
  gol: { label: 'Gol', clase: 'gol' },
  atajado: { label: 'Atajado', clase: 'atajado' },
  bloqueado: { label: 'Bloqueado', clase: 'bloqueado' },
  fuera: { label: 'Desviado', clase: 'fuera' },
  palo: { label: 'Palo', clase: 'palo' },
  autogol: { label: 'Gol en contra', clase: 'autogol' }
};

function ccNormalizarTiroVisual(t) {
  if (!t) return null;

  const rawDepth = Number(t.depth);
  const rawWidth = Number(t.width);

  if (!Number.isFinite(rawDepth) || !Number.isFinite(rawWidth)) return null;
  if (rawDepth < 50) return null;

  const depth = ccClamp(rawDepth, 50, 100);
  const width = ccClamp(rawWidth, 0, 100);

  return {
    ...t,
    depth,
    width,
    endDepth: t.endDepth == null ? null : ccClamp(t.endDepth, 50, 100),
    endWidth: t.endWidth == null ? null : ccClamp(t.endWidth, 0, 100),
    distanciaM: Number.isFinite(Number(t.distanciaM)) ? Number(t.distanciaM) : ccShotDistanceM(depth, width),
    enArea: typeof t.enArea === 'boolean' ? t.enArea : ccShotInBox(depth, width),
    zona: t.zona || ccShotZone(depth, width),
    xg: Number.isFinite(Number(t.xg)) ? Number(t.xg) : 0.05,
    resultado: t.resultado || 'fuera'
  };
}

// ---------- Shotmap media cancha vertical (estilo mplsoccer, tamaño fijo) ----------
// Dimensiones Opta (0-100). Replica VerticalPitch(pitch_type='opta', half=True).
const CC_SM_DIM = {
  boxFrontX: 83, boxTopY: 21.1, boxBottomY: 78.9,
  sixFrontX: 94.2, sixTopY: 36.8, sixBottomY: 63.2,
  penSpotX: 88.5, penArcR: 9.4, goalTopY: 45.2, goalBottomY: 54.8, centreR: 9.15
};
const CC_SM = { VB_W: 100, VB_H: 64, PAD: 3, PITCH: '#22312b', LINE: '#ffffff', LINE_W: 0.45, SHOT: '#ffd000', GOAL: '#ff4d4d' };

function ccSmXgRadius(xg) {
  const c = Math.max(0, Math.min(1, Number(xg) || 0));
  return 1.7 + Math.sqrt(c) * 3.4;
}
// Opta (x avance 50-100, y ancho 0-100) -> viewBox vertical (arco arriba)
function ccSmToSvg(x, y) {
  const sx = y;
  const sy = CC_SM.PAD + ((100 - x) / 50) * (CC_SM.VB_H - 2 * CC_SM.PAD);
  return { cx: sx, cy: sy };
}

function CCShotmap({ tiros, seleccionado }) {
  const [hover, setHover] = p5State(null);

  const visibles = (tiros || []).map(ccNormalizarTiroVisual).filter(Boolean);
  const goles = visibles.filter(t => t.resultado === 'gol' || t.resultado === 'autogol').length;
  const xgTot = visibles.reduce((a, t) => a + (Number(t.xg) || 0), 0);

  const L = (x1, y1, x2, y2, key) => {
    const a = ccSmToSvg(x1, y1), b = ccSmToSvg(x2, y2);
    return <line key={key} x1={a.cx} y1={a.cy} x2={b.cx} y2={b.cy}></line>;
  };
  const Rect = (xFront, yTop, yBottom, key) => {
    const tl = ccSmToSvg(100, yTop), fr = ccSmToSvg(xFront, yBottom);
    return <rect key={key} x={Math.min(tl.cx, fr.cx)} y={Math.min(tl.cy, fr.cy)} width={Math.abs(fr.cx - tl.cx)} height={Math.abs(fr.cy - tl.cy)}></rect>;
  };

  const pen = ccSmToSvg(CC_SM_DIM.penSpotX, 50);
  const arcDX = Math.sqrt(Math.max(0, CC_SM_DIM.penArcR ** 2 - (CC_SM_DIM.penSpotX - CC_SM_DIM.boxFrontX) ** 2));
  const pa1 = ccSmToSvg(CC_SM_DIM.boxFrontX, 50 - arcDX), pa2 = ccSmToSvg(CC_SM_DIM.boxFrontX, 50 + arcDX);
  const rUnitsY = (CC_SM_DIM.penArcR / 50) * (CC_SM.VB_H - 2 * CC_SM.PAD);
  const ca1 = ccSmToSvg(50, 50 - CC_SM_DIM.centreR), ca2 = ccSmToSvg(50, 50 + CC_SM_DIM.centreR);
  const cRY = (CC_SM_DIM.centreR / 50) * (CC_SM.VB_H - 2 * CC_SM.PAD);
  const gl = ccSmToSvg(100, CC_SM_DIM.goalTopY), gr = ccSmToSvg(100, CC_SM_DIM.goalBottomY);

  const tip = hover != null ? visibles[hover] : null;

  return (
    <div className="cc-shotmap2">
      <svg viewBox={`${-CC_SM.PAD} 0 ${CC_SM.VB_W + CC_SM.PAD * 2} ${CC_SM.VB_H}`} className="cc-shotmap2-svg" onMouseLeave={() => setHover(null)}>
        <rect x={-CC_SM.PAD} y={0} width={CC_SM.VB_W + CC_SM.PAD * 2} height={CC_SM.VB_H} fill={CC_SM.PITCH}></rect>
        <g fill="none" stroke={CC_SM.LINE} strokeWidth={CC_SM.LINE_W} strokeLinecap="round" opacity="0.92">
          {L(100, 0, 100, 100, 'gl')}
          {L(50, 0, 50, 100, 'ml')}
          {L(50, 0, 100, 0, 'li')}
          {L(50, 100, 100, 100, 'ld')}
          {Rect(CC_SM_DIM.boxFrontX, CC_SM_DIM.boxTopY, CC_SM_DIM.boxBottomY, 'box')}
          {Rect(CC_SM_DIM.sixFrontX, CC_SM_DIM.sixTopY, CC_SM_DIM.sixBottomY, 'six')}
          <line x1={gl.cx} y1={gl.cy} x2={gl.cx} y2={gl.cy - 1.4}></line>
          <line x1={gr.cx} y1={gr.cy} x2={gr.cx} y2={gr.cy - 1.4}></line>
          <line x1={gl.cx} y1={gl.cy - 1.4} x2={gr.cx} y2={gr.cy - 1.4}></line>
          <circle cx={pen.cx} cy={pen.cy} r={0.6} fill={CC_SM.LINE} stroke="none"></circle>
          <path d={`M ${pa1.cx} ${pa1.cy} A ${CC_SM_DIM.penArcR} ${rUnitsY} 0 0 1 ${pa2.cx} ${pa2.cy}`}></path>
          <path d={`M ${ca1.cx} ${ca1.cy} A ${CC_SM_DIM.centreR} ${cRY} 0 0 0 ${ca2.cx} ${ca2.cy}`}></path>
        </g>

        {visibles.map((t, i) => {
          const { cx, cy } = ccSmToSvg(t.depth, t.width);
          const r = ccSmXgRadius(t.xg);
          const esGol = t.resultado === 'gol' || t.resultado === 'autogol';
          const isHover = hover === i;
          const dimmed = (hover !== null && !isHover) || (seleccionado && t.jugador !== seleccionado);
          const fill = esGol ? CC_SM.GOAL : CC_SM.SHOT;
          return (
            <g key={i} style={{ cursor: 'pointer' }} opacity={dimmed ? 0.32 : 1} onMouseEnter={() => setHover(i)}>
              {isHover && <circle cx={cx} cy={cy} r={r + 1.4} fill="none" stroke="#fff" strokeWidth={0.5}></circle>}
              <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={esGol ? 1 : 0.85} stroke={esGol ? '#fff' : fill} strokeWidth={esGol ? 0.5 : 0.4}></circle>
            </g>
          );
        })}
      </svg>

      <div className="cc-shotmap2-tip">
        {tip ? (
          <div className="cc-shotmap2-tiprow">
            <strong>{tip.jugador || 'Sin datos'}</strong>
            <span>{(CC_RES_TIRO[tip.resultado] || CC_RES_TIRO.fuera).label} · {Number(tip.xg || 0).toFixed(2)} xG{tip.minuto != null ? " · " + tip.minuto + "'" : ''} · {Number(tip.distanciaM || 0).toFixed(1)} m</span>
          </div>
        ) : (
          <span className="cc-shotmap2-empty">{visibles.length} tiros · {goles} {goles === 1 ? 'gol' : 'goles'} · {xgTot.toFixed(2)} xG — pasa el cursor sobre un tiro</span>
        )}
      </div>

      <div className="cc-shotmap2-legend">
        <span className="cc-shotmap2-dot"><svg width="12" height="12"><circle cx="6" cy="6" r="4.5" fill={CC_SM.GOAL}></circle></svg>Gol</span>
        <span className="cc-shotmap2-dot"><svg width="12" height="12"><circle cx="6" cy="6" r="4.5" fill={CC_SM.SHOT}></circle></svg>Tiro</span>
        <span className="cc-shotmap2-size">tamaño = xG</span>
      </div>
    </div>
  );
}

// ---------- Estadísticas del jugador seleccionado ----------
// Empareja nombre Sofascore ("Javier Correa") con Wyscout ("J. Correa")
function ccBuscarJugadorCC(nombre) {
  if (!nombre) return null;
  const plantel = CC_DATA.jugadores.filter(j => j.equipo === 'Colo-Colo');
  const directo = plantel.find(j => j.nombre === nombre);
  if (directo) return directo;
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const partes = norm(nombre).split(' ');
  const apellido = partes[partes.length - 1];
  return plantel.find(j => {
    const jp = norm(j.nombre).split(' ');
    return jp[jp.length - 1] === apellido;
  }) || null;
}

// ---------- Fila comparativa CC vs rival ----------
function FilaMetrica({ label, a, b, menosEsMejor, fmt }) {
  const f = fmt || (v => v);
  const va = a || 0, vb = b || 0, total = va + vb || 1;
  const ganaA = menosEsMejor ? va < vb : va > vb;
  const ganaB = menosEsMejor ? vb < va : vb > va;
  return (
    <div className="cc-versus-row">
      <span className={'cc-versus-val' + (ganaA ? ' win' : '')}>{f(va)}</span>
      <div className="cc-versus-mid">
        <span className="cc-versus-label">{label}</span>
        <div className="cc-versus-track">
          <div className="a" style={{ width: (va / total) * 100 + '%' }}></div>
          <div className="b" style={{ width: (vb / total) * 100 + '%' }}></div>
        </div>
      </div>
      <span className={'cc-versus-val' + (ganaB ? ' win' : '')}>{f(vb)}</span>
    </div>
  );
}

// ---------------- Reporte Post-Partido ----------------
function PageReporte() {
  const partidos = CC_DATA.partidos;
  const [idx, setIdx] = p5State(partidos.length - 1);
  const [lado, setLado] = p5State('cc');
  const [jugadorSel, setJugadorSel] = p5State(null);
  const [filtroAccion, setFiltroAccion] = p5State('todas');
  const [, setTick] = p5State(0);

  p5Effect(() => {
    const f = () => setTick(t => t + 1);
    window.addEventListener('cc-shotmaps-ready', f);
    return () => window.removeEventListener('cc-shotmaps-ready', f);
  }, []);

  const p = partidos[idx];
  const realShots = window.CC_SHOTMAPS ? window.CC_SHOTMAPS.get(p.j) : null;
  const estadoShot = window.CC_SHOTMAPS ? window.CC_SHOTMAPS.estado() : 'cargando';
  const fuenteShot = window.CC_SHOTMAPS ? window.CC_SHOTMAPS.fuente(p.j) : null;

  const tiros = p5Memo(() => {
    if (realShots) return realShots.filter(t => t.lado === lado);
    return ccGenerarTiros(p, lado);
  }, [p.j, lado, realShots]);

  // Jugadores con remates en este partido (lado CC)
  const participantes = p5Memo(() => {
    const base = realShots ? realShots.filter(t => t.lado === 'cc') : ccGenerarTiros(p, 'cc');
    const m = {};

    base.forEach(t => {
      if (!t.jugador) return;
      m[t.jugador] = m[t.jugador] || { tiros: 0, goles: 0, xg: 0 };
      m[t.jugador].tiros++;
      m[t.jugador].xg += Number(t.xg) || 0;
      if (t.resultado === 'gol') m[t.jugador].goles++;
    });

    return Object.entries(m).sort((a, b) => b[1].xg - a[1].xg);
  }, [p.j, realShots]);

  const statsSel = jugadorSel ? ccBuscarJugadorCC(jugadorSel) : null;
  const opciones = partidos.map((m, i) => ({
    value: String(i),
    label: 'P' + m.j + ' · ' + (m.local ? 'vs' : 'en') + ' ' + m.rival + ' (' + m.resultado + ')'
  }));
  const fechaLarga = new Date(p.fecha + 'T12:00:00').toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="cc-page">
      <PageHeader
        icon="reporte" title="Reporte Post-Partido"
        subtitle="Análisis completo del partido con datos Wyscout"
        right={<Select label="Partido" value={String(idx)} onChange={v => { setIdx(Number(v)); setJugadorSel(null); }} options={opciones}></Select>}
      ></PageHeader>

      <Card className="cc-pad cc-reporte-head">
        <div className="cc-reporte-meta">
          <span className="cc-reporte-torneo"><CCTournamentLogo size={20}></CCTournamentLogo>Liga de Primera · Temporada 2026</span>
          <span>Partido {p.j} de {partidos.length}</span>
          <span>{fechaLarga}</span>
          <span className="cc-reporte-cond"><Localia local={p.local} mini={true}></Localia>{p.local ? 'Estadio Monumental · Local' : 'Visita'}</span>
          <span>Esquema {p.cc.esquema || '—'} vs {p.rv.esquema || '—'}</span>
        </div>
        <div className="cc-next-match-body">
          <div className="cc-next-team">
            <CCTeamLogo team="Colo-Colo" size={64}></CCTeamLogo>
            <strong>Colo-Colo</strong>
          </div>
          <div className="cc-next-vs">
            <span className="cc-reporte-marcador">{p.gf} – {p.gc}</span>
            <ResultPill resultado={p.resultado}></ResultPill>
          </div>
          <div className="cc-next-team">
            <CCTeamLogo team={p.rival} size={64}></CCTeamLogo>
            <strong>{p.rival}</strong>
          </div>
        </div>
      </Card>

      <div className="cc-grid-2 cc-reporte-cuerpo">
        <Card className="cc-pad">
          <div className="cc-chart-head">
            <h3 className="cc-card-title">Shotmap</h3>
            <SegTabs value={lado} onChange={v => { setLado(v); setJugadorSel(null); }} options={[
              { value: 'cc', label: 'Colo-Colo' },
              { value: 'rv', label: p.rival }
            ]}></SegTabs>
          </div>
          <CCShotmap tiros={tiros} seleccionado={lado === 'cc' ? jugadorSel : null}></CCShotmap>
          <div className="cc-shot-upload">
            {realShots
              ? <span className="cc-pill cc-pill-v">Shotmap real · {realShots.length} tiros · {fuenteShot === 'auto' ? 'Sofascore automático' : 'archivo del notebook'}</span>
              : estadoShot === 'cargando'
                ? <span className="cc-pill cc-pill-pendiente">Buscando shotmap en Sofascore…</span>
                : <span className="cc-pill cc-pill-pendiente">Posiciones ilustrativas (totales Wyscout reales)</span>}
            {(() => {
              const ps = window.CC_SHOTMAPS && window.CC_SHOTMAPS.partido ? window.CC_SHOTMAPS.partido(p.j) : null;
              return ps && ps.matchUrl ? (
                <a className="cc-pill cc-pill-link" href={ps.matchUrl} target="_blank" rel="noopener noreferrer">Ver en Sofascore ↗</a>
              ) : null;
            })()}
          </div>
          {!realShots && estadoShot !== 'cargando' && (
            <div className="cc-shot-upload">
              <button className="cc-btn-ghost" onClick={() => { if (window.CC_SHOTMAPS && window.CC_SHOTMAPS.reload) window.CC_SHOTMAPS.reload(); }}>
                <Icon name="descargar" size={14}></Icon> Reintentar descarga
              </button>
              <a className="cc-btn-ghost" href="#config">Cargar JSON del notebook → Configuración</a>
            </div>
          )}
          {!realShots && estadoShot === 'bloqueado' && (
            <p className="cc-card-note">Sofascore rechazó la conexión desde esta red (challenge anti-bot). El reintento prueba de nuevo todas las rutas; si persiste, sube el JSON del notebook en Configuración — queda guardado y este aviso desaparece.</p>
          )}
        </Card>

        <Card className="cc-pad">
          <h3 className="cc-card-title">Métricas del partido</h3>
          <div className="cc-versus-head">
            <div><strong>Colo-Colo</strong></div>
            <div><strong>{p.rival}</strong></div>
          </div>
          <div className="cc-versus">
            <FilaMetrica label="Goles" a={p.gf} b={p.gc}></FilaMetrica>
            <FilaMetrica label="xG" a={p.cc.xg} b={p.rv.xg} fmt={v => v.toFixed(2)}></FilaMetrica>
            <FilaMetrica label="Tiros" a={p.cc.tiros} b={p.rv.tiros}></FilaMetrica>
            <FilaMetrica label="Tiros al arco" a={p.cc.tirosArco} b={p.rv.tirosArco}></FilaMetrica>
            <FilaMetrica label="PPDA (presión)" a={p.cc.ppda} b={p.rv.ppda} menosEsMejor={true} fmt={v => v.toFixed(1)}></FilaMetrica>
            <FilaMetrica label="Pases último tercio" a={p.cc.finalThird} b={p.rv.finalThird}></FilaMetrica>
            <FilaMetrica label="Córners con remate" a={p.cc.corners} b={p.rv.corners}></FilaMetrica>
            <FilaMetrica label="Posesión %" a={p.cc.posesion} b={p.rv.posesion} fmt={v => v + '%'}></FilaMetrica>
          </div>
          <p className="cc-card-note">Pases último tercio: {p.cc.finalThirdOk} logrados de {p.cc.finalThird} (CC) · {p.rv.finalThirdOk} de {p.rv.finalThird} ({p.rival}).</p>
        </Card>
      </div>

      <Card className="cc-pad">
        <div className="cc-chart-head">
          <h3 className="cc-card-title">Acciones de jugador</h3>
        </div>
        <div className="cc-player-actions">
          <div className="cc-actions-head">
            <div className="cc-actions-selector">
              <label>
                <input type="radio" name="team-view" value="cc" checked={lado === 'cc'} onChange={() => { setLado('cc'); setJugadorSel(null); }}></input>
                <span className="cc-radio-label"><CCTeamLogo team="Colo-Colo" size={20}></CCTeamLogo>Colo-Colo</span>
              </label>
              <label>
                <input type="radio" name="team-view" value="rival" checked={lado === 'rival'} onChange={() => { setLado('rival'); setJugadorSel(null); }}></input>
                <span className="cc-radio-label"><CCTeamLogo team={p.rival} size={20}></CCTeamLogo>{p.rival}</span>
              </label>
            </div>
          </div>

          {(() => {
            const equipoNombre = lado === 'cc' ? 'Colo-Colo' : p.rival;
            const plantel = CC_DATA.jugadores
              .filter(j => j.equipo === equipoNombre && (j.min || 0) > 0)
              .sort((a, b) => (b.min || 0) - (a.min || 0));
            if (plantel.length === 0) return <p className="cc-empty">Sin jugadores con datos para este equipo.</p>;
            const seleccionado = (jugadorSel && plantel.find(j => j.nombre === jugadorSel)) ? jugadorSel : plantel[0].nombre;
            const jug = plantel.find(j => j.nombre === seleccionado);
            const acciones = ccGenerarAcciones(jug, p, lado);

            // Filtro por tipo de acción (lista desplegable)
            const FILTROS = {
              todas: a => true,
              pase: a => a.tipo === 'pase' || a.tipo === 'paseLargo' || a.tipo === 'asistencia',
              centro: a => a.tipo === 'centro',
              carrera: a => a.tipo === 'carrera',
              regate: a => a.tipo === 'regate',
              defensa: a => a.tipo === 'entrada' || a.tipo === 'intercepcion' || a.tipo === 'despeje' || a.tipo === 'recuperacion',
              remate: a => a.kind === 'shot'
            };
            const accionesFiltradas = acciones.filter(FILTROS[filtroAccion] || FILTROS.todas);

            const resumen = {};
            acciones.forEach(a => {
              const k = a.kind === 'shot' ? 'remate' : a.tipo;
              resumen[k] = (resumen[k] || 0) + 1;
            });
            const chips = [
              ['pase', 'Pases'], ['paseLargo', 'Pases largos'], ['asistencia', 'Asistencias'],
              ['centro', 'Centros'], ['carrera', 'Carreras'], ['regate', 'Regates'],
              ['entrada', 'Entradas'], ['intercepcion', 'Intercepciones'], ['despeje', 'Despejes'],
              ['recuperacion', 'Recuperaciones'], ['remate', 'Remates']
            ].filter(([k]) => resumen[k]);

            return (
              <React.Fragment>
                <div className="cc-acc-controls">
                  <Select label="Jugador" value={seleccionado} onChange={setJugadorSel}
                    options={plantel.map(j => ({ value: j.nombre, label: j.nombre + ' · ' + j.posicion }))}
                    style={{ minWidth: '240px' }}></Select>
                  <Select label="Acción a mostrar" value={filtroAccion} onChange={setFiltroAccion}
                    options={[
                      { value: 'todas', label: 'Todas las acciones' },
                      { value: 'pase', label: 'Pases y asistencias' },
                      { value: 'centro', label: 'Centros' },
                      { value: 'carrera', label: 'Carreras con balón' },
                      { value: 'regate', label: 'Regates' },
                      { value: 'defensa', label: 'Defensivas (entradas, intercep., despejes, recup.)' },
                      { value: 'remate', label: 'Remates' }
                    ]}
                    style={{ minWidth: '240px' }}></Select>
                  <div className="cc-acc-playerline">
                    <CCTeamLogo team={equipoNombre} size={26}></CCTeamLogo>
                    <div>
                      <strong>{jug.nombre}</strong>
                      <span>{jug.posicion} · {jug.min} min · {accionesFiltradas.length} {filtroAccion === 'todas' ? 'acciones' : 'mostradas'}</span>
                    </div>
                  </div>
                </div>

                <div className="cc-acc-chips">
                  {chips.map(([k, label]) => (
                    <span key={k} className={'cc-acc-chip' + (
                      (filtroAccion === 'pase' && (k === 'pase' || k === 'paseLargo' || k === 'asistencia')) ||
                      (filtroAccion === 'defensa' && (k === 'entrada' || k === 'intercepcion' || k === 'despeje' || k === 'recuperacion')) ||
                      filtroAccion === k ? ' activo' : ''
                    )} onClick={() => {
                      const mapa = { pase: 'pase', paseLargo: 'pase', asistencia: 'pase', centro: 'centro', carrera: 'carrera', regate: 'regate', entrada: 'defensa', intercepcion: 'defensa', despeje: 'defensa', recuperacion: 'defensa', remate: 'remate' };
                      setFiltroAccion(mapa[k] || 'todas');
                    }}><strong>{resumen[k]}</strong>{label}</span>
                  ))}
                </div>

                <div className="cc-acc-pitch-wrap">
                  <CCActionPitch acciones={accionesFiltradas}></CCActionPitch>
                </div>
                <CCActionLegend acciones={accionesFiltradas}></CCActionLegend>
                <p className="cc-card-note" style={{ marginTop: '12px', marginBottom: 0 }}>Acciones distribuidas en cancha a partir de las estadísticas reales por-90 (Wyscout) y la posición del jugador. Usa el desplegable o haz clic en un chip para filtrar por tipo. Ataque hacia la derecha.</p>
              </React.Fragment>
            );
          })()}
        </div>
      </Card>
    </div>
  );
}

// ---------------- Campograma v2: once editable ----------------
const CC_COORDS_433 = [
  { x: 50, y: 93, rol: 'GK' }, { x: 84, y: 76, rol: 'DEF' }, { x: 64, y: 82, rol: 'DEF' },
  { x: 36, y: 82, rol: 'DEF' }, { x: 16, y: 76, rol: 'DEF' }, { x: 50, y: 62, rol: 'MED' },
  { x: 70, y: 48, rol: 'MED' }, { x: 30, y: 48, rol: 'MED' }, { x: 82, y: 26, rol: 'ATA' },
  { x: 18, y: 26, rol: 'ATA' }, { x: 50, y: 16, rol: 'ATA' }
];

function ccLeerOnce() {
  try {
    const raw = localStorage.getItem('cc_once_v1');
    if (raw) {
      const o = JSON.parse(raw);
      if (Array.isArray(o) && o.length === 11) return o;
    }
  } catch (e) {}
  return CC_DATA.alineacion.titulares.map(t => t.nombre);
}

function PageCampogramaV2() {
  const [once, setOnce] = p5State(ccLeerOnce);
  const [sel, setSel] = p5State(null);
  const [agarrado, setAgarrado] = p5State(null); // nombre desde lista (click o drag)
  const [overSlot, setOverSlot] = p5State(null);

  const plantel = p5Memo(() =>
    CC_DATA.jugadores.filter(j => j.equipo === 'Colo-Colo' && j.min >= 0).sort((a, b) => b.min - a.min), []);

  const guardar = lista => {
    setOnce(lista);
    try { localStorage.setItem('cc_once_v1', JSON.stringify(lista)); } catch (e) {}
  };

  const asignar = (slotIdx, nombre) => {
    const nueva = [...once];
    const yaEsta = nueva.indexOf(nombre);
    if (yaEsta >= 0 && yaEsta !== slotIdx) nueva[yaEsta] = nueva[slotIdx]; // intercambio
    nueva[slotIdx] = nombre;
    guardar(nueva);
    setAgarrado(null);
    setOverSlot(null);
  };

  const onDropSlot = (e, slotIdx) => {
    e.preventDefault();
    const nombre = e.dataTransfer.getData('text/plain') || agarrado;
    if (nombre) asignar(slotIdx, nombre);
  };

  const reset = () => {
    guardar(CC_DATA.alineacion.titulares.map(t => t.nombre));
    setSel(null);
  };

  const jugador = sel ? CC_DATA.jugadores.find(j => j.nombre === sel && j.equipo === 'Colo-Colo') : null;
  const apellido = n => {
    const p = n.split(' ');
    return p.length > 1 ? p[p.length - 1] : n;
  };

  return (
    <div className="cc-page">
      <PageHeader
        icon="campograma" title="Campograma"
        subtitle="Arrastra jugadores del listado a una posición (o haz clic en jugador y luego en la posición) · esquema 4-3-3"
        right={<button className="cc-btn-ghost" onClick={reset}>Restaurar once con más minutos</button>}
      ></PageHeader>

      <div className="cc-campo-layout-v2">
        <Card className="cc-pad">
          <svg viewBox="0 0 100 130" className="cc-campo">
            <rect x="2" y="2" width="96" height="126" rx="2" className="cc-campo-base"></rect>
            <line x1="2" y1="65" x2="98" y2="65" className="cc-campo-linea"></line>
            <circle cx="50" cy="65" r="11" className="cc-campo-linea" fill="none"></circle>
            <rect x="26" y="2" width="48" height="17" className="cc-campo-linea" fill="none"></rect>
            <rect x="26" y="111" width="48" height="17" className="cc-campo-linea" fill="none"></rect>
            {CC_COORDS_433.map((c, i) => {
              const nombre = once[i];
              const j = CC_DATA.jugadores.find(x => x.nombre === nombre && x.equipo === 'Colo-Colo');
              const activo = sel === nombre;
              const esOver = overSlot === i;
              const cy = c.y * 1.26 + 2;
              return (
                <g
                  key={i} className="cc-campo-jugador"
                  style={{ cursor: 'pointer' }}
                  onClick={() => agarrado ? asignar(i, agarrado) : setSel(nombre)}
                  onDragOver={e => { e.preventDefault(); setOverSlot(i); }}
                  onDragLeave={() => setOverSlot(null)}
                  onDrop={e => onDropSlot(e, i)}
                >
                  <circle cx={c.x} cy={cy} r={esOver ? 6 : activo ? 5.2 : 4.4} className={(activo ? 'activo' : '') + (esOver ? ' over' : '')}></circle>
                  <text x={c.x} y={cy + 1.2} textAnchor="middle" className="cc-campo-num">{j ? j.posicion : c.rol}</text>
                  <text x={c.x} y={cy + 8} textAnchor="middle" className="cc-campo-nombre">{apellido(nombre)}</text>
                </g>
              );
            })}
          </svg>
        </Card>

        <Card className="cc-pad cc-plantel-lista">
          <h3 className="cc-card-title">Plantel ({plantel.length})</h3>
          <p className="cc-card-note">{agarrado ? 'Seleccionado: ' + agarrado + ' — haz clic en una posición del campo' : 'Arrastra al campo o haz clic para seleccionar'}</p>
          <div className="cc-plantel-scroll">
            {plantel.map(j => {
              const enOnce = once.includes(j.nombre);
              return (
                <div
                  key={j.nombre}
                  className={'cc-plantel-item' + (enOnce ? ' en-once' : '') + (agarrado === j.nombre ? ' agarrado' : '')}
                  draggable="true"
                  onDragStart={e => { e.dataTransfer.setData('text/plain', j.nombre); setAgarrado(j.nombre); }}
                  onDragEnd={() => setAgarrado(null)}
                  onClick={() => setAgarrado(agarrado === j.nombre ? null : j.nombre)}
                >
                  <span className="cc-plantel-pos">{j.posicion}</span>
                  <span className="cc-plantel-nombre">{j.nombre}</span>
                  <span className="cc-plantel-min">{j.min}'</span>
                  {enOnce && <Icon name="check" size={13}></Icon>}
                </div>
              );
            })}
          </div>
        </Card>

        {jugador && (
          <Card className="cc-pad cc-campo-side">
            <div className="cc-chart-head">
              <h3 className="cc-card-title">{jugador.nombre}</h3>
              <button className="cc-btn-ghost" onClick={() => setSel(null)}>Cerrar</button>
            </div>
            <p className="cc-scout-meta">{jugador.posicion} · {jugador.edad} años · {jugador.pj} partidos{jugador.altura ? ' · ' + jugador.altura + ' cm' : ''}{jugador.pie ? ' · ' + jugador.pie : ''}</p>
            <div className="cc-campo-stats">
              <StatCard label="Minutos" value={jugador.min + "'"}></StatCard>
              <StatCard label="Goles" value={jugador.goles}></StatCard>
              <StatCard label="Asistencias" value={jugador.asist}></StatCard>
              <StatCard label="xG" value={jugador.xg.toFixed(2)}></StatCard>
              <StatCard label="Precisión pase" value={jugador.pasesPct + '%'}></StatCard>
              <StatCard label="xA" value={jugador.xa.toFixed(2)}></StatCard>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  PageReporte,
  PageCampograma: PageCampogramaV2,
  CCShotmap,
  ccGenerarTiros,
  ccBuscarJugadorCC,
  ccShotDistanceM,
  ccShotInBox,
  ccShotZone
});
