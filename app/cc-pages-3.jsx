// ============================================================
// ColoColo Football Center — Páginas 3 (DATOS REALES 2026)
// Comparación de Equipos, Comparación de Jugadores,
// Dispersión de Jugadores, Dispersión de Equipos
// ============================================================
/* global React, CC_DATA, Card, PageHeader, StatCard, Select, CCRadar, CCScatter, CCBarsGroup, CCTeamLogo, CC_RADAR_EJES, ccNormalizarRadar */

const { useState: p3State, useMemo: p3Memo } = React;

const CC_EQUIPOS_LISTA = Object.keys(CC_DATA.metricasEquipo);

// ---------------- Comparación de Equipos ----------------
function PageCompEquipos() {
  const [eqA, setEqA] = p3State('Colo-Colo');
  const [eqB, setEqB] = p3State('Promedio adversarios');
  const metricas = ['Goles', 'xG', 'Posesión %', 'Pases precisos %', 'PPDA', 'Duelos def. ganados %', 'Goles en contra', 'Tiros al arco %'];
  const fuenteB = CC_DATA.metricasEquipo[eqB] && CC_DATA.metricasEquipo[eqB]._fuente;
  const MENOS = new Set(['PPDA', 'Goles en contra']);
  const dA = CC_DATA.metricasEquipo[eqA] || {};
  const dB = CC_DATA.metricasEquipo[eqB] || {};

  // Resumen: cuántas métricas gana cada uno
  let ganaA = 0, ganaB = 0;
  metricas.forEach(m => {
    const va = dA[m] || 0, vb = dB[m] || 0;
    if (va === vb) return;
    const aMejor = MENOS.has(m) ? va < vb : va > vb;
    if (aMejor) ganaA++; else ganaB++;
  });

  const destacadas = ['Goles', 'xG', 'Posesión %', 'PPDA'];

  return (
    <div className="cc-page">
      <PageHeader icon="compEquipos" title="Comparación de Equipos" subtitle="Cara a cara con promedios Wyscout de temporada completa"></PageHeader>

      <Card className="cc-pad cc-filters">
        <Select label="Equipo A" value={eqA} onChange={setEqA} options={CC_EQUIPOS_LISTA}></Select>
        <span className="cc-vs">vs</span>
        <Select label="Equipo B" value={eqB} onChange={setEqB} options={CC_EQUIPOS_LISTA}></Select>
      </Card>

      {/* Cabecera cara a cara */}
      <Card className="cc-pad cc-h2h">
        <div className="cc-h2h-team">
          <CCTeamLogo team={eqA} size={68}></CCTeamLogo>
          <strong>{eqA}</strong>
          <span className="cc-h2h-wins">{ganaA} métricas a favor</span>
        </div>
        <div className="cc-h2h-center">
          <div className="cc-h2h-score">
            <span className="a">{ganaA}</span>
            <span className="cc-h2h-dash">–</span>
            <span className="b">{ganaB}</span>
          </div>
          <span className="cc-h2h-label">Ventaja por métrica</span>
        </div>
        <div className="cc-h2h-team">
          <CCTeamLogo team={eqB} size={68}></CCTeamLogo>
          <strong>{eqB}</strong>
          <span className="cc-h2h-wins">{ganaB} métricas a favor</span>
        </div>
      </Card>

      {/* Indicadores destacados */}
      <div className="cc-grid-4">
        {destacadas.map(m => {
          const va = dA[m] || 0, vb = dB[m] || 0;
          const aMejor = va !== vb && (MENOS.has(m) ? va < vb : va > vb);
          const bMejor = va !== vb && !aMejor;
          const f = v => Math.round(v * 100) / 100;
          return (
            <div key={m} className="cc-h2h-metric">
              <span className="cc-h2h-metric-name">{m}{MENOS.has(m) ? ' ↓' : ''}</span>
              <div className="cc-h2h-metric-vals">
                <span className={aMejor ? 'win' : ''}>{f(va)}</span>
                <span className={bMejor ? 'win' : ''}>{f(vb)}</span>
              </div>
              <div className="cc-h2h-metric-bar">
                <div className="a" style={{ width: (va / (va + vb || 1)) * 100 + '%' }}></div>
                <div className="b" style={{ width: (vb / (va + vb || 1)) * 100 + '%' }}></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="cc-grid-2 cc-comp-cuerpo">
        <Card className="cc-pad">
          <div className="cc-chart-head">
            <h3 className="cc-card-title">Métrica a métrica</h3>
            <div className="cc-legend">
              <span><span className="cc-dot" style={{ background: 'var(--accent)' }}></span>{eqA}</span>
              <span><span className="cc-dot" style={{ background: 'var(--chart-2)' }}></span>{eqB}</span>
            </div>
          </div>
          <div className="cc-comp-rows">
            {metricas.map(m => {
              const va = dA[m] || 0, vb = dB[m] || 0, total = va + vb || 1;
              const aMejor = va !== vb && (MENOS.has(m) ? va < vb : va > vb);
              const bMejor = va !== vb && !aMejor;
              const f = v => Math.round(v * 100) / 100;
              return (
                <div key={m} className="cc-comp-row">
                  <span className={'cc-comp-val a' + (aMejor ? ' win' : '')}>{f(va)}</span>
                  <div className="cc-comp-mid">
                    <span className="cc-comp-name">{m}{MENOS.has(m) ? ' (menos es mejor)' : ''}</span>
                    <div className="cc-comp-track">
                      <div className="a" style={{ width: (va / total) * 100 + '%' }}></div>
                      <div className="b" style={{ width: (vb / total) * 100 + '%' }}></div>
                    </div>
                  </div>
                  <span className={'cc-comp-val b' + (bMejor ? ' win' : '')}>{f(vb)}</span>
                </div>
              );
            })}
          </div>
          <p className="cc-card-note">{fuenteB ? 'Equipo B: ' + fuenteB + '. ' : ''}En PPDA y goles en contra, el valor más bajo indica mejor rendimiento.</p>
        </Card>

        <Card className="cc-pad">
          <h3 className="cc-card-title">Perfil comparado</h3>
          <p className="cc-card-note">Radar normalizado sobre la liga · más área = mejor.</p>
          <div className="cc-radar-center">
            <CCRadar
              axes={CC_RADAR_EJES}
              series={[
                { name: eqB, color: 'var(--chart-2)', values: ccNormalizarRadar(eqB) },
                { name: eqA, color: 'var(--accent)', values: ccNormalizarRadar(eqA) }
              ]}
              size={360}
            ></CCRadar>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------- Comparación de Jugadores (liga completa) ----------------
const CC_EJES_JUGADOR = [
  { label: 'Goles/90', key: 'golesP90' },
  { label: 'xG/90', key: 'xgP90' },
  { label: 'Asist/90', key: 'xaP90' },
  { label: 'Remates/90', key: 'tirosP90' },
  { label: 'Pases %', key: 'pasesPct' },
  { label: 'P. progresivos/90', key: 'pasesProgP90' },
  { label: 'Duelos %', key: 'duelosPct' },
  { label: 'Regates/90', key: 'regatesP90' },
  { label: 'Acc. def./90', key: 'accDefP90' }
];

function ccNormalizarJugador(j, poblacion) {
  return CC_EJES_JUGADOR.map(eje => {
    const vals = poblacion.map(x => x[eje.key]);
    const min = Math.min(...vals), max = Math.max(...vals);
    return 0.1 + ((j[eje.key] - min) / (max - min || 1)) * 0.9;
  });
}

function SelectorJugador({ etiqueta, equipo, setEquipo, jugador, setJugador }) {
  const equipos = CC_DATA.equipos.map(e => e.nombre);
  const opciones = CC_DATA.jugadores
    .filter(j => j.equipo === equipo && j.min > 0)
    .sort((a, b) => b.min - a.min)
    .map(j => j.nombre);
  return (
    <div className="cc-selector-jugador">
      <Select label={etiqueta + ' · equipo'} value={equipo} onChange={v => {
        setEquipo(v);
        const primero = CC_DATA.jugadores.filter(j => j.equipo === v && j.min > 0).sort((a, b) => b.min - a.min)[0];
        if (primero) setJugador(primero.nombre);
      }} options={equipos}></Select>
      <Select label="Jugador" value={jugador} onChange={setJugador} options={opciones}></Select>
    </div>
  );
}

function PageCompJugadores() {
  const ccTop = p3Memo(() => CC_DATA.jugadores.filter(j => j.equipo === 'Colo-Colo').sort((a, b) => b.goles - a.goles)[0], []);
  const ligaTop = p3Memo(() => CC_DATA.jugadores.filter(j => j.equipo !== 'Colo-Colo').sort((a, b) => b.goles - a.goles)[0], []);
  const [eqA, setEqA] = p3State(ccTop.equipo);
  const [jA, setJA] = p3State(ccTop.nombre);
  const [eqB, setEqB] = p3State(ligaTop.equipo);
  const [jB, setJB] = p3State(ligaTop.nombre);

  const poblacion = p3Memo(() => CC_DATA.jugadores.filter(j => j.min >= 300), []);
  const a = CC_DATA.jugadores.find(j => j.nombre === jA && j.equipo === eqA) || ccTop;
  const b = CC_DATA.jugadores.find(j => j.nombre === jB && j.equipo === eqB) || ligaTop;

  return (
    <div className="cc-page">
      <PageHeader icon="compJugadores" title="Comparación de Jugadores" subtitle="Radar normalizado sobre los 406 jugadores de la liga (mín. 300 minutos)"></PageHeader>

      <Card className="cc-pad cc-filters">
        <SelectorJugador etiqueta="Jugador A" equipo={eqA} setEquipo={setEqA} jugador={jA} setJugador={setJA}></SelectorJugador>
        <span className="cc-vs">vs</span>
        <SelectorJugador etiqueta="Jugador B" equipo={eqB} setEquipo={setEqB} jugador={jB} setJugador={setJB}></SelectorJugador>
      </Card>

      <div className="cc-grid-2">
        <Card className="cc-pad">
          <div className="cc-chart-head">
            <h3 className="cc-card-title">Perfil comparado</h3>
            <div className="cc-legend">
              <span><span className="cc-dot" style={{ background: 'var(--accent)' }}></span>{a.nombre}</span>
              <span><span className="cc-dot" style={{ background: 'var(--chart-2)' }}></span>{b.nombre}</span>
            </div>
          </div>
          <div className="cc-radar-center">
            <CCRadar
              axes={CC_EJES_JUGADOR}
              series={[
                { name: b.nombre, color: 'var(--chart-2)', values: ccNormalizarJugador(b, poblacion) },
                { name: a.nombre, color: 'var(--accent)', values: ccNormalizarJugador(a, poblacion) }
              ]}
              size={400}
            ></CCRadar>
          </div>
        </Card>

        <Card className="cc-pad">
          <h3 className="cc-card-title">Métricas directas</h3>
          <div className="cc-versus-head">
            <div><strong>{a.nombre}</strong><span>{a.posicion} · {a.equipo} · {a.edad} años · {a.min}'</span></div>
            <div><strong>{b.nombre}</strong><span>{b.posicion} · {b.equipo} · {b.edad} años · {b.min}'</span></div>
          </div>
          <div className="cc-versus">
            {CC_EJES_JUGADOR.map(eje => {
              const va = a[eje.key], vb = b[eje.key];
              const total = va + vb || 1;
              return (
                <div key={eje.key} className="cc-versus-row">
                  <span className={'cc-versus-val' + (va >= vb ? ' win' : '')}>{Number.isInteger(va) ? va : va.toFixed(2)}</span>
                  <div className="cc-versus-mid">
                    <span className="cc-versus-label">{eje.label}</span>
                    <div className="cc-versus-track">
                      <div className="a" style={{ width: (va / total) * 100 + '%' }}></div>
                      <div className="b" style={{ width: (vb / total) * 100 + '%' }}></div>
                    </div>
                  </div>
                  <span className={'cc-versus-val' + (vb > va ? ' win' : '')}>{Number.isInteger(vb) ? vb : vb.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------- Dispersión de Jugadores ----------------
function PageDispJugadores() {
  const opcionesEje = [
    { value: 'xg', label: 'xG' }, { value: 'goles', label: 'Goles' },
    { value: 'xa', label: 'xA' }, { value: 'asist', label: 'Asistencias' },
    { value: 'golesP90', label: 'Goles / 90' }, { value: 'xgP90', label: 'xG / 90' },
    { value: 'tirosP90', label: 'Remates / 90' }, { value: 'pasesPct', label: 'Precisión de pase %' },
    { value: 'pasesProgP90', label: 'Pases progresivos / 90' }, { value: 'jugadasClaveP90', label: 'Jugadas claves / 90' },
    { value: 'duelosPct', label: 'Duelos %' }, { value: 'regatesP90', label: 'Regates / 90' },
    { value: 'accDefP90', label: 'Acciones def. / 90' }, { value: 'min', label: 'Minutos' },
    { value: 'edad', label: 'Edad' }, { value: 'valor', label: 'Valor de mercado' }
  ];
  const [ejeX, setEjeX] = p3State('xg');
  const [ejeY, setEjeY] = p3State('goles');
  const [equipo, setEquipo] = p3State('Toda la liga');
  const [grupo, setGrupo] = p3State('Todos');
  const [pos, setPos] = p3State('Todas');
  const [minMin, setMinMin] = p3State(450);
  const [edadMin, setEdadMin] = p3State(15);
  const [edadMax, setEdadMax] = p3State(45);

  const lx = opcionesEje.find(o => o.value === ejeX).label;
  const ly = opcionesEje.find(o => o.value === ejeY).label;
  const equipos = ['Toda la liga', ...CC_DATA.equipos.map(e => e.nombre)];
  const grupos = ['Todos', 'Arquero', 'Defensa', 'Mediocampista', 'Extremo', 'Delantero'];
  const posiciones = ['Todas', ...[...new Set(CC_DATA.jugadores.map(j => j.posicion))].filter(p => p && p !== '—').sort()];

  const points = CC_DATA.jugadores
    .filter(j =>
      j.min >= minMin &&
      (equipo === 'Toda la liga' || j.equipo === equipo) &&
      (grupo === 'Todos' || j.grupo === grupo) &&
      (pos === 'Todas' || j.posicion === pos) &&
      (j.edad === 0 || (j.edad >= edadMin && j.edad <= edadMax))
    )
    .map(j => ({ label: j.nombre, sub: j.posicion + ' · ' + j.equipo + ' · ' + j.min + "'" + (j.edad ? ' · ' + j.edad + ' años' : ''), x: j[ejeX], y: j[ejeY], logo: window.CC_LOGOS ? window.CC_LOGOS.teamUrl(j.equipo) : null }));

  return (
    <div className="cc-page">
      <PageHeader icon="dispJug" title="Dispersión · Jugadores" subtitle="Toda la liga (Wyscout) · líneas punteadas = promedio del filtro"></PageHeader>
      <Card className="cc-pad cc-filters">
        <Select label="Eje horizontal" value={ejeX} onChange={setEjeX} options={opcionesEje}></Select>
        <Select label="Eje vertical" value={ejeY} onChange={setEjeY} options={opcionesEje}></Select>
        <Select label="Equipo" value={equipo} onChange={setEquipo} options={equipos}></Select>
        <Select label="Línea" value={grupo} onChange={setGrupo} options={grupos}></Select>
        <Select label="Posición" value={pos} onChange={setPos} options={posiciones}></Select>
        <label className="cc-select-wrap">
          <span className="cc-select-label">Minutos mínimos: {minMin}'</span>
          <input type="range" min="0" max="1400" step="90" value={minMin} onChange={e => setMinMin(Number(e.target.value))} className="cc-range"></input>
        </label>
        <label className="cc-select-wrap" style={{ minWidth: '120px' }}>
          <span className="cc-select-label">Edad mín: {edadMin}</span>
          <input type="range" min="15" max="45" step="1" value={edadMin} onChange={e => setEdadMin(Math.min(Number(e.target.value), edadMax))} className="cc-range" style={{ width: '120px' }}></input>
        </label>
        <label className="cc-select-wrap" style={{ minWidth: '120px' }}>
          <span className="cc-select-label">Edad máx: {edadMax}</span>
          <input type="range" min="15" max="45" step="1" value={edadMax} onChange={e => setEdadMax(Math.max(Number(e.target.value), edadMin))} className="cc-range" style={{ width: '120px' }}></input>
        </label>
      </Card>
      <Card className="cc-pad">
        <h3 className="cc-card-title">{ly} vs {lx} · {points.length} jugadores</h3>
        {points.length === 0
          ? <p className="cc-empty">Ningún jugador cumple los filtros.</p>
          : <CCScatter points={points} xLabel={lx} yLabel={ly} formatX={v => Math.round(v * 100) / 100} formatY={v => Math.round(v * 100) / 100}></CCScatter>}
        <p className="cc-card-note">Pasa el cursor sobre un punto para identificar al jugador.</p>
      </Card>
    </div>
  );
}

// ---------------- Dispersión de Equipos ----------------
function PageDispEquipos() {
  const opciones = ['Goles', 'xG', 'Posesión %', 'Pases precisos %', 'PPDA', 'Duelos def. ganados %', 'Goles en contra', 'Tiros al arco %', 'Tiros', 'Centros'];
  const [ejeX, setEjeX] = p3State('xG');
  const [ejeY, setEjeY] = p3State('Goles');

  const points = CC_EQUIPOS_LISTA
    .filter(e => e !== 'Promedio adversarios')
    .map(e => {
      const m = CC_DATA.metricasEquipo[e];
      return { label: e, sub: m._fuente, x: m[ejeX], y: m[ejeY], logo: window.CC_LOGOS ? window.CC_LOGOS.teamUrl(e) : null };
    })
    .filter(p => typeof p.x === 'number' && typeof p.y === 'number');

  return (
    <div className="cc-page">
      <PageHeader icon="dispEq" title="Dispersión · Equipos" subtitle="Equipos con datos Wyscout de temporada completa · Colo-Colo destacado"></PageHeader>
      <Card className="cc-pad cc-filters">
        <Select label="Eje horizontal" value={ejeX} onChange={setEjeX} options={opciones}></Select>
        <Select label="Eje vertical" value={ejeY} onChange={setEjeY} options={opciones}></Select>
      </Card>
      <Card className="cc-pad">
        <h3 className="cc-card-title">{ejeY} vs {ejeX}</h3>
        <CCScatter points={points} highlight="Colo-Colo" xLabel={ejeX} yLabel={ejeY} formatX={v => Math.round(v * 100) / 100} formatY={v => Math.round(v * 100) / 100}></CCScatter>
        <p className="cc-card-note">Cada punto usa el promedio por partido del Team Stats Wyscout publicado para ese club.</p>
      </Card>
    </div>
  );
}

Object.assign(window, { PageCompEquipos, PageCompJugadores, PageDispJugadores, PageDispEquipos, CC_EQUIPOS_LISTA });
