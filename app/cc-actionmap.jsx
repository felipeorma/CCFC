// ============================================================
// ColoColo Football Center — Mapa de acciones de jugador
// Replica la lógica del notebook Python (mplsoccer):
// pases/centros/carreras como flechas, remates/regates/
// entradas/intercepciones/recuperaciones como marcadores,
// con leyenda. Las acciones se GENERAN de forma determinista
// a partir de las estadísticas reales por-90 (Wyscout) + la
// posición del jugador, ya que la API de eventos de Sofascore
// no es accesible desde el navegador.
// ============================================================
/* global React */

// ---------- RNG determinista ----------
function ccAccHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function ccAccRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ---------- Posición base en cancha (opta, ataca a la derecha) ----------
// x: 0-100 (0 = arco propio, 100 = arco rival) · y: 0-100 (ancho)
function ccPosBase(posicion) {
  const p = String(posicion || '').toUpperCase();
  const lado = p.startsWith('R') ? 78 : p.startsWith('L') ? 22 : 50;
  if (p.includes('GK')) return { x: 12, y: 50, sx: 6, sy: 10 };
  if (p.includes('CB') || p === 'RCB3' || p === 'LCB3') return { x: 26, y: p.includes('R') ? 62 : p.includes('L') ? 38 : 50, sx: 9, sy: 14 };
  if (p.includes('WB')) return { x: 46, y: lado, sx: 14, sy: 10 };
  if (p === 'RB' || p === 'LB' || p === 'RB5' || p === 'LB5') return { x: 42, y: lado, sx: 14, sy: 10 };
  if (p.includes('DMF')) return { x: 40, y: p.includes('R') ? 60 : p.includes('L') ? 40 : 50, sx: 12, sy: 14 };
  if (p.includes('AMF')) return { x: 66, y: 50, sx: 13, sy: 16 };
  if (p.includes('CMF')) return { x: 52, y: p.includes('R') ? 60 : p.includes('L') ? 40 : 50, sx: 13, sy: 16 };
  if (p.includes('WF') || p === 'RW' || p === 'LW') return { x: 72, y: lado, sx: 14, sy: 12 };
  if (p.includes('CF') || p.includes('SS')) return { x: 82, y: 50, sx: 11, sy: 16 };
  return { x: 50, y: 50, sx: 14, sy: 16 };
}

function ccClampN(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ---------- Generador de acciones ----------
function ccGenerarAcciones(jug, partido, lado) {
  if (!jug) return [];
  const rng = ccAccRng(ccAccHash((jug.nombre || '') + '|' + (partido ? partido.j : 0) + '|' + lado));
  const base = ccPosBase(jug.posicion);
  const minProm = jug.pj ? jug.min / jug.pj : 70;
  const f = ccClampN(minProm / 90, 0.25, 1.1);

  const near = (c, s) => ccClampN(c + (rng() - 0.5) * 2 * s, 3, 97);
  const acc = [];

  const pasesPct = (jug.pasesPct || 75) / 100;
  const nPases = ccClampN(Math.round((jug.pasesP90 || 20) * f * 0.8), 4, 26);
  let asignadoAsist = false;
  for (let i = 0; i < nPases; i++) {
    const x = near(base.x, base.sx + 6), y = near(base.y, base.sy + 8);
    const fwd = 6 + rng() * 22;
    const ex = ccClampN(x + fwd, 3, 99), ey = ccClampN(y + (rng() - 0.5) * 34, 3, 97);
    const exito = rng() < pasesPct;
    const largo = fwd > 20 && rng() < 0.35;
    let tipo = 'pase', color = exito ? 'exito' : 'fallo';
    if (!asignadoAsist && (jug.asist || 0) > 0 && exito && i > nPases * 0.5 && rng() < 0.4 && ex > 70) {
      tipo = 'asistencia'; color = 'asist'; asignadoAsist = true;
    } else if (largo && exito) { tipo = 'paseLargo'; color = 'largo'; }
    acc.push({ kind: 'arrow', tipo, color, x, y, ex, ey });
  }

  const nCentros = ccClampN(Math.round((jug.centrosP90 || 0) * f * 1.6), 0, 6);
  for (let i = 0; i < nCentros; i++) {
    const wing = base.y >= 50 ? near(82, 8) : near(18, 8);
    const x = near(78, 10);
    const ex = ccClampN(88 + rng() * 8, 80, 99), ey = near(50, 14);
    acc.push({ kind: 'arrow', tipo: 'centro', color: rng() < 0.42 ? 'centroOk' : 'fallo', curved: true, x, y: wing, ex, ey });
  }

  const nCarreras = ccClampN(Math.round((jug.carrerasP90 || 0) * f), 0, 6);
  for (let i = 0; i < nCarreras; i++) {
    const x = near(base.x, base.sx + 8), y = near(base.y, base.sy + 8);
    acc.push({ kind: 'arrow', tipo: 'carrera', color: 'carrera', dashed: true, x, y, ex: ccClampN(x + 8 + rng() * 12, 3, 99), ey: ccClampN(y + (rng() - 0.5) * 16, 3, 97) });
  }

  const esDef = /CB|RB|LB|WB|DMF|GK/.test(String(jug.posicion || '').toUpperCase());
  if (esDef) {
    const nDesp = ccClampN(Math.round((jug.accDefP90 || 0) * f * 0.25), 0, 4);
    for (let i = 0; i < nDesp; i++) {
      const x = near(22, 12), y = near(base.y, 20);
      acc.push({ kind: 'arrow', tipo: 'despeje', color: 'despeje', x, y, ex: ccClampN(x + 18 + rng() * 22, 3, 99), ey: near(y, 24) });
    }
  }

  const nRegates = ccClampN(Math.round((jug.regatesP90 || 0) * f), 0, 6);
  const regPct = (jug.regatesPct || 50) / 100;
  for (let i = 0; i < nRegates; i++) {
    acc.push({ kind: 'marker', tipo: 'regate', color: rng() < regPct ? 'exito' : 'fallo', shape: 'square', x: near(base.x + 8, base.sx), y: near(base.y, base.sy) });
  }

  const duelPct = (jug.duelosPct || 50) / 100;
  const nEntradas = ccClampN(Math.round((jug.accDefP90 || 0) * f * 0.35), 0, 6);
  for (let i = 0; i < nEntradas; i++) {
    acc.push({ kind: 'marker', tipo: 'entrada', color: rng() < duelPct ? 'exito' : 'fallo', shape: 'x', x: near(base.x - 4, base.sx + 6), y: near(base.y, base.sy + 8) });
  }

  const nInter = ccClampN(Math.round((jug.intercepP90 || 0) * f), 0, 7);
  for (let i = 0; i < nInter; i++) {
    acc.push({ kind: 'marker', tipo: 'intercepcion', color: 'inter', shape: 'tri', x: near(base.x - 6, base.sx + 8), y: near(base.y, base.sy + 10) });
  }

  const nRecup = ccClampN(Math.round((jug.accDefP90 || 0) * f * 0.3), 0, 5);
  for (let i = 0; i < nRecup; i++) {
    acc.push({ kind: 'marker', tipo: 'recuperacion', color: 'exito', shape: 'circle', x: near(base.x - 2, base.sx + 8), y: near(base.y, base.sy + 10) });
  }

  const nTiros = ccClampN(Math.round((jug.tirosP90 || 0) * f), 0, 6);
  const golProb = ccClampN((jug.xgP90 || 0.1) * 0.9, 0.05, 0.5);
  let golesRest = jug.goles && nTiros > 0 ? 1 : 0;
  for (let i = 0; i < nTiros; i++) {
    const x = near(84, 8), y = near(50, 16);
    let res = 'desviado';
    const r = rng();
    if (golesRest > 0 && r < golProb + 0.15) { res = 'gol'; golesRest--; }
    else if (r < 0.45) res = 'atajado';
    else if (r < 0.7) res = 'desviado';
    else res = 'bloqueado';
    acc.push({ kind: 'shot', tipo: 'remate', res, x, y });
  }

  return acc;
}

// ---------- Paleta ----------
const CC_ACC_COLORS = {
  exito: '#1E7A45', fallo: '#D11F2E', largo: '#2563EB', asist: '#E0A100',
  centroOk: '#0E9AA8', carrera: '#0E9AA8', despeje: '#E07A00', inter: '#2563EB',
  gol: '#D11F2E', atajado: '#E0A100', desviado: '#9C9C97', bloqueado: '#3A3A3A'
};
const CC_ACC_LABELS = {
  pase: 'Pase exitoso', fallo: 'Pase / acción fallada', paseLargo: 'Pase largo exitoso',
  asistencia: 'Asistencia', centro: 'Centro', centroOk: 'Centro exitoso', carrera: 'Carrera con balón',
  despeje: 'Despeje', regate: 'Regate', entrada: 'Entrada', intercepcion: 'Intercepción',
  recuperacion: 'Recuperación', remate: 'Remate'
};

// ---------- Mapeo opta → coordenadas SVG (cancha 105x68, ataca derecha) ----------
const CC_PX = 105, CC_PY = 68;
function ccAX(x) { return (x / 100) * CC_PX; }
function ccAY(y) { return ((100 - y) / 100) * CC_PY; }

function CCActionPitch({ acciones }) {
  // Marcas de cancha
  const lineas = '#B7C4B7';
  const mk = (a, i) => {
    const X = ccAX(a.x), Y = ccAY(a.y);
    const c = CC_ACC_COLORS[a.color] || '#3A3A3A';
    if (a.kind === 'arrow') {
      const EX = ccAX(a.ex), EY = ccAY(a.ey);
      const col = CC_ACC_COLORS[a.color] || '#3A3A3A';
      const mid = a.curved
        ? `Q ${(X + EX) / 2 + (EY - Y) * 0.18} ${(Y + EY) / 2 - (EX - X) * 0.18} ${EX} ${EY}`
        : `L ${EX} ${EY}`;
      return (
        <g key={i}>
          <path d={`M ${X} ${Y} ${mid}`} fill="none" stroke={col} strokeWidth="0.5"
            strokeOpacity="0.85" strokeLinecap="round" strokeDasharray={a.dashed ? '1.4 1.4' : 'none'}
            markerEnd={`url(#cc-arrow-${a.color})`}></path>
          <circle cx={X} cy={Y} r="0.7" fill={col} opacity="0.6"></circle>
        </g>
      );
    }
    if (a.kind === 'shot') {
      const col = CC_ACC_COLORS[a.res] || '#9C9C97';
      if (a.res === 'gol') {
        // estrella
        const pts = [];
        for (let k = 0; k < 10; k++) {
          const ang = -Math.PI / 2 + k * Math.PI / 5;
          const rr = k % 2 === 0 ? 2.6 : 1.1;
          pts.push((X + Math.cos(ang) * rr) + ',' + (Y + Math.sin(ang) * rr));
        }
        return <polygon key={i} points={pts.join(' ')} fill={col} stroke="#fff" strokeWidth="0.3"></polygon>;
      }
      return (
        <g key={i} stroke={col} strokeWidth="0.8" strokeLinecap="round">
          <line x1={X - 1.6} y1={Y - 1.6} x2={X + 1.6} y2={Y + 1.6}></line>
          <line x1={X - 1.6} y1={Y + 1.6} x2={X + 1.6} y2={Y - 1.6}></line>
        </g>
      );
    }
    // markers
    if (a.shape === 'square') return <rect key={i} x={X - 1.5} y={Y - 1.5} width="3" height="3" rx="0.4" fill={c} stroke="#fff" strokeWidth="0.3"></rect>;
    if (a.shape === 'x') return (
      <g key={i} stroke={c} strokeWidth="0.85" strokeLinecap="round">
        <line x1={X - 1.6} y1={Y - 1.6} x2={X + 1.6} y2={Y + 1.6}></line>
        <line x1={X - 1.6} y1={Y + 1.6} x2={X + 1.6} y2={Y - 1.6}></line>
      </g>
    );
    if (a.shape === 'tri') return <polygon key={i} points={`${X},${Y - 1.9} ${X + 1.7},${Y + 1.4} ${X - 1.7},${Y + 1.4}`} fill={c} stroke="#fff" strokeWidth="0.3"></polygon>;
    return <circle key={i} cx={X} cy={Y} r="1.6" fill={c} stroke="#fff" strokeWidth="0.3"></circle>;
  };

  const colores = Object.keys(CC_ACC_COLORS);

  return (
    <svg viewBox={`-2 -2 ${CC_PX + 4} ${CC_PY + 4}`} className="cc-actionpitch" preserveAspectRatio="xMidYMid meet">
      <defs>
        {colores.map(k => (
          <marker key={k} id={`cc-arrow-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 1 L 9 5 L 0 9 z" fill={CC_ACC_COLORS[k]}></path>
          </marker>
        ))}
      </defs>
      {/* césped */}
      <rect x="0" y="0" width={CC_PX} height={CC_PY} fill="#EEF4EE" stroke={lineas} strokeWidth="0.4"></rect>
      {/* franjas */}
      {[0, 1, 2, 3, 4, 5].map(i => i % 2 === 0 ? <rect key={i} x={i * (CC_PX / 6)} y="0" width={CC_PX / 6} height={CC_PY} fill="#E6EFE6"></rect> : null)}
      {/* línea media y círculo */}
      <line x1={CC_PX / 2} y1="0" x2={CC_PX / 2} y2={CC_PY} stroke={lineas} strokeWidth="0.4"></line>
      <circle cx={CC_PX / 2} cy={CC_PY / 2} r="9.15" fill="none" stroke={lineas} strokeWidth="0.4"></circle>
      <circle cx={CC_PX / 2} cy={CC_PY / 2} r="0.7" fill={lineas}></circle>
      {/* áreas (ataca a la derecha; defensa izquierda) */}
      <rect x="0" y={CC_PY / 2 - 20.16} width="16.5" height="40.32" fill="none" stroke={lineas} strokeWidth="0.4"></rect>
      <rect x="0" y={CC_PY / 2 - 9.16} width="5.5" height="18.32" fill="none" stroke={lineas} strokeWidth="0.4"></rect>
      <rect x={CC_PX - 16.5} y={CC_PY / 2 - 20.16} width="16.5" height="40.32" fill="none" stroke={lineas} strokeWidth="0.4"></rect>
      <rect x={CC_PX - 5.5} y={CC_PY / 2 - 9.16} width="5.5" height="18.32" fill="none" stroke={lineas} strokeWidth="0.4"></rect>
      <circle cx="9.4" cy={CC_PY / 2} r="0.6" fill={lineas}></circle>
      <circle cx={CC_PX - 9.4} cy={CC_PY / 2} r="0.6" fill={lineas}></circle>
      {/* dirección de ataque */}
      <text x={CC_PX / 2} y={CC_PY - 1.5} textAnchor="middle" className="cc-acc-dir">ATAQUE →</text>
      {/* acciones */}
      {acciones.map((a, i) => mk(a, i))}
    </svg>
  );
}

// ---------- Leyenda dinámica ----------
function CCActionLegend({ acciones }) {
  const presentes = [];
  const visto = new Set();
  acciones.forEach(a => {
    let key, color, shape;
    if (a.kind === 'shot') { key = 'remate-' + a.res; color = CC_ACC_COLORS[a.res]; shape = a.res === 'gol' ? 'star' : 'x'; }
    else if (a.kind === 'arrow') { key = a.tipo; color = CC_ACC_COLORS[a.color]; shape = 'line'; }
    else { key = a.tipo + '-' + a.color; color = CC_ACC_COLORS[a.color]; shape = a.shape; }
    if (visto.has(key)) return;
    visto.add(key);
    let label = CC_ACC_LABELS[a.tipo] || a.tipo;
    if (a.kind === 'shot') label = 'Remate: ' + (a.res === 'gol' ? 'Gol' : a.res === 'atajado' ? 'Atajado' : a.res === 'bloqueado' ? 'Bloqueado' : 'Desviado');
    else if (a.color === 'fallo' && a.kind !== 'arrow') label = (CC_ACC_LABELS[a.tipo] || a.tipo) + ' fallada';
    else if (a.color === 'exito' && a.kind === 'marker' && a.tipo !== 'recuperacion') label = (CC_ACC_LABELS[a.tipo] || a.tipo) + ' exitosa';
    presentes.push({ key, color, shape, label });
  });
  return (
    <div className="cc-acc-legend">
      {presentes.map(p => (
        <span key={p.key} className="cc-acc-legend-item">
          <span className={'cc-acc-swatch sh-' + p.shape} style={{ background: p.shape === 'line' ? 'none' : p.color, color: p.color }}>
            {p.shape === 'line' ? <span className="cc-acc-line" style={{ background: p.color }}></span> : null}
          </span>
          {p.label}
        </span>
      ))}
    </div>
  );
}

Object.assign(window, { ccGenerarAcciones, CCActionPitch, CCActionLegend, CC_ACC_COLORS, CC_ACC_LABELS });
