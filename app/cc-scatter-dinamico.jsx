// ============================================================
// ColoColo Football Center — Scatter dinámico
// Reemplaza al scatter estático de Dispersión: los puntos migran
// animados al cambiar la métrica, cuadrantes por mediana, escudo
// del equipo como punto, tooltip y fijado por clic.
// ============================================================
/* global React */

function scdMed(a) { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

function CCScatterDinamico({ points, xLabel, yLabel, highlight, formatX, formatY }) {
 const W = 1080, H = 560, pad = { l: 64, r: 26, t: 24, b: 46 };
 const [pins, setPins] = React.useState(() => new Set());
 const [hover, setHover] = React.useState(null);
 const fx = formatX || (v => v), fy = formatY || (v => v);
 const val = points.filter(p => typeof p.x === 'number' && isFinite(p.x) && typeof p.y === 'number' && isFinite(p.y));
 const xs = val.map(p => p.x), ys = val.map(p => p.y);
 const rng = a => { if (!a.length) return [0, 1]; let mn = Math.min.apply(null, a), mx = Math.max.apply(null, a); if (mn === mx) { mn -= 1; mx += 1; } const m = (mx - mn) * 0.08; return [mn - m, mx + m]; };
 const rx = rng(xs), ry = rng(ys);
 const sx = v => pad.l + (v - rx[0]) / (rx[1] - rx[0]) * (W - pad.l - pad.r);
 const sy = v => H - pad.b - (v - ry[0]) / (ry[1] - ry[0]) * (H - pad.t - pad.b);
 const medx = scdMed(xs), medy = scdMed(ys);
 const sz = val.length <= 20 ? 27 : 20;
 const ticks = [0, 1, 2, 3, 4];
 const move = (e, p) => {
  const host = e.currentTarget.ownerSVGElement.parentElement.getBoundingClientRect();
  setHover({ left: Math.min(e.clientX - host.left + 14, host.width - 190), top: e.clientY - host.top + 12, p });
 };
 const toggle = p => setPins(prev => { const n = new Set(prev); if (n.has(p.label)) n.delete(p.label); else n.add(p.label); return n; });
 return (
  <div className="cc-scdin" onMouseLeave={() => setHover(null)}>
   <svg viewBox={'0 0 ' + W + ' ' + H}>
    <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="var(--border)" strokeWidth="2"></line>
    <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke="var(--border)" strokeWidth="2"></line>
    {ticks.map(g => { const vx = rx[0] + (rx[1] - rx[0]) * g / 4; return <text key={'tx' + g} className="tick" x={sx(vx)} y={H - pad.b + 16} textAnchor="middle">{fx(vx)}</text>; })}
    {ticks.map(g => { const vy = ry[0] + (ry[1] - ry[0]) * g / 4; return <text key={'ty' + g} className="tick" x={pad.l - 8} y={sy(vy) + 3} textAnchor="end">{fy(vy)}</text>; })}
    <text className="axl" x={W - pad.r} y={H - 8} textAnchor="end">{xLabel}</text>
    <text className="axl" x={pad.l + 4} y={pad.t - 8}>{yLabel}</text>
    <g className="cc-scdin-med" style={{ transform: 'translate(' + sx(medx) + 'px,0px)' }}>
     <line x1="0" y1={pad.t} x2="0" y2={H - pad.b} stroke="var(--ink-3)" strokeDasharray="5,4"></line>
    </g>
    <g className="cc-scdin-med" style={{ transform: 'translate(0px,' + sy(medy) + 'px)' }}>
     <line x1={pad.l} y1="0" x2={W - pad.r} y2="0" stroke="var(--ink-3)" strokeDasharray="5,4"></line>
    </g>
    {val.map(p => {
     const pin = pins.has(p.label) || p.label === highlight;
     return (
      <g key={p.label} className="cc-scdin-pt" style={{ transform: 'translate(' + sx(p.x) + 'px,' + sy(p.y) + 'px)', cursor: 'pointer' }}
       onMouseMove={e => move(e, p)} onMouseLeave={() => setHover(null)} onClick={() => toggle(p)}>
       {p.logo
        ? <image href={p.logo} x={-sz / 2} y={-sz / 2} width={sz} height={sz} preserveAspectRatio="xMidYMid meet"></image>
        : <circle r="6.5" fill="var(--rojo)" fillOpacity="0.85" stroke="#fff" strokeWidth="1.4"></circle>}
       {pin && <circle r={sz / 2 + 5} fill="none" stroke="var(--rojo)" strokeWidth="2.5"></circle>}
       {pin && <text y={-(sz / 2 + 9)} textAnchor="middle" className="cc-scdin-lab">{p.label}</text>}
      </g>
     );
    })}
   </svg>
   {hover && (
    <div className="cc-scdin-tip" style={{ left: hover.left + 'px', top: hover.top + 'px' }}>
     <b>{hover.p.label}</b>
     {hover.p.sub ? <span>{hover.p.sub}</span> : null}
     <span>{xLabel}: {fx(hover.p.x)} · {yLabel}: {fy(hover.p.y)}</span>
    </div>
   )}
  </div>
 );
}

// Posiciones agrupadas en español (mapa de siglas del dataset)
const CC_POS_ESP_MAP = [
 [/^GK$|^G$/, 'Arquero'],
 [/^(L|R)WB$|^(L|R)B\d*$/, 'Lateral'],
 [/CB/, 'Defensa central'],
 [/DMF|^CDM$|^DM$|^CM$|^CMF$/, 'Volante defensivo'],
 [/^(L|R)CMF\d*$/, 'Volante mixto'],
 [/^AMF$|^CAM$|^AM$/, 'Volante ofensivo'],
 [/W(F)?$|^(L|R)M$|^(L|R)AMF$/, 'Extremo'],
 [/^CF$|^ST$|^SS$|^F$|^S$/, 'Delantero']
];
function ccPosEsp(pos) {
 const p = String(pos || '').toUpperCase().trim();
 for (const par of CC_POS_ESP_MAP) if (par[0].test(p)) return par[1];
 return 'Otro';
}

// Slider de rango doble (dos extremos ajustables sobre la misma pista)
function CCRangeDual({ label, min, max, step = 1, value, onChange, suf = '' }) {
 const lo = value[0], hi = value[1];
 const pct = v => (v - min) / ((max - min) || 1) * 100;
 return (
  <label className="cc-select-wrap cc-drange-wrap">
   <span className="cc-select-label">{label}: {lo}{suf} – {hi}{suf}</span>
   <div className="cc-drange">
    <div className="track"></div>
    <div className="fillr" style={{ left: pct(lo) + '%', width: Math.max(0, pct(hi) - pct(lo)) + '%' }}></div>
    <input type="range" min={min} max={max} step={step} value={lo} onChange={e => onChange([Math.min(Number(e.target.value), hi), hi])}></input>
    <input type="range" min={min} max={max} step={step} value={hi} onChange={e => onChange([lo, Math.max(Number(e.target.value), lo)])}></input>
   </div>
  </label>
 );
}

Object.assign(window, { CCScatterDinamico, CCRangeDual, ccPosEsp });
