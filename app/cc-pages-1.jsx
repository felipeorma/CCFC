// ============================================================
// ColoColo Football Center — Páginas 1 (DATOS REALES 2026)
// Inicio, Calendario (en vivo), Resumen, Análisis
// ============================================================
/* global React, CC_DATA, Icon, Card, PageHeader, StatCard, Select, SegTabs, DataTable, ResultPill, Localia, CCLineChart, CCRadar, CCBarsH, CCTeamLogo */

const { useState: p1State, useEffect: p1Effect, useMemo: p1Memo } = React;

function ccFechaLarga(iso) {
 const d = new Date(iso + 'T12:00:00');
 return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Hook: datos en vivo (tabla, fixture, forma)
function useSofa() {
 const [, setTick] = p1State(0);
 p1Effect(() => {
  const f = () => setTick(t => t + 1);
  window.addEventListener('cc-sofa-ready', f);
  return () => window.removeEventListener('cc-sofa-ready', f);
 }, []);
 return window.CC_SOFA || { listo: false };
}

function useFixtureActual() {
 const [, setTick] = p1State(0);
 p1Effect(() => {
  const f = () => setTick(t => t + 1);
  window.addEventListener('cc-fixture-change', f);
  return () => window.removeEventListener('cc-fixture-change', f);
 }, []);
 return window.CC_FIXTURE ? window.CC_FIXTURE.actual() : CC_DATA.fixture;
}

function ccPendientesVigentes(fixture) {
 const hoy = window.CC_FIXTURE ? window.CC_FIXTURE.hoyISO() : new Date().toISOString().slice(0, 10);
 return fixture.filter(m => !m.resultado && m.fecha && m.fecha >= hoy)
  .sort((a, b) => (a.fecha + 'T' + (a.hora || '23:59')).localeCompare(b.fecha + 'T' + (b.hora || '23:59')) || Number(a.j) - Number(b.j));
}

function ccPendientesFechaVencida(fixture) {
 const hoy = window.CC_FIXTURE ? window.CC_FIXTURE.hoyISO() : new Date().toISOString().slice(0, 10);
 return fixture.filter(m => !m.resultado && (!m.fecha || m.fecha < hoy));
}

function ccRecordReal() {
 const fx = CC_DATA.fixture.filter(m => m.resultado);
 const g = fx.filter(m => { const [a, b] = m.resultado.split('-').map(Number); return a > b; }).length;
 const e = fx.filter(m => { const [a, b] = m.resultado.split('-').map(Number); return a === b; }).length;
 const p = fx.length - g - e;
 const gf = fx.reduce((s, m) => s + Number(m.resultado.split('-')[0]), 0);
 const gc = fx.reduce((s, m) => s + Number(m.resultado.split('-')[1]), 0);
 return { pj: fx.length, g, e, p, gf, gc, pts: g * 3 + e, dg: gf - gc };
}

// Forma (últimos 5) calculada desde los partidos reales del Excel
function ccForma() {
 return CC_DATA.fixture
  .filter(m => m.resultado)
  .slice(-5)
  .map(m => { const [a, b] = m.resultado.split('-').map(Number); return a > b ? 'V' : a === b ? 'E' : 'D'; });
}

function FormaDots({ forma }) {
 if (!forma || !forma.length) return <span className="cc-forma-vacia">—</span>;
 return (
  <span className="cc-forma">
   {forma.map((r, i) => (
    <span key={i} className={'cc-forma-dot ' + (r === 'V' ? 'v' : r === 'E' ? 'e' : 'd')}>{r}</span>
   ))}
  </span>
 );
}

// ---------------- Inicio ----------------
// Alertas automáticas del plantel: contratos por vencer, lesionados que
// vuelven pronto y cumpleaños de los próximos 7 días. Sin datos inventados:
// lee el plantel editable (Gestión de Jugadores).
function AlertasInicio() {
 const alertas = React.useMemo(() => {
  let plantel = [];
  try { plantel = JSON.parse(localStorage.getItem('cc_plantel_v1')) || []; } catch (e) {}
  if (!plantel.length && window.CC_GESTION) plantel = CC_GESTION.plantel || [];
  const hoy = new Date();
  const hoy0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const out = [];
  plantel.forEach(p => {
   if (!p || !p.nombre) return;
   if (p.contrato) {
    const fin = new Date(p.contrato + 'T12:00:00');
    const meses = (fin.getFullYear() - hoy.getFullYear()) * 12 + (fin.getMonth() - hoy.getMonth());
    if (!isNaN(meses) && meses >= 0 && meses <= 7) out.push({ tipo: 'contrato', txt: p.nombre + ' · contrato vence ' + fin.toLocaleDateString('es-CL', { month: 'short', year: 'numeric' }) });
   }
   if (p.lesion && p.lesion.retorno) {
    const dias = Math.round((new Date(p.lesion.retorno + 'T12:00:00') - hoy0) / 864e5);
    if (!isNaN(dias) && dias >= 0 && dias <= 14) out.push({ tipo: 'lesion', txt: p.nombre + ' · vuelve de lesión ' + (dias === 0 ? 'hoy' : 'en ' + dias + (dias === 1 ? ' día' : ' días')) });
   }
   if (p.nacimiento) {
    const n = new Date(p.nacimiento + 'T12:00:00');
    if (!isNaN(n)) {
     const cumple = new Date(hoy.getFullYear(), n.getMonth(), n.getDate());
     if (cumple < hoy0) cumple.setFullYear(hoy.getFullYear() + 1);
     const dias = Math.round((cumple - hoy0) / 864e5);
     if (dias >= 0 && dias <= 7) out.push({ tipo: 'cumple', txt: p.nombre + ' · cumpleaños ' + (dias === 0 ? 'hoy' : 'en ' + dias + (dias === 1 ? ' día' : ' días')) });
    }
   }
  });
  // Dirección Técnica: suspensiones y jugadores en capilla (tarjetas reales)
  try {
   if (window.CC_DT) {
    CC_DT.plantelCC().forEach(s => {
     if (s.suspendido) out.push({ tipo: 'susp', txt: s.nombre + ' · suspendido' + (s.suspNota ? ' · ' + s.suspNota : '') });
     else if (s.riesgo) out.push({ tipo: 'susp', txt: s.nombre + ' · en capilla (' + s.amarillas + ' amarillas)' });
     if (s.riesgoCarga) out.push({ tipo: 'susp', txt: s.nombre + ' · carga alta de minutos (' + s.carga + '%)' });
     if (s.wellAlerta) out.push({ tipo: 'susp', txt: s.nombre + ' · wellness bajo (' + s.wellScore + '/100)' });
    });
   }
  } catch (e) {}
  return out;
 }, []);
 if (!alertas.length) return null;
 const IC = { contrato: 'alerta', lesion: 'reporte', cumple: 'estrella', susp: 'alerta' };
 return (
  <Card className="cc-pad cc-alertas">
   <div className="cc-chart-head">
    <h3 className="cc-card-title">Alertas del plantel</h3>
    <span className="cc-pill cc-pill-pendiente">{alertas.length}</span>
   </div>
   <div className="cc-alertas-list">
    {alertas.map((a, i) => (
     <span key={i} className={'cc-alerta cc-alerta-' + a.tipo}><Icon name={IC[a.tipo]} size={14}></Icon>{a.txt}</span>
    ))}
   </div>
  </Card>
 );
}

function PageInicio({ usuario }) {
 const sofa = useSofa();
 const fixture = useFixtureActual();
 const rec = ccRecordReal();
 const filaCC = sofa.tabla ? sofa.tabla.find(t => t.nombre === 'Colo-Colo') : null;
 const pendientes = ccPendientesVigentes(fixture);
 const fechaVencida = ccPendientesFechaVencida(fixture);
 const proximo = pendientes[0] || null;
 const siguientes = pendientes.slice(1, 4);
 const ultimos = fixture.filter(m => m.resultado).slice(-6).reverse();
 const plantel = CC_DATA.jugadores.filter(j => j.equipo === 'Colo-Colo');
 const goleador = [...plantel].sort((a, b) => b.goles - a.goles)[0];
 const asistidor = [...plantel].sort((a, b) => b.asist - a.asist)[0];
 const xgTotal = CC_DATA.tiros.reduce((a, m) => a + m.xg, 0);
 const esAdmin = (usuario || '').toLowerCase() === 'datos@colocolofc.cl';

 return (
  <div className="cc-page">
   <div className="cc-hero">
    <div className="cc-hero-brand">
     <CCTeamLogo team="Colo-Colo" size={86}></CCTeamLogo>
     <div className="cc-hero-titulos">
      <p className="cc-hero-kicker">{CC_DATA.club.liga} · Temporada 2026</p>
      <h1>ColoColo Football Center</h1>
      <p className="cc-hero-sub">Sesión de <strong>{usuario}</strong> {rec.pj} partidos +</p>
     </div>
    </div>
    <div className="cc-hero-stats">
     <div className="cc-hero-stat">
      <span>Posición</span>
      <strong>{filaCC ? filaCC.pos + '°' : '—'}</strong>
     </div>
     <div className="cc-hero-stat">
      <span>Puntos</span>
      <strong>{filaCC ? filaCC.pts : rec.pts}</strong>
     </div>
     <div className="cc-hero-stat">
      <span>Dif. de gol</span>
      <strong>{(rec.dg > 0 ? '+' : '') + rec.dg}</strong>
     </div>
     <div className="cc-hero-stat">
      <span>Forma</span>
      <FormaDots forma={ccForma()}></FormaDots>
     </div>
    </div>
   </div>

   <div className="cc-grid-2">
    <Card className="cc-pad cc-next-match">
     <div className="cc-next-match-head">
      <h3 className="cc-card-title">Próximo partido</h3>
      {proximo && <span className="cc-pill cc-pill-pendiente">Fecha {proximo.j} de 30</span>}
     </div>
     {proximo ? (
      <React.Fragment>
       <div className="cc-next-match-body">
        <div className="cc-next-team">
         <CCTeamLogo team="Colo-Colo" size={64}></CCTeamLogo>
         <strong>Colo-Colo</strong>
        </div>
        <div className="cc-next-vs">
         <span className="cc-next-fecha">{ccFechaLarga(proximo.fecha)}</span>
         <span className="cc-next-hora">{proximo.hora ? proximo.hora + ' hrs' : 'Horario por confirmar'}</span>
         <span className="cc-next-cond">{proximo.local ? 'Estadio Monumental' : 'Visita'}</span>
        </div>
        <div className="cc-next-team">
         <CCTeamLogo team={proximo.rival} size={64}></CCTeamLogo>
         <strong>{proximo.rival}</strong>
        </div>
       </div>
       {siguientes.length > 0 && (
        <div className="cc-despues">
         {siguientes.map(m => (
          <div key={m.j} className="cc-despues-row">
           <span className="cc-fixture-j">F{m.j}</span>
           <span>{ccFechaLarga(m.fecha)}</span>
           <Localia local={m.local}></Localia>
           <span className="cc-despues-rival"><CCTeamLogo team={m.rival} size={18}></CCTeamLogo>{m.rival}</span>
          </div>
         ))}
        </div>
       )}
      </React.Fragment>
     ) : (
      <p className="cc-empty">No hay un próximo partido con fecha vigente informada.</p>
     )}
     {fechaVencida.length > 0 && <p className="cc-card-note cc-fecha-pendiente"><Icon name="alerta" size={13}></Icon> {fechaVencida.length} {fechaVencida.length === 1 ? 'partido pendiente tiene' : 'partidos pendientes tienen'} una fecha pasada y requiere actualización.</p>}
    </Card>

    <Card className="cc-pad">
     <div className="cc-chart-head">
      <h3 className="cc-card-title">Últimos resultados</h3>
     </div>
     <div className="cc-ultimos">
      {ultimos.map(m => (
       <div key={m.j} className="cc-ultimos-row">
        <ResultPill resultado={m.resultado} local={m.local}></ResultPill>
        <span className="cc-ultimos-rival"><CCTeamLogo team={m.rival} size={20}></CCTeamLogo>{m.rival}</span>
        <span className="cc-ultimos-meta"><Localia local={m.local} mini={true}></Localia>{ccFechaLarga(m.fecha)}</span>
       </div>
      ))}
     </div>
    </Card>
   </div>

   <div className="cc-grid-4">
    <StatCard label="Goles a favor" value={rec.gf} sub={xgTotal.toFixed(1) + ' xG generado'} tone="accent"></StatCard>
    <StatCard label="Goles en contra" value={rec.gc} sub={rec.pj + ' partidos jugados'}></StatCard>
    <StatCard label="Goleador" value={goleador ? goleador.goles : '—'} sub={goleador ? goleador.nombre : ''}></StatCard>
    <StatCard label="Asistidor" value={asistidor ? asistidor.asist : '—'} sub={asistidor ? asistidor.nombre : ''}></StatCard>
   </div>

   <AlertasInicio></AlertasInicio>

   <div className={esAdmin ? 'cc-board-grid' : 'cc-board-grid cc-board-solo'}>
    <NotasBoard usuario={usuario}></NotasBoard>
    {esAdmin && (
     <div className="cc-board-side">
      <AdminTodo usuario={usuario}></AdminTodo>
      <CumpleBoard></CumpleBoard>
     </div>
    )}
   </div>
  </div>
 );
}

// ---------------- Calendario ----------------
function PageCalendario() {
 const sofa = useSofa();
 const fixture = useFixtureActual();
 const rec = ccRecordReal();
 const [vista, setVista] = p1State('tabla');
 const pendientes = ccPendientesVigentes(fixture);
 const fechaVencida = ccPendientesFechaVencida(fixture);
 const proximo = pendientes[0] || null;

 const reducida = !!(sofa.tabla && sofa.tabla[0] && sofa.tabla[0].g == null);
 const hayForma = !!(sofa.tabla && sofa.tabla.some(t => t.forma && t.forma.length));
 const columnas = [
  { key: 'pos', label: '#', align: 'center', render: r => r.pos },
  { key: 'nombre', label: 'Club', render: r => (
    <span className="cc-team-cell">
     <CCTeamLogo team={r.nombre} size={22}></CCTeamLogo>{r.nombre}
    </span>
   ) },
  { key: 'pj', label: 'PJ', align: 'center' },
  ...(reducida ? [] : [
   { key: 'g', label: 'G', align: 'center' },
   { key: 'e', label: 'E', align: 'center' },
   { key: 'p', label: 'P', align: 'center' },
   { key: 'gf', label: 'GF', align: 'center' },
   { key: 'gc', label: 'GC', align: 'center' }
  ]),
  { key: 'dg', label: 'DIF', align: 'center', render: r => (r.dg > 0 ? '+' : '') + r.dg },
  { key: 'pts', label: 'PTS', align: 'center', render: r => <strong>{r.pts}</strong> },
  ...(hayForma ? [
   { key: 'forma', label: 'Últimos 5', render: r => <FormaDots forma={r.forma}></FormaDots> }
  ] : [])
 ];

 // Próximos partidos ya incluidos en CC_DATA.fixture (30 fechas del PDF oficial)

 return (
  <div className="cc-page">
   <PageHeader icon="calendario" title="Calendario" subtitle="Temporada 2026 · tabla general de la liga · fixture oficial de 30 fechas"></PageHeader>

   <div className="cc-grid-4">
    <StatCard label="Victorias" value={rec.g} tone="v"></StatCard>
    <StatCard label="Empates" value={rec.e} tone="e"></StatCard>
    <StatCard label="Derrotas" value={rec.p} tone="d"></StatCard>
    <StatCard label="Puntos" value={rec.pts} tone="accent"></StatCard>
   </div>

   {proximo && (
    <Card className="cc-pad cc-next-match">
     <div className="cc-next-match-head">
      <h3 className="cc-card-title">Próximo partido</h3>
      <span className="cc-pill cc-pill-pendiente">Fecha {proximo.j} de 30</span>
     </div>
     <div className="cc-next-match-body">
      <div className="cc-next-team">
       <CCTeamLogo team="Colo-Colo" size={64}></CCTeamLogo>
       <strong>Colo-Colo</strong>
      </div>
      <div className="cc-next-vs">
       <span className="cc-next-fecha">{ccFechaLarga(proximo.fecha)}</span>
       <span className="cc-next-hora">{proximo.hora ? proximo.hora + ' hrs' : 'Horario por confirmar'}</span>
       <span className="cc-next-cond">{proximo.local ? 'Estadio Monumental' : 'Visita'}</span>
      </div>
      <div className="cc-next-team">
       <CCTeamLogo team={proximo.rival} size={64}></CCTeamLogo>
       <strong>{proximo.rival}</strong>
      </div>
     </div>
   </Card>
   )}

   {fechaVencida.length > 0 && (
    <p className="cc-card-note cc-fecha-pendiente"><Icon name="alerta" size={13}></Icon> {fechaVencida.length} {fechaVencida.length === 1 ? 'partido pendiente tiene' : 'partidos pendientes tienen'} una fecha pasada. La fecha reprogramada aún no está informada.</p>
   )}

   <SegTabs value={vista} onChange={setVista} options={[
    { value: 'tabla', label: 'Tabla de posiciones' },
    { value: 'fixture', label: 'Fixture y resultados' },
    { value: 'sim', label: 'Simulación' }
   ]}></SegTabs>

   {vista === 'tabla' && (
    sofa.tabla && sofa.tabla.length ? (
     <Card>
      <DataTable columns={columnas} rows={sofa.tabla} highlightRow={r => r.nombre === 'Colo-Colo'} csv="tabla-posiciones-2026"></DataTable>
     </Card>
    ) : (
     <Card className="cc-pad">
      <p className="cc-empty">{sofa.listo ? 'No se pudo conectar con. La tabla en vivo no está disponible sin conexión.' : 'Cargando tabla en vivo…'}</p>
     </Card>
    )
   )}

   {vista === 'sim' && <SimulacionMonteCarlo></SimulacionMonteCarlo>}

   {vista === 'fixture' && (
    <Card className="cc-pad">
     <div className="cc-fixture-legend">
      <span><span className="cc-dot v"></span>Victoria</span>
      <span><span className="cc-dot e"></span>Empate</span>
      <span><span className="cc-dot d"></span>Derrota</span>
      <span><span className="cc-dot pend"></span>Por jugar</span>
     </div>
     <div className="cc-fixture">
      {fixture.map(m => (
       <div key={'w' + m.j} className="cc-fixture-row">
        <span className="cc-fixture-j">P{m.j}</span>
        <span className="cc-fixture-fecha">{!m.resultado && fechaVencida.some(x => String(x.j) === String(m.j)) ? 'Fecha por actualizar' : ccFechaLarga(m.fecha)}{m.reprogramado ? ' · reprogramado' : ''}</span>
        <Localia local={m.local}></Localia>
        <span className="cc-fixture-rival"><CCTeamLogo team={m.rival} size={20}></CCTeamLogo>{m.rival}</span>
        <ResultPill resultado={m.resultado} local={m.local}></ResultPill>
       </div>
      ))}
     </div>
    </Card>
   )}
  </div>
 );
}

// ---------------- Resumen de Temporada ----------------
const CC_RADAR_EJES = [
 { label: 'Goles', key: 'Goles' },
 { label: 'xG', key: 'xG' },
 { label: 'Posesión', key: 'Posesión %' },
 { label: 'Precisión pases', key: 'Pases precisos %' },
 { label: 'Presión (PPDA)', key: 'PPDA', invertir: true },
 { label: 'Duelos def.', key: 'Duelos def. ganados %' },
 { label: 'Valla', key: 'Goles en contra', invertir: true },
 { label: 'Tiros al arco', key: 'Tiros al arco %' }
];

function ccNormalizarRadar(equipo) {
 const todos = Object.values(CC_DATA.metricasEquipo);
 return CC_RADAR_EJES.map(eje => {
  const vals = todos.map(m => m[eje.key]).filter(v => typeof v === 'number');
  const min = Math.min(...vals), max = Math.max(...vals);
  let f = (CC_DATA.metricasEquipo[equipo][eje.key] - min) / (max - min || 1);
  if (eje.invertir) f = 1 - f;
  return 0.12 + Math.max(0, Math.min(1, f)) * 0.88;
 });
}

function PageResumen() {
 const plantel = CC_DATA.jugadores.filter(j => j.equipo === 'Colo-Colo');
 const goleadores = [...plantel].sort((a, b) => b.goles - a.goles).slice(0, 5);
 const asistidores = [...plantel].sort((a, b) => b.asist - a.asist).slice(0, 5);
 const minutos = [...plantel].sort((a, b) => b.min - a.min).slice(0, 5);
 const tarjetas = [...plantel].sort((a, b) => (b.amarillas + b.rojas * 2) - (a.amarillas + a.rojas * 2)).slice(0, 5);

 // Métricas donde lideramos vs promedio de adversarios
 const lidera = CC_RADAR_EJES.map(eje => {
  const cc = CC_DATA.metricasEquipo['Colo-Colo'][eje.key];
  const adv = CC_DATA.metricasEquipo['Promedio adversarios'][eje.key];
  const mejor = eje.invertir ? cc < adv : cc > adv;
  const dif = eje.invertir ? adv - cc : cc - adv;
  return { label: eje.label, cc, adv, mejor, dif, pct: eje.key.includes('%') ? '%' : '', invertir: eje.invertir };
 });
 const liderando = lidera.filter(m => m.mejor).sort((a, b) => b.dif - a.dif);

 // Resultados: triunfos contundentes (dif ≥ 2) y derrotas preocupantes (dif ≥ 2)
 const jugados = (CC_DATA.fixture || []).filter(m => m.resultado);
 const parse = m => { const [a, b] = m.resultado.split('-').map(Number); return { gf: a, gc: b, dif: a - b }; };
 const contundentes = jugados.map(m => ({ m, r: parse(m) })).filter(x => x.r.dif >= 2).sort((a, b) => b.r.dif - a.r.dif);
 const preocupantes = jugados.map(m => ({ m, r: parse(m) })).filter(x => x.r.dif <= -2).sort((a, b) => a.r.dif - b.r.dif);

 // Jugadores con más y menos carga (mínimo 1 partido)
 const conJuego = plantel.filter(j => (j.pj || 0) > 0);
 const masMinutos = [...conJuego].sort((a, b) => b.min - a.min).slice(0, 5);
 const menosMinutos = [...conJuego].sort((a, b) => a.min - b.min).slice(0, 5);

 // Edad promedio ponderada por minutos (los que efectivamente se alinean)
 const totMin = conJuego.reduce((a, j) => a + j.min, 0);
 const edadPond = totMin ? conJuego.reduce((a, j) => a + (j.edad || 0) * j.min, 0) / totMin : 0;
 const edadSimple = conJuego.length ? conJuego.reduce((a, j) => a + (j.edad || 0), 0) / conJuego.length : 0;

 const imprimir = () => {
  document.body.classList.add('cc-print-resumen');
  const off = () => { document.body.classList.remove('cc-print-resumen'); window.removeEventListener('afterprint', off); };
  window.addEventListener('afterprint', off);
  setTimeout(() => window.print(), 80);
 };

 return (
  <div className="cc-page cc-resumen-roja">
   <CCPrintMarca></CCPrintMarca>
   <CCPrintHeader titulo="Resumen de Temporada 2026"></CCPrintHeader>
   <PageHeader icon="resumen" title="Resumen de Temporada" subtitle="Promedios por partido · plantel real de Colo-Colo"
    right={<button className="cc-btn-primary cc-no-print" style={{ width: 'auto' }} onClick={imprimir}><Icon name="pdf" size={15}></Icon> Imprimir PDF</button>}></PageHeader>

   <Card className="cc-pad">
    <h3 className="cc-card-title">Colo-Colo vs promedio de sus adversarios</h3>
    <div className="cc-radar-layout">
     <CCRadar
      axes={CC_RADAR_EJES}
      series={[
       { name: 'Promedio adversarios', color: 'var(--chart-3)', values: ccNormalizarRadar('Promedio adversarios') },
       { name: 'Colo-Colo', color: 'var(--accent)', values: ccNormalizarRadar('Colo-Colo') }
      ]}
     ></CCRadar>
     <div className="cc-radar-side">
      <div className="cc-legend">
       <span><span className="cc-dot" style={{ background: 'var(--accent)' }}></span>Colo-Colo</span>
       <span><span className="cc-dot" style={{ background: 'var(--chart-3)' }}></span>Promedio adversarios</span>
      </div>
      <div className="cc-radar-tabla">
       <div className="cc-radar-tabla-row head">
        <span>Métrica</span><strong>Colo-Colo</strong><strong>Adversarios</strong>
       </div>
       {CC_RADAR_EJES.map(eje => {
        const cc = CC_DATA.metricasEquipo['Colo-Colo'][eje.key];
        const adv = CC_DATA.metricasEquipo['Promedio adversarios'][eje.key];
        const pct = eje.key.includes('%') ? '%' : '';
        const mejor = eje.invertir ? cc < adv : cc > adv;
        return (
         <div key={eje.key} className="cc-radar-tabla-row">
          <span>{eje.label}</span>
          <strong className={mejor ? 'mejor' : ''}>{cc}{pct}</strong>
          <em>{adv}{pct}</em>
         </div>
        );
       })}
      </div>
      <p className="cc-card-note">Promedios por partido. En rojo, las métricas donde Colo-Colo supera al promedio de sus adversarios. PPDA y goles en contra se grafican invertidos: más área = mejor rendimiento.</p>
     </div>
    </div>
   </Card>

   <Card className="cc-pad">
    <h3 className="cc-card-title">Estadísticas del plantel ({plantel.length} jugadores)</h3>
    <div className="cc-grid-2">
     <SquadList titulo="Goleadores" rows={goleadores} render={j => j.goles + ' goles'}></SquadList>
     <SquadList titulo="Asistencias" rows={asistidores} render={j => j.asist + ' asist.'}></SquadList>
     <SquadList titulo="Minutos jugados" rows={minutos} render={j => j.min.toLocaleString('es-CL') + "'"}></SquadList>
     <SquadList titulo="Tarjetas" rows={tarjetas} render={j => j.amarillas + '🟨' + (j.rojas ? ' ' + j.rojas + '🟥' : '')}></SquadList>
    </div>
   </Card>

   <div className="cc-grid-2">
    <Card className="cc-pad">
     <h3 className="cc-card-title">¿En qué lideramos?</h3>
     <p className="cc-card-note">Métricas donde Colo-Colo supera el promedio de sus adversarios (, por partido).</p>
     <div className="cc-resumen-lidera">
      {liderando.map(m => (
       <div key={m.label} className="cc-lidera-row">
        <span className="cc-lidera-check">✔</span>
        <span className="cc-lidera-lbl">{m.label}</span>
        <span className="cc-lidera-val">{m.cc}{m.pct} <em>vs {m.adv}{m.pct}</em></span>
       </div>
      ))}
      {liderando.length === 0 && <p className="cc-empty">Sin ventajas destacadas.</p>}
     </div>
    </Card>

    <Card className="cc-pad">
     <h3 className="cc-card-title">Edad del equipo alineado</h3>
     <p className="cc-card-note">Promedio de edad de los jugadores que suman minutos (ponderado por minutos jugados).</p>
     <div className="cc-resumen-edad">
      <div className="cc-edad-big">{edadPond.toFixed(1)}<span>años</span></div>
      <div className="cc-edad-sub">
       <div><span>Ponderada por minutos</span><strong>{edadPond.toFixed(1)}</strong></div>
       <div><span>Promedio simple</span><strong>{edadSimple.toFixed(1)}</strong></div>
       <div><span>Jugadores utilizados</span><strong>{conJuego.length}</strong></div>
      </div>
     </div>
    </Card>
   </div>

   <div className="cc-grid-2">
    <Card className="cc-pad">
     <h3 className="cc-card-title">Triunfos contundentes</h3>
     <p className="cc-card-note">Victorias por diferencia de 2 o más goles.</p>
     <div className="cc-resumen-res">
      {contundentes.map(({ m, r }) => (
       <div key={m.j} className="cc-res-row win">
        <span className="cc-res-marcador">{r.gf}–{r.gc}</span>
        <span className="cc-res-rival"><Localia local={m.local} mini={true}></Localia><CCTeamLogo team={m.rival} size={18}></CCTeamLogo>{m.rival}</span>
        <span className="cc-res-fecha">F{m.j} · {ccFechaLarga(m.fecha)}</span>
       </div>
      ))}
      {contundentes.length === 0 && <p className="cc-empty">Aún sin goleadas.</p>}
     </div>
    </Card>

    <Card className="cc-pad">
     <h3 className="cc-card-title">Derrotas preocupantes</h3>
     <p className="cc-card-note">Caídas por diferencia de 2 o más goles.</p>
     <div className="cc-resumen-res">
      {preocupantes.map(({ m, r }) => (
       <div key={m.j} className="cc-res-row loss">
        <span className="cc-res-marcador">{r.gf}–{r.gc}</span>
        <span className="cc-res-rival"><Localia local={m.local} mini={true}></Localia><CCTeamLogo team={m.rival} size={18}></CCTeamLogo>{m.rival}</span>
        <span className="cc-res-fecha">F{m.j} · {ccFechaLarga(m.fecha)}</span>
       </div>
      ))}
      {preocupantes.length === 0 && <p className="cc-empty">Sin derrotas abultadas. 💪</p>}
     </div>
    </Card>
   </div>

   <div className="cc-grid-2">
    <Card className="cc-pad">
     <h3 className="cc-card-title">Más presentes</h3>
     <p className="cc-card-note">Jugadores con más minutos y partidos disputados.</p>
     <SquadList titulo="" rows={masMinutos} render={j => j.min.toLocaleString('es-CL') + "' · " + (j.pj || 0) + ' PJ'}></SquadList>
    </Card>
    <Card className="cc-pad">
     <h3 className="cc-card-title">Menos utilizados</h3>
     <p className="cc-card-note">Jugadores del plantel con menos minutos y partidos.</p>
     <SquadList titulo="" rows={menosMinutos} render={j => j.min.toLocaleString('es-CL') + "' · " + (j.pj || 0) + ' PJ'}></SquadList>
    </Card>
   </div>
  </div>
 );
}

function SquadList({ titulo, rows, render }) {
 return (
  <div className="cc-squadlist">
   <h4>{titulo}</h4>
   {rows.map((j, i) => (
    <div key={j.nombre} className="cc-squadlist-row">
     <span className="cc-squadlist-rank">{i + 1}</span>
     <span className="cc-squadlist-name">{j.nombre}</span>
     <span className="cc-squadlist-pos">{j.posicion}</span>
     <span className="cc-squadlist-val">{render(j)}</span>
    </div>
   ))}
  </div>
 );
}

// ---------------- Análisis Avanzado ----------------
function PageAnalisis() {
 const [vista, setVista] = p1State('pases');
 const grupos = ['Arquero', 'Defensa', 'Mediocampista', 'Extremo', 'Delantero'];
 const plantel = CC_DATA.jugadores.filter(j => j.equipo === 'Colo-Colo' && j.min > 0);

 const porGrupo = grupos.map(g => {
  const js = plantel.filter(j => j.grupo === g);
  const prom = key => js.length ? js.reduce((a, j) => a + j[key], 0) / js.length : 0;
  return {
   grupo: g, n: js.length,
   pases: prom('pasesPct'),
   duelos: prom('duelosPct'),
   accDef: prom('accDefP90')
  };
 });

 return (
  <div className="cc-page">
   <PageHeader icon="analisis" title="Análisis Avanzado" subtitle="Lectura táctica por líneas del plantel real"></PageHeader>

   <SegTabs value={vista} onChange={setVista} options={[
    { value: 'pases', label: 'Efectividad por línea' },
    { value: 'profundidad', label: 'Profundidad de plantel' },
    { value: 'periodos', label: 'Comparación de períodos' },
    { value: 'esquemas', label: 'Esquemas usados' }
   ]}></SegTabs>

   {vista === 'pases' && (
    <Card className="cc-pad">
     <h3 className="cc-card-title">Efectividad por posición</h3>
     <p className="cc-card-note">Promedios del plantel con minutos · precisión de pase, duelos y acciones defensivas</p>
     <div className="cc-pos-cards">
      {porGrupo.map(g => (
       <div key={g.grupo} className="cc-pos-card">
        <h4>{g.grupo}</h4>
        <p className="cc-pos-n">{g.n}<span> jugadores</span></p>
        <div className="cc-pos-metric">
         <span>Precisión de pase</span>
         <div className="cc-pos-track"><div style={{ width: Math.min(100, g.pases) + '%' }}></div></div>
         <strong>{g.pases.toFixed(1)}%</strong>
        </div>
        <div className="cc-pos-metric">
         <span>Duelos ganados</span>
         <div className="cc-pos-track"><div style={{ width: Math.min(100, g.duelos) + '%' }}></div></div>
         <strong>{g.duelos.toFixed(1)}%</strong>
        </div>
        <div className="cc-pos-foot">{g.accDef.toFixed(1)} acciones defensivas / 90'</div>
       </div>
      ))}
     </div>
    </Card>
   )}

   {vista === 'profundidad' && (
    <Card className="cc-pad">
     <h3 className="cc-card-title">Profundidad de plantel</h3>
     <p className="cc-card-note">Reparto de minutos por línea — capacidad de rotación y dependencia</p>
     <div className="cc-depth">
      {grupos.map(g => {
       const js = plantel.filter(j => j.grupo === g).sort((a, b) => b.min - a.min).slice(0, 7);
       const maxMin = 14 * 90;
       if (!js.length) return null;
       return (
        <div key={g} className="cc-depth-group">
         <h4>{g} <span>{js.length} con minutos</span></h4>
         {js.map(j => (
          <div key={j.nombre} className="cc-depth-row">
           <span className="cc-depth-name">{j.nombre}</span>
           <span className="cc-depth-pos">{j.posicion}</span>
           <div className="cc-depth-track">
            <div style={{ width: `${Math.min(100, (j.min / maxMin) * 100)}%` }}></div>
           </div>
           <span className="cc-depth-min">{j.min}'</span>
          </div>
         ))}
        </div>
       );
      })}
     </div>
    </Card>
   )}

   {vista === 'periodos' && <PagePeriodos></PagePeriodos>}

   {vista === 'esquemas' && (
    <Card className="cc-pad">
     <h3 className="cc-card-title">Esquemas tácticos usados</h3>
     <p className="cc-card-note">Esquema predominante por partido según · 14 partidos</p>
     <div className="cc-probs">
      {Object.entries(CC_DATA.alineacion.esquemas).sort((a, b) => b[1] - a[1]).map(([esq, n]) => (
       <div key={esq} className="cc-prob-row">
        <span className="cc-prob-pos" style={{ minWidth: '56px' }}>{esq}</span>
        <div className="cc-prob-track">
         <div className="cc-prob-fill" style={{ width: `${(n / 14) * 100}%` }}></div>
        </div>
        <span className="cc-prob-val">{n} PJ</span>
       </div>
      ))}
     </div>
    </Card>
   )}
  </div>
 );
}

function PagePeriodos() {
 const mitad = Math.ceil(CC_DATA.ppda.length / 2);
 const per1 = CC_DATA.tiros.slice(0, mitad);
 const per2 = CC_DATA.tiros.slice(mitad);
 const prom = (arr, key) => arr.reduce((a, m) => a + m[key], 0) / arr.length;
 const ppda1 = CC_DATA.ppda.slice(0, mitad), ppda2 = CC_DATA.ppda.slice(mitad);

 const filas = [
  { metrica: 'Goles por partido', a: prom(per1, 'goles'), b: prom(per2, 'goles'), masEsMejor: true },
  { metrica: 'xG por partido', a: prom(per1, 'xg'), b: prom(per2, 'xg'), masEsMejor: true },
  { metrica: 'Tiros al arco', a: prom(per1, 'tiros'), b: prom(per2, 'tiros'), masEsMejor: true },
  { metrica: 'Goles en contra', a: prom(per1, 'golesRival'), b: prom(per2, 'golesRival'), masEsMejor: false },
  { metrica: 'xG en contra', a: prom(per1, 'xgRival'), b: prom(per2, 'xgRival'), masEsMejor: false },
  { metrica: 'PPDA (presión)', a: prom(ppda1, 'ppda'), b: prom(ppda2, 'ppda'), masEsMejor: false }
 ];

 return (
  <Card className="cc-pad">
   <h3 className="cc-card-title">Comparación entre períodos</h3>
   <p className="cc-card-note">Partidos 1–{mitad} vs {mitad + 1}–{CC_DATA.ppda.length} · detección de tendencias y caídas de rendimiento</p>
   <div className="cc-periodos">
    <div className="cc-periodos-head">
     <span></span><span>P1–{mitad}</span><span>P{mitad + 1}–{CC_DATA.ppda.length}</span><span>Tendencia</span>
    </div>
    {filas.map(f => {
     const delta = f.b - f.a;
     const mejora = f.masEsMejor ? delta > 0.005 : delta < -0.005;
     const igual = Math.abs(delta) <= 0.005;
     return (
      <div key={f.metrica} className="cc-periodos-row">
       <span className="cc-periodos-metric">{f.metrica}</span>
       <span>{f.a.toFixed(2)}</span>
       <span>{f.b.toFixed(2)}</span>
       <span className={'cc-trend ' + (igual ? 'e' : mejora ? 'v' : 'd')}>
        {igual ? '— estable' : (delta > 0 ? '▲ ' : '▼ ') + Math.abs(delta).toFixed(2) + (mejora ? ' mejora' : ' baja')}
       </span>
      </div>
     );
    })}
   </div>
  </Card>
 );
}

// ---------------- Simulación Monte Carlo del campeonato ----------------
function SimulacionMonteCarlo() {
 const [res, setRes] = p1State(null);
 const [cargando, setCargando] = p1State(false);
 const nSims = 10000;

 const correr = () => {
  if (!window.CC_MONTECARLO) return;
  setCargando(true);
  setTimeout(() => {
   const r = window.CC_MONTECARLO.simular(nSims);
   setRes(r);
   setCargando(false);
  }, 30);
 };
 p1Effect(() => { correr(); }, []);

 const pct = v => v >= 0.995 ? '99%+' : v <= 0.005 && v > 0 ? '<1%' : Math.round(v * 100) + '%';
 const barCls = v => v >= 0.6 ? 'alto' : v >= 0.2 ? 'medio' : 'bajo';

 return (
  <React.Fragment>
   <Card className="cc-pad">
    <div className="cc-chart-head">
     <h3 className="cc-card-title">Simulación del campeonato · Monte Carlo</h3>
     <button className="cc-btn-ghost" onClick={correr} disabled={cargando}>{cargando ? 'Simulando…' : 'Volver a simular'}</button>
    </div>
    <p className="cc-card-note">
     Proyección del cierre de la temporada simulando <strong>{nSims.toLocaleString('es-CL')}</strong> veces las fechas restantes.
     Usa la tabla actual (PJ, PTS, GF, GC), las <strong>métricas del equipo</strong> (xG, tiros al arco, posesión, PPDA, pases y duelos defensivos), el <strong>nivel del plantel</strong> (players stats: xG/xA, goles, jugadas clave y acciones defensivas por-90) y el
     <strong> fixture real de Colo-Colo</strong> (rivales restantes + localía, con ajuste por los enfrentamientos previos).
    </p>
    <div className="cc-sim-reglas">
     <span className="cc-sim-chip camp"><img src="https://img.sofascore.com/api/v1/unique-tournament/384/image" alt="" className="cc-sim-logo" onError={e => { e.target.style.display = 'none'; }}></img>🏆 Campeón → Libertadores (1°)</span>
     <span className="cc-sim-chip lib"><img src="https://img.sofascore.com/api/v1/unique-tournament/384/image" alt="" className="cc-sim-logo" onError={e => { e.target.style.display = 'none'; }}></img>Libertadores 1°–4°</span>
     <span className="cc-sim-chip sud"><img src="https://img.sofascore.com/api/v1/unique-tournament/480/image" alt="" className="cc-sim-logo" onError={e => { e.target.style.display = 'none'; }}></img>Sudamericana 5°–9°</span>
     <span className="cc-sim-chip desc">Descenso 15°–16°</span>
    </div>
    <p className="cc-card-note cc-sim-nota">Reglas ANFP 2026 para cupos CONMEBOL. El campeón de Copa Chile toma un cupo de Libertadores, lo que puede correr un lugar los cupos internacionales (esa copa se juega aparte y no entra en la simulación de la tabla).</p>
   </Card>

   {res && (
    <Card>
     <div className="cc-gestion-tabla">
      <table className="cc-tabla cc-sim-tabla">
       <thead>
        <tr>
         <th className="cc-c">Pos. proy.</th>
         <th>Club</th>
         <th className="cc-c">PJ</th>
         <th className="cc-c">PTS proy.</th>
         <th>🏆 Campeón</th>
         <th>Libertadores</th>
         <th>Sudamericana</th>
         <th>Descenso</th>
        </tr>
       </thead>
       <tbody>
        {res.filas.map((f, i) => {
         const zona = i === 0 ? 'z-camp' : i <= 3 ? 'z-lib' : i <= 8 ? 'z-sud' : i >= 14 ? 'z-desc' : '';
         const torneo = i === 0 ? '384' : i <= 3 ? '384' : i <= 8 ? '480' : null;
         return (
         <tr key={f.nombre} className={(f.nombre === 'Colo-Colo' ? 'cc-sim-cc ' : '') + zona}>
          <td className="cc-c"><strong>{i + 1}</strong></td>
          <td><span className="cc-team-cell">
           <CCTeamLogo team={f.nombre} size={20}></CCTeamLogo>{f.nombre}
           {i === 0 && <span className="cc-sim-trofeo" title="Campeón">🏆</span>}
           {torneo && <img src={'https://img.sofascore.com/api/v1/unique-tournament/' + torneo + '/image'} alt="" className="cc-sim-logo-row" onError={e => { e.target.style.display = 'none'; }}></img>}
          </span></td>
          <td className="cc-c">{f.pj}</td>
          <td className="cc-c"><strong>{f.ptsProy}</strong></td>
          <td className="cc-sim-hm"><SimCell v={f.campeon} hue="camp" txt={pct(f.campeon)}></SimCell></td>
          <td className="cc-sim-hm"><SimCell v={f.libert} hue="lib" txt={pct(f.libert)}></SimCell></td>
          <td className="cc-sim-hm"><SimCell v={f.sudam} hue="sud" txt={pct(f.sudam)}></SimCell></td>
          <td className="cc-sim-hm"><SimCell v={f.descenso} hue="desc" txt={pct(f.descenso)}></SimCell></td>
         </tr>
         );
        })}
       </tbody>
      </table>
     </div>
    </Card>
   )}
  </React.Fragment>
 );
}

function SimCell({ v, hue, txt }) {
 // Matriz de calor: intensidad proporcional a la probabilidad, color por columna.
 const HUES = { camp: '#E4A800', lib: '#1E7A45', sud: '#2A6FDB', desc: '#C0261F' };
 const c = HUES[hue] || '#888';
 const a = Math.max(0, Math.min(1, v));
 const bg = 'color-mix(in srgb, ' + c + ' ' + Math.round(6 + a * 88) + '%, transparent)';
 const fuerte = a >= 0.62;
 return (
  <span className="cc-sim-cell" style={{ background: bg, color: fuerte ? '#fff' : 'var(--ink)' }}>{txt}</span>
 );
}

function SimBar({ v, cls, txt }) {
 return (
  <span className="cc-sim-prob">
   <span className="cc-sim-prob-track"><span className={'cc-sim-prob-fill ' + cls} style={{ width: Math.max(2, v * 100) + '%' }}></span></span>
   <span className="cc-sim-prob-txt">{txt}</span>
  </span>
 );
}

Object.assign(window, { PageInicio, PageCalendario, PageResumen, PageAnalisis, ccFechaLarga, CC_RADAR_EJES, ccNormalizarRadar, useSofa, useFixtureActual, FormaDots, ccRecordReal, ccForma});
