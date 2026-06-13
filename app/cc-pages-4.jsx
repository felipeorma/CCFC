// ============================================================
// ColoColo Football Center — Páginas 4 (v3)
// Scouting (crear informe, video, PDF), Campograma,
// Configuración (logos manuales), Usuarios (roles/contraseñas), Login
// ============================================================
/* global React, CC_DATA, Icon, Card, PageHeader, StatCard, Select, SegTabs, Estrellas, EstrellasInput, DataTable, CCTeamLogo, CCTournamentLogo */

const { useState: p4State, useEffect: p4Effect } = React;

// ---------- Usuarios: almacenamiento compartido ----------
function ccLeerUsuarios() {
  let lista = null;
  try {
    const raw = localStorage.getItem('cc_usuarios_v1');
    if (raw) { const u = JSON.parse(raw); if (Array.isArray(u) && u.length) lista = u; }
  } catch (e) {}
  if (!lista) lista = CC_DATA.usuarios.map(u => Object.assign({}, u));
  // La cuenta principal siempre tiene su contraseña asignada
  lista = lista.map(u => u.principal ? Object.assign({}, u, { pass: 'Admin' }) : u);
  return lista;
}
function ccGuardarUsuarios(lista) {
  try { localStorage.setItem('cc_usuarios_v1', JSON.stringify(lista)); } catch (e) {}
}
function ccRolDe(email) {
  const u = ccLeerUsuarios().find(x => x.email === email);
  return u ? u.rol : null;
}
// Páginas permitidas para una cuenta: null = todas
function ccPaginasDe(email) {
  const u = ccLeerUsuarios().find(x => x.email === email);
  if (!u || u.principal || !Array.isArray(u.paginas)) return null;
  return u.paginas;
}

// ---------------- Informes de Scouting ----------------
function ccLeerInformes() {
  try {
    const raw = localStorage.getItem('cc_informes_v1');
    if (raw) { const x = JSON.parse(raw); if (Array.isArray(x)) return x; }
  } catch (e) {}
  return [];
}

function FormInforme({ onGuardar, onCancelar }) {
  const [f, setF] = p4State({
    jugador: '', club: CC_DATA.equipos[0].nombre, posicion: 'CF', edad: 20,
    partido: '', video: '', pdf: '', fortalezas: '', debilidades: '',
    recomendacion: 'Seguir observando', prioridad: 'Media',
    ratings: { 'Técnica': 3, 'Táctica': 3, 'Física': 3, 'Mental': 3 }
  });
  const set = (k, v) => setF(prev => Object.assign({}, prev, { [k]: v }));
  const setRating = (k, v) => setF(prev => Object.assign({}, prev, { ratings: Object.assign({}, prev.ratings, { [k]: v }) }));
  const posiciones = [...new Set(CC_DATA.jugadores.map(j => j.posicion))].filter(p => p && p !== '—').sort();

  const enviar = e => {
    e.preventDefault();
    if (!f.jugador.trim()) return;
    onGuardar(Object.assign({}, f, {
      jugador: f.jugador.trim(),
      edad: Number(f.edad) || 0,
      fecha: new Date().toISOString().slice(0, 10),
      scout: 'Área de Scouting'
    }));
  };

  return (
    <Card className="cc-pad cc-form-informe">
      <h3 className="cc-card-title">Nuevo informe de scouting</h3>
      <form onSubmit={enviar}>
        <div className="cc-form-grid">
          <label className="cc-select-wrap">
            <span className="cc-select-label">Jugador *</span>
            <input className="cc-input" value={f.jugador} onChange={e => set('jugador', e.target.value)} placeholder="Nombre del jugador"></input>
          </label>
          <Select label="Club" value={f.club} onChange={v => set('club', v)} options={CC_DATA.equipos.map(e => e.nombre)}></Select>
          <Select label="Posición" value={f.posicion} onChange={v => set('posicion', v)} options={posiciones}></Select>
          <label className="cc-select-wrap" style={{ minWidth: '90px' }}>
            <span className="cc-select-label">Edad</span>
            <input className="cc-input" type="number" min="15" max="45" value={f.edad} onChange={e => set('edad', e.target.value)}></input>
          </label>
          <label className="cc-select-wrap" style={{ gridColumn: '1 / -1' }}>
            <span className="cc-select-label">Partido observado</span>
            <input className="cc-input" value={f.partido} onChange={e => set('partido', e.target.value)} placeholder="Ej: Ñublense vs Cobresal (2-1)"></input>
          </label>
        </div>

        <div className="cc-form-ratings">
          {Object.keys(f.ratings).map(k => (
            <div key={k} className="cc-form-rating">
              <span>{k}</span>
              <EstrellasInput valor={f.ratings[k]} onChange={v => setRating(k, v)}></EstrellasInput>
            </div>
          ))}
        </div>

        <div className="cc-form-grid">
          <label className="cc-select-wrap" style={{ gridColumn: '1 / -1' }}>
            <span className="cc-select-label">Fortalezas</span>
            <textarea className="cc-input cc-textarea" value={f.fortalezas} onChange={e => set('fortalezas', e.target.value)} rows="2"></textarea>
          </label>
          <label className="cc-select-wrap" style={{ gridColumn: '1 / -1' }}>
            <span className="cc-select-label">Aspectos a mejorar</span>
            <textarea className="cc-input cc-textarea" value={f.debilidades} onChange={e => set('debilidades', e.target.value)} rows="2"></textarea>
          </label>
          <label className="cc-select-wrap">
            <span className="cc-select-label">Link de video (YouTube, Wyscout…)</span>
            <input className="cc-input" type="url" value={f.video} onChange={e => set('video', e.target.value)} placeholder="https://…"></input>
          </label>
          <label className="cc-select-wrap">
            <span className="cc-select-label">Adjuntar PDF</span>
            <input
              className="cc-input cc-input-file" type="file" accept="application/pdf"
              onChange={e => set('pdf', e.target.files && e.target.files[0] ? e.target.files[0].name : '')}
            ></input>
          </label>
          <Select label="Recomendación" value={f.recomendacion} onChange={v => set('recomendacion', v)} options={['Fichar', 'Seguir observando', 'Descartar']}></Select>
          <Select label="Prioridad" value={f.prioridad} onChange={v => set('prioridad', v)} options={['Alta', 'Media', 'Baja']}></Select>
        </div>

        <div className="cc-form-acciones">
          <button type="submit" className="cc-btn-primary" style={{ width: 'auto' }}>Guardar informe</button>
          <button type="button" className="cc-btn-ghost" onClick={onCancelar}>Cancelar</button>
        </div>
      </form>
    </Card>
  );
}

function PageScouting() {
  const [filtroRec, setFiltroRec] = p4State('Todas');
  const [filtroPos, setFiltroPos] = p4State('Todas');
  const [abierto, setAbierto] = p4State(null);
  const [creando, setCreando] = p4State(false);
  const [propios, setPropios] = p4State(ccLeerInformes);

  const todos = [...propios, ...CC_DATA.informes];
  const recs = ['Todas', 'Fichar', 'Seguir observando', 'Descartar'];
  const posiciones = ['Todas', ...[...new Set(todos.map(r => r.posicion))].sort()];
  const informes = todos.filter(r =>
    (filtroRec === 'Todas' || r.recomendacion === filtroRec) &&
    (filtroPos === 'Todas' || r.posicion === filtroPos)
  );

  const guardar = informe => {
    const nuevos = [informe, ...propios];
    setPropios(nuevos);
    try { localStorage.setItem('cc_informes_v1', JSON.stringify(nuevos)); } catch (e) {}
    setCreando(false);
    setAbierto(informe.jugador);
  };

  const eliminar = jugador => {
    const nuevos = propios.filter(r => r.jugador !== jugador);
    setPropios(nuevos);
    try { localStorage.setItem('cc_informes_v1', JSON.stringify(nuevos)); } catch (e) {}
  };

  return (
    <div className="cc-page">
      <PageHeader
        icon="scouting" title="Informes de Scouting"
        subtitle="Seguimiento de jugadores objetivo · elaborados por el área de scouting"
        right={
          <button className="cc-btn-primary" style={{ width: 'auto' }} onClick={() => setCreando(!creando)}>
            <Icon name="mas" size={15}></Icon> Nuevo informe
          </button>
        }
      ></PageHeader>

      {creando && <FormInforme onGuardar={guardar} onCancelar={() => setCreando(false)}></FormInforme>}

      <Card className="cc-pad cc-filters">
        <Select label="Recomendación" value={filtroRec} onChange={setFiltroRec} options={recs}></Select>
        <Select label="Posición" value={filtroPos} onChange={setFiltroPos} options={posiciones}></Select>
      </Card>

      {informes.length === 0 && (
        <Card className="cc-pad"><p className="cc-empty">Ningún informe coincide con los filtros.</p></Card>
      )}

      <div className="cc-scout-grid">
        {informes.map(r => {
          const promedio = Object.values(r.ratings).reduce((a, b) => a + b, 0) / Object.keys(r.ratings).length;
          const open = abierto === r.jugador;
          const esPropio = propios.some(p => p.jugador === r.jugador);
          return (
            <Card key={r.jugador + r.fecha} className="cc-pad cc-scout-card">
              <div className="cc-scout-head">
                <div>
                  <h3>{r.jugador}</h3>
                  <p className="cc-scout-meta">{r.posicion} · {r.edad} años · {r.club}</p>
                </div>
                <div className="cc-scout-rating">
                  <strong>{Math.round(promedio * 10) / 10}</strong>
                  <Estrellas valor={promedio}></Estrellas>
                </div>
              </div>

              <div className="cc-scout-tags">
                <span className={'cc-pill ' + (r.recomendacion === 'Fichar' ? 'cc-pill-v' : r.recomendacion === 'Descartar' ? 'cc-pill-d' : 'cc-pill-e')}>{r.recomendacion}</span>
                <span className="cc-pill cc-pill-pendiente">Prioridad {(r.prioridad || 'media').toLowerCase()}</span>
                {r.video && (
                  <a className="cc-pill cc-pill-link" href={r.video} target="_blank" rel="noopener noreferrer">
                    <Icon name="video" size={12}></Icon> Video
                  </a>
                )}
                {r.pdf && (
                  <span className="cc-pill cc-pill-pendiente" title={r.pdf}>
                    <Icon name="pdf" size={12}></Icon> {r.pdf.length > 22 ? r.pdf.slice(0, 20) + '…' : r.pdf}
                  </span>
                )}
              </div>

              <div className="cc-scout-ratings">
                {Object.entries(r.ratings).map(([k, v]) => (
                  <div key={k} className="cc-scout-rating-row">
                    <span>{k}</span>
                    <div className="cc-scout-track"><div style={{ width: (v / 5) * 100 + '%' }}></div></div>
                    <strong>{v}</strong>
                  </div>
                ))}
              </div>

              {open && (
                <div className="cc-scout-detalle">
                  {r.partido && <p><strong>Partido observado:</strong> {r.partido}</p>}
                  {r.fortalezas && <p><strong>Fortalezas:</strong> {r.fortalezas}</p>}
                  {r.debilidades && <p><strong>Aspectos a mejorar:</strong> {r.debilidades}</p>}
                  <p className="cc-scout-firma">{r.scout} · {r.fecha}</p>
                </div>
              )}
              <div className="cc-scout-pie">
                <button className="cc-btn-ghost" onClick={() => setAbierto(open ? null : r.jugador)}>
                  {open ? 'Ocultar informe' : 'Ver informe completo'}
                </button>
                {esPropio && (
                  <button className="cc-btn-ghost cc-btn-peligro" onClick={() => eliminar(r.jugador)} title="Eliminar informe">
                    <Icon name="basura" size={14}></Icon>
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Campograma ----------------
function PageCampograma() {
  const titulares = CC_DATA.alineacion.titulares;
  const [sel, setSel] = p4State(titulares[titulares.length - 1].nombre);
  const jugador = CC_DATA.jugadores.find(j => j.nombre === sel && j.equipo === 'Colo-Colo') || CC_DATA.jugadores.find(j => j.nombre === sel);
  const apellido = n => { const p = n.split(' '); return p.length > 1 ? p[p.length - 1] : n; };

  return (
    <div className="cc-page">
      <PageHeader icon="campograma" title="Campograma" subtitle={'Once con más minutos · esquema más usado: ' + CC_DATA.alineacion.esquema + ' · haz clic en un jugador'}></PageHeader>

      <div className="cc-campo-layout">
        <Card className="cc-pad">
          <svg viewBox="0 0 100 130" className="cc-campo">
            <rect x="2" y="2" width="96" height="126" rx="2" className="cc-campo-base"></rect>
            <line x1="2" y1="65" x2="98" y2="65" className="cc-campo-linea"></line>
            <circle cx="50" cy="65" r="11" className="cc-campo-linea" fill="none"></circle>
            <rect x="26" y="2" width="48" height="17" className="cc-campo-linea" fill="none"></rect>
            <rect x="38" y="2" width="24" height="7" className="cc-campo-linea" fill="none"></rect>
            <rect x="26" y="111" width="48" height="17" className="cc-campo-linea" fill="none"></rect>
            <rect x="38" y="121" width="24" height="7" className="cc-campo-linea" fill="none"></rect>
            {CC_DATA.alineacion.titulares.map(t => {
              const activo = t.nombre === sel;
              return (
                <g key={t.nombre} className="cc-campo-jugador" onClick={() => setSel(t.nombre)} style={{ cursor: 'pointer' }}>
                  <circle cx={t.x} cy={t.y * 1.26 + 2} r={activo ? 5.2 : 4.4} className={activo ? 'activo' : ''}></circle>
                  <text x={t.x} y={t.y * 1.26 + 3.2} textAnchor="middle" className="cc-campo-num">{t.posicion}</text>
                  <text x={t.x} y={t.y * 1.26 + 10} textAnchor="middle" className="cc-campo-nombre">{apellido(t.nombre)}</text>
                </g>
              );
            })}
          </svg>
        </Card>

        <Card className="cc-pad cc-campo-side">
          <h3 className="cc-card-title">{jugador.nombre}</h3>
          <p className="cc-scout-meta">{jugador.posicion} · {jugador.edad} años · {jugador.pj} partidos{jugador.altura ? ' · ' + jugador.altura + ' cm' : ''}{jugador.pie ? ' · ' + jugador.pie : ''}</p>
          <div className="cc-campo-stats">
            <StatCard label="Minutos" value={jugador.min + "'"}></StatCard>
            <StatCard label="Goles" value={jugador.goles}></StatCard>
            <StatCard label="Asistencias" value={jugador.asist}></StatCard>
            <StatCard label="xG" value={jugador.xg.toFixed(2)}></StatCard>
            <StatCard label="Precisión pase" value={jugador.pasesPct + '%'}></StatCard>
            <StatCard label="xA" value={jugador.xa.toFixed(2)}></StatCard>
          </div>
          <div className="cc-campo-extra">
            <div><span>Duelos ganados</span><strong>{jugador.duelosPct ? jugador.duelosPct + '%' : '—'}</strong></div>
            <div><span>Regates / 90</span><strong>{jugador.regatesP90.toFixed(1)}</strong></div>
            <div><span>Acciones defensivas / 90</span><strong>{jugador.accDefP90.toFixed(1)}</strong></div>
            <div><span>Tarjetas</span><strong>{jugador.amarillas} 🟨 {jugador.rojas ? jugador.rojas + ' 🟥' : ''}</strong></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------------- Configuración ----------------
// Registro persistente de datasets cargados (con fecha de subida + eliminar).
// Team Stats: un archivo por equipo (la liga tiene 16 clubes).
function ccEquiposLiga() {
  return Object.keys(CC_DATA.metricasEquipo || {})
    .filter(function (n) { return n && n !== 'Promedio adversarios'; })
    .sort(function (a, b) { return a.localeCompare(b, 'es'); });
}
function ccDatasetsDefault() {
  var equipos = ccEquiposLiga();
  return {
    teamFiles: equipos.map(function (nombre) {
      return {
        id: nombre,
        equipo: nombre,
        archivo: (CC_DATA.teamStatsFiles && CC_DATA.teamStatsFiles[nombre]) || 'TeamStats_' + nombre.replace(/[^A-Za-z0-9]+/g, '') + '.xlsx',
        fecha: '2026-06-11'
      };
    }),
    players: { archivo: CC_DATA.datasets[1].archivo, detalle: CC_DATA.datasets[1].detalle, fecha: '2026-06-11' },
    extra: []
  };
}
function ccLeerDatasets() {
  try {
    const d = JSON.parse(localStorage.getItem('cc_datasets_v1') || 'null');
    if (d && Array.isArray(d.teamFiles)) return d;
  } catch (e) {}
  return ccDatasetsDefault();
}
function ccGuardarDatasets(d) {
  try { localStorage.setItem('cc_datasets_v1', JSON.stringify(d)); } catch (e) {}
}
function ccHoyISO() { return new Date().toISOString().slice(0, 10); }

function GestorDatos({ temporada }) {
  const [ds, setDs] = p4State(ccLeerDatasets);
  const [tipoSubida, setTipoSubida] = p4State('team');
  const [equipoSel, setEquipoSel] = p4State(ccEquiposLiga()[0] || '');
  const [arrastrando, setArrastrando] = p4State(false);
  const [msg, setMsg] = p4State(null);

  const persistir = next => { setDs(next); ccGuardarDatasets(next); };
  const equipos = ccEquiposLiga();

  const registrarTeam = (file, equipo) => {
    const entry = { id: equipo, equipo: equipo, archivo: file.name, fecha: ccHoyISO() };
    const resto = (ds.teamFiles || []).filter(t => t.id !== equipo);
    persistir({ ...ds, teamFiles: [entry, ...resto].sort((a, b) => a.equipo.localeCompare(b.equipo, 'es')) });
    setMsg({ tipo: 'ok', texto: 'Team Stats de ' + equipo + ' actualizado (' + file.name + ').' });
  };
  const registrar = (file, tipo) => {
    if (tipo === 'team') { registrarTeam(file, equipoSel); return; }
    if (tipo === 'players') {
      persistir({ ...ds, players: { archivo: file.name, detalle: Math.round(file.size / 1024) + ' KB · subido por el usuario', fecha: ccHoyISO() } });
      setMsg({ tipo: 'ok', texto: '«' + file.name + '» guardado en la temporada ' + temporada + '.' });
      return;
    }
    persistir({ ...ds, extra: [{ id: Date.now(), nombre: file.name, tipo: 'Adicional', fecha: ccHoyISO() }, ...(ds.extra || [])] });
    setMsg({ tipo: 'ok', texto: '«' + file.name + '» guardado como archivo adicional.' });
  };

  const onDrop = e => {
    e.preventDefault();
    setArrastrando(false);
    Array.from(e.dataTransfer.files || []).forEach(f => registrar(f, tipoSubida));
  };

  const eliminarTeam = id => persistir({ ...ds, teamFiles: (ds.teamFiles || []).filter(t => t.id !== id) });
  const eliminarPlayers = () => { persistir({ ...ds, players: null }); setMsg({ tipo: 'ok', texto: 'Estadísticas de jugadores eliminadas.' }); };
  const eliminarExtra = id => persistir({ ...ds, extra: (ds.extra || []).filter(x => x.id !== id) });

  const totalEquipos = equipos.length;
  const cargados = (ds.teamFiles || []).length;

  return (
    <React.Fragment>
      <Card className="cc-pad">
        <div className="cc-chart-head">
          <h3 className="cc-card-title">1 · Team Stats Wyscout (un archivo por equipo)</h3>
          <span className={'cc-pill ' + (cargados >= totalEquipos ? 'cc-pill-v' : 'cc-pill-pendiente')}>{cargados} de {totalEquipos} equipos</span>
        </div>
        <p className="cc-card-note">Cada club aporta un archivo de <strong>Wyscout</strong> con sus partidos: valores propios y del adversario, 109 métricas por partido (goles, xG, PPDA, posesión, duelos…).</p>
        {(ds.teamFiles || []).length > 0 ? (
          <div className="cc-evol-table">
            <div className="cc-evol-head cuatro"><span>Equipo</span><span>Archivo</span><span>Última actualización</span><span></span></div>
            {ds.teamFiles.map(t => (
              <div key={t.id} className="cc-evol-row cuatro">
                <span className="cc-evol-rival"><CCTeamLogo team={t.equipo} size={18}></CCTeamLogo> {t.equipo}</span>
                <span className="cc-dataset-detalle">{t.archivo}</span>
                <span>{t.fecha}</span>
                <span><button className="cc-btn-ghost cc-btn-danger" onClick={() => eliminarTeam(t.id)}><Icon name="cerrar" size={12}></Icon> Eliminar</button></span>
              </div>
            ))}
          </div>
        ) : (
          <p className="cc-empty">Ningún archivo de Team Stats cargado. Súbelos abajo (uno por equipo).</p>
        )}
      </Card>

      <Card className="cc-pad">
        <div className="cc-chart-head">
          <h3 className="cc-card-title">2 · Estadísticas de jugadores (liga completa)</h3>
          <span className={'cc-pill ' + (ds.players ? 'cc-pill-v' : 'cc-pill-e')}>{ds.players ? 'Cargado' : 'Sin cargar'}</span>
        </div>
        <p className="cc-card-note">Un único archivo con todos los jugadores de la liga: 115 métricas por jugador (goles, xG, xA, pases, duelos, regates, valor de mercado…).</p>
        {ds.players ? (
          <div className="cc-evol-table">
            <div className="cc-evol-head cuatro"><span>Archivo</span><span>Detalle</span><span>Última actualización</span><span></span></div>
            <div className="cc-evol-row cuatro">
              <span className="cc-evol-rival">{ds.players.archivo}</span>
              <span className="cc-dataset-detalle">{ds.players.detalle}</span>
              <span>{ds.players.fecha}</span>
              <span><button className="cc-btn-ghost cc-btn-danger" onClick={eliminarPlayers}><Icon name="cerrar" size={12}></Icon> Eliminar</button></span>
            </div>
          </div>
        ) : (
          <p className="cc-empty">Sin archivo de jugadores. Súbelo abajo.</p>
        )}
      </Card>

      <Card className="cc-pad">
        <h3 className="cc-card-title">Cargar datos · Temporada {temporada}</h3>
        <div className="cc-filters" style={{ marginBottom: '14px' }}>
          <Select label="Tipo de archivo" value={tipoSubida} onChange={setTipoSubida} options={[
            { value: 'team', label: 'Team Stats (por equipo)' },
            { value: 'players', label: 'Estadísticas de jugadores' },
            { value: 'extra', label: 'Otro / adicional' }
          ]}></Select>
          {tipoSubida === 'team' && (
            <Select label="Equipo" value={equipoSel} onChange={setEquipoSel} options={equipos}></Select>
          )}
          <label className="cc-select-wrap" style={{ minWidth: '220px' }}>
            <span className="cc-select-label">Seleccionar archivo</span>
            <input className="cc-input cc-input-file" type="file" accept=".csv,.xlsx,.xls,text/csv" onChange={e => e.target.files && e.target.files[0] && registrar(e.target.files[0], tipoSubida)}></input>
          </label>
        </div>
        <div
          className={'cc-dropzone' + (arrastrando ? ' over' : '')}
          onDragOver={e => { e.preventDefault(); setArrastrando(true); }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={onDrop}
        >
          <Icon name="subir" size={28}></Icon>
          <p><strong>Arrastra aquí tu CSV o Excel de Wyscout</strong></p>
          <p className="cc-card-note">{tipoSubida === 'team' ? 'Se asignará al equipo: ' + equipoSel : 'Se guarda en la temporada ' + temporada} · con su fecha de subida</p>
        </div>
        {msg && <p className={msg.tipo === 'ok' ? 'cc-card-note' : 'cc-login-error'} style={{ marginTop: '10px' }}>{msg.texto}</p>}
        {(ds.extra || []).length > 0 && (
          <div className="cc-evol-table" style={{ marginTop: '14px' }}>
            <div className="cc-evol-head cuatro"><span>Archivo</span><span>Contenido</span><span>Subido</span><span></span></div>
            {ds.extra.map(a => (
              <div key={a.id} className="cc-evol-row cuatro">
                <span className="cc-evol-rival">{a.nombre}</span>
                <span>{a.tipo}</span>
                <span>{a.fecha}</span>
                <span><button className="cc-btn-ghost cc-btn-danger" onClick={() => eliminarExtra(a.id)}><Icon name="cerrar" size={12}></Icon> Eliminar</button></span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </React.Fragment>
  );
}

function SubirShotmaps() {
  const [, setTick] = p4State(0);
  const [jSel, setJSel] = p4State(String(CC_DATA.partidos[CC_DATA.partidos.length - 1].j));
  const [url, setUrl] = p4State('');
  const [msg, setMsg] = p4State(null);
  const [cargando, setCargando] = p4State(false);
  p4Effect(() => {
    const f = () => setTick(t => t + 1);
    window.addEventListener('cc-shotmaps-ready', f);
    return () => window.removeEventListener('cc-shotmaps-ready', f);
  }, []);

  const api = window.CC_SHOTMAPS;
  const cuantos = api ? api.cuantos() : 0;
  const partido = CC_DATA.partidos.find(x => String(x.j) === jSel);

  const cargar = e => {
    e.preventDefault();
    if (!api || !partido) return;
    if (!url.trim()) { setMsg({ tipo: 'error', texto: 'Pega la URL del partido en Sofascore.' }); return; }
    setCargando(true);
    setMsg(null);
    api.cargarDesdeUrl(partido.j, url.trim(), partido.local)
      .then(r => { setMsg({ tipo: 'ok', texto: r.tiros + ' tiros cargados para P' + partido.j + ' (evento ' + r.eventId + ').' }); setUrl(''); })
      .catch(err => setMsg({ tipo: 'error', texto: String(err && err.message || err) }))
      .then(() => setCargando(false));
  };

  return (
    <Card className="cc-pad">
      <div className="cc-chart-head">
        <h3 className="cc-card-title">Shotmaps por partido (Sofascore)</h3>
        <span className={'cc-pill ' + (cuantos > 0 ? 'cc-pill-v' : 'cc-pill-pendiente')}>
          {cuantos + ' de ' + CC_DATA.partidos.length + ' partidos con shotmap'}
        </span>
      </div>
      <p className="cc-card-note">Pega la URL del partido en Sofascore y la plataforma descarga y arma el shotmap automáticamente. Ejemplo: <code>https://www.sofascore.com/football/match/colo-colo-huachipato/...#id:15352997</code></p>
      <form className="cc-filters" onSubmit={cargar}>
        <Select label="Partido" value={jSel} onChange={v => { setJSel(v); setMsg(null); }} options={CC_DATA.partidos.map(x => ({ value: String(x.j), label: 'P' + x.j + ' · ' + (x.local ? 'vs' : 'en') + ' ' + x.rival + ' (' + x.resultado + ')' + (api && api.get(x.j) ? ' ✓' : '') }))}></Select>
        <label className="cc-select-wrap" style={{ flex: 1, minWidth: '320px' }}>
          <span className="cc-select-label">URL del partido en Sofascore</span>
          <input className="cc-input" type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.sofascore.com/...#id:15352997"></input>
        </label>
        <button type="submit" className="cc-btn-primary" style={{ width: 'auto', alignSelf: 'flex-end' }} disabled={cargando}>{cargando ? 'Descargando…' : 'Cargar shotmap'}</button>
        {api && partido && api.get(partido.j) && (
          <button type="button" className="cc-btn-ghost" style={{ alignSelf: 'flex-end' }} onClick={() => { api.quitar(partido.j); setMsg({ tipo: 'ok', texto: 'Shotmap de P' + partido.j + ' eliminado.' }); }}>Quitar shotmap de P{partido.j}</button>
        )}
      </form>
      {msg && <p className={msg.tipo === 'ok' ? 'cc-card-note' : 'cc-login-error'} style={{ marginTop: '8px' }}>{msg.texto}</p>}
      <p className="cc-card-note" style={{ marginBottom: 0 }}>Si Sofascore bloquea la conexión desde tu red, los partidos 1–14 ya vienen con su shotmap real precargado en la plataforma.</p>
    </Card>
  );
}

function SubirTabla() {
  const [estado, setEstado] = p4State(() => {
    try {
      const d = JSON.parse(localStorage.getItem('cc_standings_csv_v1') || 'null');
      return d && d.rows ? { filas: d.rows.length, fecha: d.fecha } : null;
    } catch (e) { return null; }
  });
  const [error, setError] = p4State('');

  const leer = file => {
    const fr = new FileReader();
    fr.onload = () => {
      const fn = window.CC_SOFA_CARGAR_CSV;
      const res = fn ? fn(String(fr.result)) : { ok: false, error: 'Módulo de standings no disponible.' };
      if (res.ok) { setEstado({ filas: res.filas, fecha: new Date().toISOString().slice(0, 10) }); setError(''); }
      else setError(res.error || 'No se pudo leer el archivo.');
    };
    fr.readAsText(file);
  };

  return (
    <Card className="cc-pad">
      <div className="cc-chart-head">
        <h3 className="cc-card-title">3 · Tabla de posiciones (CSV de Sofascore)</h3>
        {estado && <span className="cc-pill cc-pill-v">Cargada · {estado.filas} equipos · {estado.fecha}</span>}
      </div>
      <p className="cc-card-note">La API de Sofascore bloquea conexiones del navegador. Genera el CSV con tu función <strong>get_league_standings</strong> (columnas position, team, matches, wins, draws, losses, goals_for, goals_against, points) y súbelo aquí: el Calendario mostrará la tabla completa con G/E/P y goles.</p>
      <label className="cc-select-wrap" style={{ maxWidth: '360px' }}>
        <span className="cc-select-label">Archivo de standings (.csv)</span>
        <input className="cc-input cc-input-file" type="file" accept=".csv,text/csv" onChange={e => e.target.files && e.target.files[0] && leer(e.target.files[0])}></input>
      </label>
      {error && <p className="cc-login-error" style={{ marginTop: '8px' }}>{error}</p>}
    </Card>
  );
}

function EstadoLogos() {
  const [, setTick] = p4State(0);
  const equiposIniciales = ccEquiposLiga();
  const [eqSel, setEqSel] = p4State(equiposIniciales[0] || 'Colo-Colo');
  const [url, setUrl] = p4State('');
  const [guardado, setGuardado] = p4State(false);

  p4Effect(() => {
    const f = () => setTick(t => t + 1);
    window.addEventListener('cc-logos-ready', f);
    return () => window.removeEventListener('cc-logos-ready', f);
  }, []);
  p4Effect(() => {
    setUrl(window.CC_LOGOS ? window.CC_LOGOS.getManual(eqSel) : '');
    setGuardado(false);
  }, [eqSel]);

  const st = window.CC_LOGOS ? window.CC_LOGOS.status() : { listo: false, mapeados: 0 };
  const equipos = ccEquiposLiga().map(nombre =>
    (CC_DATA.equipos || []).find(e => e.nombre === nombre) || { nombre: nombre, abrev: nombre.slice(0, 3).toUpperCase() }
  );

  const guardarLogo = e => {
    e.preventDefault();
    if (window.CC_LOGOS) {
      window.CC_LOGOS.setManual(eqSel, url.trim());
      setGuardado(true);
    }
  };

  return (
    <Card className="cc-pad">
      <div className="cc-chart-head">
        <h3 className="cc-card-title cc-title-logos">
          <CCTournamentLogo size={26}></CCTournamentLogo>
          Logos del torneo y equipos
        </h3>
        <span className={'cc-pill ' + (st.listo ? 'cc-pill-v' : 'cc-pill-pendiente')}>
          {!st.listo ? 'Cargando…' : 'Sofascore CDN · respaldo a siglas'}
        </span>
      </div>
      <p className="cc-card-note">Los escudos fueron extraídos desde SofaScore. Si alguno no aparece, selecciónalo abajo y pega la URL de su imagen para corregirlo manualmente.</p>
      <div className="cc-logo-grid">
        {equipos.map(e => (
          <button key={e.nombre} type="button" className={'cc-logo-cell' + (eqSel === e.nombre ? ' sel' : '')} onClick={() => setEqSel(e.nombre)}>
            <CCTeamLogo team={e.nombre} size={28}></CCTeamLogo>
            <span>{e.nombre}</span>
          </button>
        ))}
      </div>
      <form className="cc-logo-manual" onSubmit={guardarLogo}>
        <Select label="Equipo" value={eqSel} onChange={setEqSel} options={equipos.map(e => e.nombre)}></Select>
        <label className="cc-select-wrap" style={{ flex: 1, minWidth: '260px' }}>
          <span className="cc-select-label">URL del logo (PNG/SVG)</span>
          <input
            className="cc-input" type="url" value={url}
            onChange={e => { setUrl(e.target.value); setGuardado(false); }}
            placeholder="Ej: https://img.sofascore.com/api/v1/team/3155/image"
          ></input>
        </label>
        <button type="submit" className="cc-btn-primary" style={{ width: 'auto' }}>Guardar</button>
        {guardado && <span className="cc-pill cc-pill-v">Logo guardado ✓</span>}
      </form>
    </Card>
  );
}

function PageConfig() {
  const [temporada, setTemporada] = p4State('2026');

  return (
    <div className="cc-page">
      <PageHeader icon="config" title="Configuración" subtitle="Fuentes de datos, temporada activa y logos de la plataforma"></PageHeader>

      <Card className="cc-pad">
        <div className="cc-chart-head">
          <h3 className="cc-card-title">Temporada activa</h3>
          <span className="cc-pill cc-pill-v">Todos los datos cargados pertenecen a esta temporada</span>
        </div>
        <div className="cc-temporadas">
          <button
            className={'cc-temporada' + (temporada === '2026' ? ' activa' : '')}
            onClick={() => setTemporada('2026')}
          >
            <strong>2026</strong>
            <span>Liga de Primera · en curso</span>
            <span className="cc-temporada-detalle">14 partidos · 406 jugadores · datos Wyscout</span>
          </button>
          <button className="cc-temporada deshabilitada" disabled="disabled">
            <strong>2027</strong>
            <span>Próximamente</span>
            <span className="cc-temporada-detalle">Se habilitará al iniciar la próxima temporada</span>
          </button>
        </div>
        <p className="cc-card-note">Cada temporada mantiene sus propios archivos. Al crear la temporada 2027, los datos 2026 quedarán archivados y consultables.</p>
      </Card>

      <GestorDatos temporada={temporada}></GestorDatos>

      <SubirShotmaps></SubirShotmaps>

      <EstadoLogos></EstadoLogos>
    </div>
  );
}

// ---------------- Gestión de Usuarios ----------------
function PageUsuarios({ sesion }) {
  const [usuarios, setUsuarios] = p4State(ccLeerUsuarios);
  const [nuevo, setNuevo] = p4State(null); // null = oculto
  const [passEdit, setPassEdit] = p4State(null); // email en edición
  const [passVal, setPassVal] = p4State('');
  const [accesosEdit, setAccesosEdit] = p4State(null); // email con panel de accesos abierto

  const actual = usuarios.find(u => u.email === sesion);
  const esAdmin = !actual || actual.rol === 'Administrador';

  const guardar = lista => { setUsuarios(lista); ccGuardarUsuarios(lista); };

  const cambiarRol = (email, rol) => {
    guardar(usuarios.map(u => u.email === email ? Object.assign({}, u, { rol }) : u));
  };
  const asignarPass = email => {
    if (!passVal.trim()) return;
    guardar(usuarios.map(u => u.email === email ? Object.assign({}, u, { pass: passVal.trim() }) : u));
    setPassEdit(null); setPassVal('');
  };
  const eliminar = email => {
    guardar(usuarios.filter(u => u.email !== email));
  };
  const togglePagina = (email, id) => {
    guardar(usuarios.map(u => {
      if (u.email !== email) return u;
      const todas = [...window.CC_NAV, ...window.CC_NAV_ADMIN].map(n => n.id);
      const actuales = Array.isArray(u.paginas) ? u.paginas : todas;
      const nuevas = actuales.includes(id) ? actuales.filter(x => x !== id) : [...actuales, id];
      return Object.assign({}, u, { paginas: nuevas });
    }));
  };
  const todasLasPaginas = email => {
    guardar(usuarios.map(u => u.email === email ? Object.assign({}, u, { paginas: undefined }) : u));
  };
  const agregar = e => {
    e.preventDefault();
    if (!nuevo.nombre.trim() || !nuevo.email.trim()) return;
    guardar([...usuarios, {
      nombre: nuevo.nombre.trim(), email: nuevo.email.trim().toLowerCase(),
      rol: nuevo.rol, pass: nuevo.pass || '', ultimoAcceso: 'Nunca'
    }]);
    setNuevo(null);
  };

  return (
    <div className="cc-page">
      <PageHeader
        icon="usuarios" title="Gestión de Usuarios"
        subtitle={'Roles, accesos y contraseñas · cuenta principal: datos@colocolofc.cl' + (esAdmin ? '' : ' · tu rol no permite editar')}
        right={esAdmin ? (
          <button className="cc-btn-primary" style={{ width: 'auto' }} onClick={() => setNuevo(nuevo ? null : { nombre: '', email: '', rol: 'Visita', pass: '' })}>
            <Icon name="mas" size={15}></Icon> Agregar usuario
          </button>
        ) : null}
      ></PageHeader>

      {nuevo && (
        <Card className="cc-pad">
          <h3 className="cc-card-title">Nuevo usuario</h3>
          <form className="cc-filters" onSubmit={agregar}>
            <label className="cc-select-wrap">
              <span className="cc-select-label">Nombre *</span>
              <input className="cc-input" value={nuevo.nombre} onChange={e => setNuevo(Object.assign({}, nuevo, { nombre: e.target.value }))}></input>
            </label>
            <label className="cc-select-wrap">
              <span className="cc-select-label">Correo *</span>
              <input className="cc-input" type="email" value={nuevo.email} onChange={e => setNuevo(Object.assign({}, nuevo, { email: e.target.value }))} placeholder="usuario@colocolofc.cl"></input>
            </label>
            <Select label="Rol" value={nuevo.rol} onChange={v => setNuevo(Object.assign({}, nuevo, { rol: v }))} options={['Administrador', 'Editor', 'Visita']}></Select>
            <label className="cc-select-wrap">
              <span className="cc-select-label">Contraseña</span>
              <input className="cc-input" type="text" value={nuevo.pass} onChange={e => setNuevo(Object.assign({}, nuevo, { pass: e.target.value }))} placeholder="Opcional"></input>
            </label>
            <button type="submit" className="cc-btn-primary" style={{ width: 'auto' }}>Crear</button>
          </form>
        </Card>
      )}

      <Card>
        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Contraseña</th><th>Último acceso</th><th></th></tr>
            </thead>
            <tbody>
              {usuarios.map(u => {
                const principal = !!u.principal;
                return (
                  <tr key={u.email}>
                    <td>
                      <strong>{u.nombre}</strong>
                      {principal && <span className="cc-pill cc-pill-v" style={{ marginLeft: '8px' }}>Cuenta principal</span>}
                      {u.email === sesion && <span className="cc-pill cc-pill-pendiente" style={{ marginLeft: '8px' }}>Tú</span>}
                    </td>
                    <td>{u.email}</td>
                    <td>
                      {principal || !esAdmin ? (
                        <span className={'cc-pill ' + (u.rol === 'Administrador' ? 'cc-pill-v' : u.rol === 'Editor' ? 'cc-pill-e' : 'cc-pill-pendiente')}>{u.rol}</span>
                      ) : (
                        <select className="cc-select cc-select-mini" value={u.rol} onChange={e => cambiarRol(u.email, e.target.value)}>
                          <option value="Administrador">Administrador</option>
                          <option value="Editor">Editor</option>
                          <option value="Visita">Visita</option>
                        </select>
                      )}
                    </td>
                    <td>
                      {passEdit === u.email ? (
                        <span className="cc-pass-edit">
                          <input className="cc-input cc-input-mini" type="text" value={passVal} onChange={e => setPassVal(e.target.value)} placeholder="Nueva contraseña"></input>
                          <button className="cc-btn-ghost" onClick={() => asignarPass(u.email)}>OK</button>
                        </span>
                      ) : (
                        <span className="cc-pass-cell">
                          <span className="cc-pass-estado">{u.pass ? '••••••••' : 'Sin contraseña'}</span>
                          {esAdmin && (
                            <button className="cc-btn-ghost" onClick={() => { setPassEdit(u.email); setPassVal(''); }}>
                              {u.pass ? 'Cambiar' : 'Asignar'}
                            </button>
                          )}
                        </span>
                      )}
                    </td>
                    <td>{u.ultimoAcceso}</td>
                    <td>
                      <span className="cc-pass-cell">
                        {esAdmin && !principal && (
                          <button className="cc-btn-ghost" onClick={() => setAccesosEdit(accesosEdit === u.email ? null : u.email)}>
                            {Array.isArray(u.paginas) ? u.paginas.length + ' páginas' : 'Acceso total'}
                          </button>
                        )}
                        {principal && <span className="cc-pass-estado">Acceso total</span>}
                        {esAdmin && !principal && u.email !== sesion && (
                          <button className="cc-btn-ghost cc-btn-peligro" onClick={() => eliminar(u.email)} title="Eliminar usuario">
                            <Icon name="basura" size={14}></Icon>
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {accesosEdit && (() => {
        const u = usuarios.find(x => x.email === accesosEdit);
        if (!u) return null;
        const todas = [...window.CC_NAV, ...window.CC_NAV_ADMIN];
        const activas = Array.isArray(u.paginas) ? u.paginas : todas.map(n => n.id);
        return (
          <Card className="cc-pad">
            <div className="cc-chart-head">
              <h3 className="cc-card-title">Accesos de {u.nombre}</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="cc-btn-ghost" onClick={() => todasLasPaginas(u.email)}>Dar acceso total</button>
                <button className="cc-btn-ghost" onClick={() => setAccesosEdit(null)}>Cerrar</button>
              </div>
            </div>
            <p className="cc-card-note">Marca las páginas que esta cuenta puede ver. Los cambios aplican al instante.</p>
            <div className="cc-accesos-grid">
              {todas.map(n => (
                <label key={n.id} className="cc-acceso">
                  <input type="checkbox" checked={activas.includes(n.id)} onChange={() => togglePagina(u.email, n.id)}></input>
                  <Icon name={n.icon} size={15}></Icon>
                  <span>{n.label}</span>
                </label>
              ))}
            </div>
          </Card>
        );
      })()}

      <Card className="cc-pad cc-aviso">
        <Icon name="candado" size={18}></Icon>
        <p><strong>Administrador</strong> gestiona usuarios y datos · <strong>Editor</strong> crea informes y carga archivos · <strong>Visita</strong> solo lectura. La cuenta principal no puede ser eliminada ni degradada.</p>
      </Card>
    </div>
  );
}

// ---------------- Login ----------------
function PageLogin({ onLogin }) {
  const [email, setEmail] = p4State('datos@colocolofc.cl');
  const [pass, setPass] = p4State('');
  const [error, setError] = p4State('');

  const entrar = e => {
    e.preventDefault();
    const lista = ccLeerUsuarios();
    const u = lista.find(x => x.email === email.trim().toLowerCase());
    if (!u) { setError('Cuenta no encontrada. Pide acceso al administrador (datos@colocolofc.cl).'); return; }
    if (u.pass && u.pass !== pass) { setError('Contraseña incorrecta.'); return; }
    ccGuardarUsuarios(lista.map(x => x.email === u.email ? Object.assign({}, x, { ultimoAcceso: 'Hoy' }) : x));
    onLogin(u.email);
  };

  return (
    <div className="cc-login">
      <div className="cc-login-card">
        <div className="cc-login-escudo">
          <CCTeamLogo team="Colo-Colo" size={88}></CCTeamLogo>
        </div>
        <h1>ColoColo<br></br>Football Center</h1>
        <p className="cc-login-sub">Plataforma de análisis del Cacique · Temporada 2026</p>
        <form onSubmit={entrar}>
          <label className="cc-select-wrap">
            <span className="cc-select-label">Correo institucional</span>
            <input className="cc-input" type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}></input>
          </label>
          <label className="cc-select-wrap">
            <span className="cc-select-label">Contraseña</span>
            <input className="cc-input" type="password" value={pass} onChange={e => { setPass(e.target.value); setError(''); }} placeholder="Si no tienes una asignada, deja vacío"></input>
          </label>
          {error && <p className="cc-login-error">{error}</p>}
          <button type="submit" className="cc-btn-primary">Ingresar</button>
        </form>
        <p className="cc-login-foot">Cuenta principal: datos@colocolofc.cl · Los roles se administran en Gestión de Usuarios</p>
      </div>
    </div>
  );
}

Object.assign(window, { PageScouting, PageCampograma, PageConfig, PageUsuarios, PageLogin, EstadoLogos, SubirShotmaps, ccLeerUsuarios, ccRolDe, ccPaginasDe });
