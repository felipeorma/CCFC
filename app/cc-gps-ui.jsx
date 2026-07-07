// ============================================================
// ColoColo Football Center — GPS Catapult (UI)
// Pestaña dentro de Dirección Técnica. Visualizaciones de élite:
// KPIs de carga e intensidad, resumen de sesión con enlace inline
// al plantel, evolución del equipo, sprints y aceleraciones.
// ============================================================
/* global React, CC_GPS, CC_DT, Icon, Card, Select, StatCard, CCTeamLogo */

function dtGpsFmt(iso) { try { return new Date(iso + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }); } catch (e) { return iso; } }
function dtGpsFmtL(iso) { try { return new Date(iso + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return iso; } }
function dtApellido(n) { const p = (n || '').trim().split(' '); return p.length > 1 ? p[p.length - 1] : n; }

function DTGps({ puedeEditar, usuario }) {
  const cuenta = (usuario || '').toLowerCase();
  const rolG = (() => { try { return window.ccRolDe ? window.ccRolDe(usuario) : null; } catch (e) { return null; } })();
  const puedeSubir = rolG === 'Administrador' || cuenta === 'ct@colocolofc.cl';
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const f = () => setTick(t => t + 1);
    window.addEventListener('cc-gps-change', f);
    return () => window.removeEventListener('cc-gps-change', f);
  }, []);
  const sesiones = CC_GPS.sesiones();
  const [selId, setSelId] = React.useState(sesiones[0] ? sesiones[0].id : null);
  const sesActual = sesiones.find(s => s.id === selId) || sesiones[0];
  const filas = sesActual ? CC_GPS.filasResueltas(sesActual.id) : [];
  const plantel = (window.CC_DT ? CC_DT.plantelCC() : []).map(s => s.nombre);
  const [pendiente, setPendiente] = React.useState(null); // { texto, nombre } esperando tipo+fecha

  // Fechas de partidos enlazadas al Reporte Post-Partido
  const partidos = React.useMemo(() => {
    try {
      return (CC_DATA.partidos || []).map(p => ({
        fecha: p.fecha,
        label: 'P' + p.j + ' · ' + (p.local ? 'vs ' : 'en ') + p.rival + ' (' + (p.resultado || '') + ') · ' + dtGpsFmtL(p.fecha)
      }));
    } catch (e) { return []; }
  }, []);

  const cargarArchivo = e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => setPendiente({ texto: String(fr.result), nombre: file.name.replace(/\.csv$/i, '') });
    fr.readAsText(file);
    e.target.value = '';
  };
  const confirmarCarga = meta => {
    const res = CC_GPS.agregar(pendiente.texto, pendiente.nombre, meta);
    if (res.ok) setSelId(res.sesion.id);
    else alert('No se pudo leer el archivo: ' + (res.error || ''));
    setPendiente(null);
  };

  if (!sesiones.length) {
    return (
      <React.Fragment>
      <Card className="cc-pad cc-gps-empty">
        <Icon name="dt" size={30}></Icon>
        <h3 className="cc-card-title">Sin sesiones GPS cargadas</h3>
        <p className="cc-card-note">Sube un archivo CSV exportado de Catapult (entrenamiento o partido). Al subirlo se te preguntará el tipo de sesión y la fecha.</p>
        <div className="cc-gps-actions">
          {puedeSubir && <label className="cc-btn-primary cc-gps-upload"><Icon name="subir" size={15}></Icon> Subir CSV de Catapult<input type="file" accept=".csv" onChange={cargarArchivo} hidden></input></label>}
        </div>
        {!puedeSubir && <p className="cc-card-note cc-gps-perm">Solo la cuenta de <strong>Cuerpo Técnico</strong> o el <strong>Administrador</strong> pueden subir archivos GPS.</p>}
      </Card>
      {pendiente && <DTGpsDialogo pendiente={pendiente} partidos={partidos} onConfirm={confirmarCarga} onCancel={() => setPendiente(null)}></DTGpsDialogo>}
      </React.Fragment>
    );
  }

  // Semáforo de carga por percentiles de la sesión
  const dists = filas.filter(f => f.dur >= 20).map(f => f.dist).sort((a, b) => a - b);
  const pRef = p => dists.length ? dists[Math.floor((dists.length - 1) * p)] : 0;
  const cargaSem = f => {
    if (f.dur < 20) return { cls: 'na', txt: 'Parcial' };
    if (f.dist >= pRef(0.8)) return { cls: 'alto', txt: 'Alta' };
    if (f.dist >= pRef(0.4)) return { cls: 'medio', txt: 'Media' };
    return { cls: 'bajo', txt: 'Baja' };
  };
  const val = filas.filter(f => f.dur >= 20);
  const maxDist = Math.max(1, ...filas.map(f => f.dist));
  const totalDistKm = Math.round(filas.reduce((a, f) => a + f.dist, 0) / 1000 * 10) / 10;
  const promMMin = val.length ? Math.round(val.reduce((a, f) => a + f.mMin, 0) / val.length) : 0;
  const topVmax = Math.max(0, ...filas.map(f => f.vmax));
  const totSprints = filas.reduce((a, f) => a + (f.spr || 0), 0);
  const haySpr = filas.some(f => f.spr != null);

  return (
    <React.Fragment>
      <div className="cc-gps-bar">
        <Select label="Sesión" value={sesActual.id} onChange={setSelId}
          options={sesiones.map(s => ({ value: s.id, label: (s.tipo === 'Partido' ? '⚽ ' : '🏃 ') + s.titulo + ' · ' + dtGpsFmtL(s.fecha) }))}></Select>
        <div className="cc-gps-bar-actions">
          {puedeSubir && <label className="cc-btn-ghost cc-gps-upload"><Icon name="subir" size={14}></Icon> Subir CSV<input type="file" accept=".csv" onChange={cargarArchivo} hidden></input></label>}
          {puedeSubir && <button className="cc-btn-ghost cc-btn-peligro" onClick={() => { if (window.confirm('¿Eliminar esta sesión GPS?')) { CC_GPS.eliminar(sesActual.id); setSelId(null); } }}><Icon name="basura" size={14}></Icon> Eliminar</button>}
        </div>
      </div>

      {pendiente && <DTGpsDialogo pendiente={pendiente} partidos={partidos} onConfirm={confirmarCarga} onCancel={() => setPendiente(null)}></DTGpsDialogo>}

      <div className="cc-grid-4">
        <StatCard label="Carga total del equipo" value={totalDistKm + ' km'} sub="suma de distancia" tone="accent"></StatCard>
        <StatCard label="Índice de intensidad" value={promMMin + ' m/min'} sub="promedio del equipo"></StatCard>
        <StatCard label={haySpr ? 'Sprints del equipo' : 'Vel. máx del día'} value={haySpr ? totSprints : topVmax + ' km/h'} sub={haySpr ? 'total de esfuerzos' : 'pico individual'} tone="v"></StatCard>
        <StatCard label="Jugadores" value={filas.length} sub={sesActual.tipo}></StatCard>
      </div>

      <Card>
        <div className="cc-pad cc-dt-tabhead">
          <h3 className="cc-card-title">Resumen de sesión · {sesActual.tipo}</h3>
          <p className="cc-card-note">Métricas por jugador. En <strong>Plantel</strong> enlazas cada registro con un jugador de Colo-Colo (o lo desenlazas). “Sin enlazar” = el nombre del archivo aún no está asociado a un jugador del plantel. Columnas: distancia total, distancia/minuto (intensidad), HSR (&gt;19,8 km/h), sprint (&gt;25 km/h), Player Load y PL/min, velocidad máxima. La carga compara la distancia contra el plantel de la sesión.</p>
        </div>
        <div className="cc-gestion-tabla">
          <table className="cc-tabla">
            <thead>
              <tr>
                <th>Jugador (archivo)</th>
                <th>Plantel</th>
                <th className="cc-c">Min</th>
                <th className="cc-c">Dist (m)</th>
                <th className="cc-c">m/min</th>
                <th className="cc-c">HSR</th>
                <th className="cc-c">Sprint</th>
                <th className="cc-c">PL</th>
                <th className="cc-c">PL/min</th>
                <th className="cc-c">Vel. máx</th>
                <th>Carga</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => {
                const sem = cargaSem(f);
                return (
                  <tr key={i} className={f.plantel ? '' : 'cc-gps-tr-sin'}>
                    <td><span className="cc-gps-nom">{f.name}<em>{f.pos || '—'}</em></span></td>
                    <td>
                      {puedeEditar ? (
                        <div className="cc-gps-link">
                          <CCTeamLogo team="Colo-Colo" size={16}></CCTeamLogo>
                          <select className={'cc-gps-linksel' + (f.plantel ? '' : ' sin')}
                            value={f.plantel || ''} onChange={e => { CC_GPS.setAlias(f.name, e.target.value || null); setTick(t => t + 1); }}>
                            <option value="">— Sin enlazar —</option>
                            {plantel.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      ) : (f.plantel
                        ? <span className="cc-gps-match"><CCTeamLogo team="Colo-Colo" size={16}></CCTeamLogo>{f.plantel}</span>
                        : <span className="cc-falta">Sin enlazar</span>)}
                    </td>
                    <td className="cc-c">{f.dur}'</td>
                    <td className="cc-c"><strong>{f.dist.toLocaleString('es-CL')}</strong></td>
                    <td className="cc-c">{f.mMin}</td>
                    <td className="cc-c">{f.hsr == null ? '—' : f.hsr}</td>
                    <td className="cc-c">{f.sprint == null ? '—' : f.sprint}</td>
                    <td className="cc-c">{f.pl}</td>
                    <td className="cc-c">{f.plMin}</td>
                    <td className="cc-c">{f.vmax || '—'}</td>
                    <td><span className={'cc-gps-sem cc-gps-sem-' + sem.cls}>{sem.txt}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="cc-grid-2">
        <Card className="cc-pad">
          <h3 className="cc-card-title">Perfil de intensidad — distancia por jugador</h3>
          <p className="cc-card-note">Barra = distancia total; el tramo rojo marca la porción a alta velocidad (HSR + sprint).</p>
          <div className="cc-gps-bars">
            {filas.slice().sort((a, b) => b.dist - a.dist).map((f, i) => {
              const hv = (f.hsr || 0);
              return (
                <div key={i} className="cc-gps-barrow">
                  <span className="cc-gps-barlbl" title={f.plantel || f.name}>{dtApellido(f.plantel || f.name)}</span>
                  <div className="cc-gps-bartrack">
                    <div className="cc-gps-barfill" style={{ width: (f.dist / maxDist * 100) + '%' }}>
                      {hv > 0 && <span className="cc-gps-bar-hi" style={{ width: Math.min(100, hv / f.dist * 100) + '%' }}></span>}
                    </div>
                  </div>
                  <span className="cc-gps-barval">{(f.dist / 1000).toFixed(1)}k</span>
                </div>
              );
            })}
          </div>
        </Card>

        <DTGpsAccDec filas={filas} tipo={sesActual.tipo}></DTGpsAccDec>
      </div>

      <DTGpsEvolucion></DTGpsEvolucion>
    </React.Fragment>
  );
}

// Aceleraciones vs desaceleraciones (promedio por jugador de la sesión)
function DTGpsAccDec({ filas, tipo }) {
  const val = filas.filter(f => f.dur >= 20 && (f.acc != null || f.dec != null));
  if (!val.length) {
    return (
      <Card className="cc-pad">
        <h3 className="cc-card-title">Aceleraciones vs desaceleraciones</h3>
        <p className="cc-empty">Este export no incluye conteo de aceleraciones/desaceleraciones.</p>
      </Card>
    );
  }
  const rows = val.slice().sort((a, b) => (b.acc || 0) - (a.acc || 0));
  const maxV = Math.max(1, ...rows.map(f => Math.max(f.acc || 0, f.dec || 0)));
  const avgAcc = Math.round(rows.reduce((a, f) => a + (f.acc || 0), 0) / rows.length);
  const avgDec = Math.round(rows.reduce((a, f) => a + (f.dec || 0), 0) / rows.length);
  return (
    <Card className="cc-pad">
      <div className="cc-chart-head">
        <h3 className="cc-card-title">Aceleraciones vs desaceleraciones</h3>
        <span className="cc-gps-legend"><span className="cc-gps-lg acc"></span>Acel {avgAcc}<span className="cc-gps-lg dec"></span>Desac {avgDec}</span>
      </div>
      <p className="cc-card-note">Esfuerzos por jugador (barra doble). Un desbalance marcado señala mayor exigencia de frenado.</p>
      <div className="cc-gps-accdec">
        {rows.map((f, i) => (
          <div key={i} className="cc-gps-adrow">
            <span className="cc-gps-barlbl" title={f.plantel || f.name}>{dtApellido(f.plantel || f.name)}</span>
            <div className="cc-gps-adbars">
              <div className="cc-gps-adbar acc" style={{ width: ((f.acc || 0) / maxV * 100) + '%' }} title={'Aceleraciones ' + (f.acc || 0)}></div>
              <div className="cc-gps-adbar dec" style={{ width: ((f.dec || 0) / maxV * 100) + '%' }} title={'Desaceleraciones ' + (f.dec || 0)}></div>
            </div>
            <span className="cc-gps-barval">{(f.acc || 0)}/{(f.dec || 0)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Evolución del equipo por sesión (carga, intensidad, sprints)
function DTGpsEvolucion() {
  const [metrica, setMetrica] = React.useState('distKm');
  const res = CC_GPS.resumenSesiones();
  const METR = {
    distKm: { label: 'Carga total (km)', fmt: v => v + ' km', color: 'var(--rojo)' },
    mMin: { label: 'Intensidad (m/min)', fmt: v => v + ' m/min', color: '#2563EB' },
    sprints: { label: 'Sprints del equipo', fmt: v => v + '', color: '#1E7A45' }
  };
  if (res.length < 2) {
    return (
      <Card className="cc-pad">
        <h3 className="cc-card-title">Evolución del equipo</h3>
        <p className="cc-empty">Carga al menos dos sesiones para ver la evolución (partidos y entrenamientos).</p>
      </Card>
    );
  }
  const m = METR[metrica];
  const W = 620, H = 200, PADX = 40, PADY = 26;
  const vals = res.map(s => s[metrica] || 0);
  const maxV = Math.max(1, ...vals);
  const x = i => PADX + (res.length === 1 ? 0.5 : i / (res.length - 1)) * (W - 2 * PADX);
  const y = v => H - PADY - (v / maxV) * (H - 2 * PADY);
  const pts = res.map((s, i) => [x(i), y(s[metrica] || 0)]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = 'M' + pts[0][0].toFixed(1) + ' ' + (H - PADY) + ' ' + path.slice(1) + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (H - PADY) + ' Z';

  return (
    <Card className="cc-pad">
      <div className="cc-chart-head">
        <h3 className="cc-card-title">Evolución del equipo — partidos y entrenamientos</h3>
        <Select value={metrica} onChange={setMetrica}
          options={Object.keys(METR).map(k => ({ value: k, label: METR[k].label }))}></Select>
      </div>
      <p className="cc-card-note">{m.label} por sesión, ordenadas por fecha. ⚽ = partido · 🏃 = entrenamiento.</p>
      <div className="cc-gps-evo">
        <svg viewBox={'0 0 ' + W + ' ' + H} className="cc-gps-evo-svg" preserveAspectRatio="xMidYMid meet">
          {[0, 0.5, 1].map((g, i) => (
            <g key={i}>
              <line x1={PADX} y1={y(maxV * g)} x2={W - PADX} y2={y(maxV * g)} stroke="var(--border)" strokeWidth="1" strokeDasharray={g === 0 ? '' : '3 4'}></line>
              <text x={PADX - 6} y={y(maxV * g) + 3} textAnchor="end" className="cc-gps-evo-ax">{Math.round(maxV * g)}</text>
            </g>
          ))}
          <path d={area} fill={m.color} opacity="0.10"></path>
          <path d={path} fill="none" stroke={m.color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round"></path>
          {res.map((s, i) => (
            <g key={s.id}>
              <circle cx={x(i)} cy={y(s[metrica] || 0)} r="5" fill="var(--surface)" stroke={m.color} strokeWidth="2.4"></circle>
              <text x={x(i)} y={y(s[metrica] || 0) - 11} textAnchor="middle" className="cc-gps-evo-val">{m.fmt(s[metrica] || 0)}</text>
              <text x={x(i)} y={H - PADY + 15} textAnchor="middle" className="cc-gps-evo-ax">{(s.tipo === 'Partido' ? '⚽ ' : '🏃 ') + dtGpsFmt(s.fecha)}</text>
            </g>
          ))}
        </svg>
      </div>
    </Card>
  );
}

// Diálogo al subir un CSV: tipo de sesión + fecha (partido enlaza con el fixture)
function DTGpsDialogo({ pendiente, partidos, onConfirm, onCancel }) {
  const [tipo, setTipo] = React.useState('Entrenamiento');
  const [fecha, setFecha] = React.useState(new Date().toISOString().slice(0, 10));
  const [partidoFecha, setPartidoFecha] = React.useState(partidos[0] ? partidos[0].fecha : '');
  const confirmar = () => {
    const f = tipo === 'Partido' ? (partidoFecha || fecha) : fecha;
    const titulo = pendiente.nombre + ' · ' + (tipo === 'Partido' ? 'Partido' : 'Entrenamiento');
    onConfirm({ tipo, fecha: f, titulo });
  };
  return (
    <div className="cc-modal-overlay" onClick={onCancel}>
      <div className="cc-modal cc-modal-sm" onClick={e => e.stopPropagation()}>
        <div className="cc-modal-head">
          <h3>Nueva sesión GPS</h3>
          <button className="cc-modal-x" onClick={onCancel}><Icon name="cerrar" size={18}></Icon></button>
        </div>
        <div className="cc-gps-dlg">
          <p className="cc-card-note" style={{ margin: '0 0 4px' }}>Archivo: <strong>{pendiente.nombre}</strong></p>
          <div className="cc-gps-dlg-tipo">
            <button className={'cc-gps-dlg-btn' + (tipo === 'Entrenamiento' ? ' on' : '')} onClick={() => setTipo('Entrenamiento')}>🏃 Entrenamiento</button>
            <button className={'cc-gps-dlg-btn' + (tipo === 'Partido' ? ' on' : '')} onClick={() => setTipo('Partido')}>⚽ Partido</button>
          </div>
          {tipo === 'Entrenamiento' ? (
            <label className="cc-esc-campo"><span>Fecha del entrenamiento</span>
              <input className="cc-input" type="date" value={fecha} onChange={e => setFecha(e.target.value)}></input>
            </label>
          ) : partidos.length ? (
            <label className="cc-esc-campo"><span>Partido (enlazado al Reporte Post-Partido)</span>
              <select className="cc-input" value={partidoFecha} onChange={e => setPartidoFecha(e.target.value)}>
                {partidos.map(p => <option key={p.fecha} value={p.fecha}>{p.label}</option>)}
              </select>
            </label>
          ) : (
            <label className="cc-esc-campo"><span>Fecha del partido</span>
              <input className="cc-input" type="date" value={fecha} onChange={e => setFecha(e.target.value)}></input>
            </label>
          )}
        </div>
        <div className="cc-esc-btns">
          <button className="cc-btn-mini" onClick={confirmar}><Icon name="check" size={14}></Icon> Guardar sesión</button>
          <button className="cc-btn-mini cc-btn-ghost" onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DTGps });
