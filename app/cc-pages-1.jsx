// ============================================================
// ColoColo Football Center — Páginas 1 (DATOS REALES 2026)
// Inicio, Calendario (Sofascore en vivo), Resumen, Análisis
// ============================================================
/* global React, CC_DATA, Icon, Card, PageHeader, StatCard, Select, SegTabs, DataTable, ResultPill, Localia, CCLineChart, CCRadar, CCBarsH, CCTeamLogo */

const { useState: p1State, useEffect: p1Effect, useMemo: p1Memo } = React;

function ccFechaLarga(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Hook: datos en vivo de Sofascore (tabla, fixture, forma)
function useSofa() {
  const [, setTick] = p1State(0);
  p1Effect(() => {
    const f = () => setTick(t => t + 1);
    window.addEventListener('cc-sofa-ready', f);
    return () => window.removeEventListener('cc-sofa-ready', f);
  }, []);
  return window.CC_SOFA || { listo: false };
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

// Forma (últimos 5) calculada desde los partidos reales del Excel Wyscout
function ccFormaWyscout() {
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
function PageInicio({ usuario }) {
  const sofa = useSofa();
  const rec = ccRecordReal();
  const filaCC = sofa.tabla ? sofa.tabla.find(t => t.nombre === 'Colo-Colo') : null;
  const pendientes = CC_DATA.fixture.filter(m => !m.resultado);
  const proximo = pendientes[0] || null;
  const siguientes = pendientes.slice(1, 4);
  const ultimos = CC_DATA.fixture.filter(m => m.resultado).slice(-6).reverse();
  const plantel = CC_DATA.jugadores.filter(j => j.equipo === 'Colo-Colo');
  const goleador = [...plantel].sort((a, b) => b.goles - a.goles)[0];
  const asistidor = [...plantel].sort((a, b) => b.asist - a.asist)[0];
  const xgTotal = CC_DATA.tiros.reduce((a, m) => a + m.xg, 0);

  return (
    <div className="cc-page">
      <div className="cc-hero">
        <div className="cc-hero-brand">
          <CCTeamLogo team="Colo-Colo" size={86}></CCTeamLogo>
          <div className="cc-hero-titulos">
            <p className="cc-hero-kicker">{CC_DATA.club.liga} · Temporada 2026</p>
            <h1>ColoColo Football Center</h1>
            <p className="cc-hero-sub">Sesión de <strong>{usuario}</strong> · Wyscout {rec.pj} partidos + Sofascore</p>
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
            <FormaDots forma={ccFormaWyscout()}></FormaDots>
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
            <p className="cc-empty">Temporada finalizada · sin partidos pendientes.</p>
          )}
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
    </div>
  );
}

// ---------------- Calendario ----------------
function PageCalendario() {
  const sofa = useSofa();
  const rec = ccRecordReal();
  const [vista, setVista] = p1State('tabla');
  const proximo = CC_DATA.fixture.find(m => !m.resultado) || null;

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

      <SegTabs value={vista} onChange={setVista} options={[
        { value: 'tabla', label: 'Tabla de posiciones' },
        { value: 'fixture', label: 'Fixture y resultados' }
      ]}></SegTabs>

      {vista === 'tabla' && (
        sofa.tabla && sofa.tabla.length ? (
          <Card>
            <DataTable columns={columnas} rows={sofa.tabla} highlightRow={r => r.nombre === 'Colo-Colo'}></DataTable>
          </Card>
        ) : (
          <Card className="cc-pad">
            <p className="cc-empty">{sofa.listo ? 'No se pudo conectar con Sofascore. La tabla en vivo no está disponible sin conexión.' : 'Cargando tabla en vivo desde Sofascore…'}</p>
          </Card>
        )
      )}

      {vista === 'fixture' && (
        <Card className="cc-pad">
          <div className="cc-fixture-legend">
            <span><span className="cc-dot v"></span>Victoria</span>
            <span><span className="cc-dot e"></span>Empate</span>
            <span><span className="cc-dot d"></span>Derrota</span>
            <span><span className="cc-dot pend"></span>Por jugar</span>
          </div>
          <div className="cc-fixture">
            {CC_DATA.fixture.map(m => (
              <div key={'w' + m.j} className="cc-fixture-row">
                <span className="cc-fixture-j">P{m.j}</span>
                <span className="cc-fixture-fecha">{ccFechaLarga(m.fecha)}</span>
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

  return (
    <div className="cc-page cc-resumen-roja">
      <PageHeader icon="resumen" title="Resumen de Temporada" subtitle="Promedios Wyscout de los 14 partidos · plantel real de Colo-Colo"></PageHeader>

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
            <p className="cc-card-note">Promedios por partido (Wyscout). En rojo, las métricas donde Colo-Colo supera al promedio de sus adversarios. PPDA y goles en contra se grafican invertidos: más área = mejor rendimiento.</p>
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
      <PageHeader icon="analisis" title="Análisis Avanzado" subtitle="Lectura táctica por líneas con datos Wyscout del plantel real"></PageHeader>

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
          <p className="cc-card-note">Esquema predominante por partido según Wyscout · 14 partidos</p>
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

Object.assign(window, { PageInicio, PageCalendario, PageResumen, PageAnalisis, ccFechaLarga, CC_RADAR_EJES, ccNormalizarRadar, useSofa, FormaDots, ccRecordReal, ccFormaWyscout });
