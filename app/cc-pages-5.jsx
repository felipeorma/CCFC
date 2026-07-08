// ============================================================
// ColoColo Football Center — Página 5: Reporte Post-Partido
// + Campograma v2 (once editable con drag & drop)
// ============================================================
/* global React, CC_DATA, Icon, Card, PageHeader, StatCard, Select, SegTabs, Localia, CCTeamLogo, CCTournamentLogo, ResultPill */

const { useState: p5State, useMemo: p5Memo, useEffect: p5Effect } = React;

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
// Empareja nombre ("Javier Correa") con ("J. Correa")
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
// ---------- Posiciones promedio (por partido) ----------
function avgApellido(n) { const parts = String(n || '').trim().split(' '); return parts.length > 1 ? parts[parts.length - 1] : (parts[0] || ''); }

function CCAvgPosiciones({ p, eventId }) {
 const [equipo, setEquipo] = p5State('ambos');
 const [, setTick] = p5State(0);
 React.useEffect(() => {
  const f = () => setTick(t => t + 1);
  window.addEventListener('cc-actions-dl', f);
  return () => window.removeEventListener('cc-actions-dl', f);
 }, []);
 const item = eventId != null && window.CC_ACTIONS_BUNDLE ? window.CC_ACTIONS_BUNDLE[String(eventId)] : null;
 const avg = item && item.avgPos ? item.avgPos : null;

 const puntos = p5Memo(() => {
  if (!avg) return [];
  const out = [];
  ['cc', 'rv'].forEach(lado => {
   const meta = (item && item[lado]) || [];
   (avg[lado] || []).forEach(pt => {
    const m = meta.find(x => String(x.id) === String(pt.i)) || null;
    if ((m && m.titular === false) || pt.s) return;   // solo el XI inicial
    const sx = lado === 'cc' ? (pt.y / 100) * 68 : 68 - (pt.y / 100) * 68;
    const sy = lado === 'cc' ? 100 - pt.x : pt.x;
    out.push({ lado, x: sx, y: sy, n: pt.n, d: pt.d || (m && m.dorsal) || '', min: m ? m.minutos : null });
   });
  });
  return out;
 }, [avg, item]);

 const visibles = puntos.filter(t => equipo === 'ambos' || t.lado === equipo);
 const L = { fill: 'none', stroke: 'rgba(255,255,255,0.55)', strokeWidth: 0.4 };

 return (
  <Card className="cc-pad cc-avgpos-sec">
   <div className="cc-chart-head">
    <h3 className="cc-card-title">Posiciones promedio</h3>
    <div className="cc-avgpos-controles">
     <SegTabs value={equipo} onChange={setEquipo} options={[
      { value: 'ambos', label: 'Ambos' },
      { value: 'cc', label: 'Colo-Colo' },
      { value: 'rv', label: p.rival }
     ]}></SegTabs>
     {avg && <ExportJPGButton targetSelector=".cc-avgpos-sec" filename="posiciones-promedio" titulo="Posiciones Promedio"></ExportJPGButton>}
    </div>
   </div>
   {!avg ? (
    <p className="cc-card-note">Este partido aún no tiene las posiciones promedio descargadas. Ve a <strong>Configuración → Datos Sofascore → Acciones por jugador</strong> y descárgalo (si ya estaba descargado aparecerá como «Parcial»: al pulsar Descargar solo baja lo que falta).</p>
   ) : (
    <React.Fragment>
     <p className="cc-card-note">Ubicación media de las acciones de cada titular en este partido · Colo-Colo ataca hacia arriba. Pasa el cursor por un punto para ver el nombre y los minutos.</p>
     <div className="cc-avgpos-wrap">
      <svg viewBox="0 0 68 100" className="cc-avgpos-svg" preserveAspectRatio="xMidYMid meet">
       <rect x="0" y="0" width="68" height="100" rx="1.4" fill="#1b6f40"></rect>
       <rect x="1.5" y="1.5" width="65" height="97" {...L}></rect>
       <line x1="1.5" y1="50" x2="66.5" y2="50" {...L}></line>
       <circle cx="34" cy="50" r="9.15" {...L}></circle>
       <circle cx="34" cy="50" r="0.5" fill="rgba(255,255,255,0.55)" stroke="none"></circle>
       <rect x="13.85" y="81.5" width="40.3" height="16.5" {...L}></rect>
       <rect x="24.84" y="92.5" width="18.32" height="5.5" {...L}></rect>
       <rect x="13.85" y="1.5" width="40.3" height="16.5" {...L}></rect>
       <rect x="24.84" y="1.5" width="18.32" height="5.5" {...L}></rect>
       {visibles.map((t, i) => (
        <g key={i} className="cc-avgpos-tok">
         <title>{t.n + (t.min != null ? ' · ' + t.min + String.fromCharCode(39) : '')}</title>
         <circle cx={t.x} cy={t.y} r="2.7" fill={t.lado === 'cc' ? '#0b0b0d' : '#BE1622'} stroke="#fff" strokeWidth="0.45"></circle>
         {t.d ? <text x={t.x} y={t.y + 0.9} textAnchor="middle" fontSize="2.5" fontWeight="800" fill="#fff">{t.d}</text> : null}
         <text x={t.x} y={t.y + 5.4} textAnchor="middle" fontSize="2.3" fontWeight="700" fill="#fff" stroke="rgba(0,0,0,0.55)" strokeWidth="0.35" paintOrder="stroke">{avgApellido(t.n)}</text>
        </g>
       ))}
      </svg>
     </div>
     <div className="cc-avgpos-leyenda">
      <span><i className="cc-avgpos-dot cc"></i> Colo-Colo</span>
      <span><i className="cc-avgpos-dot rv"></i> {p.rival}</span>
     </div>
    </React.Fragment>
   )}
  </Card>
 );
}

function PageReporte() {
 const [lado, setLado] = p5State('cc');
 const [jugadorSel, setJugadorSel] = p5State(null);
 const [filtroAccion, setFiltroAccion] = p5State('todas');
 const [filtroRes, setFiltroRes] = p5State('todas');
 const [lineupsAcciones, setLineupsAcciones] = p5State(null);
 const [accionesJugador, setAccionesJugador] = p5State([]);
 const [estadoAcciones, setEstadoAcciones] = p5State('idle');
 const [errorAcciones, setErrorAcciones] = p5State('');
 const [accionesRetry, setAccionesRetry] = p5State(0);
 const [tick, setTick] = p5State(0);

 p5Effect(() => {
  const f = () => setTick(t => t + 1);
  window.addEventListener('cc-shotmaps-ready', f);
  return () => window.removeEventListener('cc-shotmaps-ready', f);
 }, []);

 // Partidos con stats Wyscout + fechas del fixture que ya tienen shotmap
 // cargado (Configuración → Shotmaps) aunque aún no tengan Team Stats.
 const partidos = p5Memo(() => {
  const base = CC_DATA.partidos;
  const extra = (CC_DATA.fixture || [])
   .filter(f => window.CC_SHOTMAPS && window.CC_SHOTMAPS.get(f.j) && !base.some(x => String(x.j) === String(f.j)))
   .map(f => ({ j: f.j, rival: f.rival, local: f.local, fecha: f.fecha, resultado: f.resultado || 's/r', sinStats: true }));
  return base.concat(extra).sort((a, b) => Number(a.j) - Number(b.j));
 }, [tick]);
 const [idx, setIdx] = p5State(partidos.length - 1);

 const p = partidos[Math.min(idx, partidos.length - 1)];
 const realShots = window.CC_SHOTMAPS ? window.CC_SHOTMAPS.get(p.j) : null;
 const estadoShot = window.CC_SHOTMAPS ? window.CC_SHOTMAPS.estado() : 'cargando';
 const fuenteShot = window.CC_SHOTMAPS ? window.CC_SHOTMAPS.fuente(p.j) : null;
 const partidoSofa = window.CC_SHOTMAPS && window.CC_SHOTMAPS.partido ? window.CC_SHOTMAPS.partido(p.j) : null;
 const partidoBundle = window.CC_SHOTMAPS_BUNDLE && window.CC_SHOTMAPS_BUNDLE[String(p.j)];
 const eventId = (partidoSofa && partidoSofa.eventId) || (partidoBundle && partidoBundle.eventId) || null;
 const homeEsCC = partidoSofa && typeof partidoSofa.homeEsCC === 'boolean' ? partidoSofa.homeEsCC : !!p.local;
 // Solo jugadores con acciones disponibles en ESTE partido
 const bundleEv = eventId != null && window.CC_ACTIONS_BUNDLE ? window.CC_ACTIONS_BUNDLE[String(eventId)] : null;
 const conAcciones = j => {
  if (String(j.id).startsWith('shot:')) return true;
  if (bundleEv && bundleEv.actions) {
   const acc = bundleEv.actions[String(j.id)];
   if (Array.isArray(acc) && acc.length > 0) return true;
   return (realShots || []).some(t => t.lado === lado && t.jugador === j.nombre);
  }
  if (j.minutos > 0) return true;
  // Suplentes no utilizados llegan sin minutos (null): cross-check con el
  // paquete real de estadísticas por partido y con el shotmap.
  if (window.CC_LINEUPS && CC_LINEUPS.jugador(p.j, lado, j.nombre)) return true;
  return (realShots || []).some(t => t.lado === lado && t.jugador === j.nombre);
 };
 const jugadoresAcciones = ((lineupsAcciones && lineupsAcciones[lado]) || []).filter(conAcciones);
 const jugadorAccion = jugadoresAcciones.find(j => String(j.id) === String(jugadorSel)) || null;

 p5Effect(() => {
  let activo = true;
  setLineupsAcciones(null);
  setAccionesJugador([]);
  setErrorAcciones('');
  if (!eventId || !window.CC_ACTIONS) {
   setEstadoAcciones('error');
   setErrorAcciones('No hay identificador disponible para cargar las acciones de este partido.');
   return () => { activo = false; };
  }
  setEstadoAcciones('cargando-lineup');
  window.CC_ACTIONS.getLineups(eventId, homeEsCC).then(lineups => {
   if (!activo) return;
   setLineupsAcciones(lineups);
   setEstadoAcciones('idle');
  }).catch(err => {
   if (!activo) return;
   const fallback = { cc: [], rv: [] };
   (realShots || []).forEach(shot => {
    if (!shot.jugador || !fallback[shot.lado]) return;
    if (fallback[shot.lado].some(j => j.nombre === shot.jugador)) return;
    fallback[shot.lado].push({ id: 'shot:' + shot.lado + ':' + shot.jugador, nombre: shot.jugador, posicion: '', dorsal: '', minutos: null, titular: null, lado: shot.lado });
   });
   fallback.cc.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
   fallback.rv.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
   if (fallback.cc.length || fallback.rv.length) {
    setLineupsAcciones(fallback);
    setEstadoAcciones('lineup-parcial');
    setErrorAcciones(String((err && err.message) || err));
   } else {
    setEstadoAcciones('error');
    setErrorAcciones(String((err && err.message) || err));
   }
  });
  return () => { activo = false; };
 }, [p.j, eventId, homeEsCC, accionesRetry, realShots]);

 p5Effect(() => {
  let activo = true;
  setAccionesJugador([]);
  setErrorAcciones('');
  if (!jugadorAccion || !eventId || !window.CC_ACTIONS) return () => { activo = false; };
  setEstadoAcciones('cargando-acciones');
  window.CC_ACTIONS.getPlayerActions(eventId, jugadorAccion, realShots || []).then(acciones => {
   if (!activo) return;
   setAccionesJugador(acciones);
   setEstadoAcciones(acciones.ccParcial ? 'parcial' : 'listo');
   setErrorAcciones(acciones.ccParcial ? acciones.ccError : '');
  }).catch(err => {
   if (!activo) return;
   setEstadoAcciones('error');
   setErrorAcciones(String((err && err.message) || err));
  });
  return () => { activo = false; };
 }, [eventId, jugadorSel, jugadorAccion && jugadorAccion.id, realShots, accionesRetry]);


 const tiros = p5Memo(() => {
  if (realShots) return realShots.filter(t => t.lado === lado);
  return [];
 }, [p.j, lado, realShots]);
 const opciones = partidos.map((m, i) => ({
  value: String(i),
  label: 'P' + m.j + ' · ' + (m.local ? 'vs' : 'en') + ' ' + m.rival + ' (' + m.resultado + ')' + (m.sinStats ? ' · solo shotmap' : '')
 }));
 const fechaLarga = new Date(p.fecha + 'T12:00:00').toLocaleDateString('es-CL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
 });

 return (
  <div className="cc-page">
   <CCPrintMarca></CCPrintMarca>
   <CCPrintHeader titulo="Reporte Post-Partido 2026"></CCPrintHeader>
   <PageHeader
    icon="reporte" title="Reporte Post-Partido"
    subtitle="Análisis completo del partido"
    right={<div className="cc-reporte-acciones">
     <Select label="Partido" value={String(idx)} onChange={v => { setIdx(Number(v)); setJugadorSel(null); }} options={opciones}></Select>
     <ExportJPGButton targetSelector="#cc-reporte-partido-cap" filename="reporte-partido" titulo="Reporte Post-Partido"></ExportJPGButton>
    </div>}
   ></PageHeader>

   <div id="cc-reporte-partido-cap">
   <Card className="cc-pad cc-reporte-head">
    <div className="cc-reporte-meta">
     <span className="cc-reporte-torneo"><CCTournamentLogo size={20}></CCTournamentLogo>Liga de Primera · Temporada 2026</span>
     <span>Partido {p.j} de {partidos.length}</span>
     <span>{fechaLarga}</span>
     <span className="cc-reporte-cond"><Localia local={p.local} mini={true}></Localia>{p.local ? 'Estadio Monumental · Local' : 'Visita'}</span>
     <span>Esquema {p.cc ? (p.cc.esquema || '—') : '—'} vs {p.rv ? (p.rv.esquema || '—') : '—'}</span>
    </div>
    <div className="cc-next-match-body">
     <div className="cc-next-team">
      <CCTeamLogo team="Colo-Colo" size={64}></CCTeamLogo>
      <strong>Colo-Colo</strong>
     </div>
     <div className="cc-next-vs">
      <span className="cc-reporte-marcador">{p.gf != null ? p.gf + ' – ' + p.gc : (p.resultado && p.resultado !== 's/r' ? p.resultado.replace('-', ' – ') : '—')}</span>
      <ResultPill resultado={p.resultado}></ResultPill>
     </div>
     <div className="cc-next-team">
      <CCTeamLogo team={p.rival} size={64}></CCTeamLogo>
      <strong>{p.rival}</strong>
     </div>
    </div>
   </Card>

   <div className="cc-grid-2 cc-reporte-cuerpo cc-reporte-partido-sec">
    <Card className="cc-pad cc-reporte-shotmaps">
     <div className="cc-chart-head">
      <h3 className="cc-card-title">Shotmap</h3>
      <SegTabs value={lado} onChange={v => { setLado(v); setJugadorSel(null); }} options={[
       { value: 'cc', label: 'Colo-Colo' },
       { value: 'rv', label: p.rival }
      ]}></SegTabs>
     </div>
     {realShots
      ? <CCShotmap tiros={tiros} seleccionado={null}></CCShotmap>
      : <p className="cc-empty">Shotmap real no disponible para este partido.</p>}
     {/* Ambos shotmaps, solo al exportar el PDF del partido */}
     {realShots && <div className="cc-print-only cc-print-dualshot">
      <div className="cc-dualshot-col">
       <h4 className="cc-dualshot-t"><CCTeamLogo team="Colo-Colo" size={18}></CCTeamLogo> Colo-Colo</h4>
       <CCShotmap tiros={realShots.filter(t => t.lado === 'cc')} seleccionado={null}></CCShotmap>
      </div>
      <div className="cc-dualshot-col">
       <h4 className="cc-dualshot-t"><CCTeamLogo team={p.rival} size={18}></CCTeamLogo> {p.rival}</h4>
       <CCShotmap tiros={realShots.filter(t => t.lado === 'rv')} seleccionado={null}></CCShotmap>
      </div>
     </div>}
     <div className="cc-shot-upload">
      {realShots
       ? <span className="cc-pill cc-pill-v">Shotmap real · {realShots.length} tiros · {fuenteShot === 'auto' ? 'automático' : 'archivo del notebook'}</span>
       : estadoShot === 'cargando'
        ? <span className="cc-pill cc-pill-pendiente">Buscando shotmap…</span>
        : <span className="cc-pill cc-pill-pendiente">Shotmap real no disponible</span>}
      {(() => {
       const ps = window.CC_SHOTMAPS && window.CC_SHOTMAPS.partido ? window.CC_SHOTMAPS.partido(p.j) : null;
       return ps && ps.matchUrl ? (
        <a className="cc-pill cc-pill-link" href={ps.matchUrl} target="_blank" rel="noopener noreferrer">Ver ↗</a>
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
      <p className="cc-card-note">rechazó la conexión desde esta red (challenge anti-bot). El reintento prueba de nuevo todas las rutas; si persiste, sube el JSON del notebook en Configuración — queda guardado y este aviso desaparece.</p>
     )}
    </Card>

    {p.cc ? (
    <Card className="cc-pad cc-reporte-metricas">
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
      <FilaMetrica label="Pases 1/3 (logrados)" a={p.cc.finalThirdOk} b={p.rv.finalThirdOk}></FilaMetrica>
      <FilaMetrica label="Pases 1/3 (intentados)" a={p.cc.finalThird} b={p.rv.finalThird}></FilaMetrica>
      <FilaMetrica label="Córners con remate" a={p.cc.corners} b={p.rv.corners}></FilaMetrica>
      <FilaMetrica label="Posesión %" a={p.cc.posesion} b={p.rv.posesion} fmt={v => v + '%'}></FilaMetrica>
     </div>
    </Card>
    ) : (
    <Card className="cc-pad cc-reporte-metricas">
     <h3 className="cc-card-title">Métricas del partido</h3>
     <p className="cc-card-note">Este partido aún no tiene Team Stats de Wyscout cargados — solo el shotmap. Sube el archivo del equipo en Configuración → Carga de datos y las métricas aparecerán aquí.</p>
    </Card>
    )}
   </div>
   </div>

   <Card className="cc-pad cc-reporte-acciones-sec" id="cc-reporte-acciones-cap">
    <div className="cc-chart-head">
     <h3 className="cc-card-title">Acciones de jugadores</h3>
    </div>
    <div className="cc-player-actions">
     <div className="cc-actions-selector">
      <label>
       <input type="radio" name="team-view" value="cc" checked={lado === 'cc'} onChange={() => { setLado('cc'); setJugadorSel(null); setFiltroAccion('todas'); setFiltroRes('todas'); }}></input>
       <span className="cc-radio-label"><CCTeamLogo team="Colo-Colo" size={20}></CCTeamLogo>Colo-Colo</span>
      </label>
      <label>
       <input type="radio" name="team-view" value="rv" checked={lado === 'rv'} onChange={() => { setLado('rv'); setJugadorSel(null); setFiltroAccion('todas'); setFiltroRes('todas'); }}></input>
       <span className="cc-radio-label"><CCTeamLogo team={p.rival} size={20}></CCTeamLogo>{p.rival}</span>
      </label>
     </div>

     {estadoAcciones === 'cargando-lineup' ? <p className="cc-empty">Cargando la alineación del partido…</p> : (() => {
      if (!lineupsAcciones) return <React.Fragment>
       <p className="cc-empty">{errorAcciones || 'Las acciones no están disponibles para este partido.'}</p>
       <button className="cc-btn-ghost" onClick={() => setAccionesRetry(v => v + 1)}><Icon name="actualizar" size={14}></Icon> Reintentar</button>
      </React.Fragment>;

      const FILTROS = {
       todas: a => true, pase: a => a.grupo === 'pase', centro: a => a.grupo === 'centro',
       carrera: a => a.grupo === 'carrera', regate: a => a.grupo === 'regate',
       defensa: a => a.grupo === 'defensa', remate: a => a.grupo === 'remate', otra: a => a.grupo === 'otra'
      };
      const esFallida = a => a.color === 'fallo' || (a.kind === 'shot' && (a.res === 'desviado' || a.res === 'bloqueado'));
      const accionesFiltradas = accionesJugador
       .filter(FILTROS[filtroAccion] || FILTROS.todas)
       .filter(a => filtroRes === 'todas' ? true : (filtroRes === 'falladas' ? esFallida(a) : !esFallida(a)));
      const resumen = accionesJugador.reduce((acc, a) => { acc[a.grupo] = (acc[a.grupo] || 0) + 1; return acc; }, {});
      const grupos = [
       ['pase', 'Pases'], ['centro', 'Centros'], ['carrera', 'Carreras'], ['regate', 'Regates'],
       ['defensa', 'Defensivas'], ['remate', 'Remates'], ['otra', 'Otras']
      ].filter(([key]) => resumen[key]);

      return <React.Fragment>
       {jugadoresAcciones.some(j => String(j.id).startsWith('shot:')) && <p className="cc-card-note">No se pudo cargar la alineación completa; el selector muestra temporalmente a los jugadores identificados en el shotmap.</p>}
       <div className="cc-acc-controls">
        <Select label="Jugador" value={jugadorAccion ? String(jugadorAccion.id) : ''} onChange={v => { setJugadorSel(v || null); setFiltroAccion('todas'); setFiltroRes('todas'); }}
         options={[{ value: '', label: 'Seleccionar un jugador…' }, ...jugadoresAcciones.map(j => ({ value: String(j.id), label: j.nombre + (j.posicion ? ' · ' + j.posicion : '') }))]}
         style={{ minWidth: '250px' }}></Select>
        <Select label="Acción a mostrar" value={filtroAccion} onChange={setFiltroAccion}
         options={[
          { value: 'todas', label: 'Todas las acciones' }, { value: 'pase', label: 'Pases y asistencias' },
          { value: 'centro', label: 'Centros' }, { value: 'carrera', label: 'Carreras con balón' },
          { value: 'regate', label: 'Regates' }, { value: 'defensa', label: 'Acciones defensivas' },
          { value: 'remate', label: 'Remates' }, { value: 'otra', label: 'Otras acciones' }
         ]} style={{ minWidth: '210px' }}></Select>
        <Select label="Resultado" value={filtroRes} onChange={setFiltroRes}
         options={[
          { value: 'todas', label: 'Todos' },
          { value: 'exitosas', label: 'Exitosas' },
          { value: 'falladas', label: 'Falladas' }
         ]} style={{ minWidth: '140px' }}></Select>
        {jugadorAccion && <div className="cc-acc-playerline">
         <CCTeamLogo team={lado === 'cc' ? 'Colo-Colo' : p.rival} size={26}></CCTeamLogo>
         <div><strong>{jugadorAccion.nombre}</strong><span>{jugadorAccion.posicion || 'Jugador'}{jugadorAccion.minutos != null ? ' · ' + jugadorAccion.minutos + "'" : ''} · {accionesJugador.length} acciones</span></div>
        </div>}
        {jugadorAccion && accionesJugador.length > 0 && <ExportJPGButton targetSelector=".cc-reporte-acciones-sec" filename="acciones-jugador" titulo="Acciones de Jugador"></ExportJPGButton>}
       </div>

       {!jugadorAccion ? <p className="cc-empty">Selecciona un jugador para ver todas sus acciones del partido.</p>
        : estadoAcciones === 'cargando-acciones' ? <p className="cc-empty">Cargando todas las acciones de {jugadorAccion.nombre}…</p>
        : estadoAcciones === 'error' ? <React.Fragment><p className="cc-empty">{errorAcciones}</p><button className="cc-btn-ghost" onClick={() => setAccionesRetry(v => v + 1)}><Icon name="actualizar" size={14}></Icon> Reintentar</button></React.Fragment>
        : accionesJugador.length === 0 ? <p className="cc-empty">No hay acciones espaciales registradas para este jugador en este partido.</p>
        : <React.Fragment>
         {estadoAcciones === 'parcial' && <p className="cc-card-note">No se pudo cargar el detalle completo; se muestran únicamente los remates disponibles. Reintenta para cargar pases, conducciones, regates y acciones defensivas.</p>}
         <div className="cc-acc-chips">
          <button className={'cc-acc-chip' + (filtroAccion === 'todas' ? ' activo' : '')} onClick={() => setFiltroAccion('todas')}><strong>{accionesJugador.length}</strong>Todas</button>
          {grupos.map(([key, label]) => <button key={key} className={'cc-acc-chip' + (filtroAccion === key ? ' activo' : '')} onClick={() => setFiltroAccion(key)}><strong>{resumen[key]}</strong>{label}</button>)}
         </div>
         <div className="cc-acc-pitch-wrap"><CCActionPitch acciones={accionesFiltradas}></CCActionPitch></div>
         <CCActionLegend acciones={accionesFiltradas}></CCActionLegend>
        </React.Fragment>}
      </React.Fragment>;
     })()}
    </div>
   </Card>

   <CCAvgPosiciones p={p} eventId={eventId}></CCAvgPosiciones>
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
 ccBuscarJugadorCC,
 ccShotDistanceM,
 ccShotInBox,
 ccShotZone
});
