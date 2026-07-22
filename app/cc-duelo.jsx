// ============================================================
// ColoColo Football Center — Duelo cara a cara (pie giratorio)
// Comparación Individual (jugadores) y Colectiva (equipos):
// composición de acciones con torta giratoria, bloques del
// segmento elegido y tabla comparativa por percentiles.
// ============================================================
/* global React, Card, Select, CCTeamLogo */

const DUEL_SEGC = ['#BE1622', '#141414', '#8C1219', '#6E6E6A', '#D43A45', '#3A3E46', '#5E060B', '#9C9C97', '#A81E28', '#26272E', '#E4626B', '#54575F'];
const DUEL_CAT_J = [
 { k: 'pasesP90', l: 'PASES', ex: 'pasesPct' },
 { k: 'pasesProgP90', l: 'PASES PROG.', ex: null },
 { k: 'duelosP90', l: 'DUELOS', ex: 'duelosPct' },
 { k: 'accDefP90', l: 'ACC. DEF.', ex: null },
 { k: 'intercepP90', l: 'INTERCEP.', ex: null },
 { k: 'regatesP90', l: 'REGATES', ex: 'regatesPct' },
 { k: 'carrerasP90', l: 'CARRERAS', ex: null },
 { k: 'toquesAreaP90', l: 'TOQUES ÁREA', ex: null },
 { k: 'centrosP90', l: 'CENTROS', ex: null },
 { k: 'tirosP90', l: 'TIROS', ex: 'tirosArcoPct' },
 { k: 'jugadasClaveP90', l: 'JUG. CLAVE', ex: null },
 { k: 'golesP90', l: 'GOLES', ex: null }
];
const DUEL_CAT_E = [
 { k: 'Goles', l: 'GOLES', ex: null },
 { k: 'Tiros', l: 'TIROS', ex: 'Tiros al arco %' },
 { k: 'Centros', l: 'CENTROS', ex: null },
 { k: 'Córners', l: 'CÓRNERS', ex: null },
 { k: 'Faltas', l: 'FALTAS', ex: null }
];
const DUEL_ORD_POS = [[/^GK/, 0], [/CB/, 1], [/^(L|R)B\d*$|WB/, 2], [/DMF/, 3], [/CMF/, 4], [/AMF/, 5], [/W(F)?$/, 6], [/^SS$/, 7], [/CF|ST/, 8]];
function duelPosOrder(p) { p = String(p || '').toUpperCase(); for (const par of DUEL_ORD_POS) if (par[0].test(p)) return par[1]; return 9; }
function duelR1(v) { return Math.round(v * 10) / 10; }
function duelFmt(v) { return v == null ? '—' : duelR1(v).toLocaleString('es-CL'); }
function duelLogo(t) { try { return window.CC_LOGOS ? CC_LOGOS.teamUrl(t) : null; } catch (e) { return null; } }
function duelPlayers() { return CC_DATA.jugadores.slice(); }
function duelTeams() { return Object.keys(CC_DATA.metricasEquipo || {}).filter(k => k !== 'Promedio adversarios').sort((a, b) => a.localeCompare(b, 'es')); }
function duelTeamsConJug() { const s = {}; duelPlayers().forEach(j => { s[j.equipo] = 1; }); return Object.keys(s).sort((a, b) => a.localeCompare(b, 'es')); }
function duelPlayersOf(t) { return duelPlayers().filter(j => j.equipo === t).sort((a, b) => { const d = duelPosOrder(a.posicion) - duelPosOrder(b.posicion); return d !== 0 ? d : a.nombre.localeCompare(b.nombre, 'es'); }); }
function duelCats(modo) { return modo === 'ind' ? DUEL_CAT_J : DUEL_CAT_E; }
function duelEnt(modo, id) {
 if (modo === 'ind') { let p = null; duelPlayers().forEach(j => { if (j.nombre + '|' + j.equipo === id) p = j; }); return p; }
 return CC_DATA.metricasEquipo[id] || null;
}
function duelBuild(modo, id) {
 const e = duelEnt(modo, id); if (!e) return null;
 const C = duelCats(modo); let sum = 0; const vals = {};
 C.forEach(c => { let v = e[c.k]; v = (typeof v === 'number' && isFinite(v)) ? v : 0; vals[c.k] = v; sum += v; });
 const segs = C.map((c, i) => ({ label: c.l, key: c.k, ex: c.ex, color: DUEL_SEGC[i % DUEL_SEGC.length], p90: vals[c.k], percentage: sum > 0 ? Math.round(vals[c.k] / sum * 1000) / 10 : 0 })).filter(s => s.percentage > 0);
 const pool = modo === 'ind' ? duelPlayers() : duelTeams().map(t => CC_DATA.metricasEquipo[t]);
 return { e, segs, score: duelR1(sum), pool };
}
function duelStats(modo, d, seg) {
 const e = d.e; const out = { p90: seg.p90, exito: null, porPartido: null, total: null, rank: null };
 if (modo === 'ind') {
  const min = e.min || 0, pj = e.pj || 0;
  out.total = Math.round(seg.p90 * min / 90);
  out.porPartido = pj > 0 ? duelR1(seg.p90 * min / 90 / pj) : null;
 } else {
  out.porPartido = duelR1(seg.p90);
  out.total = Math.round(seg.p90 * (e._pj || 0));
 }
 if (seg.ex && typeof e[seg.ex] === 'number') out.exito = duelR1(e[seg.ex]);
 let mejor = 1; d.pool.forEach(o => { const v = o && o[seg.key]; if (typeof v === 'number' && v > seg.p90) mejor++; });
 out.rank = mejor;
 return out;
}
function duelGeo(segs) {
 let cur = -90;
 return segs.map(s => {
  const ang = s.percentage / 100 * 360, a0 = cur, a1 = cur + ang; cur = a1;
  const mid = (a0 + a1) / 2, R = 100, cx = 120, cy = 120;
  const x1 = cx + R * Math.cos(a0 * Math.PI / 180), y1 = cy + R * Math.sin(a0 * Math.PI / 180);
  const x2 = cx + R * Math.cos(a1 * Math.PI / 180), y2 = cy + R * Math.sin(a1 * Math.PI / 180);
  const la = ang > 180 ? 1 : 0;
  const path = 'M ' + cx + ' ' + cy + ' L ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' A ' + R + ' ' + R + ' 0 ' + la + ' 1 ' + x2.toFixed(2) + ' ' + y2.toFixed(2) + ' Z';
  const lr = 35 + (100 - 35) / 2;
  return Object.assign({}, s, { path, mid, ang, lx: cx + lr * Math.cos(mid * Math.PI / 180), ly: cy + lr * Math.sin(mid * Math.PI / 180) });
 });
}
function duelMidDeg(segs, idx) { let cum = 0; for (let i = 0; i < idx; i++) cum += segs[i].percentage / 100 * 360; return cum + (segs[idx].percentage / 100 * 360) / 2; }
function duelDefaults(modo) {
 if (modo === 'ind') {
  const cc = duelPlayersOf('Colo-Colo').slice().sort((a, b) => (b.min || 0) - (a.min || 0));
  const all = duelPlayers();
  const l = cc[0] || all[0], r = cc[1] || all[1];
  return { L: { team: l.equipo, id: l.nombre + '|' + l.equipo }, R: { team: r.equipo, id: r.nombre + '|' + r.equipo } };
 }
 const ts = duelTeams(); const other = ts.find(t => t !== 'Colo-Colo') || ts[1];
 return { L: { team: 'Colo-Colo', id: 'Colo-Colo' }, R: { team: other, id: other } };
}
function duelCmpRows(modo) {
 if (modo === 'ind') return DUEL_CAT_J.map(c => ({ k: c.k, l: c.l + ' /90' })).concat([
  { k: 'pasesPct', l: 'PASES %', suf: '%' }, { k: 'duelosPct', l: 'DUELOS %', suf: '%' },
  { k: 'regatesPct', l: 'REGATES %', suf: '%' }, { k: 'tirosArcoPct', l: 'TIROS AL ARCO %', suf: '%' }
 ]);
 return DUEL_CAT_E.map(c => ({ k: c.k, l: c.l + ' /PARTIDO', inv: c.k === 'Faltas' })).concat([
  { k: 'Posesión %', l: 'POSESIÓN %', suf: '%' }, { k: 'Pases precisos %', l: 'PASES PRECISOS %', suf: '%' },
  { k: 'Duelos def. ganados %', l: 'DUELOS DEF. %', suf: '%' }, { k: 'Tiros al arco %', l: 'TIROS AL ARCO %', suf: '%' },
  { k: 'PPDA', l: 'PPDA (↓ mejor)', inv: true }
 ]);
}
function duelPctile(key, val, pool, inv) {
 const vals = []; pool.forEach(o => { const v = o && o[key]; if (typeof v === 'number' && isFinite(v)) vals.push(v); });
 if (val == null || typeof val !== 'number' || vals.length < 2) return null;
 let below = 0, eq = 0;
 vals.forEach(v => { if (v < val) below++; else if (v === val) eq++; });
 let p = (below + Math.max(0, eq - 1) / 2) / (vals.length - 1) * 100;
 if (inv) p = 100 - p;
 return Math.max(0, Math.min(100, p));
}

function CCDuelo({ modo }) {
 const [sel, setSel] = React.useState(() => duelDefaults(modo));
 const dL = duelBuild(modo, sel.L.id), dR = duelBuild(modo, sel.R.id);
 const [cat, setCat] = React.useState(() => (dL && dL.segs[0] ? dL.segs[0].label : null));
 const [rot, setRot] = React.useState(() => {
  const t = { L: 0, R: 0 };
  if (dL && dL.segs.length) t.L = 180 - duelMidDeg(dL.segs, 0);
  if (dR && dR.segs.length) t.R = 180 - duelMidDeg(dR.segs, 0);
  return t;
 });
 const [hover, setHover] = React.useState(null);

 React.useEffect(() => {
  setRot(prev => {
   const next = Object.assign({}, prev);
   [['L', dL], ['R', dR]].forEach(par => {
    const s = par[0], d = par[1];
    if (!d || !d.segs.length) return;
    let idx = d.segs.findIndex(x => x.label === cat); if (idx < 0) idx = 0;
    const target = 180 - duelMidDeg(d.segs, idx);
    let diff = target - prev[s];
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    next[s] = prev[s] + diff;
   });
   return next;
  });
 }, [sel.L.id, sel.R.id, cat, modo]);

 if (!dL || !dR) return null;
 const idxDe = d => { let i = d.segs.findIndex(x => x.label === cat); return i < 0 ? 0 : i; };
 const stL = dL.segs.length ? duelStats(modo, dL, dL.segs[idxDe(dL)]) : { p90: null, exito: null, porPartido: null, total: null, rank: null };
 const stR = dR.segs.length ? duelStats(modo, dR, dR.segs[idxDe(dR)]) : { p90: null, exito: null, porPartido: null, total: null, rank: null };
 const best = (key, lower) => {
  const va = key === 'score' ? dL.score : stL[key], vb = key === 'score' ? dR.score : stR[key];
  if (va == null || vb == null || va === vb) return null;
  return (lower ? va < vb : va > vb) ? 'L' : 'R';
 };
 const bests = { score: best('score'), p90: best('p90'), total: best('total'), exito: best('exito'), porPartido: best('porPartido'), rank: best('rank', true) };
 const nmDe = side => modo === 'ind' ? sel[side].id.split('|')[0] : sel[side].id;

 const pickTeam = (side, t) => setSel(prev => {
  const next = Object.assign({}, prev);
  if (modo === 'ind') { const ps = duelPlayersOf(t); next[side] = { team: t, id: ps.length ? ps[0].nombre + '|' + ps[0].equipo : prev[side].id }; }
  else next[side] = { team: t, id: t };
  return next;
 });
 const pickPlayer = (side, id) => setSel(prev => Object.assign({}, prev, { [side]: Object.assign({}, prev[side], { id }) }));

 const panel = side => {
  const d = side === 'L' ? dL : dR, st = side === 'L' ? stL : stR;
  const S = sel[side], geo = duelGeo(d.segs), selIdx = idxDe(d), rotS = rot[side];
  const lg = duelLogo(S.team), nm = nmDe(side);
  const selColor = d.segs[selIdx] ? d.segs[selIdx].color : DUEL_SEGC[0];
  const hovIdx = hover && hover.side === side ? hover.i : null;
  const anno = hovIdx != null && geo[hovIdx] && geo[hovIdx].ang <= 19 ? (() => {
   const s = geo[hovIdx];
   const a = (s.mid + rotS) * Math.PI / 180, c = Math.cos(a), n = Math.sin(a);
   const str = s.label + ' ' + s.percentage + '%', w = str.length * 5.4 + 12;
   const tx = Math.max(6 + w / 2, Math.min(234 - w / 2, 120 + 118 * c)), ty = Math.max(12, Math.min(228, 120 + 118 * n));
   return (
    <g>
     <line x1={120 + 101 * c} y1={120 + 101 * n} x2={120 + 112 * c} y2={120 + 112 * n} stroke={s.color} strokeWidth="2"></line>
     <rect x={tx - w / 2} y={ty - 9} width={w} height="18" rx="9" fill="var(--surface)" stroke="var(--border)"></rect>
     <text className="anno-pill" x={tx} y={ty + 3.5} textAnchor="middle">{str}</text>
    </g>
   );
  })() : null;
  return (
   <Card className="cc-pad cc-duel-card">
    <div className={'cc-duel-selrow' + (modo === 'col' ? ' solo' : '')}>
     <Select label="Equipo" value={S.team} onChange={t => pickTeam(side, t)} options={modo === 'ind' ? duelTeamsConJug() : duelTeams()}></Select>
     {modo === 'ind' && <Select label="Jugador (GK→CF)" value={S.id} onChange={id => pickPlayer(side, id)}
      options={duelPlayersOf(S.team).map(j => ({ value: j.nombre + '|' + j.equipo, label: j.nombre + ' · ' + j.posicion }))}></Select>}
    </div>
    <div className="name-tag">{lg ? <img src={lg} onError={e => e.target.remove()}></img> : null}<span>{nm}</span>{modo === 'ind' ? <span className="sub">{S.team}</span> : null}</div>
    {modo === 'ind'
     ? <div className="statline">{(d.e.pj || 0)} PJ · {(d.e.min || 0)}′ · {(d.e.goles || 0)} goles · {(d.e.asist || 0)} asist.{d.e.edad ? ' · ' + d.e.edad + ' años' : ''}</div>
     : <div className="statline">{(d.e._pj || 0)} partidos registrados</div>}
    <div className="cc-duel-pie">
     <div className="score-box"><div className={'score-value' + (bests.score === side ? ' best' : '')}>{duelFmt(d.score)}</div><div className="score-label">{modo === 'ind' ? 'ACCIONES /90' : 'ACCIONES OF. /PARTIDO'}</div></div>
     <div className="pie-wrap">
      <svg viewBox="0 0 240 240" className="pie-chart">
       <g className="rotg" style={{ transform: 'rotate(' + rotS + 'deg)', transformOrigin: '120px 120px' }}>
        {geo.map((s, i) => {
         const off = i === selIdx ? 8 : (i === hovIdx ? 4 : 0);
         return <path key={i} d={s.path} fill={s.color} className={'seg' + (i === selIdx ? ' on' : '')}
          style={{ transform: 'translate(' + (off * Math.cos(s.mid * Math.PI / 180)).toFixed(2) + 'px,' + (off * Math.sin(s.mid * Math.PI / 180)).toFixed(2) + 'px)' }}
          onClick={() => setCat(s.label)}
          onMouseEnter={() => setHover({ side, i })} onMouseLeave={() => setHover(null)}></path>;
        })}
        {geo.map((s, i) => {
         if (s.ang <= 19) return null;
         const w = s.label.split(' ');
         return (
          <g key={'l' + i} className="lblg" style={{ transform: 'rotate(' + (-rotS) + 'deg)', transformOrigin: s.lx.toFixed(1) + 'px ' + s.ly.toFixed(1) + 'px' }}>
           {w.length > 1
            ? [<text key="a" x={s.lx} y={s.ly - 10} textAnchor="middle" dominantBaseline="middle" className="seg-lbl">{w[0]}</text>,
               <text key="b" x={s.lx} y={s.ly + 2} textAnchor="middle" dominantBaseline="middle" className="seg-lbl">{w.slice(1).join(' ')}</text>,
               <text key="c" x={s.lx} y={s.ly + 14} textAnchor="middle" dominantBaseline="middle" className="seg-pct">{s.percentage}%</text>]
            : [<text key="a" x={s.lx} y={s.ly - 6} textAnchor="middle" dominantBaseline="middle" className="seg-lbl">{s.label}</text>,
               <text key="b" x={s.lx} y={s.ly + 6} textAnchor="middle" dominantBaseline="middle" className="seg-pct">{s.percentage}%</text>]}
          </g>
         );
        })}
       </g>
       <circle cx="120" cy="120" r="35" fill="var(--surface)" fillOpacity="0.5"></circle>
       <circle cx="120" cy="120" r="20" fill="var(--surface)" stroke="var(--border)"></circle>
       {lg && <image href={lg} x="108" y="108" width="24" height="24" preserveAspectRatio="xMidYMid meet"></image>}
       {anno}
      </svg>
     </div>
     <div className="branches">
      <svg viewBox="0 0 300 60">
       <line x1="150" y1="0" x2="150" y2="20" stroke={selColor} strokeWidth="4"></line>
       <line x1="150" y1="20" x2="20" y2="20" stroke={selColor} strokeWidth="4"></line>
       <line x1="150" y1="20" x2="280" y2="20" stroke={selColor} strokeWidth="4"></line>
       <line x1="20" y1="18" x2="20" y2="60" stroke={selColor} strokeWidth="4"></line>
       <line x1="280" y1="18" x2="280" y2="60" stroke={selColor} strokeWidth="4"></line>
      </svg>
     </div>
     <div className="blocks">
      <div className={'blk' + (bests.p90 === side ? ' best' : '')}><div className="blk-l">{modo === 'ind' ? 'POR 90′' : 'POR PARTIDO'}</div><div className="blk-v">{duelFmt(st.p90)}</div></div>
      <div className={'blk' + (bests.total === side ? ' best' : '')}><div className="blk-l">TOTAL 2026</div><div className="blk-v">{st.total == null ? '—' : st.total.toLocaleString('es-CL')}</div></div>
     </div>
     <div className="mets3">
      <div className={'met' + (bests.exito === side ? ' best' : '')}><div className="met-l">ÉXITO / PRECISIÓN</div><div className="met-v">{st.exito == null ? '—' : duelFmt(st.exito) + '%'}</div></div>
      <div className={'met' + (bests.porPartido === side ? ' best' : '')}><div className="met-l">{modo === 'ind' ? 'POR PARTIDO' : 'PROMEDIO /PARTIDO'}</div><div className="met-v">{duelFmt(st.porPartido)}</div></div>
      <div className={'met' + (bests.rank === side ? ' best' : '')}><div className="met-l">PUESTO LIGA</div><div className="met-v">{st.rank == null ? '—' : '#' + st.rank}</div></div>
     </div>
    </div>
   </Card>
  );
 };

 // ---- tabla comparativa por percentiles ----
 const rows = duelCmpRows(modo);
 let winL = 0, winR = 0; const accL = [], accR = [];
 const filas = rows.map(rw => {
  let va = dL.e[rw.k], vb = dR.e[rw.k];
  va = (typeof va === 'number' && isFinite(va)) ? va : null;
  vb = (typeof vb === 'number' && isFinite(vb)) ? vb : null;
  const pa = duelPctile(rw.k, va, dL.pool, rw.inv), pb = duelPctile(rw.k, vb, dL.pool, rw.inv);
  if (pa != null) accL.push(pa);
  if (pb != null) accR.push(pb);
  let gA = null;
  if (pa != null && pb != null && pa !== pb) gA = pa > pb;
  if (gA === true) winL++; else if (gA === false) winR++;
  return { rw, va, vb, pa, pb, gA };
 });
 const sL = accL.length ? duelR1(accL.reduce((a, b) => a + b, 0) / accL.length) : null;
 const sR = accR.length ? duelR1(accR.reduce((a, b) => a + b, 0) / accR.length) : null;
 const nmL = nmDe('L'), nmR = nmDe('R');
 const ganador = (sL != null && sR != null && sL !== sR) ? (sL > sR ? nmL : nmR) : null;
 const lgL = duelLogo(sel.L.team), lgR = duelLogo(sel.R.team);

 return (
  <React.Fragment>
   <div className="cc-duel">
    {panel('L')}
    <div className="cc-duel-vs">VS</div>
    {panel('R')}
   </div>
   <Card className="cc-pad cc-duel-cmp">
    <div className="cc-chart-head">
     <h3 className="cc-card-title">Comparativa métrica a métrica</h3>
    </div>
    <p className="cc-card-note">Valores en percentil (P0–P100, sobre todos los registros cargados) · debajo, el valor real · el mejor de cada fila lleva la insignia.</p>
    <div className="cmp-head">
     <div className="side">{lgL ? <img src={lgL} onError={e => e.target.remove()}></img> : null}{nmL}</div>
     <div className="mid">Métrica</div>
     <div className="side r">{nmR}{lgR ? <img src={lgR} onError={e => e.target.remove()}></img> : null}</div>
    </div>
    {filas.map(({ rw, va, vb, pa, pb, gA }) => {
     const fa = pa == null ? '—' : 'P' + Math.round(pa), fb = pb == null ? '—' : 'P' + Math.round(pb);
     const ra = va == null ? '' : duelFmt(va) + (rw.suf || ''), rb = vb == null ? '' : duelFmt(vb) + (rw.suf || '');
     return (
      <div key={rw.k + rw.l} className="cmp-row">
       <div className="cmp-val">{gA === true ? <span className="win">{fa}</span> : fa}{ra ? <small>{ra}</small> : null}</div>
       <div className="cmp-bar l"><i style={{ width: (pa == null ? 0 : pa) + '%' }}></i></div>
       <div className="cmp-lbl">{rw.l}</div>
       <div className="cmp-bar r"><i style={{ width: (pb == null ? 0 : pb) + '%' }}></i></div>
       <div className="cmp-val r">{gA === false ? <span className="win">{fb}</span> : fb}{rb ? <small>{rb}</small> : null}</div>
      </div>
     );
    })}
    <div className="cmp-verdict">
     <div className={'v-badge' + (sL != null && sR != null && sL > sR ? ' win' : '')}><b>{sL == null ? '—' : duelFmt(sL)}</b><small>Score {nmL}</small></div>
     <div className="v-texto">{ganador ? <React.Fragment>Mejor global: <em>{ganador}</em> · {winL}–{winR} en métricas</React.Fragment> : 'Empate global · ' + winL + '–' + winR + ' en métricas'}</div>
     <div className={'v-badge' + (sL != null && sR != null && sR > sL ? ' win' : '')}><b>{sR == null ? '—' : duelFmt(sR)}</b><small>Score {nmR}</small></div>
    </div>
   </Card>
  </React.Fragment>
 );
}

Object.assign(window, { CCDuelo });
