// ============================================================
// ColoColo Football Center — Gráficos SVG
// LineChart, BarsH, RadarChart, ScatterChart, PolarBars
// ============================================================
/* global React */

const { useState: ccUseState } = React;

function ccNiceTicks(min, max, count) {
  if (min === max) { max = min + 1; }
  const span = max - min;
  const step0 = span / Math.max(1, count);
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const norm = step0 / mag;
  let step;
  if (norm < 1.5) step = 1; else if (norm < 3) step = 2; else if (norm < 7) step = 5; else step = 10;
  step *= mag;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step * 0.001; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return { ticks, lo, hi };
}

// ---------------- Line chart (1-2 series) ----------------
function CCLineChart({ series, labels, height = 280, yLabel, avgLines = [], formatY }) {
  const [hover, setHover] = ccUseState(null);
  const W = 860, H = height, padL = 46, padR = 16, padT = 14, padB = 34;
  const all = series.flatMap(s => s.data).concat(avgLines.map(a => a.value));
  const { ticks, lo, hi } = ccNiceTicks(Math.min(...all), Math.max(...all), 5);
  const n = labels.length;
  const x = i => padL + (n <= 1 ? 0 : (i / (n - 1)) * (W - padL - padR));
  const y = v => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const fmt = formatY || (v => v);

  return (
    <div className="cc-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="cc-chart" onMouseLeave={() => setHover(null)}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className="cc-grid"></line>
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" className="cc-tick">{fmt(t)}</text>
          </g>
        ))}
        {labels.map((l, i) => (
          (n <= 16 || i % 2 === 0) ? <text key={i} x={x(i)} y={H - 10} textAnchor="middle" className="cc-tick">{l}</text> : null
        ))}
        {avgLines.map((a, k) => (
          <g key={k}>
            <line x1={padL} x2={W - padR} y1={y(a.value)} y2={y(a.value)} stroke={a.color} strokeDasharray="6 5" strokeWidth="1.4" opacity="0.7"></line>
            <text x={W - padR} y={y(a.value) - 6} textAnchor="end" fontSize="11" fill={a.color} fontWeight="600">{a.label}</text>
          </g>
        ))}
        {series.map((s, k) => (
          <g key={k}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ')}
            ></polyline>
            {s.data.map((v, i) => (
              <circle
                key={i}
                cx={x(i)} cy={y(v)} r={hover === i ? 6 : 4}
                fill={s.color} stroke="var(--surface)" strokeWidth="1.6"
                onMouseEnter={() => setHover(i)}
              ></circle>
            ))}
          </g>
        ))}
        {hover != null && (
          <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} className="cc-grid" strokeDasharray="3 3"></line>
        )}
      </svg>
      {hover != null && (
        <div className="cc-tooltip">
          <strong>{labels[hover]}</strong>
          {series.map((s, k) => (
            <div key={k} className="cc-tooltip-row">
              <span className="cc-dot" style={{ background: s.color }}></span>
              <span>{s.name}</span>
              <b>{fmt(s.data[hover])}</b>
            </div>
          ))}
          {series[0].meta && series[0].meta[hover] && <div className="cc-tooltip-meta">{series[0].meta[hover]}</div>}
        </div>
      )}
    </div>
  );
}

// ---------------- Horizontal bars (rankings) ----------------
function CCBarsH({ rows, highlight, formatV, color }) {
  const max = Math.max(...rows.map(r => r.value), 0.0001);
  const fmt = formatV || (v => v);
  return (
    <div className="cc-barsh">
      {rows.map((r, i) => {
        const hot = highlight && r.label === highlight;
        return (
          <div key={r.label + i} className="cc-barsh-row">
            <span className="cc-barsh-rank">{i + 1}</span>
            <span className={'cc-barsh-label' + (hot ? ' hot' : '')}>
              {r.logo && <img className="cc-barsh-logo" src={r.logo} alt="" width="20" height="20" loading="lazy"></img>}
              {r.label}
            </span>
            <div className="cc-barsh-track">
              <div
                className="cc-barsh-fill"
                style={{ width: `${(r.value / max) * 100}%`, background: hot ? (color || 'var(--accent)') : 'var(--bar-idle)' }}
              ></div>
            </div>
            <span className={'cc-barsh-val' + (hot ? ' hot' : '')}>{fmt(r.value)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------- Radar (1-2 entidades) ----------------
function CCRadar({ axes, series, size = 380 }) {
  // axes: [{label}], series: [{name,color,values:[0..1],raw:[...]}]
  const C = size / 2, R = C - 64, n = axes.length;
  const pt = (i, f) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [C + Math.cos(a) * R * f, C + Math.sin(a) * R * f];
  };
  const ring = f => axes.map((_, i) => pt(i, f).join(',')).join(' ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="cc-chart" style={{ maxWidth: size }}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={ring(f)} fill="none" className="cc-grid-poly"></polygon>
      ))}
      {axes.map((a, i) => {
        const [x2, y2] = pt(i, 1);
        const [lx, ly] = pt(i, 1.22);
        return (
          <g key={i}>
            <line x1={C} y1={C} x2={x2} y2={y2} className="cc-grid"></line>
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="cc-tick cc-radar-label">{a.label}</text>
          </g>
        );
      })}
      {series.map((s, k) => (
        <g key={k}>
          <polygon
            points={s.values.map((v, i) => pt(i, Math.max(0.04, v)).join(',')).join(' ')}
            fill={s.color} opacity="0.14"
          ></polygon>
          <polygon
            points={s.values.map((v, i) => pt(i, Math.max(0.04, v)).join(',')).join(' ')}
            fill="none" stroke={s.color} strokeWidth="2.2" strokeLinejoin="round"
          ></polygon>
          {s.values.map((v, i) => {
            const [cx, cy] = pt(i, Math.max(0.04, v));
            return <circle key={i} cx={cx} cy={cy} r="3.6" fill={s.color} stroke="var(--surface)" strokeWidth="1.4"></circle>;
          })}
        </g>
      ))}
    </svg>
  );
}

// ---------------- Scatter ----------------
function CCScatter({ points, xLabel, yLabel, height = 420, highlight, formatX, formatY }) {
  const [hover, setHover] = ccUseState(null);
  const W = 860, H = height, padL = 52, padR = 20, padT = 16, padB = 44;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const tx = ccNiceTicks(Math.min(...xs), Math.max(...xs), 6);
  const ty = ccNiceTicks(Math.min(...ys), Math.max(...ys), 5);
  const x = v => padL + ((v - tx.lo) / (tx.hi - tx.lo)) * (W - padL - padR);
  const y = v => padT + (1 - (v - ty.lo) / (ty.hi - ty.lo)) * (H - padT - padB);
  const fx = formatX || (v => v), fy = formatY || (v => v);
  const avgX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const avgY = ys.reduce((a, b) => a + b, 0) / ys.length;

  return (
    <div className="cc-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="cc-chart" onMouseLeave={() => setHover(null)}>
        {ty.ticks.map(t => (
          <g key={'y' + t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className="cc-grid"></line>
            <text x={padL - 8} y={y(t) + 4} textAnchor="end" className="cc-tick">{fy(t)}</text>
          </g>
        ))}
        {tx.ticks.map(t => (
          <text key={'x' + t} x={x(t)} y={H - 22} textAnchor="middle" className="cc-tick">{fx(t)}</text>
        ))}
        <line x1={x(avgX)} x2={x(avgX)} y1={padT} y2={H - padB} className="cc-grid" strokeDasharray="5 4"></line>
        <line x1={padL} x2={W - padR} y1={y(avgY)} y2={y(avgY)} className="cc-grid" strokeDasharray="5 4"></line>
        <text x={W / 2} y={H - 4} textAnchor="middle" className="cc-axis-label">{xLabel}</text>
        <text x={12} y={H / 2} textAnchor="middle" className="cc-axis-label" transform={`rotate(-90 12 ${H / 2})`}>{yLabel}</text>
        {points.map((p, i) => {
          const hot = highlight && p.label === highlight;
          const op = hover == null || hover === i ? 1 : 0.45;
          const r = p.logo ? (hot ? 16 : 12) : (hot ? 8 : 6);
          return (
            <g key={i} onMouseEnter={() => setHover(i)}>
              {p.logo ? (
                <g opacity={op}>
                  {hot && <circle cx={x(p.x)} cy={y(p.y)} r={r + 3.5} fill="none" stroke="var(--accent)" strokeWidth="1.8"></circle>}
                  {/* foreignObject+img (no <image>): los <img> sí se incrustan al exportar/capturar */}
                  <foreignObject x={x(p.x) - r} y={y(p.y) - r} width={r * 2} height={r * 2} style={{ pointerEvents: 'none', overflow: 'visible' }}>
                    <img src={p.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}></img>
                  </foreignObject>
                  <circle cx={x(p.x)} cy={y(p.y)} r={r + 2} fill="transparent"></circle>
                </g>
              ) : (
                <circle cx={x(p.x)} cy={y(p.y)} r={r}
                  fill={hot ? 'var(--accent)' : 'var(--scatter-idle)'}
                  stroke="var(--surface)" strokeWidth="1.6"
                  opacity={op}
                ></circle>
              )}
              {(hot || hover === i) && (
                <text x={x(p.x)} y={y(p.y) - r - 6} textAnchor="middle" className="cc-scatter-name">{p.label}</text>
              )}
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div className="cc-tooltip">
          <strong>{points[hover].label}</strong>
          {points[hover].sub && <div className="cc-tooltip-meta">{points[hover].sub}</div>}
          <div className="cc-tooltip-row"><span>{xLabel}</span><b>{fx(points[hover].x)}</b></div>
          <div className="cc-tooltip-row"><span>{yLabel}</span><b>{fy(points[hover].y)}</b></div>
        </div>
      )}
    </div>
  );
}

// ---------------- Grouped vertical bars (comparación) ----------------
function CCBarsGroup({ groups, series, formatV }) {
  // groups: [metricLabel], series: [{name,color,data:[...]}] — normalizado por grupo
  const fmt = formatV || (v => v);
  return (
    <div className="cc-barsgroup">
      {groups.map((g, gi) => {
        const max = Math.max(...series.map(s => s.data[gi]), 0.0001);
        return (
          <div key={g} className="cc-barsgroup-row">
            <div className="cc-barsgroup-label">{g}</div>
            <div className="cc-barsgroup-bars">
              {series.map((s, si) => (
                <div key={si} className="cc-barsgroup-bar">
                  <div className="cc-barsgroup-track">
                    <div className="cc-barsgroup-fill" style={{ width: `${(s.data[gi] / max) * 100}%`, background: s.color }}></div>
                  </div>
                  <span className="cc-barsgroup-val">{fmt(s.data[gi])}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

Object.assign(window, { CCLineChart, CCBarsH, CCRadar, CCScatter, CCBarsGroup, ccNiceTicks });
