// ============================================================
// ColoColo Football Center — Páginas 2 (DATOS REALES 2026)
// PPDA, Tiros y xG, Ranking de Equipos, Ranking de Jugadores
// ============================================================
/* global React, CC_DATA, Icon, Card, PageHeader, StatCard, Select, SegTabs, CCLineChart, CCBarsH, ResultPill */

const { useState: p2State, useMemo: p2Memo } = React;

// ---------------- PPDA ----------------
function CCResDot({ r }) {
 if (!r) return <span className="cc-forma-vacia">—</span>;
 const [a, b] = r.split('-').map(Number);
 const t = a > b ? 'v' : a === b ? 'e' : 'd';
 return <span className={'cc-forma-dot ' + t}>{t.toUpperCase()}</span>;
}

function PagePPDA() {
 const datos = CC_DATA.ppda;
 const prom = datos.reduce((a, m) => a + m.ppda, 0) / datos.length;
 const promRival = datos.reduce((a, m) => a + m.ppdaRival, 0) / datos.length;
 const mejor = [...datos].sort((a, b) => a.ppda - b.ppda)[0];
 const peor = [...datos].sort((a, b) => b.ppda - a.ppda)[0];
 const todos = datos.flatMap(m => [m.ppda, m.ppdaRival]);
 const esMin = Math.min(...todos) - 1;
 const esMax = Math.max(...todos) + 1;
 const pos = v => Math.max(0, Math.min(100, ((v - esMin) / (esMax - esMin)) * 100));
 const maxBar = Math.max(...datos.map(m => m.ppda));

 return (
  <div className="cc-page">
   <PageHeader icon="ppda" title="PPDA — Presión" subtitle="Pases que permitimos al rival antes de robar el balón · menos pases = presión más intensa"></PageHeader>

   <Card className="cc-pad">
    <div className="cc-presion-top">
     <div className="cc-presion-intro">
      <h3 className="cc-card-title">¿Qué tan intensa es nuestra presión?</h3>
      <p className="cc-card-note">El PPDA mide cuántos pases completa el rival antes de que lo interrumpamos con una acción defensiva. Mientras más bajo el número, más rápido recuperamos el balón.</p>
     </div>
     <div className="cc-presion-num">
      <strong>{prom.toFixed(1)}</strong>
      <span>PPDA promedio<br></br>Colo-Colo · {datos.length} partidos</span>
     </div>
    </div>
    <div className="cc-presion-escala">
     <div className="cc-presion-track"></div>
     <div className="cc-presion-marker cc" style={{ left: pos(prom) + '%' }}>
      <b>Colo-Colo {prom.toFixed(1)}</b>
      <i></i>
     </div>
     <div className="cc-presion-marker riv" style={{ left: pos(promRival) + '%' }}>
      <b>Rivales {promRival.toFixed(1)}</b>
      <i></i>
     </div>
    </div>
    <div className="cc-presion-ejes"><span>◀ Presión intensa</span><span>Presión pasiva ▶</span></div>
   </Card>

   <div className="cc-grid-2">
    <StatCard label="Partido con más presión" value={mejor.ppda.toFixed(1)} sub={'vs ' + mejor.rival + ' · ' + mejor.resultado} tone="v"></StatCard>
    <StatCard label="Partido con menos presión" value={peor.ppda.toFixed(1)} sub={'vs ' + peor.rival + ' · ' + peor.resultado} tone="d"></StatCard>
   </div>

   <Card className="cc-pad">
    <div className="cc-chart-head">
     <h3 className="cc-card-title">Evolución fecha a fecha</h3>
     <div className="cc-legend">
      <span><span className="cc-dot" style={{ background: 'var(--rojo)' }}></span>Más presión que nuestro promedio</span>
      <span><span className="cc-dot" style={{ background: 'var(--bar-idle)' }}></span>Menos presión</span>
     </div>
    </div>
    <div className="cc-cols">
     {datos.map(m => (
      <div key={m.j} className="cc-col" title={'P' + m.j + ' vs ' + m.rival + ' · PPDA ' + m.ppda.toFixed(1) + ' · ' + m.resultado}>
       <span className="cc-col-val">{m.ppda.toFixed(1)}</span>
       <div className="cc-col-area">
        <div className={'cc-col-bar' + (m.ppda <= prom ? ' on' : '')} style={{ height: (m.ppda / maxBar) * 100 + '%' }}></div>
       </div>
       <CCTeamLogo team={m.rival} size={22}></CCTeamLogo>
       <CCResDot r={m.resultado}></CCResDot>
      </div>
     ))}
    </div>
    <p className="cc-card-note">Barras más cortas = presión más intensa ese día. Bajo cada barra: el rival y el resultado del partido.</p>
   </Card>

   <Card className="cc-pad">
    <h3 className="cc-card-title">Duelo de presión partido a partido</h3>
    <p className="cc-card-note">El punto rojo es Colo-Colo y el gris su rival. Cuando el rojo queda a la izquierda, presionamos más que el rival ese día.</p>
    <div className="cc-duelos">
     {datos.map(m => {
      const gano = m.ppda < m.ppdaRival;
      const l = pos(Math.min(m.ppda, m.ppdaRival));
      const r = pos(Math.max(m.ppda, m.ppdaRival));
      return (
       <div key={m.j} className="cc-duelo-row">
        <span className="cc-duelo-rival"><CCTeamLogo team={m.rival} size={20}></CCTeamLogo>P{m.j} · {m.rival}</span>
        <div className="cc-duelo-track">
         <div className="cc-duelo-linea" style={{ left: l + '%', width: Math.max(0.5, r - l) + '%' }}></div>
         <span className="cc-duelo-dot riv" style={{ left: pos(m.ppdaRival) + '%' }} title={m.rival + ' ' + m.ppdaRival.toFixed(1)}></span>
         <span className="cc-duelo-dot cc" style={{ left: pos(m.ppda) + '%' }} title={'Colo-Colo ' + m.ppda.toFixed(1)}></span>
        </div>
        <span className={'cc-duelo-delta ' + (gano ? 'v' : 'd')}>{gano ? 'CC presionó más' : 'Presionó más el rival'}</span>
       </div>
      );
     })}
    </div>
   </Card>
  </div>
 );
}

// ---------------- Tiros y xG ----------------
function PageTiros() {
 const datos = CC_DATA.tiros;
 const labels = datos.map(m => 'P' + m.j);
 const goles = datos.reduce((a, m) => a + m.goles, 0);
 const xgTotal = datos.reduce((a, m) => a + m.xg, 0);
 const promTiros = datos.reduce((a, m) => a + m.tiros, 0) / datos.length;
 const dif = goles - xgTotal;
 const mejorXG = [...datos].sort((a, b) => b.xg - a.xg)[0];
 const maxHero = Math.max(goles, xgTotal);
 const maxPar = Math.max(...datos.flatMap(m => [m.goles, m.xg]));

 let acumG = 0, acumX = 0;
 const serieG = datos.map(m => { acumG += m.goles; return acumG; });
 const serieX = datos.map(m => { acumX += m.xg; return Math.round(acumX * 100) / 100; });

 return (
  <div className="cc-page">
   <PageHeader icon="tiros" title="Tiros y xG" subtitle="¿Cuánto peligro generamos y qué tan bien lo convertimos?"></PageHeader>

   <Card className="cc-pad">
    <div className="cc-xg-hero">
     <div className="cc-xg-hero-col">
      <span className="cc-xg-hero-label">Goles anotados</span>
      <strong className="cc-xg-hero-num rojo">{goles}</strong>
      <div className="cc-xg-hero-track"><div className="rojo" style={{ width: (goles / maxHero) * 100 + '%' }}></div></div>
     </div>
     <div className="cc-xg-hero-col">
      <span className="cc-xg-hero-label">xG generado (goles esperados)</span>
      <strong className="cc-xg-hero-num">{xgTotal.toFixed(1)}</strong>
      <div className="cc-xg-hero-track"><div className="gris" style={{ width: (xgTotal / maxHero) * 100 + '%' }}></div></div>
     </div>
     <div className="cc-xg-hero-delta">
      <strong className={dif >= 0 ? 'v' : 'd'}>{(dif >= 0 ? '+' : '') + dif.toFixed(1)} goles</strong>
      <span>{dif >= 0
       ? 'El equipo convierte más de lo que valen sus ocasiones: definición por sobre lo esperado.'
       : 'El equipo convierte menos de lo que valen sus ocasiones: falta puntería en la definición.'}</span>
     </div>
    </div>
   </Card>

   <div className="cc-grid-3">
    <StatCard label="Tiros al arco / partido" value={promTiros.toFixed(1)} tone="accent"></StatCard>
    <StatCard label="xG / partido" value={(xgTotal / datos.length).toFixed(2)}></StatCard>
    <StatCard label="Mejor producción (xG)" value={mejorXG.xg.toFixed(2)} sub={'vs ' + mejorXG.rival + ' · ' + mejorXG.resultado} tone="v"></StatCard>
   </div>

   <Card className="cc-pad">
    <div className="cc-chart-head">
     <h3 className="cc-card-title">La carrera de la temporada: goles vs xG acumulado</h3>
     <div className="cc-legend">
      <span><span className="cc-dot" style={{ background: 'var(--rojo)' }}></span>Goles acumulados</span>
      <span><span className="cc-dot" style={{ background: 'var(--chart-3)' }}></span>xG acumulado</span>
     </div>
    </div>
    <CCLineChart
     labels={labels}
     series={[
      { name: 'Goles acumulados', color: 'var(--rojo)', data: serieG, meta: datos.map(m => 'vs ' + m.rival + ' · ' + m.resultado + ' · ' + m.fecha) },
      { name: 'xG acumulado', color: 'var(--chart-3)', data: serieX }
     ]}
     formatY={v => v}
    ></CCLineChart>
    <p className="cc-card-note">Cuando la línea roja corre por encima de la gris, Colo-Colo está convirtiendo más de lo que el xG espera.</p>
   </Card>

   <Card className="cc-pad">
    <div className="cc-chart-head">
     <h3 className="cc-card-title">Goles vs xG en cada partido</h3>
     <div className="cc-legend">
      <span><span className="cc-dot" style={{ background: 'var(--rojo)' }}></span>Goles</span>
      <span><span className="cc-dot" style={{ background: 'var(--scatter-idle)' }}></span>xG</span>
     </div>
    </div>
    <div className="cc-cols cc-cols-pares">
     {datos.map(m => (
      <div key={m.j} className="cc-col" title={'P' + m.j + ' vs ' + m.rival + ' · ' + m.goles + ' goles · xG ' + m.xg.toFixed(2) + ' · ' + m.tiros + ' tiros al arco'}>
       <span className="cc-col-val">{m.goles}<em> / {m.xg.toFixed(1)}</em></span>
       <div className="cc-col-area">
        <div className="cc-col-bar rojo" style={{ height: Math.max(2, (m.goles / maxPar) * 100) + '%' }}></div>
        <div className="cc-col-bar gris" style={{ height: Math.max(2, (m.xg / maxPar) * 100) + '%' }}></div>
       </div>
       <CCTeamLogo team={m.rival} size={22}></CCTeamLogo>
       <CCResDot r={m.resultado}></CCResDot>
      </div>
     ))}
    </div>
    <p className="cc-card-note">Rojo más alto que gris = sacamos más goles de los que valían nuestras ocasiones ese día.</p>
   </Card>

   <Card className="cc-pad">
    <h3 className="cc-card-title">Detalle por partido</h3>
    <div className="cc-evol-table">
     <div className="cc-evol-head"><span>Partido</span><span>Rival</span><span>Tiros</span><span>xG</span><span>Goles</span><span>Eficiencia</span></div>
     {datos.map(m => {
      const ef = m.goles - m.xg;
      return (
       <div key={m.j} className="cc-evol-row seis">
        <span>P{m.j} · {m.fecha}</span>
        <span className="cc-evol-rival">{m.rival}</span>
        <span>{m.tiros}</span>
        <span>{m.xg.toFixed(2)}</span>
        <span><strong>{m.goles}</strong></span>
        <span className={'cc-trend ' + (ef > 0.15 ? 'v' : ef < -0.15 ? 'd' : 'e')}>{(ef >= 0 ? '+' : '') + ef.toFixed(2)}</span>
       </div>
      );
     })}
    </div>
   </Card>
  </div>
 );
}

// ---------------- Ranking de Equipos ----------------
const CC_METRICAS_RANKING = [
 'Goles', 'xG', 'Posesión %', 'Pases precisos %', 'PPDA',
 'Duelos def. ganados %', 'Goles en contra', 'Tiros al arco %', 'Tiros', 'Centros', 'Córners', 'Faltas'
];
const CC_DEF_EQUIPO = {
 'Goles': 'Goles anotados por partido.',
 'xG': 'Goles esperados: calidad acumulada de las ocasiones creadas por partido.',
 'Posesión %': 'Porcentaje de tiempo con el balón en control del equipo.',
 'Pases precisos %': 'Porcentaje de pases completados con éxito.',
 'PPDA': 'Pases del rival permitidos por acción defensiva: mide la intensidad de la presión (menos = presiona más arriba).',
 'Duelos def. ganados %': 'Porcentaje de duelos defensivos ganados.',
 'Goles en contra': 'Goles recibidos por partido.',
 'Tiros al arco %': 'Porcentaje de remates que van al arco.',
 'Tiros': 'Remates totales por partido.',
 'Centros': 'Centros enviados al área por partido.',
 'Córners': 'Tiros de esquina por partido.',
 'Faltas': 'Faltas cometidas por partido.'
};
const CC_MENOS_ES_MEJOR = new Set(['PPDA', 'Goles en contra', 'Faltas']);

function PageRankEquipos() {
 const [metrica, setMetrica] = p2State('xG');
 const asc = CC_MENOS_ES_MEJOR.has(metrica);
 const entidades = Object.keys(CC_DATA.metricasEquipo).filter(e => e !== 'Promedio adversarios');
 const rows = entidades
  .map(e => {
   const m = CC_DATA.metricasEquipo[e];
   return { label: e + (m._pj && m._pj < 10 ? ' · ' + m._pj + ' PJ' : ''), nombre: e, value: m[metrica], logo: window.CC_LOGOS ? window.CC_LOGOS.teamUrl(e) : null };
  })
  .filter(r => typeof r.value === 'number')
  .sort((a, b) => asc ? a.value - b.value : b.value - a.value);
 const pos = rows.findIndex(r => r.nombre === 'Colo-Colo') + 1;

 return (
  <div className="cc-page" id="cc-rank-equipos-cap">
   <PageHeader
    icon="rankEquipos" title="Ranking de Equipos"
    subtitle="Equipos con estadísticas de temporada cargadas · promedios por partido"
    right={<div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}><Select label="Métrica" value={metrica} onChange={setMetrica} options={CC_METRICAS_RANKING}></Select><ExportJPGButton targetSelector="#cc-rank-equipos-cap" filename="ranking-equipos" titulo="Ranking de Equipos"></ExportJPGButton></div>}
   ></PageHeader>

   <div className="cc-grid-3">
    <StatCard label={'Colo-Colo en ' + metrica} value={CC_DATA.metricasEquipo['Colo-Colo'][metrica]} tone="accent"></StatCard>
    <StatCard label="Posición en el ranking" value={pos + '° de ' + rows.length}></StatCard>
    <StatCard label="Criterio" value={asc ? 'Menos es mejor' : 'Más es mejor'} sub="Promedios por partido"></StatCard>
   </div>

   <Card className="cc-pad">
    <h3 className="cc-card-title">{metrica} — Temporada 2026</h3>
    <CCBarsH rows={rows} highlight={rows.find(r => r.nombre === 'Colo-Colo') && rows.find(r => r.nombre === 'Colo-Colo').label} formatV={v => typeof v === 'number' ? (Math.round(v * 100) / 100) : v}></CCBarsH>
    <p className="cc-def-metrica"><strong>{metrica}:</strong> {CC_DEF_EQUIPO[metrica] || ''} {asc ? 'Menos es mejor.' : 'Más es mejor.'}</p>
   </Card>
  </div>
 );
}

// ---------------- Ranking de Jugadores (liga completa) ----------------
const CC_METRICAS_JUGADOR = [
 { value: 'goles', label: 'Goles' },
 { value: 'asist', label: 'Asistencias' },
 { value: 'xg', label: 'xG' },
 { value: 'xa', label: 'xA' },
 { value: 'golesP90', label: 'Goles / 90' },
 { value: 'xgP90', label: 'xG / 90' },
 { value: 'xaP90', label: 'xA / 90' },
 { value: 'tirosP90', label: 'Remates / 90' },
 { value: 'tirosArcoPct', label: 'Tiros al arco %' },
 { value: 'pasesPct', label: 'Precisión de pase %' },
 { value: 'pasesProgP90', label: 'Pases progresivos / 90' },
 { value: 'jugadasClaveP90', label: 'Jugadas claves / 90' },
 { value: 'duelosPct', label: 'Duelos ganados %' },
 { value: 'regatesP90', label: 'Regates / 90' },
 { value: 'carrerasP90', label: 'Carreras en progresión / 90' },
 { value: 'accDefP90', label: 'Acciones defensivas / 90' },
 { value: 'intercepP90', label: 'Interceptaciones / 90' },
 { value: 'min', label: 'Minutos jugados' },
 { value: 'valor', label: 'Valor de mercado' }
];
const CC_DEF_JUGADOR = {
 goles: 'Goles anotados en la temporada.',
 asist: 'Asistencias de gol en la temporada.',
 xg: 'Goles esperados: calidad total de los remates del jugador.',
 xa: 'Asistencias esperadas: calidad de los pases que generan remate.',
 golesP90: 'Goles cada 90 minutos jugados.',
 xgP90: 'Goles esperados cada 90 minutos.',
 xaP90: 'Asistencias esperadas cada 90 minutos.',
 tirosP90: 'Remates cada 90 minutos.',
 tirosArcoPct: 'Porcentaje de remates que van al arco.',
 pasesPct: 'Porcentaje de pases completados.',
 pasesProgP90: 'Pases que avanzan el juego hacia el arco rival, cada 90 minutos.',
 jugadasClaveP90: 'Pases que generan una ocasión de gol, cada 90 minutos.',
 duelosPct: 'Porcentaje de duelos ganados (ofensivos y defensivos).',
 regatesP90: 'Regates intentados cada 90 minutos.',
 carrerasP90: 'Conducciones que avanzan con el balón, cada 90 minutos.',
 accDefP90: 'Acciones defensivas (entradas, intercepciones, despejes) cada 90 minutos.',
 intercepP90: 'Balones interceptados cada 90 minutos.',
 min: 'Minutos totales disputados en la temporada.',
 valor: 'Valor de mercado estimado del jugador.'
};

function PageRankJugadores() {
 const [metrica, setMetrica] = p2State('goles');
 const [grupo, setGrupo] = p2State('Todos');
 const [pos, setPos] = p2State('Todas');
 const [equipo, setEquipo] = p2State('Toda la liga');
 const [minMin, setMinMin] = p2State(450);

 const grupos = ['Todos', 'Arquero', 'Defensa', 'Mediocampista', 'Extremo', 'Delantero'];
 const posiciones = ['Todas', ...[...new Set(CC_DATA.jugadores.map(j => j.posicion))].filter(p => p && p !== '—').sort()];
 const equipos = ['Toda la liga', ...CC_DATA.equipos.map(e => e.nombre)];
 const def = CC_METRICAS_JUGADOR.find(m => m.value === metrica);

 const rows = CC_DATA.jugadores
  .filter(j =>
   (grupo === 'Todos' || j.grupo === grupo) &&
   (pos === 'Todas' || j.posicion === pos) &&
   (equipo === 'Toda la liga' || j.equipo === equipo) &&
   j.min >= minMin
  )
  .map(j => ({ label: j.nombre, logo: window.CC_LOGOS ? window.CC_LOGOS.teamUrl(j.equipo) : null, value: j[metrica] }))
  .sort((a, b) => b.value - a.value)
  .slice(0, 15);

 const fmt = v => metrica === 'valor'
  ? '$' + (v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : Math.round(v / 1000) + 'K')
  : (typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(2) : v);

 return (
  <div className="cc-page" id="cc-rank-jugadores-cap">
   <PageHeader icon="rankJugadores" title="Ranking de Jugadores" subtitle={CC_DATA.jugadores.length + ' jugadores de la liga · Temporada 2026'}
    right={<ExportJPGButton targetSelector="#cc-rank-jugadores-cap" filename="ranking-jugadores" titulo="Ranking de Jugadores"></ExportJPGButton>}></PageHeader>

   <Card className="cc-pad cc-filters">
    <Select label="Métrica" value={metrica} onChange={setMetrica} options={CC_METRICAS_JUGADOR}></Select>
    <Select label="Equipo" value={equipo} onChange={setEquipo} options={equipos}></Select>
    <Select label="Línea" value={grupo} onChange={setGrupo} options={grupos}></Select>
    <Select label="Posición" value={pos} onChange={setPos} options={posiciones}></Select>
    <label className="cc-select-wrap">
     <span className="cc-select-label">Minutos mínimos: {minMin}'</span>
     <input
      type="range" min="0" max="1400" step="90" value={minMin}
      onChange={e => setMinMin(Number(e.target.value))}
      className="cc-range"
     ></input>
    </label>
   </Card>

   <Card className="cc-pad">
    <h3 className="cc-card-title">{def.label} — Top {rows.length}</h3>
    {rows.length === 0
     ? <p className="cc-empty">Ningún jugador cumple los filtros seleccionados.</p>
     : <CCBarsH rows={rows} highlight={rows[0] && rows[0].label} formatV={fmt}></CCBarsH>}
    <p className="cc-def-metrica"><strong>{def.label}:</strong> {CC_DEF_JUGADOR[metrica] || ''}</p>
   </Card>
  </div>
 );
}

Object.assign(window, { PagePPDA, PageTiros, PageRankEquipos, PageRankJugadores, CCResDot, CC_METRICAS_RANKING, CC_METRICAS_JUGADOR, CC_MENOS_ES_MEJOR });
