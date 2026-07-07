// ============================================================
// ColoColo Football Center - Acciones reales por jugador
// Fuente: SofaScore /event/{id}/lineups y /rating-breakdown
// ============================================================

(function () {
  const CACHE_KEY = 'cc_actions_real_v1';
  const memory = {};

  try {
    Object.assign(memory, JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'));
  } catch (e) {}

  function save() {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(memory)); } catch (e) {}
  }

  function fetchCached(key, path) {
    if (memory[key]) return Promise.resolve(memory[key]);
    if (typeof window.ccSofaFetch !== 'function') {
      return Promise.reject(new Error('No está disponible la conexión con SofaScore.'));
    }
    return window.ccSofaFetch(path).then(data => {
      if (!data || data.error) throw new Error('SofaScore no entregó datos para este partido.');
      memory[key] = data;
      save();
      return data;
    });
  }

  function isOk(value) {
    if (value === true || value === 1) return true;
    return ['true', '1', 'success', 'successful', 'won', 'accurate'].includes(String(value || '').toLowerCase());
  }

  function number(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : null;
  }

  function norm(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  }

  function title(value) {
    return String(value || 'Acción').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  const LABELS = {
    pass: 'Pase', cross: 'Centro', 'ball-carry': 'Carrera con balón', dribble: 'Regate',
    tackle: 'Entrada', interception: 'Intercepción', clearance: 'Despeje',
    'ball-recovery': 'Recuperación', block: 'Bloqueo', duel: 'Duelo'
  };

  function normalizeEvent(raw, category) {
    const start = raw.playerCoordinates || {};
    const end = raw.passEndCoordinates || {};
    const x = number(start.x != null ? start.x : raw.x);
    const y = number(start.y != null ? start.y : raw.y);
    const ex = number(end.x != null ? end.x : raw.end_x);
    const ey = number(end.y != null ? end.y : raw.end_y);
    if (x == null || y == null) return null;

    const action = String(raw.eventActionType || raw.actionType || category || '').toLowerCase();
    const successful = isOk(raw.outcome);
    const longBall = isOk(raw.isLongBall);
    const assist = isOk(raw.isAssist);
    let tipo = action || category || 'accion';
    let grupo = 'otra';
    let color = successful ? 'exito' : 'fallo';
    let shape = 'circle';

    if (assist) {
      tipo = 'asistencia'; grupo = 'pase'; color = 'asist';
    } else if (action === 'cross') {
      tipo = 'centro'; grupo = 'centro'; color = successful ? 'centroOk' : 'fallo';
    } else if (longBall) {
      tipo = 'paseLargo'; grupo = 'pase'; color = successful ? 'largo' : 'fallo';
    } else if (category === 'passes' || action === 'pass') {
      tipo = 'pase'; grupo = 'pase';
    } else if (category === 'ball-carries' || action === 'ball-carry') {
      tipo = 'carrera'; grupo = 'carrera'; color = 'carrera';
    } else if (category === 'dribbles' || action === 'dribble') {
      tipo = 'regate'; grupo = 'regate'; shape = 'square';
    } else if (['tackle', 'interception', 'clearance', 'ball-recovery', 'block'].includes(action) || category === 'defensive') {
      grupo = 'defensa';
      const map = { tackle: 'entrada', interception: 'intercepcion', clearance: 'despeje', 'ball-recovery': 'recuperacion', block: 'bloqueo' };
      tipo = map[action] || action || 'defensa';
      color = action === 'interception' ? 'inter' : action === 'clearance' ? 'despeje' : successful ? 'exito' : 'fallo';
      shape = action === 'interception' ? 'tri' : action === 'tackle' ? 'x' : 'circle';
    }

    const rawLabel = tipo === 'asistencia' ? 'Asistencia'
      : tipo === 'paseLargo' ? 'Pase largo'
      : (LABELS[action] || title(action || category));
    const label = grupo === 'carrera' || tipo === 'asistencia' || tipo === 'intercepcion' || tipo === 'despeje'
      ? rawLabel
      : rawLabel + (successful ? ' exitoso' : ' fallado');
    const hasEnd = ex != null && ey != null;

    return {
      kind: hasEnd ? 'arrow' : 'marker', tipo, grupo, color, shape,
      label, x, y, ex, ey,
      curved: tipo === 'centro', dashed: tipo === 'carrera',
      minuto: raw.time != null ? raw.time : (raw.minute != null ? raw.minute : null)
    };
  }

  function normalizeShot(shot) {
    const result = shot.resultado === 'fuera' || shot.resultado === 'palo' ? 'desviado' : shot.resultado;
    return {
      kind: 'shot', tipo: 'remate', grupo: 'remate', res: result || 'desviado',
      label: 'Remate', x: number(shot.depth), y: number(shot.width), minuto: shot.minuto
    };
  }

  function lineupPlayer(item, lado) {
    const player = item.player || {};
    const stats = item.statistics || {};
    return {
      id: player.id,
      nombre: player.name || player.shortName || 'Sin nombre',
      posicion: item.position || player.position || '',
      dorsal: item.jerseyNumber || item.shirtNumber || '',
      minutos: stats.minutesPlayed != null ? stats.minutesPlayed : null,
      titular: !item.substitute,
      lado
    };
  }

  function lineupBundlePorEvento(eventId) {
    const bundle = window.CC_LINEUPS_BUNDLE || null;
    if (!bundle) return null;
    const match = Object.values(bundle).find(item => item && String(item.eventId) === String(eventId));
    return match || null;
  }

  function lineupPlayerBundle(item, lado) {
    return {
      id: 'lineup:' + lado + ':' + norm(item.n),
      nombre: item.n || 'Sin nombre',
      posicion: item.p || '',
      dorsal: item.d || '',
      minutos: item.min != null ? item.min : null,
      titular: item.min == null ? null : item.min >= 45,
      lado
    };
  }

  function getLineups(eventId, homeEsCC) {
    const bundled = window.CC_ACTIONS_BUNDLE && window.CC_ACTIONS_BUNDLE[String(eventId)];
    if (bundled && Array.isArray(bundled.cc) && Array.isArray(bundled.rv) && (bundled.cc.length || bundled.rv.length)) {
      return Promise.resolve({ cc: bundled.cc, rv: bundled.rv });
    }
    const lineupBundle = lineupBundlePorEvento(eventId);
    if (lineupBundle && Array.isArray(lineupBundle.cc) && Array.isArray(lineupBundle.rv)) {
      return Promise.resolve({
        cc: lineupBundle.cc.map(p => lineupPlayerBundle(p, 'cc')),
        rv: lineupBundle.rv.map(p => lineupPlayerBundle(p, 'rv'))
      });
    }
    return fetchCached('lineups:' + eventId, '/event/' + eventId + '/lineups').then(data => {
      const homeSide = homeEsCC ? 'cc' : 'rv';
      const awaySide = homeEsCC ? 'rv' : 'cc';
      const home = (((data.home || {}).players) || []).map(p => lineupPlayer(p, homeSide));
      const away = (((data.away || {}).players) || []).map(p => lineupPlayer(p, awaySide));
      const all = home.concat(away).filter(p => p.id && p.nombre);
      if (!all.length) throw new Error('La alineación real no está disponible para este partido.');
      return {
        cc: all.filter(p => p.lado === 'cc'),
        rv: all.filter(p => p.lado === 'rv')
      };
    });
  }

  function mergePlayerShots(events, player, shots) {
    const playerName = norm(player.nombre);
    (shots || []).filter(s => norm(s.jugador) === playerName).forEach(s => {
      const shot = normalizeShot(s);
      if (shot.x != null && shot.y != null) events.push(shot);
    });
    return events;
  }

  function getPlayerActions(eventId, player, shots) {
    if (String(player.id).startsWith('shot:') || String(player.id).startsWith('lineup:')) {
      const shotsOnly = mergePlayerShots([], player, shots);
      shotsOnly.ccParcial = true;
      shotsOnly.ccError = String(player.id).startsWith('lineup:')
        ? 'Acciones espaciales pendientes de carga backend. La alineación y estadísticas del jugador sí están en la base.'
        : 'No se pudo cargar el detalle completo del partido.';
      return Promise.resolve(shotsOnly);
    }
    const bundled = window.CC_ACTIONS_BUNDLE && window.CC_ACTIONS_BUNDLE[String(eventId)];
    if (bundled && bundled.actions && Array.isArray(bundled.actions[String(player.id)])) {
      const events = bundled.actions[String(player.id)].map(item => normalizeEvent({
        eventActionType: item.a, outcome: item.o, isLongBall: item.l, isAssist: item.i,
        playerCoordinates: { x: item.x, y: item.y },
        passEndCoordinates: item.ex == null || item.ey == null ? null : { x: item.ex, y: item.ey },
        time: item.t
      }, item.c)).filter(Boolean);
      return Promise.resolve(mergePlayerShots(events, player, shots));
    }
    if (bundled) {
      const shotsOnly = mergePlayerShots([], player, shots);
      shotsOnly.ccParcial = true;
      shotsOnly.ccError = 'Acciones espaciales pendientes de carga backend. No se descargan desde el navegador para evitar bloqueos de SofaScore.';
      return Promise.resolve(shotsOnly);
    }
    return fetchCached('actions:' + eventId + ':' + player.id,
      '/event/' + eventId + '/player/' + player.id + '/rating-breakdown').then(data => {
      const events = [];
      Object.keys(data).forEach(category => {
        if (!Array.isArray(data[category]) || /shot/i.test(category)) return;
        data[category].forEach(raw => {
          const action = normalizeEvent(raw, category);
          if (action) events.push(action);
        });
      });
      return mergePlayerShots(events, player, shots);
    }).catch(error => {
      const shotsOnly = mergePlayerShots([], player, shots);
      if (!shotsOnly.length) throw error;
      shotsOnly.ccParcial = true;
      shotsOnly.ccError = String((error && error.message) || error);
      return shotsOnly;
    });
  }

  window.CC_ACTIONS = { getLineups, getPlayerActions };
})();

const CC_ACC_COLORS = {
  exito: '#3ED47F', fallo: '#FF5A62', largo: '#5FA8FF', asist: '#FFC94D',
  centroOk: '#3FD3E0', carrera: '#3FD3E0', despeje: '#FF9E45', inter: '#5FA8FF',
  gol: '#FF5A62', atajado: '#FFC94D', desviado: '#C9CFC9', bloqueado: '#93A09B'
};

const CC_SHOT_LABEL = { gol: 'Remate: Gol', atajado: 'Remate: Atajado', bloqueado: 'Remate: Bloqueado', desviado: 'Remate: Desviado' };
const CC_PX = 105, CC_PY = 68;
function ccAX(x) { return (x / 100) * CC_PX; }
function ccAY(y) { return ((100 - y) / 100) * CC_PY; }

function CCActionPitch({ acciones }) {
  const [tip, setTip] = React.useState(null);
  const lineas = 'rgba(255,255,255,0.68)';
  const colores = Object.keys(CC_ACC_COLORS);

  const marker = (a, i) => {
    const x = ccAX(a.x), y = ccAY(a.y);
    const color = CC_ACC_COLORS[a.kind === 'shot' ? a.res : a.color] || '#FFFFFF';
    const label = a.kind === 'shot' ? (CC_SHOT_LABEL[a.res] || 'Remate') : a.label;
    const hover = {
      className: 'cc-acc-ev' + (tip ? (tip.i === i ? ' cc-acc-on' : ' cc-acc-dim') : ''),
      onMouseEnter: () => setTip({ i, x, y, txt: label + (a.minuto != null ? ' · ' + a.minuto + '′' : '') }),
      onMouseLeave: () => setTip(null)
    };

    if (a.kind === 'arrow') {
      const ex = ccAX(a.ex), ey = ccAY(a.ey);
      const route = a.curved
        ? `Q ${(x + ex) / 2 + (ey - y) * 0.18} ${(y + ey) / 2 - (ex - x) * 0.18} ${ex} ${ey}`
        : `L ${ex} ${ey}`;
      return <g key={i} {...hover}>
        <path d={`M ${x} ${y} ${route}`} fill="none" stroke={color} strokeWidth="0.5" strokeOpacity="0.88"
          strokeLinecap="round" strokeDasharray={a.dashed ? '1.4 1.4' : 'none'} markerEnd={`url(#cc-arrow-${a.color})`}></path>
        <path d={`M ${x} ${y} ${route}`} fill="none" stroke="transparent" strokeWidth="3"></path>
        <circle cx={x} cy={y} r="0.7" fill={color} opacity="0.7"></circle>
      </g>;
    }
    if (a.kind === 'shot' && a.res === 'gol') {
      const points = [];
      for (let k = 0; k < 10; k++) {
        const angle = -Math.PI / 2 + k * Math.PI / 5;
        const radius = k % 2 === 0 ? 2.6 : 1.1;
        points.push((x + Math.cos(angle) * radius) + ',' + (y + Math.sin(angle) * radius));
      }
      return <polygon key={i} {...hover} points={points.join(' ')} fill={color} stroke="#fff" strokeWidth="0.3"></polygon>;
    }
    if (a.kind === 'shot' || a.shape === 'x') return <g key={i} {...hover} stroke={color} strokeWidth="0.85" strokeLinecap="round">
      <line x1={x - 1.6} y1={y - 1.6} x2={x + 1.6} y2={y + 1.6}></line>
      <line x1={x - 1.6} y1={y + 1.6} x2={x + 1.6} y2={y - 1.6}></line>
    </g>;
    if (a.shape === 'square') return <rect key={i} {...hover} x={x - 1.5} y={y - 1.5} width="3" height="3" rx="0.4" fill={color} stroke="#fff" strokeWidth="0.3"></rect>;
    if (a.shape === 'tri') return <polygon key={i} {...hover} points={`${x},${y - 1.9} ${x + 1.7},${y + 1.4} ${x - 1.7},${y + 1.4}`} fill={color} stroke="#fff" strokeWidth="0.3"></polygon>;
    return <circle key={i} {...hover} cx={x} cy={y} r="1.6" fill={color} stroke="#fff" strokeWidth="0.3"></circle>;
  };

  return <svg viewBox={`-2 -2 ${CC_PX + 4} ${CC_PY + 4}`} className="cc-actionpitch" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="cc-acc-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1F8A4C"></stop><stop offset="1" stopColor="#136436"></stop></linearGradient>
      {colores.map(k => <marker key={k} id={`cc-arrow-${k}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 1 L 9 5 L 0 9 z" fill={CC_ACC_COLORS[k]}></path></marker>)}
    </defs>
    <rect x="0" y="0" width={CC_PX} height={CC_PY} fill="url(#cc-acc-grass)" stroke={lineas} strokeWidth="0.5"></rect>
    {[0, 1, 2, 3, 4, 5].map(i => i % 2 === 0 ? <rect key={i} x={i * (CC_PX / 6)} y="0" width={CC_PX / 6} height={CC_PY} fill="rgba(255,255,255,0.05)"></rect> : null)}
    <line x1={CC_PX / 2} y1="0" x2={CC_PX / 2} y2={CC_PY} stroke={lineas} strokeWidth="0.4"></line>
    <circle cx={CC_PX / 2} cy={CC_PY / 2} r="9.15" fill="none" stroke={lineas} strokeWidth="0.4"></circle>
    <circle cx={CC_PX / 2} cy={CC_PY / 2} r="0.7" fill={lineas}></circle>
    <rect x="0" y={CC_PY / 2 - 20.16} width="16.5" height="40.32" fill="none" stroke={lineas} strokeWidth="0.4"></rect>
    <rect x="0" y={CC_PY / 2 - 9.16} width="5.5" height="18.32" fill="none" stroke={lineas} strokeWidth="0.4"></rect>
    <rect x={CC_PX - 16.5} y={CC_PY / 2 - 20.16} width="16.5" height="40.32" fill="none" stroke={lineas} strokeWidth="0.4"></rect>
    <rect x={CC_PX - 5.5} y={CC_PY / 2 - 9.16} width="5.5" height="18.32" fill="none" stroke={lineas} strokeWidth="0.4"></rect>
    <circle cx="9.4" cy={CC_PY / 2} r="0.6" fill={lineas}></circle><circle cx={CC_PX - 9.4} cy={CC_PY / 2} r="0.6" fill={lineas}></circle>
    <text x={CC_PX / 2} y={CC_PY - 1.5} textAnchor="middle" className="cc-acc-dir">ATAQUE →</text>
    {(acciones || []).map(marker)}
    {tip && (() => {
      const width = Math.min(64, tip.txt.length * 1.45 + 5);
      const x = Math.max(width / 2 + 1, Math.min(CC_PX - width / 2 - 1, tip.x));
      const y = tip.y > 9 ? tip.y - 7.4 : tip.y + 2.8;
      return <g pointerEvents="none"><rect x={x - width / 2} y={y} width={width} height="4.6" rx="1.2" fill="rgba(8,14,10,0.94)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.15"></rect><text x={x} y={y + 3.2} textAnchor="middle" fill="#fff" fontSize="2.7" fontWeight="700">{tip.txt}</text></g>;
    })()}
  </svg>;
}

function CCLegendSymbol({ action }) {
  const color = CC_ACC_COLORS[action.kind === 'shot' ? action.res : action.color] || '#FFFFFF';
  const shape = action.kind === 'arrow' ? 'line' : action.kind === 'shot' && action.res === 'gol' ? 'star' : action.kind === 'shot' ? 'x' : action.shape;
  const star = '13,1 15,6 21,6 16.5,9.5 18.5,15 13,11.5 7.5,15 9.5,9.5 5,6 11,6';
  return <svg className="cc-acc-sym" viewBox="0 0 26 16" width="26" height="16" aria-hidden="true">
    {shape === 'line' && <g><line x1="2" y1="8" x2="17" y2="8" stroke={color} strokeWidth="2.2" strokeLinecap="round"></line><path d="M 16 3.5 L 24 8 L 16 12.5 z" fill={color}></path></g>}
    {shape === 'star' && <polygon points={star} fill={color}></polygon>}
    {shape === 'x' && <g stroke={color} strokeWidth="2.4" strokeLinecap="round"><line x1="8" y1="3" x2="18" y2="13"></line><line x1="8" y1="13" x2="18" y2="3"></line></g>}
    {shape === 'square' && <rect x="8" y="3" width="10" height="10" rx="1.4" fill={color}></rect>}
    {shape === 'tri' && <polygon points="13,2.5 19.5,13.5 6.5,13.5" fill={color}></polygon>}
    {!['line', 'star', 'x', 'square', 'tri'].includes(shape) && <circle cx="13" cy="8" r="5.4" fill={color}></circle>}
  </svg>;
}

function CCActionLegend({ acciones }) {
  const unique = [];
  const seen = new Set();
  (acciones || []).forEach(action => {
    const label = action.kind === 'shot' ? (CC_SHOT_LABEL[action.res] || 'Remate') : action.label;
    const key = action.kind + '|' + action.tipo + '|' + action.color + '|' + action.res;
    if (!seen.has(key)) { seen.add(key); unique.push({ ...action, label }); }
  });
  return <div className="cc-acc-legend">{unique.map((action, i) => <span key={i} className="cc-acc-legend-item"><CCLegendSymbol action={action}></CCLegendSymbol>{action.label}</span>)}</div>;
}

Object.assign(window, { CCActionPitch, CCActionLegend });
