// ============================================================
// ColoColo Football Center — Páginas 6
// Gestión de Jugadores, Captación (mapa Chile), Mercado:
// Jugadores ofrecidos y Jugadores para ofrecer.
// ============================================================
/* global React, CC_DATA, CC_GESTION, Icon, Card, PageHeader, StatCard, Select, SegTabs, DataTable, CCTeamLogo */

const { useState: p6State, useEffect: p6Effect, useMemo: p6Memo, useRef: p6Ref } = React;

function p6USD(v) {
 if (!v) return '—';
 if (v >= 1e6) return 'US$' + (v / 1e6).toFixed(1).replace('.0', '') + 'M';
 if (v >= 1e3) return 'US$' + Math.round(v / 1e3) + 'K';
 return 'US$' + v;
}
function p6Edad(iso) {
 const n = new Date(iso); const h = new Date();
 let e = h.getFullYear() - n.getFullYear();
 if (h.getMonth() < n.getMonth() || (h.getMonth() === n.getMonth() && h.getDate() < n.getDate())) e--;
 return e;
}
function p6ContratoMeta(iso) {
 const fin = new Date(iso + 'T12:00:00');
 const hoy = new Date();
 const meses = (fin.getFullYear() - hoy.getFullYear()) * 12 + (fin.getMonth() - hoy.getMonth());
 return { fin, meses, expiraPronto: meses <= 7, anio: fin.getFullYear() };
}

// =================== Gestión de Jugadores ===================
const CC_PLANTEL_KEY = 'cc_plantel_v1';
function ccLoadPlantel() {
 try { const v = JSON.parse(localStorage.getItem(CC_PLANTEL_KEY)); if (Array.isArray(v) && v.length) return v; } catch (e) {}
 return JSON.parse(JSON.stringify(CC_GESTION.plantel || []));
}
// Normaliza el representante a objeto { agencia, contacto, email, telefono } o null (sin representante)
function ccRepNorm(rep) {
 if (rep == null || rep === '') return null;
 if (typeof rep === 'string') {
  if (rep.toLowerCase() === 'sin representante') return { sin: true };
  return { agencia: rep, contacto: '', email: '', telefono: '' };
 }
 return rep;
}

function PageGestion({ usuario }) {
 const rol = (() => { try { return window.ccRolDe ? window.ccRolDe(usuario) : null; } catch (e) { return null; } })();
 const puedeEditar = rol === 'Administrador' || rol === 'Editor';

 const [estado, setEstado] = p6State('Todos');
 const [pos, setPos] = p6State('Todas');
 const [plantel, setPlantel] = p6State(() => ccLoadPlantel());
 const [editIdx, setEditIdx] = p6State(null);  // índice (en plantel) en edición, o 'nuevo'
 const [repIdx, setRepIdx] = p6State(null);   // índice cuyo popup de representante está abierto

 p6Effect(() => { try { localStorage.setItem(CC_PLANTEL_KEY, JSON.stringify(plantel)); } catch (e) {} }, [plantel]);

 // Enlace Gestión ↔ Wyscout: además del nombre exacto, casa por apellido +
 // inicial del nombre (y desempata por edad) — así los jugadores agregados a
 // mano se enlazan solos cada vez que se vuelve a subir el archivo de
 // jugadores de Wyscout, y el plantel se mantiene toda la temporada.
 const statsCC = p6Memo(() => CC_DATA.jugadores.filter(j => j.equipo === 'Colo-Colo'), []);
 const buscarStats = p6Memo(() => {
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  const clave = n => {
   const parts = norm(n).split(' ').filter(Boolean);
   if (!parts.length) return null;
   return { apellido: parts[parts.length - 1], inicial: (parts[0] || '')[0] || '' };
  };
  const porNombre = {};
  statsCC.forEach(j => { porNombre[norm(j.nombre)] = j; });
  return (p) => {
   const exacto = porNombre[norm(p.nombre)];
   if (exacto) return exacto;
   const k = clave(p.nombre);
   if (!k) return null;
   const cands = statsCC.filter(j => {
    const kj = clave(j.nombre);
    return kj && kj.apellido === k.apellido && (!k.inicial || !kj.inicial || kj.inicial === k.inicial);
   });
   if (cands.length === 1) return cands[0];
   if (cands.length > 1) {
    const edadP = p.nacimiento ? p6Edad(p.nacimiento) : null;
    if (edadP != null) {
     const orden = cands.slice().sort((a, b) => Math.abs((a.edad || 99) - edadP) - Math.abs((b.edad || 99) - edadP));
     if (Math.abs((orden[0].edad || 99) - edadP) <= 2) return orden[0];
    }
   }
   return null;
  };
 }, [statsCC]);

 // filas enriquecidas (conservan idx original en plantel)
 const filas = p6Memo(() => plantel.map((p, idx) => {
  const s = buscarStats(p) || {};
  const cm = p6ContratoMeta(p.contrato);
  return {
   ...p, idx,
   grupo: s.grupo || '—', posicion: p.posicionStat || p.posicion || s.posicion || '—',
   edad: p.nacimiento ? p6Edad(p.nacimiento) : (s.edad || '—'),
   pj: s.pj || 0, min: s.min || 0, cm
  };
 }).sort((a, b) => (a.dorsal || 99) - (b.dorsal || 99)), [plantel, buscarStats]);

 const grupos = ['Todas', 'Arquero', 'Defensa', 'Mediocampista', 'Extremo', 'Delantero'];
 const visibles = filas.filter(f =>
  (estado === 'Todos' || f.estado === estado) &&
  (pos === 'Todas' || f.grupo === pos)
 );

 const kpi = {
  total: filas.length,
  lesionados: filas.filter(f => f.estado === 'Lesionado').length,
  cedidos: filas.filter(f => f.cesion && f.cesion.direccion === 'sale').length,
  extranjeros: filas.filter(f => f.extranjero).length,
  porVencer: filas.filter(f => f.cm.expiraPronto).length
 };
 const ESTADO_CLS = { 'Disponible': 'ok', 'Lesionado': 'les', 'Cedido': 'ces' };

 // --- mutaciones ---
 const guardarJugador = (idx, datos) => {
  setPlantel(prev => idx === 'nuevo' ? [...prev, datos] : prev.map((p, i) => i === idx ? datos : p));
  setEditIdx(null);
 };
 const borrarJugador = idx => { setPlantel(prev => prev.filter((_, i) => i !== idx)); setEditIdx(null); };
 const guardarRep = (idx, rep) => { setPlantel(prev => prev.map((p, i) => i === idx ? { ...p, representante: rep } : p)); };

 // --- ordenamiento por columna (clic en el encabezado) ---
 const [orden, setOrden] = p6State({ key: 'dorsal', dir: 1 });
 const clickOrden = key => setOrden(prev => prev.key === key ? { key: key, dir: -prev.dir } : { key: key, dir: 1 });
 const ORD_VAL = {
  dorsal: f => f.dorsal || 999,
  nombre: f => (f.nombre || '').toLowerCase(),
  posicion: f => (f.posicion || '').toString(),
  edad: f => (typeof f.edad === 'number' ? f.edad : 999),
  pj: f => f.pj || 0,
  min: f => f.min || 0,
  contrato: f => (f.cm && f.cm.fin && !isNaN(f.cm.fin)) ? f.cm.fin.getTime() : 9e15,
  estado: f => f.estado || '',
  valor: f => Number(f.valor) || Number(f.clausula) || 0,
  representante: f => { const r = ccRepNorm(f.representante); return r && !r.sin ? (r.agencia || r.contacto || 'zz').toLowerCase() : 'zzz'; }
 };
 const visiblesOrd = [...visibles].sort((a, b) => {
  const g = ORD_VAL[orden.key] || ORD_VAL.dorsal;
  const va = g(a), vb = g(b);
  return (va < vb ? -1 : va > vb ? 1 : 0) * orden.dir;
 });
 const Th = ({ k, className, children }) => (
  <th className={(className ? className + ' ' : '') + 'cc-th-sort'} onClick={() => clickOrden(k)} title="Ordenar">
   <span className="cc-th-sort-in">{children}{orden.key === k ? <span className="cc-th-arrow">{orden.dir === 1 ? '\u25B2' : '\u25BC'}</span> : null}</span>
  </th>
 );

 return (
  <div className="cc-page">
   <PageHeader icon="usuarios" title="Gestión de Jugadores" subtitle="Plantel 2026 · contratos, lesiones, cesiones, representantes y valor"></PageHeader>

   <div className="cc-grid-5">
    <StatCard label="En plantel" value={kpi.total} tone="accent"></StatCard>
    <StatCard label="Lesionados" value={kpi.lesionados} tone="d"></StatCard>
    <StatCard label="Cedidos fuera" value={kpi.cedidos}></StatCard>
    <StatCard label="Extranjeros" value={kpi.extranjeros}></StatCard>
    <StatCard label="Contrato por vencer" value={kpi.porVencer} tone={kpi.porVencer ? 'd' : 'v'}></StatCard>
   </div>

   <Card className="cc-pad">
    <div className="cc-filtros-row">
     <div className="cc-filtro">
      <label>Estado</label>
      <Select value={estado} onChange={setEstado} options={['Todos', 'Disponible', 'Lesionado', 'Cedido']}></Select>
     </div>
     <div className="cc-filtro">
      <label>Posición</label>
      <Select value={pos} onChange={setPos} options={grupos}></Select>
     </div>
     <span className="cc-filtros-count">{visibles.length} jugadores</span>
     <button className="cc-btn-mini cc-btn-ghost" onClick={() => ccDescargarCSV('plantel-colocolo-2026',
      ['Dorsal', 'Jugador', 'Posición', 'Edad', 'PJ', 'Min', 'Contrato', 'Estado', 'Valor US$', 'Cláusula US$', 'Representante'],
      visiblesOrd.map(f => { const r = ccRepNorm(f.representante); return [f.dorsal || '', f.nombre, f.posicion, f.edad, f.pj, f.min, f.cm.anio, f.estado, f.valor || '', f.clausula || '', r && !r.sin ? (r.agencia || r.contacto || '') : 'Sin representante']; }))}>
      Exportar CSV
     </button>
     {puedeEditar && (
      <button className="cc-btn-primario cc-gestion-add" onClick={() => setEditIdx('nuevo')}>
       <Icon name="mas" size={15}></Icon> Agregar jugador
      </button>
     )}
    </div>
    {!puedeEditar && <p className="cc-card-note">Tu rol ({rol || 'Visita'}) es de solo lectura. La edición está disponible para roles Editor y Administrador.</p>}
   </Card>

   <Card>
    <div className="cc-gestion-tabla">
     <table className="cc-tabla">
      <thead>
       <tr>
        <Th k="dorsal" className="cc-c">#</Th>
        <Th k="nombre">Jugador</Th>
        <Th k="posicion">Pos.</Th>
        <Th k="edad" className="cc-c">Edad</Th>
        <Th k="pj" className="cc-c">PJ</Th>
        <Th k="min" className="cc-c">Min</Th>
        <Th k="contrato">Contrato</Th>
        <Th k="estado">Estado</Th>
        <Th k="valor" className="cc-r">Valor / Cláusula</Th>
        <Th k="representante">Representante</Th>
        {puedeEditar && <th className="cc-c">Editar</th>}
       </tr>
      </thead>
      <tbody>
       {visiblesOrd.map(f => {
        const rep = ccRepNorm(f.representante);
        return (
         <tr key={f.idx}>
          <td className="cc-c cc-dorsal-cell">{f.dorsal || '–'}</td>
          <td>
           <span className="cc-jug-cell">
            <CCTeamLogo team="Colo-Colo" size={20}></CCTeamLogo>
            <span className="cc-jug-nom">{f.nombre}</span>
            {f.extranjero && <span className="cc-ext-tag" title={f.nac}>EXT</span>}
           </span>
          </td>
          <td><span className="cc-pos-mini">{f.posicion}</span></td>
          <td className="cc-c">{f.edad}</td>
          <td className="cc-c">{f.pj}</td>
          <td className="cc-c">{f.min}'</td>
          <td>
           <span className={'cc-contrato' + (f.cm.expiraPronto ? ' alerta' : '')}>
            {f.cm.expiraPronto && <Icon name="alerta" size={14}></Icon>}
            {f.cm.anio}
            {f.cm.expiraPronto && <span className="cc-contrato-aviso">expira pronto</span>}
           </span>
          </td>
          <td>
           <span className={'cc-estado-badge cc-estado-' + (ESTADO_CLS[f.estado] || 'ok')}>{f.estado}</span>
            {f.situacion ? <div className="cc-estado-det">Fin de temporada: {f.situacion}</div> : null}
           {(() => {
            try {
             const s = window.CC_DT ? CC_DT.estadoDe(f.nombre) : null;
             if (!s) return null;
             return (
              <React.Fragment>
               {s.suspendido && <div className="cc-estado-det">Suspendido · Dirección Técnica</div>}
               {s.mercado && <div className="cc-estado-det">En mercado: {s.mercado}</div>}
              </React.Fragment>
             );
            } catch (e) { return null; }
           })()}
           {f.estado === 'Lesionado' && f.lesion && <div className="cc-estado-det">{f.lesion.tipo} · vuelve {new Date(f.lesion.retorno + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</div>}
           {f.cesion && <div className="cc-estado-det">{f.cesion.tipo} {f.cesion.club} · hasta {new Date(f.cesion.hasta + 'T12:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</div>}
          </td>
          <td className="cc-r">
           {f.valor ? <strong className="cc-valor">{p6USD(f.valor)}</strong> : <span className="cc-falta">Sin valuación</span>}
           {f.clausula ? <div className="cc-estado-det">Cláusula {p6USD(f.clausula)}</div> : null}
          </td>
          <td>
           <button className="cc-repr-btn" onClick={() => setRepIdx(f.idx)}>
            {rep && rep.sin ? <span className="cc-falta">Sin representante</span>
             : rep ? <span className="cc-repr-nom"><Icon name="usuarios" size={13}></Icon> {rep.agencia || rep.contacto || 'Ver'}</span>
             : <span className="cc-falta">Agregar</span>}
           </button>
          </td>
          {puedeEditar && (
           <td className="cc-c">
            <button className="cc-escuela-edit" title="Editar jugador" onClick={() => setEditIdx(f.idx)}><Icon name="lapiz" size={14}></Icon></button>
           </td>
          )}
         </tr>
        );
       })}
      </tbody>
     </table>
    </div>
   </Card>

   {editIdx !== null && (
    <JugadorEditor
     jugador={editIdx === 'nuevo' ? null : plantel[editIdx]}
     puedeEditar={puedeEditar}
     usuario={usuario}
     onSave={datos => guardarJugador(editIdx, datos)}
     onCancel={() => setEditIdx(null)}
     onDelete={editIdx === 'nuevo' ? null : () => borrarJugador(editIdx)}></JugadorEditor>
   )}

   {repIdx !== null && (
    <RepPopup
     rep={ccRepNorm(plantel[repIdx] && plantel[repIdx].representante)}
     jugador={plantel[repIdx] ? plantel[repIdx].nombre : ''}
     puedeEditar={puedeEditar}
     onSave={rep => { guardarRep(repIdx, rep); setRepIdx(null); }}
     onClose={() => setRepIdx(null)}></RepPopup>
   )}
  </div>
 );
}

// --------- Timeline de notas por jugador (quién dijo qué y cuándo) ---------
function NotasJugador({ jugador, usuario }) {
 const KEY = 'cc_plantel_notas_v1';
 const [todas, setTodas] = p6State(() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } });
 const [txt, setTxt] = p6State('');
 const lista = todas[jugador] || [];
 const guardar = next => { setTodas(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch (e) {} };
 const agregar = () => {
  const t = txt.trim(); if (!t) return;
  guardar({ ...todas, [jugador]: [...lista, { autor: usuario || '—', texto: t, fecha: new Date().toISOString() }] });
  setTxt('');
 };
 const borrar = i => guardar({ ...todas, [jugador]: lista.filter((_, k) => k !== i) });
 return (
  <div className="cc-esc-block cc-jug-notas">
   <div className="cc-esc-block-head">
    <span className="cc-esc-sub"><Icon name="reporte" size={13}></Icon> Historial de notas</span>
    <span className="cc-scout-nota-fecha">{lista.length ? lista.length + (lista.length === 1 ? ' nota' : ' notas') : 'Sin notas'}</span>
   </div>
   {lista.map((n, i) => (
    <div key={i} className="cc-scout-nota">
     <div className="cc-scout-nota-head">
      <span className="cc-scout-nota-autor">{n.autor}</span>
      <span className="cc-scout-nota-fecha">{(n.fecha || '').slice(0, 10)}</span>
      {n.autor === usuario && <button className="cc-escuela-edit cc-btn-danger" style={{ marginLeft: 'auto' }} title="Borrar mi nota" onClick={() => borrar(i)}><Icon name="basura" size={12}></Icon></button>}
     </div>
     <p className="cc-scout-nota-txt">{n.texto}</p>
    </div>
   ))}
   <div className="cc-scout-nota-form">
    <textarea className="cc-notas-input" rows={2} placeholder={'Agregar nota como ' + (usuario || '')} value={txt} onChange={e => setTxt(e.target.value)}></textarea>
    <button className="cc-btn-mini" onClick={agregar} disabled={!txt.trim()}><Icon name="mas" size={13}></Icon> Agregar nota</button>
   </div>
  </div>
 );
}

// --------- Editor de jugador (modal) ---------
function JugadorEditor({ jugador, puedeEditar, usuario, onSave, onCancel, onDelete }) {
 const [f, setF] = p6State(() => jugador ? { ...jugador } : {
  nombre: '', dorsal: '', posicion: '', nac: 'Chile', extranjero: false,
  contrato: '2026-12-31', estado: 'Disponible', valor: '', clausula: '', nacimiento: '', representante: null
 });
 const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
 const ro = !puedeEditar;
 const inp = (k, label, type) => (
  <label className="cc-esc-campo">
   <span>{label}</span>
   <input className="cc-input" type={type || 'text'} disabled={ro} value={f[k] == null ? '' : f[k]}
    onChange={e => set(k, type === 'number' ? e.target.value.replace(/[^0-9]/g, '') : e.target.value)}></input>
  </label>
 );
 const guardar = () => onSave({
  ...f,
  dorsal: Number(f.dorsal) || null,
  valor: Number(f.valor) || null,
  clausula: Number(f.clausula) || null,
  extranjero: (f.nac || '').trim().toLowerCase() !== 'chile' && !!(f.nac || '').trim()
 });

 return (
  <div className="cc-modal-overlay" onClick={onCancel}>
   <div className="cc-modal" onClick={e => e.stopPropagation()}>
    <div className="cc-modal-head">
     <h3>{jugador ? 'Editar jugador' : 'Agregar jugador'}</h3>
     <button className="cc-modal-x" onClick={onCancel}><Icon name="cerrar" size={18}></Icon></button>
    </div>
    <div className="cc-esc-grid cc-modal-grid">
     {inp('nombre', 'Nombre')}
     {inp('dorsal', 'Dorsal', 'number')}
     {inp('posicion', 'Posición (ej. RCMF)')}
     {inp('nac', 'Nacionalidad')}
     <label className="cc-esc-campo">
      <span>Estado</span>
      <Select value={f.estado || 'Disponible'} onChange={v => set('estado', v)} options={['Disponible', 'Lesionado', 'Cedido']}></Select>
     </label>
     {inp('contrato', 'Fin de contrato (AAAA-MM-DD)')}
     {inp('nacimiento', 'Nacimiento (AAAA-MM-DD)')}
     <label className="cc-esc-campo"><span>Situación fin de temporada</span>
      <Select value={f.situacion || ''} onChange={v => set('situacion', v)} options={[{ value: '', label: '— (sigue en el club)' }, 'Continúa', 'Libre', 'Préstamo', 'Transferencia', 'Fin de cesión', 'Retiro']}></Select>
     </label>
     {inp('valor', 'Valor de mercado (US$)', 'number')}
     {inp('clausula', 'Cláusula de rescisión (US$)', 'number')}
    </div>
    {jugador && <NotasJugador jugador={jugador.nombre} usuario={usuario}></NotasJugador>}
    {puedeEditar && (
     <div className="cc-esc-btns">
      <button className="cc-btn-mini" onClick={guardar}><Icon name="check" size={14}></Icon> Guardar</button>
      <button className="cc-btn-mini cc-btn-ghost" onClick={onCancel}>Cancelar</button>
      {onDelete && <button className="cc-btn-mini cc-btn-danger" onClick={onDelete}><Icon name="basura" size={14}></Icon> Quitar del plantel</button>}
     </div>
    )}
   </div>
  </div>
 );
}

// --------- Popup de representante (modal) ---------
function RepPopup({ rep, jugador, puedeEditar, onSave, onClose }) {
 const inicial = rep && !rep.sin ? rep : { agencia: '', contacto: '', email: '', telefono: '' };
 const [f, setF] = p6State({ ...inicial });
 const [editando, setEditando] = p6State(!rep || (!rep.sin && !rep.agencia && !rep.contacto));
 const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
 const inp = (k, label, type) => (
  <label className="cc-esc-campo">
   <span>{label}</span>
   <input className="cc-input" type={type || 'text'} value={f[k] || ''} onChange={e => set(k, e.target.value)}></input>
  </label>
 );
 const sinRep = rep && rep.sin;

 return (
  <div className="cc-modal-overlay" onClick={onClose}>
   <div className="cc-modal cc-modal-sm" onClick={e => e.stopPropagation()}>
    <div className="cc-modal-head">
     <h3>Representante · {jugador}</h3>
     <button className="cc-modal-x" onClick={onClose}><Icon name="cerrar" size={18}></Icon></button>
    </div>

    {!editando && !sinRep && rep && (
     <div className="cc-rep-info">
      <div className="cc-rep-row"><span>Agencia</span><strong>{rep.agencia || '—'}</strong></div>
      <div className="cc-rep-row"><span>Contacto</span><strong>{rep.contacto || <em className="cc-falta">No registrado</em>}</strong></div>
      <div className="cc-rep-row"><span><Icon name="mail" size={13}></Icon> Email</span><strong>{rep.email || <em className="cc-falta">Falta agregar</em>}</strong></div>
      <div className="cc-rep-row"><span><Icon name="telefono" size={13}></Icon> Teléfono</span><strong>{rep.telefono || <em className="cc-falta">Falta agregar</em>}</strong></div>
     </div>
    )}
    {!editando && sinRep && <p className="cc-rep-nota">Jugador <strong>sin representante</strong> registrado.</p>}

    {editando && (
     <div className="cc-esc-grid cc-modal-grid">
      {inp('agencia', 'Nombre de la agencia')}
      {inp('contacto', 'Contacto (persona)')}
      {inp('email', 'Email', 'email')}
      {inp('telefono', 'Teléfono', 'tel')}
     </div>
    )}

    {puedeEditar && (
     <div className="cc-esc-btns">
      {editando ? (
       <React.Fragment>
        <button className="cc-btn-mini" onClick={() => onSave({ ...f })}><Icon name="check" size={14}></Icon> Guardar</button>
        <button className="cc-btn-mini cc-btn-ghost" onClick={onClose}>Cancelar</button>
       </React.Fragment>
      ) : (
       <React.Fragment>
        <button className="cc-btn-mini" onClick={() => setEditando(true)}><Icon name="lapiz" size={14}></Icon> {sinRep ? 'Agregar representante' : 'Editar'}</button>
        {!sinRep && <button className="cc-btn-mini cc-btn-ghost" onClick={() => onSave('sin representante')}>Marcar sin representante</button>}
       </React.Fragment>
      )}
     </div>
    )}
   </div>
  </div>
 );
}

// =================== Captación (mapa de Chile) ===================
const CC_NOMBRE_REG = {
 AP: 'Arica y Parinacota', TA: 'Tarapacá', AN: 'Antofagasta', AT: 'Atacama', CO: 'Coquimbo',
 VA: 'Valparaíso', RM: 'Metropolitana', LI: "O'Higgins", ML: 'Maule', NB: 'Ñuble',
 BI: 'Biobío', AR: 'La Araucanía', LR: 'Los Ríos', LL: 'Los Lagos', AI: 'Aysén', MA: 'Magallanes'
};
const CC_ESC_KEY = 'cc_escuelas_v1';
function ccLoadEscuelas() {
 try { const v = JSON.parse(localStorage.getItem(CC_ESC_KEY)); if (v && typeof v === 'object') return v; } catch (e) {}
 return JSON.parse(JSON.stringify(CC_GESTION.escuelas || {}));
}

function PageCaptacion({ usuario }) {
 const ref = p6Ref(null);
 const rol = (() => { try { return window.ccRolDe ? window.ccRolDe(usuario) : null; } catch (e) { return null; } })();
 const puedeEditar = rol === 'Administrador';
 const [escuelas, setEscuelas] = p6State(() => ccLoadEscuelas());
 const [sel, setSel] = p6State(null);   // sigla seleccionada
 const [editIdx, setEditIdx] = p6State(null);
 const [nuevaRegion, setNuevaRegion] = p6State('RM');
 const [labels, setLabels] = p6State([]); // etiquetas de región sobre el mapa

 p6Effect(() => {
  if (!puedeEditar) return;
  try { localStorage.setItem(CC_ESC_KEY, JSON.stringify(escuelas)); } catch (e) {}
 }, [escuelas, puedeEditar]);

 const conEscuela = Object.keys(escuelas).filter(k => (escuelas[k] || []).length);

 const totales = p6Memo(() => {
  let nEsc = 0, nNin = 0;
  Object.values(escuelas).forEach(arr => { nEsc += arr.length; arr.forEach(e => { nNin += Number(e.ninos) || 0; }); });
  return { regiones: conEscuela.length, escuelas: nEsc, ninos: nNin };
 }, [escuelas]);

 // Inyectar el SVG del mapa una vez, rotado 90° para quedar vertical
 p6Effect(() => {
  if (!ref.current || !window.CC_CHILE_SVG) return;
  ref.current.innerHTML = window.CC_CHILE_SVG;
  const svg = ref.current.querySelector('svg');
  if (svg) {
   svg.removeAttribute('width'); svg.removeAttribute('height');
   svg.setAttribute('viewBox', '0 0 280 1640');     // alto y angosto
   svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
   svg.style.width = 'auto'; svg.style.height = '100%';
   const g = svg.querySelector('#map_chile');
   if (g) g.setAttribute('transform', 'translate(280,0) rotate(90)'); // gira 90° (norte arriba)
  }
  ref.current.querySelectorAll('#map_chile_Regiones path').forEach(p => {
   const sig = p.getAttribute('data-sigla');
   p.classList.add('cc-region');
   p.style.cursor = 'pointer';
   p.addEventListener('click', () => { setSel(sig); setEditIdx(null); });
  });
  // Calcular posición vertical de cada región para las etiquetas
  const calc = () => {
   if (!ref.current) return;
   const base = ref.current.getBoundingClientRect();
   const acc = {};
   ref.current.querySelectorAll('#map_chile_Regiones path').forEach(p => {
    const sig = p.getAttribute('data-sigla');
    if (!sig) return;
    const r = p.getBoundingClientRect();
    if (!acc[sig]) acc[sig] = { top: r.top, bottom: r.bottom };
    else { acc[sig].top = Math.min(acc[sig].top, r.top); acc[sig].bottom = Math.max(acc[sig].bottom, r.bottom); }
   });
   const arr = Object.keys(acc).map(sig => ({
    sig, name: CC_NOMBRE_REG[sig] || sig,
    y: (acc[sig].top + acc[sig].bottom) / 2 - base.top
   })).sort((a, b) => a.y - b.y);
   // Anti-solapamiento: empuja hacia abajo etiquetas demasiado juntas
   const MIN = 17;
   for (let i = 1; i < arr.length; i++) {
    if (arr[i].y - arr[i - 1].y < MIN) arr[i].y = arr[i - 1].y + MIN;
   }
   // Re-centra el bloque si se desbordó por debajo
   const overflow = arr.length ? arr[arr.length - 1].y - (base.height - 6) : 0;
   if (overflow > 0) arr.forEach(l => { l.y = Math.max(6, l.y - overflow); });
   setLabels(arr);
  };
  const raf = requestAnimationFrame(calc);
  const t1 = setTimeout(calc, 200);
  const t2 = setTimeout(calc, 600);
  window.addEventListener('resize', calc);
  return () => { cancelAnimationFrame(raf); clearTimeout(t1); clearTimeout(t2); window.removeEventListener('resize', calc); };
 }, []);

 // Heatmap: tono según cantidad de escuelas por región + selección
 p6Effect(() => {
  if (!ref.current) return;
  const maxN = Math.max(1, ...conEscuela.map(s => (escuelas[s] || []).length));
  ref.current.querySelectorAll('#map_chile_Regiones path').forEach(p => {
   const sig = p.getAttribute('data-sigla');
   const n = (escuelas[sig] || []).length;
   p.classList.toggle('cc-region-activa', n > 0);
   p.classList.toggle('cc-region-sel', sig === sel);
   if (n > 0) {
    const r = n / maxN;
    p.style.fill = 'color-mix(in srgb, var(--heat-high) ' + Math.round(r * 100) + '%, var(--heat-low))';
   } else {
    p.style.fill = '';
   }
  });
 }, [sel, escuelas]);

 const maxEsc = Math.max(1, ...conEscuela.map(s => (escuelas[s] || []).length));

 // --- mutaciones (solo admin) ---
 const patchEscuela = (region, idx, patch) => {
  if (!puedeEditar) return;
  setEscuelas(prev => ({
   ...prev, [region]: (prev[region] || []).map((e, i) => i === idx ? { ...e, ...patch } : e)
  }));
 };
 const addEscuela = region => {
  if (!puedeEditar) return;
  setEscuelas(prev => ({ ...prev, [region]: [...(prev[region] || []), { ciudad: 'Nueva escuela', encargado: '', categorias: '', ninos: 0, email: '', telefono: '', destacados: [], notas: '' }] }));
  setSel(region);
  setEditIdx((escuelas[region] || []).length);
 };
 const delEscuela = (region, idx) => {
  if (!puedeEditar) return;
  setEscuelas(prev => {
   const arr = (prev[region] || []).filter((_, i) => i !== idx);
   const next = { ...prev };
   if (arr.length) next[region] = arr; else delete next[region];
   return next;
  });
  setEditIdx(null);
 };

 const listaSel = sel ? (escuelas[sel] || []) : null;

 return (
  <div className="cc-page">
   <PageHeader icon="campograma" title="Captación" subtitle="Red nacional de escuelas de fútbol Colo-Colo · temporada 2026"></PageHeader>

   <div className="cc-grid-3">
    <StatCard label="Regiones con escuela" value={totales.regiones} tone="accent"></StatCard>
    <StatCard label="Escuelas oficiales" value={totales.escuelas}></StatCard>
   <StatCard label="Niños y niñas" value={totales.ninos.toLocaleString('es-CL')}></StatCard>
   </div>

   {!puedeEditar && <p className="cc-card-note">Tu rol ({rol || 'Visita'}) es de solo lectura en Captación.</p>}

   {puedeEditar && (
    <Card className="cc-pad cc-capt-admin">
     <span className="cc-capt-admin-label"><Icon name="mas" size={15}></Icon> Agregar escuela en</span>
     <Select value={nuevaRegion} onChange={setNuevaRegion} options={Object.keys(CC_NOMBRE_REG).map(s => ({ value: s, label: CC_NOMBRE_REG[s] }))}></Select>
     <button className="cc-btn-primario" onClick={() => addEscuela(nuevaRegion)}><Icon name="mas" size={15}></Icon> Agregar</button>
    </Card>
   )}

   <div className="cc-captacion">
    <Card className="cc-pad cc-mapa-card">
     <h3 className="cc-card-title">Mapa de cobertura</h3>
     <p className="cc-card-note">Tono según la cantidad de escuelas por región (más oscuro = más escuelas). Haz clic en una región para ver su detalle{puedeEditar ? ' o editarla' : ''}.</p>
     <div className="cc-mapa-wrap">
      <div className="cc-mapa-chile" ref={ref}></div>
      <div className="cc-mapa-labels">
       {labels.map(l => (
        <button key={l.sig} type="button"
         className={'cc-mapa-label' + (conEscuela.includes(l.sig) ? ' on' : '') + (l.sig === sel ? ' sel' : '')}
         style={{ top: l.y + 'px' }}
         onClick={() => { setSel(l.sig); setEditIdx(null); }}>
         <span className="cc-mapa-label-dot"></span>{l.name}{conEscuela.includes(l.sig) ? <span className="cc-mapa-label-n">{(escuelas[l.sig] || []).length}</span> : null}
        </button>
       ))}
      </div>
     </div>
     <div className="cc-heat-legend">
      <span className="cc-heat-legend-label">Escuelas por región</span>
      <div className="cc-heat-scale">
       <span className="cc-heat-swatch s0"></span>
       <span className="cc-heat-swatch s1"></span>
       <span className="cc-heat-swatch s2"></span>
       <span className="cc-heat-swatch s3"></span>
       <span className="cc-heat-swatch s4"></span>
      </div>
      <span className="cc-heat-ends">0<span>{maxEsc}+</span></span>
     </div>
    </Card>

    <Card className="cc-pad cc-escuelas-panel">
     {!sel && (
      <div className="cc-escuelas-vacio">
       <Icon name="campograma" size={32}></Icon>
       <p>Selecciona una región en el mapa para ver sus escuelas, encargados y categorías.</p>
       <div className="cc-region-chips">
        {conEscuela.map(s => (
         <button key={s} className="cc-region-chip" onClick={() => setSel(s)}>{CC_NOMBRE_REG[s] || s}</button>
        ))}
       </div>
      </div>
     )}
     {sel && (
      <React.Fragment>
       <div className="cc-escuelas-head">
        <h3 className="cc-card-title">{CC_NOMBRE_REG[sel] || sel}</h3>
        <div className="cc-escuelas-head-acc">
         {puedeEditar && <button className="cc-btn-mini" onClick={() => addEscuela(sel)}><Icon name="mas" size={14}></Icon> Escuela</button>}
         <button className="cc-btn-mini cc-btn-ghost" onClick={() => { setSel(null); setEditIdx(null); }}>← Todas</button>
        </div>
       </div>
       <div className="cc-escuelas-lista">
        {(listaSel || []).length === 0 && <p className="cc-empty">Sin escuelas en esta región.</p>}
        {(listaSel || []).map((e, i) => (
         editIdx === i ? (
          <EscuelaEditor key={i} escuela={e}
           onSave={patch => { patchEscuela(sel, i, patch); setEditIdx(null); }}
           onCancel={() => setEditIdx(null)}
           onDelete={() => delEscuela(sel, i)}></EscuelaEditor>
         ) : (
          <div key={i} className="cc-escuela">
           <div className="cc-escuela-top">
            <strong>{e.ciudad}</strong>
            <span className="cc-escuela-right">
             <span className="cc-escuela-ninos">{Number(e.ninos) || 0} niños</span>
             {puedeEditar && <button className="cc-escuela-edit" title="Editar" onClick={() => setEditIdx(i)}><Icon name="lapiz" size={14}></Icon></button>}
            </span>
           </div>
           <div className="cc-escuela-meta">
            <span><Icon name="usuarios" size={14}></Icon> {e.encargado || <em className="cc-falta">Sin encargado</em>}</span>
            <span><Icon name="estrella" size={14}></Icon> Cat. {e.categorias || <em className="cc-falta">—</em>}</span>
           </div>
           <div className="cc-escuela-contacto">
            <span className={e.email ? '' : 'cc-falta'}><Icon name="mail" size={13}></Icon> {e.email || 'Falta agregar email'}</span>
            <span className={e.telefono ? '' : 'cc-falta'}><Icon name="telefono" size={13}></Icon> {e.telefono || 'Falta agregar teléfono'}</span>
           </div>
           {(e.destacados || []).length > 0 && (
            <div className="cc-esc-destacados">
             <span className="cc-esc-sub"><Icon name="estrella" size={13}></Icon> Jugadores destacados</span>
             <ul>
              {(e.destacados || []).map((d, k) => (
               <li key={k}><strong>{d.nombre}</strong>{d.anioNacimiento ? <span className="cc-esc-dest-contacto"> · nac. {d.anioNacimiento}</span> : null}{d.contacto ? <span className="cc-esc-dest-contacto"> · {d.contacto}</span> : null}</li>
              ))}
             </ul>
            </div>
           )}
           {e.notas ? (
            <div className="cc-esc-notas">
             <span className="cc-esc-sub"><Icon name="reporte" size={13}></Icon> Notas</span>
             <p>{e.notas}</p>
            </div>
           ) : null}
          </div>
         )
        ))}
       </div>
      </React.Fragment>
     )}
    </Card>
   </div>

   <CaptacionResumen escuelas={escuelas} onSel={s => { setSel(s); setEditIdx(null); }}></CaptacionResumen>
  </div>
 );
}

// Tabla de resumen de la red de escuelas (por región + total)
function ccParseCats(str) { const m = (str || '').match(/\d{4}/g); return m ? m.map(Number) : []; }
function CaptacionResumen({ escuelas, onSel }) {
 const [orden, setOrden] = p6State(null);
 const filasBase = p6Memo(() => {
  const out = Object.keys(escuelas).filter(k => (escuelas[k] || []).length).map(sig => {
   const arr = escuelas[sig] || [];
   const ninos = arr.reduce((s, e) => s + (Number(e.ninos) || 0), 0);
   const encargados = [];
   arr.forEach(e => (e.encargado || '').split(/[,/]| y /).map(x => x.trim()).filter(Boolean).forEach(x => { if (!encargados.includes(x)) encargados.push(x); }));
   const cats = [];
   arr.forEach(e => ccParseCats(e.categorias).forEach(y => cats.push(y)));
   const destacados = arr.reduce((s, e) => s + ((e.destacados || []).length), 0);
   const sinContacto = arr.filter(e => !e.email && !e.telefono).length;
   return {
    sig, region: CC_NOMBRE_REG[sig] || sig, escuelas: arr.length, ninos, encargados,
    cats: cats.length ? Math.min(...cats) + '–' + Math.max(...cats) : '—',
    catsMin: cats.length ? Math.min(...cats) : null,
    promedio: arr.length ? Math.round(ninos / arr.length) : 0,
    destacados, sinContacto
   };
  }).sort((a, b) => b.ninos - a.ninos);
  return out;
 }, [escuelas]);

 const tot = filasBase.reduce((a, f) => ({
  escuelas: a.escuelas + f.escuelas, ninos: a.ninos + f.ninos,
  encargados: a.encargados + f.encargados.length, destacados: a.destacados + f.destacados,
  sinContacto: a.sinContacto + f.sinContacto
 }), { escuelas: 0, ninos: 0, encargados: 0, destacados: 0, sinContacto: 0 });

 const filas = p6Memo(() => {
  if (!orden) return filasBase;
  const valor = f => {
   if (orden.key === 'encargados') return f.encargados.length;
   if (orden.key === 'categorias') return f.catsMin;
   if (orden.key === 'porcentaje') return tot.ninos ? f.ninos / tot.ninos : 0;
   return f[orden.key];
  };
  return [...filasBase].sort((a, b) => {
   const va = valor(a), vb = valor(b);
   if (va == null && vb != null) return 1;
   if (vb == null && va != null) return -1;
   const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es');
   return cmp * orden.dir;
  });
 }, [filasBase, orden, tot.ninos]);

 const ordenar = key => setOrden(prev => prev && prev.key === key ? (prev.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 });
 const th = (key, label, centro) => (
  <th className={(centro ? 'cc-c ' : '') + 'cc-th-sort'} title="Ordenar" onClick={() => ordenar(key)}>
   <span className="cc-th-sort-in">{label}{orden && orden.key === key ? <span className="cc-th-arrow">{orden.dir === 1 ? '\u25B2' : '\u25BC'}</span> : null}</span>
  </th>
 );

 return (
  <Card className="cc-resumen-capt">
   <div className="cc-pad cc-resumen-capt-head">
    <div className="cc-chart-head">
     <h3 className="cc-card-title">Resumen de la red de escuelas</h3>
     <button className="cc-btn-mini cc-btn-ghost" onClick={() => ccDescargarCSV('escuelas-colocolo-2026',
      ['Región', 'Escuelas', 'Niños', 'Niños/escuela', 'Encargados', 'Categorías', 'Destacados', '% del total'],
      filas.map(f => [f.region, f.escuelas, f.ninos, Math.round(f.ninos / f.escuelas), f.encargados.join(', '), f.cats, f.destacados, (tot.ninos ? Math.round(f.ninos / tot.ninos * 100) : 0) + '%']))}>
      Exportar CSV
     </button>
    </div>
    <p className="cc-card-note">Consolidado por región · ordenado por número de niños y niñas. Haz clic en una región para ver su detalle.</p>
   </div>
   <div className="cc-gestion-tabla">
    <table className="cc-tabla">
     <thead>
      <tr>
       {th('region', 'Región')}
       {th('escuelas', 'Escuelas', true)}
       {th('ninos', 'Niños', true)}
       {th('promedio', 'Niños/escuela', true)}
       {th('encargados', 'Encargados')}
       {th('categorias', 'Categorías', true)}
       {th('destacados', 'Destacados', true)}
       {th('porcentaje', '% del total', true)}
      </tr>
     </thead>
     <tbody>
      {filas.map(f => (
       <tr key={f.sig} className="cc-resumen-row" onClick={() => onSel(f.sig)}>
        <td><strong>{f.region}</strong></td>
        <td className="cc-c">{f.escuelas}</td>
        <td className="cc-c">{f.ninos.toLocaleString('es-CL')}</td>
        <td className="cc-c">{f.promedio}</td>
        <td>
         <span className="cc-enc-count">{f.encargados.length}</span>
         <span className="cc-enc-list">{f.encargados.join(', ') || <em className="cc-falta">Sin encargado</em>}</span>
         {f.sinContacto > 0 && <span className="cc-enc-aviso" title="Escuelas sin email ni teléfono"><Icon name="alerta" size={12}></Icon> {f.sinContacto} sin contacto</span>}
        </td>
        <td className="cc-c">{f.cats}</td>
        <td className="cc-c">{f.destacados || '—'}</td>
        <td className="cc-c">{tot.ninos ? Math.round(f.ninos / tot.ninos * 100) : 0}%</td>
       </tr>
      ))}
     </tbody>
     <tfoot>
      <tr className="cc-resumen-total">
       <td><strong>Total nacional</strong></td>
       <td className="cc-c"><strong>{tot.escuelas}</strong></td>
       <td className="cc-c"><strong>{tot.ninos.toLocaleString('es-CL')}</strong></td>
       <td className="cc-c">{tot.escuelas ? Math.round(tot.ninos / tot.escuelas) : 0}</td>
       <td><strong>{tot.encargados}</strong> encargados</td>
       <td className="cc-c">—</td>
       <td className="cc-c"><strong>{tot.destacados || '—'}</strong></td>
       <td className="cc-c">100%</td>
      </tr>
     </tfoot>
    </table>
   </div>
  </Card>
 );
}

// Editor inline de una escuela (Admin / Editor)
function EscuelaEditor({ escuela, onSave, onCancel, onDelete }) {
 const [f, setF] = p6State({ destacados: [], notas: '', ...escuela });
 const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
 const campo = (k, label, type) => (
  <label className="cc-esc-campo">
   <span>{label}</span>
   <input className="cc-input" type={type || 'text'} value={f[k] == null ? '' : f[k]}
    onChange={e => set(k, type === 'number' ? e.target.value.replace(/[^0-9]/g, '') : e.target.value)}></input>
  </label>
 );
 const destacados = f.destacados || [];
 const setDest = (idx, key, val) => set('destacados', destacados.map((d, i) => i === idx ? { ...d, [key]: val } : d));
 const addDest = () => set('destacados', [...destacados, { nombre: '', anioNacimiento: '', contacto: '' }]);
 const delDest = idx => set('destacados', destacados.filter((_, i) => i !== idx));

 return (
  <div className="cc-escuela cc-escuela-editor">
   <div className="cc-esc-grid">
    {campo('ciudad', 'Ciudad / sede')}
    {campo('ninos', 'N° de niños', 'number')}
    {campo('encargado', 'Encargado')}
    {campo('categorias', 'Categorías (ej. 2010–2017)')}
    {campo('email', 'Email de contacto')}
    {campo('telefono', 'Teléfono de contacto')}
   </div>

   <div className="cc-esc-block">
    <div className="cc-esc-block-head">
     <span className="cc-esc-sub"><Icon name="estrella" size={13}></Icon> Jugadores destacados</span>
     <button className="cc-btn-mini cc-btn-ghost" onClick={addDest}><Icon name="mas" size={13}></Icon> Agregar</button>
    </div>
    {destacados.length === 0 && <p className="cc-card-note">Sin jugadores destacados registrados.</p>}
    {destacados.map((d, k) => (
     <div key={k} className="cc-dest-row">
     <input className="cc-input" placeholder="Nombre del jugador" value={d.nombre || ''} onChange={e => setDest(k, 'nombre', e.target.value)}></input>
      <input className="cc-input" type="number" min="1990" max={new Date().getFullYear()} placeholder="Año de nacimiento" value={d.anioNacimiento || ''} onChange={e => setDest(k, 'anioNacimiento', e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}></input>
      <input className="cc-input" placeholder="Contacto (tel / email / tutor)" value={d.contacto || ''} onChange={e => setDest(k, 'contacto', e.target.value)}></input>
      <button className="cc-escuela-edit cc-btn-danger" title="Quitar" onClick={() => delDest(k)}><Icon name="basura" size={13}></Icon></button>
     </div>
    ))}
   </div>

   <label className="cc-esc-campo cc-esc-notas-campo">
    <span><Icon name="reporte" size={13}></Icon> Notas (visibles para todos)</span>
    <textarea className="cc-notas-input" rows={2} value={f.notas || ''} onChange={e => set('notas', e.target.value)} placeholder="Observaciones del cuerpo técnico o scouting…"></textarea>
   </label>

   <div className="cc-esc-btns">
    <button className="cc-btn-mini" onClick={() => onSave({ ...f, ninos: Number(f.ninos) || 0, destacados: destacados.filter(d => (d.nombre || '').trim()).map(d => ({ ...d, anioNacimiento: d.anioNacimiento ? Number(d.anioNacimiento) : null })) })}><Icon name="check" size={14}></Icon> Guardar</button>
    <button className="cc-btn-mini cc-btn-ghost" onClick={onCancel}>Cancelar</button>
    <button className="cc-btn-mini cc-btn-danger" onClick={onDelete}><Icon name="basura" size={14}></Icon> Eliminar</button>
   </div>
  </div>
 );
}

// =================== Mercado: agentes + helpers ===================
function MercadoCard({ children }) {
 return <div className="cc-mercado-card">{children}</div>;
}

const CC_AGENTES_KEY = 'cc_agentes_v1';
function ccLoadAgentes() {
 try { const v = JSON.parse(localStorage.getItem(CC_AGENTES_KEY)); if (Array.isArray(v) && v.length) return v; } catch (e) {}
 // Semilla desde los agentes ya presentes en el mercado entrante
 const seed = [];
 (CC_GESTION.ofrecidos || []).forEach(o => {
  if (o.agente && !seed.find(a => a.agencia === o.agente)) seed.push({ agencia: o.agente, contacto: '', email: '', telefono: '', notas: '' });
 });
 return seed;
}
function ccSaveAgentes(list) { try { localStorage.setItem(CC_AGENTES_KEY, JSON.stringify(list)); } catch (e) {} }

// Popup con la info de un agente (ver / editar / agregar)
function AgentePopup({ agencia, agentes, puedeEditar, onSaveAgente, onClose }) {
 const existente = agentes.find(a => a.agencia === agencia);
 const [f, setF] = p6State(() => existente ? { ...existente } : { agencia: agencia || '', contacto: '', email: '', telefono: '', notas: '' });
 const [editando, setEditando] = p6State(!existente);
 const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
 const inp = (k, label, type) => (
  <label className="cc-esc-campo"><span>{label}</span>
   <input className="cc-input" type={type || 'text'} value={f[k] || ''} onChange={e => set(k, e.target.value)}></input>
  </label>
 );
 return (
  <div className="cc-modal-overlay" onClick={onClose}>
   <div className="cc-modal cc-modal-sm" onClick={e => e.stopPropagation()}>
    <div className="cc-modal-head">
     <h3>Agente · {f.agencia || 'Nuevo'}</h3>
     <button className="cc-modal-x" onClick={onClose}><Icon name="cerrar" size={18}></Icon></button>
    </div>
    {!editando && existente ? (
     <div className="cc-rep-info">
      <div className="cc-rep-row"><span>Agencia</span><strong>{existente.agencia}</strong></div>
      <div className="cc-rep-row"><span>Contacto</span><strong>{existente.contacto || <em className="cc-falta">No registrado</em>}</strong></div>
      <div className="cc-rep-row"><span><Icon name="mail" size={13}></Icon> Email</span><strong>{existente.email || <em className="cc-falta">Falta agregar</em>}</strong></div>
      <div className="cc-rep-row"><span><Icon name="telefono" size={13}></Icon> Teléfono</span><strong>{existente.telefono || <em className="cc-falta">Falta agregar</em>}</strong></div>
      {existente.notas && <div className="cc-rep-row cc-rep-notas"><span>Notas</span><p>{existente.notas}</p></div>}
     </div>
    ) : (
     <div className="cc-esc-grid cc-modal-grid">
      {inp('agencia', 'Agencia de representación')}
      {inp('contacto', 'Contacto (persona)')}
      {inp('email', 'Email', 'email')}
      {inp('telefono', 'Teléfono', 'tel')}
      <label className="cc-esc-campo" style={{ gridColumn: '1 / -1' }}><span>Notas</span>
       <textarea className="cc-notas-input" rows={2} value={f.notas || ''} onChange={e => set('notas', e.target.value)}></textarea>
      </label>
     </div>
    )}
    {puedeEditar && (
     <div className="cc-esc-btns">
      {editando ? (
       <React.Fragment>
        <button className="cc-btn-mini" onClick={() => { if (f.agencia.trim()) { onSaveAgente(f); onClose(); } }}><Icon name="check" size={14}></Icon> Guardar agente</button>
        <button className="cc-btn-mini cc-btn-ghost" onClick={onClose}>Cancelar</button>
       </React.Fragment>
      ) : (
       <button className="cc-btn-mini" onClick={() => setEditando(true)}><Icon name="lapiz" size={14}></Icon> Editar</button>
      )}
     </div>
    )}
   </div>
  </div>
 );
}

const CC_EST_OFR = { 'Prioridad': 'prio', 'En análisis': 'ana', 'Descartado': 'desc', 'Negociando': 'ana', 'Ofrecido': 'prio', 'Cerrado': 'ok' };

// Tarjeta de jugador del mercado (entrante o saliente)
function MercadoPlayerCard({ o, modo, puedeEditar, onAgente, onEdit, onDelete }) {
 const [open, setOpen] = p6State(false);
 const club = modo === 'ofrecido' ? o.club : 'Colo-Colo';
 return (
  <MercadoCard>
   <div className="cc-mercado-head">
    <div className="cc-mercado-nom">
     <strong>{o.jugador}</strong>
     <span className="cc-mercado-club"><CCTeamLogo team={club} size={16}></CCTeamLogo>{club}</span>
    </div>
    <span className={'cc-estado-badge cc-estado-' + (CC_EST_OFR[o.estado] || 'ana')}>{o.estado}</span>
   </div>
   <div className="cc-mercado-tags">
    {o.origen === 'dt' && <span className="cc-mercado-tag cc-tag-dt">Dirección Técnica</span>}
    <span className="cc-pos-mini">{o.posicion}</span>
    {o.edad ? <span className="cc-mercado-tag">{o.edad} años</span> : null}
    {modo === 'ofrecido' && o.nac ? <span className="cc-mercado-tag">{o.nac}</span> : null}
    {modo === 'ofrecido' && o.liga ? <span className="cc-mercado-tag">{o.liga}</span> : null}
    {modo === 'ofrecido' && o.pais ? <span className="cc-mercado-tag">{o.pais}</span> : null}
    <span className={'cc-tipo-op cc-tipo-' + (o.tipo === 'Cesión' ? 'cesion' : 'transfer')}>{o.tipo}</span>
   </div>
   {modo === 'ofrecido' ? (
    <React.Fragment>
     <div className="cc-mercado-row"><span>Valor</span><strong>{o.tipo === 'Cesión' ? 'Cesión' : p6USD(o.valor)}</strong></div>
     <div className="cc-mercado-row"><span>Agente</span>
      {o.agente ? <button className="cc-agente-btn" onClick={() => onAgente(o.agente)}><Icon name="usuarios" size={12}></Icon> {o.agente}</button> : <span className="cc-falta">—</span>}
     </div>
    </React.Fragment>
   ) : (
    <React.Fragment>
     <div className="cc-mercado-row"><span>Motivo</span><span>{o.motivo || '—'}</span></div>
     <div className="cc-mercado-row cc-mercado-row-top"><span>Interesados</span>
      <span className="cc-inter-list">
       {(() => {
        const lista = Array.isArray(o.interesados) ? o.interesados : (o.interesados ? [o.interesados] : []);
        if (!lista.length) return <span className="cc-falta">—</span>;
        return lista.map((t, i) => <span key={i} className="cc-inter-team"><CCTeamLogo team={t} size={14}></CCTeamLogo>{t}</span>);
       })()}
      </span>
     </div>
     {o.agente ? <div className="cc-mercado-row"><span>Agente</span><button className="cc-agente-btn" onClick={() => onAgente(o.agente)}><Icon name="usuarios" size={12}></Icon> {o.agente}</button></div> : null}
    </React.Fragment>
   )}
   {o.nota && <p className="cc-mercado-nota">{o.nota}</p>}

   {(o.videos && o.videos.length) || o.informe || open ? (
    <div className="cc-mercado-extra">
     {(o.videos || []).map((v, k) => (
      <a key={k} className="cc-pill cc-pill-link" href={v} target="_blank" rel="noopener noreferrer"><Icon name="video" size={12}></Icon> Video {o.videos.length > 1 ? k + 1 : ''}</a>
     ))}
     {open && o.informe && <div className="cc-mercado-informe"><span className="cc-esc-sub"><Icon name="reporte" size={13}></Icon> Informe</span><p>{o.informe}</p></div>}
    </div>
   ) : null}

   <div className="cc-mercado-pie">
    {o.informe && <button className="cc-btn-mini cc-btn-ghost" onClick={() => setOpen(!open)}>{open ? 'Ocultar informe' : 'Ver informe'}</button>}
    {puedeEditar && <button className="cc-btn-mini" onClick={onEdit}><Icon name="lapiz" size={13}></Icon> Editar</button>}
    {puedeEditar && <button className="cc-btn-mini cc-btn-danger" onClick={onDelete}><Icon name="basura" size={13}></Icon></button>}
   </div>
  </MercadoCard>
 );
}

// Editor (modal) de un jugador del mercado
function MercadoEditor({ modo, player, agentes, onSave, onCancel, onDelete, onPickAgente }) {
 const catalogoVacio = { paisId: '', pais: '', ligaId: '', liga: '', equipoId: '', club: '' };
 const baseOfr = { jugador: '', ...catalogoVacio, posicion: 'CF', edad: 21, nac: '', tipo: 'Transferencia', valor: '', agente: '', estado: 'En análisis', nota: '', informe: '', videos: [] };
 const baseSal = { jugador: '', posicion: 'CF', edad: 21, tipo: 'Transferencia', motivo: '', interesados: [], interesadosDetalle: [], agente: '', estado: 'Negociando', nota: '', informe: '', videos: [] };
 const [f, setF] = p6State(() => player ? { videos: [], ...player } : (modo === 'ofrecido' ? baseOfr : baseSal));
 const [interesCatalogo, setInteresCatalogo] = p6State(catalogoVacio);
 const [interesPickerKey, setInteresPickerKey] = p6State(0);
 const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
 const Catalogo = window.CatalogoPicker;
 const interesados = Array.isArray(f.interesados)
  ? f.interesados.map(String).filter(Boolean)
  : (f.interesados ? String(f.interesados).split(',').map(x => x.trim()).filter(Boolean) : []);
 const detallesInteres = Array.isArray(f.interesadosDetalle) ? f.interesadosDetalle : [];
 const addInteresado = () => {
  const club = (interesCatalogo.club || '').trim();
  if (!club || interesados.includes(club)) return;
  setF(prev => ({
   ...prev,
   interesados: [...interesados, club],
   interesadosDetalle: [...detallesInteres.filter(d => d.club !== club), { ...interesCatalogo }]
  }));
  setInteresCatalogo(catalogoVacio);
  setInteresPickerKey(k => k + 1);
 };
 const delInteresado = t => setF(prev => ({
  ...prev,
  interesados: interesados.filter(x => x !== t),
  interesadosDetalle: detallesInteres.filter(d => d.club !== t)
 }));
 const videos = f.videos || [];
 const setVideo = (i, v) => set('videos', videos.map((x, k) => k === i ? v : x));
 const estados = modo === 'ofrecido' ? ['Prioridad', 'En análisis', 'Descartado'] : ['Negociando', 'Ofrecido', 'Cerrado'];
 const inp = (k, label, type) => (
  <label className="cc-esc-campo"><span>{label}</span>
   <input className="cc-input" type={type || 'text'} value={f[k] == null ? '' : f[k]} onChange={e => set(k, type === 'number' ? e.target.value.replace(/[^0-9]/g, '') : e.target.value)}></input>
  </label>
 );
 return (
  <div className="cc-modal-overlay" onClick={onCancel}>
   <div className="cc-modal" onClick={e => e.stopPropagation()}>
    <div className="cc-modal-head">
     <h3>{player ? 'Editar jugador' : 'Agregar jugador'}</h3>
     <button className="cc-modal-x" onClick={onCancel}><Icon name="cerrar" size={18}></Icon></button>
    </div>
    <div className="cc-esc-grid cc-modal-grid">
     {inp('jugador', 'Jugador')}
     {modo === 'ofrecido' && <div className="cc-esc-block cc-mercado-catalogo">
      <div className="cc-esc-block-head"><span className="cc-esc-sub"><Icon name="rankEquipos" size={13}></Icon> País → Liga → Equipo (catálogo)</span></div>
      {Catalogo ? <Catalogo value={f} onChange={patch => setF(prev => ({ ...prev, ...patch }))}></Catalogo> : <p className="cc-empty">Catálogo no disponible.</p>}
      <label className="cc-esc-campo"><span>Club actual</span>
       <input className="cc-input" value={f.club || ''} onChange={e => set('club', e.target.value)} placeholder="Selecciona desde el catálogo o escribe el club"></input>
      </label>
     </div>}
     {inp('posicion', 'Posición')}
     {inp('edad', 'Edad', 'number')}
     {modo === 'ofrecido' && inp('nac', 'Nacionalidad')}
     <label className="cc-esc-campo"><span>Operación</span>
      <Select value={f.tipo} onChange={v => set('tipo', v)} options={['Transferencia', 'Cesión']}></Select>
     </label>
     <label className="cc-esc-campo"><span>Estado</span>
      <Select value={f.estado} onChange={v => set('estado', v)} options={estados}></Select>
     </label>
     {modo === 'ofrecido' && f.tipo !== 'Cesión' && inp('valor', 'Valor (US$)', 'number')}
     {modo === 'saliente' && inp('motivo', 'Motivo')}
     <label className="cc-esc-campo" style={{ gridColumn: '1 / -1' }}><span>Agente / agencia</span>
      <div className="cc-agente-pick">
       <Select value={f.agente || ''} onChange={v => set('agente', v)} options={[{ value: '', label: 'Sin agente' }, ...agentes.map(a => ({ value: a.agencia, label: a.agencia }))]}></Select>
       <button type="button" className="cc-btn-mini cc-btn-ghost" onClick={() => onPickAgente(set)}><Icon name="mas" size={13}></Icon> Nuevo agente</button>
      </div>
     </label>
    </div>
    {modo === 'saliente' && (
     <div className="cc-esc-block">
      <div className="cc-esc-block-head">
       <span className="cc-esc-sub"><Icon name="rankEquipos" size={13}></Icon> Equipos interesados · País → Liga → Equipo (catálogo)</span>
      </div>
      {Catalogo ? <Catalogo key={interesPickerKey} value={interesCatalogo} onChange={patch => setInteresCatalogo(prev => ({ ...prev, ...patch }))}></Catalogo> : <p className="cc-empty">Catálogo no disponible.</p>}
      <button type="button" className="cc-btn-mini cc-btn-ghost" disabled={!interesCatalogo.club} onClick={addInteresado}><Icon name="mas" size={13}></Icon> Agregar equipo</button>
      <div className="cc-chip-row">
       {interesados.length === 0 && <span className="cc-card-note">Sin equipos interesados.</span>}
       {interesados.map(t => (
        <span key={t} className="cc-team-chip"><CCTeamLogo team={t} size={16}></CCTeamLogo>{t}<button type="button" onClick={() => delInteresado(t)}><Icon name="cerrar" size={11}></Icon></button></span>
       ))}
      </div>
     </div>
    )}
    <div className="cc-esc-block">
     <div className="cc-esc-block-head">
      <span className="cc-esc-sub"><Icon name="video" size={13}></Icon> Links de video</span>
      <button className="cc-btn-mini cc-btn-ghost" onClick={() => set('videos', [...videos, ''])}><Icon name="mas" size={13}></Icon> Agregar</button>
     </div>
     {videos.length === 0 && <p className="cc-card-note">Sin videos.</p>}
     {videos.map((v, k) => (
      <div key={k} className="cc-dest-row">
       <input className="cc-input" placeholder="https://… (YouTube,)" value={v} onChange={e => setVideo(k, e.target.value)} style={{ gridColumn: '1 / 3' }}></input>
       <button className="cc-escuela-edit cc-btn-danger" onClick={() => set('videos', videos.filter((_, j) => j !== k))}><Icon name="basura" size={13}></Icon></button>
      </div>
     ))}
    </div>
    <label className="cc-esc-campo cc-esc-notas-campo"><span><Icon name="reporte" size={13}></Icon> Informe / observaciones</span>
     <textarea className="cc-notas-input" rows={3} value={f.informe || ''} onChange={e => set('informe', e.target.value)} placeholder="Informe de scouting del jugador…"></textarea>
    </label>
    <label className="cc-esc-campo cc-esc-notas-campo"><span>Nota corta (resumen en tarjeta)</span>
     <input className="cc-input" value={f.nota || ''} onChange={e => set('nota', e.target.value)}></input>
    </label>
    <div className="cc-esc-btns">
     <button className="cc-btn-mini" onClick={() => { if ((f.jugador || '').trim()) onSave({ ...f, edad: Number(f.edad) || 0, valor: Number(f.valor) || 0, videos: videos.filter(v => (v || '').trim()) }); }}><Icon name="check" size={14}></Icon> Guardar</button>
     <button className="cc-btn-mini cc-btn-ghost" onClick={onCancel}>Cancelar</button>
     {onDelete && <button className="cc-btn-mini cc-btn-danger" onClick={onDelete}><Icon name="basura" size={14}></Icon> Eliminar</button>}
    </div>
   </div>
  </div>
 );
}

// Hook compartido para una lista de mercado persistente
function useMercado(key, seed) {
 const [lista, setLista] = p6State(() => {
  try { const v = JSON.parse(localStorage.getItem(key)); if (Array.isArray(v)) return v; } catch (e) {}
  return JSON.parse(JSON.stringify(seed || []));
 });
 const guardar = next => { setLista(next); try { localStorage.setItem(key, JSON.stringify(next)); } catch (e) {} };
 return [lista, guardar];
}

// Página de mercado genérica (entrante / saliente)
function MercadoPage({ usuario, modo }) {
 const rol = (() => { try { return window.ccRolDe ? window.ccRolDe(usuario) : null; } catch (e) { return null; } })();
 const puedeEditar = rol === 'Administrador' || rol === 'Editor';
 const [tipo, setTipo] = p6State('Todos');
 const [lista, guardar] = useMercado(modo === 'ofrecido' ? 'cc_ofrecidos_v1' : 'cc_para_ofrecer_v1', modo === 'ofrecido' ? CC_GESTION.ofrecidos : CC_GESTION.paraOfrecer);
 const [agentes, setAgentes] = p6State(() => ccLoadAgentes());
 const [editIdx, setEditIdx] = p6State(null);   // índice o 'nuevo'
 const [agentePopup, setAgentePopup] = p6State(null);

 const guardarAgente = ag => { const next = agentes.find(a => a.agencia === ag.agencia) ? agentes.map(a => a.agencia === ag.agencia ? ag : a) : [...agentes, ag]; setAgentes(next); ccSaveAgentes(next); };
 const visibles = lista.map((o, i) => ({ o, i })).filter(({ o }) => tipo === 'Todos' || o.tipo === tipo);

 const guardarJugador = datos => {
  if (editIdx === 'nuevo') guardar([datos, ...lista]);
  else guardar(lista.map((x, i) => i === editIdx ? datos : x));
  setEditIdx(null);
 };
 const borrarJugador = idx => { guardar(lista.filter((_, i) => i !== idx)); setEditIdx(null); };

 const cab = modo === 'ofrecido'
  ? { icon: 'buscar', title: 'Jugadores ofrecidos', sub: 'Mercado entrante · jugadores que ofrecen a Colo-Colo' }
  : { icon: 'flecha', title: 'Jugadores para ofrecer', sub: 'Mercado saliente · jugadores propios disponibles para transferencia o cesión' };

 return (
  <div className="cc-page">
   <PageHeader icon={cab.icon} title={cab.title} subtitle={cab.sub}
    right={puedeEditar ? <button className="cc-btn-primary" style={{ width: 'auto' }} onClick={() => setEditIdx('nuevo')}><Icon name="mas" size={15}></Icon> Agregar jugador</button> : null}></PageHeader>

   <SegTabs value={tipo} onChange={setTipo} options={[
    { value: 'Todos', label: 'Todos' },
    { value: 'Transferencia', label: 'Transferencia' },
    { value: 'Cesión', label: 'Cesión' }
   ]}></SegTabs>

   {!puedeEditar && <p className="cc-card-note" style={{ padding: '0 4px' }}>Tu rol ({rol || 'Visita'}) es de solo lectura.</p>}

   {visibles.length === 0 && <Card className="cc-pad"><p className="cc-empty">Sin jugadores en esta categoría.</p></Card>}

   <div className="cc-mercado-grid">
    {visibles.map(({ o, i }) => (
     <MercadoPlayerCard key={i} o={o} modo={modo} puedeEditar={puedeEditar}
      onAgente={ag => setAgentePopup(ag)}
      onEdit={() => setEditIdx(i)}
      onDelete={() => { if (window.confirm('¿Eliminar a ' + o.jugador + '?')) borrarJugador(i); }}></MercadoPlayerCard>
    ))}
   </div>

   {editIdx !== null && (
    <MercadoEditor modo={modo} player={editIdx === 'nuevo' ? null : lista[editIdx]} agentes={agentes}
     onSave={guardarJugador} onCancel={() => setEditIdx(null)}
     onDelete={editIdx === 'nuevo' ? null : () => borrarJugador(editIdx)}
     onPickAgente={() => setAgentePopup('__nuevo__')}></MercadoEditor>
   )}

   {agentePopup !== null && (
    <AgentePopup agencia={agentePopup === '__nuevo__' ? '' : agentePopup} agentes={agentes} puedeEditar={puedeEditar}
     onSaveAgente={guardarAgente} onClose={() => setAgentePopup(null)}></AgentePopup>
   )}
  </div>
 );
}

function PageOfrecidos({ usuario }) { return <MercadoPage usuario={usuario} modo="ofrecido"></MercadoPage>; }
function PageParaOfrecer({ usuario }) { return <MercadoPage usuario={usuario} modo="saliente"></MercadoPage>; }

Object.assign(window, { PageGestion, PageCaptacion, PageOfrecidos, PageParaOfrecer });
