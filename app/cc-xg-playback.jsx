// ============================================================
// ColoColo Football Center — xG en vivo · Playback (Reporte)
// Tarjeta adicional del Reporte Post-Partido: carrera de xG
// acumulado + shotmap cronológico con los tiros reales del
// partido cargado. No modifica las demás secciones.
// ============================================================
/* global React, Card, CCTeamLogo */

function xgpR2(v) { return Math.round(v * 100) / 100; }

function CCXgPlayback({ shots, rival }) {
 const sorted = React.useMemo(() => shots.filter(s => s && s.minuto != null).map(s => Object.assign({}, s, { xg: typeof s.xg === 'number' ? s.xg : 0.05 })).sort((a, b) => a.minuto - b.minuto), [shots]);
 const tMax = Math.max(93, sorted.length ? sorted[sorted.length - 1].minuto + 2 : 93);
 const [t, setT] = React.useState(tMax);
 const [playing, setPlaying] = React.useState(false);
 const [speed, setSpeed] = React.useState(2);
 const raf = React.useRef(null), last = React.useRef(0), tRef = React.useRef(tMax), spRef = React.useRef(2);
 spRef.current = speed;
 const tlRef = React.useRef(null);
 React.useEffect(() => () => cancelAnimationFrame(raf.current), []);
 if (!sorted.length) return null;

 function tick(ts) {
  if (!last.current) last.current = ts;
  const dt = (ts - last.current) / 1000; last.current = ts;
  let nt = tRef.current + dt * 1.6 * spRef.current;
  if (nt >= tMax) { tRef.current = tMax; setT(tMax); setPlaying(false); return; }
  tRef.current = nt; setT(nt);
  raf.current = requestAnimationFrame(tick);
 }
 const play = () => {
  if (playing) { setPlaying(false); cancelAnimationFrame(raf.current); return; }
  const ini = tRef.current >= tMax ? 0 : tRef.current;
  tRef.current = ini; setT(ini); setPlaying(true); last.current = 0;
  raf.current = requestAnimationFrame(tick);
 };
 const seek = e => {
  const r = tlRef.current.getBoundingClientRect();
  const nt = Math.max(0, Math.min(tMax, (e.clientX - r.left) / r.width * tMax));
  setPlaying(false); cancelAnimationFrame(raf.current);
  tRef.current = nt; setT(nt);
 };

 // acumulados al minuto t
 let gc = 0, gr = 0, xc = 0, xr = 0;
 sorted.forEach(s => { if (s.minuto <= t) { if (s.lado === 'cc') { xc += s.xg; if (s.resultado === 'gol') gc++; } else { xr += s.xg; if (s.resultado === 'gol') gr++; } } });

 // ---- carrera de xG ----
 const W = 620, H = 240, p = { l: 42, r: 78, t: 16, b: 26 };
 const pasos = lado => { let acc = 0; return sorted.filter(s => s.lado === lado).map(s => { acc = xgpR2(acc + s.xg); return { min: s.minuto, acc }; }); };
 const cc = pasos('cc'), rv = pasos('rv');
 const mx = Math.max(cc.length ? cc[cc.length - 1].acc : 0, rv.length ? rv[rv.length - 1].acc : 0, 0.5) * 1.15;
 const gsx = m => p.l + m / tMax * (W - p.l - p.r);
 const gsy = v => H - p.b - v / mx * (H - p.t - p.b);
 const pathDe = pts => { let d = 'M ' + gsx(0) + ' ' + gsy(0), prev = 0; pts.forEach(q => { d += ' L ' + gsx(q.min) + ' ' + gsy(prev) + ' L ' + gsx(q.min) + ' ' + gsy(q.acc); prev = q.acc; }); return d + ' L ' + gsx(tMax) + ' ' + gsy(prev); };
 const golPts = sorted.filter(s => s.resultado === 'gol').map(s => { let acc = 0; (s.lado === 'cc' ? cc : rv).forEach(q => { if (q.min <= s.minuto) acc = q.acc; }); return { s, acc }; });

 // ---- cancha completa ----
 const PW = 520, PH = 336, mxp = 14, myp = 16, fw = PW - 2 * mxp, fh = PH - 2 * myp;
 const X = v => mxp + v / 100 * fw, Y = v => myp + v / 100 * fh;
 const L = { fill: 'none', stroke: '#cfd6cf', strokeWidth: 1.6 };
 const lgC = window.CC_LOGOS ? CC_LOGOS.teamUrl('Colo-Colo') : null;
 const lgR = window.CC_LOGOS ? CC_LOGOS.teamUrl(rival) : null;
 const wm = fh * 0.44;

 return (
  <Card className="cc-pad cc-xgp">
   <div className="cc-chart-head">
    <h3 className="cc-card-title">xG en vivo · Playback</h3>
   </div>
   <div className="cc-xgp-ctl cc-no-print">
    <button className="cc-btn-mini" onClick={play}>{playing ? '❚❚ Pausa' : (t >= tMax ? '↺ Reproducir' : '▶ Reproducir')}</button>
    {[1, 2, 4].map(v => <button key={v} className={'cc-btn-mini cc-btn-ghost spd' + (speed === v ? ' on' : '')} onClick={() => setSpeed(v)}>{v}x</button>)}
    <div className="cc-xgp-marc">
     <span className="eq"><CCTeamLogo team="Colo-Colo" size={20}></CCTeamLogo>Colo-Colo</span>
     <span className="num">{gc} – {gr}</span>
     <span className="eq">{rival}<CCTeamLogo team={rival} size={20}></CCTeamLogo></span>
     <span className="minb">{Math.floor(t)}'</span>
    </div>
   </div>
   <div className="cc-xgp-tl cc-no-print" ref={tlRef} onClick={seek}>
    <div className="base"></div>
    <div className="fill" style={{ width: (t / tMax * 100) + '%' }}></div>
    {[0, 15, 30, 45, 60, 75, 90].map(mm => <div key={mm} className="tick" style={{ left: (mm / tMax * 100) + '%' }}>{mm}'</div>)}
    {sorted.map((s, i) => (
     <div key={i} className={'ev ' + (s.lado === 'cc' ? 'cc' : 'rv') + (s.resultado === 'gol' ? ' gol' : '') + (s.minuto > t ? ' off' : '')}
      style={{ left: (s.minuto / tMax * 100) + '%' }}
      title={s.minuto + "' · " + (s.jugador || '—') + ' · ' + (s.lado === 'cc' ? 'Colo-Colo' : rival) + ' · ' + (s.resultado === 'gol' ? 'GOL' : s.resultado) + ' · xG ' + xgpR2(s.xg)}></div>
    ))}
    <div className="cursor" style={{ left: (t / tMax * 100) + '%' }}></div>
   </div>
   <div className="cc-xgp-grid">
    <div>
     <svg viewBox={'0 0 ' + W + ' ' + H} style={{ width: '100%', height: 'auto' }}>
      {[0, 1, 2, 3, 4].map(g => { const v = mx / 4 * g; return <g key={g}><line x1={p.l} y1={gsy(v)} x2={W - p.r} y2={gsy(v)} stroke="var(--border)"></line><text className="tick" x={p.l - 6} y={gsy(v) + 3} textAnchor="end">{xgpR2(v)}</text></g>; })}
      {[0, 15, 30, 45, 60, 75, 90].map(mm => <text key={mm} className="tick" x={gsx(mm)} y={H - 8} textAnchor="middle">{mm}'</text>)}
      <clipPath id="ccXgpClip"><rect x={p.l} y="0" width={Math.max(0, gsx(t) - p.l)} height={H}></rect></clipPath>
      <g clipPath="url(#ccXgpClip)">
       <path d={pathDe(rv)} fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round"></path>
       <path d={pathDe(cc)} fill="none" stroke="var(--rojo)" strokeWidth="3" strokeLinejoin="round"></path>
       {golPts.map((g, i) => <circle key={i} cx={gsx(g.s.minuto)} cy={gsy(g.acc)} r="6" fill={g.s.lado === 'cc' ? 'var(--rojo)' : 'var(--ink)'} stroke="#fff" strokeWidth="2"></circle>)}
      </g>
      <line x1={gsx(t)} y1={p.t} x2={gsx(t)} y2={H - p.b} stroke="var(--ink-3)" strokeDasharray="4,3"></line>
      <text className="xgnum" x={W - p.r + 8} y={p.t + 24} fill="var(--rojo)">{xc.toFixed(2)}</text>
      <text className="xgnum" x={W - p.r + 8} y={p.t + 52} fill="var(--ink)">{xr.toFixed(2)}</text>
      <text className="axl" x={p.l} y={p.t - 4}>xG acumulado</text>
     </svg>
     <div className="cc-xgp-leg"><span><i style={{ background: 'var(--rojo)' }}></i>Colo-Colo</span><span><i style={{ background: 'var(--ink)' }}></i>{rival}</span></div>
    </div>
    <div>
     <svg viewBox={'0 0 ' + PW + ' ' + PH} style={{ width: '100%', height: 'auto' }}>
      <rect x="0" y="0" width={PW} height={PH} rx="12" fill="#EFF3EE"></rect>
      <rect x={mxp} y={myp} width={fw} height={fh} {...L}></rect>
      <line x1={X(50)} y1={myp} x2={X(50)} y2={PH - myp} {...L}></line>
      <circle cx={X(50)} cy={Y(50)} r={fh * 0.13} {...L}></circle>
      <rect x={mxp} y={Y(21)} width={fw * 0.16} height={fh * 0.58} {...L}></rect>
      <rect x={mxp} y={Y(36)} width={fw * 0.06} height={fh * 0.28} {...L}></rect>
      <rect x={PW - mxp - fw * 0.16} y={Y(21)} width={fw * 0.16} height={fh * 0.58} {...L}></rect>
      <rect x={PW - mxp - fw * 0.06} y={Y(36)} width={fw * 0.06} height={fh * 0.28} {...L}></rect>
      {lgR && <image href={lgR} x={X(25) - wm / 2} y={Y(50) - wm / 2} width={wm} height={wm} opacity="0.09" preserveAspectRatio="xMidYMid meet"></image>}
      {lgC && <image href={lgC} x={X(75) - wm / 2} y={Y(50) - wm / 2} width={wm} height={wm} opacity="0.09" preserveAspectRatio="xMidYMid meet"></image>}
      {sorted.map((s, i) => {
       const esCC = s.lado === 'cc';
       const px = esCC ? X(100 - s.depth) : X(s.depth);
       const py = Y(esCC ? s.width : 100 - s.width);
       const rr = 5 + s.xg * 14, col = esCC ? 'var(--rojo)' : 'var(--ink)';
       return (
        <g key={i} style={{ opacity: s.minuto <= t ? 1 : 0, transition: 'opacity .25s' }}>
         <title>{s.minuto + "' · " + (s.jugador || '—') + ' · ' + (s.resultado === 'gol' ? 'GOL' : s.resultado) + ' · xG ' + xgpR2(s.xg)}</title>
         {s.resultado === 'gol' && <circle cx={px} cy={py} r={rr + 6} fill="none" stroke={col} strokeWidth="2.5"></circle>}
         <circle cx={px} cy={py} r={rr} fill={col} fillOpacity={s.resultado === 'gol' ? 1 : 0.55} stroke="#fff" strokeWidth="1.2"></circle>
        </g>
       );
      })}
      <text className="axl" x={X(75)} y={PH - 3} textAnchor="middle" fill="var(--rojo)">ataca Colo-Colo →</text>
      <text className="axl" x={X(25)} y={PH - 3} textAnchor="middle">← ataca {rival}</text>
     </svg>
    </div>
   </div>
   <p className="cc-card-note">Reproduce el partido: la curva de xG avanza minuto a minuto y los tiros aparecen en orden cronológico (tamaño = xG, anillo = gol). Haz clic en la línea de tiempo para saltar a un minuto.</p>
  </Card>
 );
}

Object.assign(window, { CCXgPlayback });
