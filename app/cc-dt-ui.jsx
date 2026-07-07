// ============================================================
// ColoColo Football Center — Página Dirección Técnica v3
// Centro de rendimiento: Físico y cargas · Wellness · Nutrición
// y GPS. Encabezados ordenables,
// historial de wellness por fecha (editar/borrar), castigos
// (tarjetas/secretaría), pliegues por fase y plan de partido
// con torneo y rival. Todo propaga al resto de la plataforma.
// ============================================================
/* global React, CC_DATA, CC_DT, Icon, Card, PageHeader, StatCard, Select, SegTabs, CCTeamLogo */

const dtCondColor = c => c >= 88 ? 'var(--exito)' : c >= 75 ? '#F59E0B' : 'var(--rojo)';
const dtWellColor = s => s == null ? 'var(--ink-3)' : s >= 75 ? 'var(--exito)' : s >= 55 ? '#F59E0B' : 'var(--rojo)';
const DT_CASTIGOS = { tarjetas: 'Acumulación de tarjetas', secretaria: 'Secretaría / Tribunal' };

// Encabezados ordenables: clic = mayor→menor, 2º clic = menor→mayor, 3º = original
function useDTSort(getters) {
 const [sort, setSort] = React.useState(null);
 const th = (label, k, cls) => (
  <th key={k || label} className={(cls || '') + (k ? ' cc-th-sort' + (sort && sort.k === k ? ' on' : '') : '')}
   onClick={k ? () => setSort(s => (!s || s.k !== k) ? { k, dir: -1 } : s.dir === -1 ? { k, dir: 1 } : null) : undefined}>
   {label}{k && sort && sort.k === k ? (sort.dir === -1 ? ' ▼' : ' ▲') : ''}
  </th>
 );
 const aplicar = lista => {
  if (!sort || !getters[sort.k]) return lista;
  const g = getters[sort.k];
  const cmp = (va, vb) => (typeof va === 'string' || typeof vb === 'string')
   ? String(va || '').localeCompare(String(vb || ''), 'es')
   : (Number(va) || 0) - (Number(vb) || 0);
  return [...lista].sort((a, b) => cmp(g(a), g(b)) * (sort.dir === -1 ? -1 : 1));
 };
 return { th, aplicar };
}

function DTJugador({ s }) {
 return (
  <span className="cc-dt-jug">
   <CCTeamLogo team="Colo-Colo" size={20}></CCTeamLogo>
   <span className="cc-dt-jug-txt">
    <strong>{s.nombre}</strong>
    <em>{s.posicion || '—'}{s.edad ? ' · ' + s.edad + ' años' : ''}</em>
   </span>
  </span>
 );
}

function DTDisponibilidadBadge({ s }) {
 if (s.lesionado) return <span className="cc-dt-badge les">Lesionado</span>;
 if (s.suspendido) return <span className="cc-dt-badge sus">Suspendido</span>;
 if (s.cedido) return <span className="cc-dt-badge ces">Cedido</span>;
 return <span className="cc-dt-badge ok">Disponible</span>;
}

// ---------- Pestaña Panel ----------
function DTPanel({ plantel, puedeEditar }) {
 const entren = CC_DT.getEntrenamiento();
 const plan = CC_DT.getPlan();
 const rivales = CC_DATA.equipos.map(e => e.nombre).filter(n => n !== 'Colo-Colo');
 const alertas = [];
 plantel.forEach(s => {
  if (s.suspendido) alertas.push({ t: 'sus', txt: s.nombre + ' · suspendido' + (s.suspTipo ? ' · ' + (DT_CASTIGOS[s.suspTipo] || s.suspTipo).toLowerCase() + (s.suspFechas ? ' (' + s.suspFechas + ' fecha' + (s.suspFechas > 1 ? 's' : '') + ')' : '') : '') });
  if (s.riesgo) alertas.push({ t: 'cap', txt: s.nombre + ' · en capilla (' + s.amarillas + ' amarillas)' });
  if (s.riesgoCarga) alertas.push({ t: 'car', txt: s.nombre + ' · carga alta (' + s.carga + '% del máximo)' });
  if (s.wellAlerta) alertas.push({ t: 'wel', txt: s.nombre + ' · wellness bajo (' + s.wellScore + '/100)' });
  if (s.nutri && s.nutri.restricciones) alertas.push({ t: 'nut', txt: s.nombre + ' · restricción: ' + s.nutri.restricciones });
 });
 return (
  <React.Fragment>
   <div className="cc-grid-2">
    <Card className="cc-pad">
     <h3 className="cc-card-title">Entrenamiento semanal</h3>
     <p className="cc-card-note">El foco ajusta la condición estimada de todo el plantel (recuperación la sube, intensivo la baja).</p>
     <div className="cc-dt-focos">
      {Object.entries(CC_DT.FOCOS).map(([k, f]) => (
       <button key={k} disabled={!puedeEditar}
        className={'cc-dt-foco' + (entren.foco === k ? ' on' : '')}
        onClick={() => CC_DT.setEntrenamiento({ foco: k })}>
        {f.label}
        <span className="cc-dt-foco-delta">{f.delta > 0 ? '+' + f.delta : f.delta}% cond.</span>
       </button>
      ))}
     </div>
    </Card>
    <Card className="cc-pad">
     <h3 className="cc-card-title">Plan de partido</h3>
     <p className="cc-card-note">Elige torneo y rival (opcional) y define el bloque táctico. Se muestra en el Campograma.</p>
     <div className="cc-dt-plan cc-dt-plan-rival">
      <Select label="Torneo" value={plan.torneo || ''} onChange={v => puedeEditar && CC_DT.setPlan({ torneo: v })}
       options={[{ value: '', label: '— Sin torneo —' }, 'Campeonato Chileno']}></Select>
      <Select label="Rival" value={plan.rival || ''} onChange={v => puedeEditar && CC_DT.setPlan({ rival: v })}
       options={[{ value: '', label: '— Sin rival —' }, ...rivales]}></Select>
     </div>
     <div className="cc-dt-plan">
      <Select label="Presión" value={plan.presion || ''} onChange={v => puedeEditar && CC_DT.setPlan({ presion: v })}
       options={[{ value: '', label: '—' }, 'Alta', 'Media', 'Baja']}></Select>
      <Select label="Línea defensiva" value={plan.linea || ''} onChange={v => puedeEditar && CC_DT.setPlan({ linea: v })}
       options={[{ value: '', label: '—' }, 'Alta', 'Media', 'Baja']}></Select>
      <Select label="Amplitud" value={plan.amplitud || ''} onChange={v => puedeEditar && CC_DT.setPlan({ amplitud: v })}
       options={[{ value: '', label: '—' }, 'Amplia', 'Normal', 'Estrecha']}></Select>
     </div>
     <input className="cc-input cc-dt-plan-nota" placeholder="Nota táctica (opcional)…" disabled={!puedeEditar}
      value={plan.nota || ''} onChange={e => CC_DT.setPlan({ nota: e.target.value })}></input>
    </Card>
   </div>
   <Card className="cc-pad">
    <div className="cc-chart-head">
     <h3 className="cc-card-title">Alertas de rendimiento</h3>
     <span className="cc-pill cc-pill-pendiente">{alertas.length}</span>
    </div>
    {alertas.length === 0
     ? <p className="cc-empty">Sin alertas: plantel disponible, cargas y wellness en rango.</p>
     : <div className="cc-alertas-list">
       {alertas.map((a, i) => <span key={i} className={'cc-alerta cc-dt-al-' + a.t}><Icon name="alerta" size={14}></Icon>{a.txt}</span>)}
      </div>}
   </Card>
  </React.Fragment>
 );
}

// ---------- Pestaña Disponibilidad ----------
function DTDisponibilidad({ plantel, puedeEditar }) {
 const set = (n, patch) => { if (puedeEditar) CC_DT.setJugador(n, patch); };
 const { th, aplicar } = useDTSort({
  nombre: s => s.nombre, min: s => s.min, pj: s => s.pj,
  ready: s => s.readiness, cond: s => s.condicion, moral: s => s.moral, am: s => s.amarillas,
  disp: s => (s.disponible ? 1 : 0)
 });
 const lista = aplicar(plantel);
 const AUTO_CLS = { 'Óptimo': 'ok', 'Apto': 'ok', 'En gestión': 'sus', 'Riesgo': 'les', 'No disponible': 'les' };
 return (
  <Card>
   <div className="cc-pad cc-dt-tabhead">
    <h3 className="cc-card-title">Disponibilidad y estado competitivo</h3>
    <p className="cc-card-note">Haz clic en un encabezado para ordenar (mayor→menor, luego menor→mayor). El <strong>estado automático</strong> combina wellness, carga de minutos y carga GPS reciente (ACWR); la condición <em>estimada</em> suma entrenamiento y ajuste manual. “Capilla” = a una amarilla de la suspensión. Los castigos registran suspensiones por acumulación de tarjetas o por Secretaría/Tribunal.</p>
   </div>
   <div className="cc-gestion-tabla">
    <table className="cc-tabla">
     <thead>
      <tr>
       {th('Jugador', 'nombre')}
       {th('Min', 'min', 'cc-c')}
       {th('PJ', 'pj', 'cc-c')}
       {th('Estado (auto)', 'ready')}
       {th('Condición', 'cond')}
       {th('Moral', 'moral')}
       {th('Tarjetas', 'am', 'cc-c')}
       {th('Disponibilidad', 'disp')}
       {th('Castigo', null)}
       {th('Mercado', null)}
      </tr>
     </thead>
     <tbody>
      {lista.map(s => (
       <tr key={s.nombre} className={s.disponible ? '' : 'cc-dt-tr-nodisp'}>
        <td><DTJugador s={s}></DTJugador></td>
        <td className="cc-c">{s.min}'</td>
        <td className="cc-c">{s.pj}</td>
        <td>
         <div className="cc-dt-auto">
          <span className={'cc-dt-badge ' + (AUTO_CLS[s.estadoAuto] || 'ok')} title={'Readiness ' + s.readiness + '/100'}>{s.estadoAuto}</span>
          <div className="cc-dt-cond-bar cc-dt-ready"><span style={{ width: s.readiness + '%', background: dtCondColor(s.readiness) }}></span></div>
          {s.gpsRiesgo && <span className="cc-dt-acwr" title={'ACWR ' + s.acwr}>ACWR {s.acwr}</span>}
         </div>
        </td>
        <td>
         <div className="cc-dt-cond">
          <div className="cc-dt-cond-bar"><span style={{ width: s.condicion + '%', background: dtCondColor(s.condicion) }}></span></div>
          <span className="cc-dt-cond-num" style={{ color: dtCondColor(s.condicion) }}>{s.condicion}%</span>
          {puedeEditar && (
           <span className="cc-dt-adj">
            <button onClick={() => set(s.nombre, { condAjuste: (s.condAjuste || 0) - 2 })} title="Bajar ajuste">−</button>
            <button onClick={() => set(s.nombre, { condAjuste: (s.condAjuste || 0) + 2 })} title="Subir ajuste">+</button>
           </span>
          )}
         </div>
        </td>
        <td>
         <div className="cc-dt-moral" title={s.moralLabel}>
          {CC_DT.MORAL.map((m, i) => (
           <button key={i} disabled={!puedeEditar} title={m}
            className={'cc-dt-moral-dot' + (i <= s.moral ? ' on' : '')}
            onClick={() => set(s.nombre, { moral: i })}></button>
          ))}
         </div>
        </td>
        <td className="cc-c">
         <span className="cc-dt-tarjetas">
          <span className="cc-dt-tj am" title="Amarillas (dataset)">{s.amarillas}</span>
          <span className="cc-dt-tj ro" title="Rojas (dataset)">{s.rojas}</span>
          {s.riesgo && <span className="cc-dt-capilla">capilla</span>}
         </span>
        </td>
        <td>
         <DTDisponibilidadBadge s={s}></DTDisponibilidadBadge>
         {s.suspendido && s.suspTipo && <div className="cc-estado-det">{DT_CASTIGOS[s.suspTipo] || s.suspTipo}{s.suspFechas ? ' · ' + s.suspFechas + ' fecha' + (s.suspFechas > 1 ? 's' : '') : ''}</div>}
        </td>
        <td>
         {s.lesionado || s.cedido ? <span className="cc-falta">—</span> : (
          <span className="cc-dt-castigo">
           <select className="cc-dt-wsel cc-dt-csel" disabled={!puedeEditar} value={s.suspTipo || ''}
            onChange={e => set(s.nombre, { suspTipo: e.target.value, susp: false, suspFechas: e.target.value ? (s.suspFechas || 1) : null })}>
            <option value="">Sin castigo</option>
            <option value="tarjetas">Acumulación de tarjetas</option>
            <option value="secretaria">Secretaría / Tribunal</option>
           </select>
           {s.suspTipo ? (
            <input className="cc-input cc-dt-fechas" type="number" min="1" max="99" disabled={!puedeEditar}
             title="Fechas de suspensión" value={s.suspFechas || 1}
             onChange={e => set(s.nombre, { suspFechas: Math.max(1, Math.min(99, Number(e.target.value) || 1)) })}></input>
           ) : null}
          </span>
         )}
        </td>
        <td>
         <Select value={s.mercado || ''} onChange={v => set(s.nombre, { mercado: v || null })}
          options={[{ value: '', label: 'En plantel' }, { value: 'Transferencia', label: 'Venta' }, { value: 'Cesión', label: 'Cesión' }]}></Select>
        </td>
       </tr>
      ))}
     </tbody>
    </table>
   </div>
  </Card>
 );
}

// ---------- Pestaña Físico y cargas ----------
function DTFisico({ plantel, puedeEditar }) {
 const { th, aplicar } = useDTSort({
  nombre: s => s.nombre, alt: s => s.altura, peso: s => s.peso, imc: s => s.imc,
  min: s => s.min, mpj: s => s.minPJ, carga: s => s.carga, acwr: s => s.acwr == null ? -1 : s.acwr
 });
 const lista = aplicar(plantel);
 return (
  <Card>
   <div className="cc-pad cc-dt-tabhead">
    <h3 className="cc-card-title">Datos físicos y carga de minutos</h3>
    <p className="cc-card-note">Edad, altura y pie provienen del dataset. El peso lo registra el staff (el IMC se calcula solo). La carga compara los minutos del jugador contra el más utilizado; sobre 85% se marca en riesgo. Los datos <strong>GPS</strong> (partidos y entrenamiento) se ingresan como distancia acumulada aguda (7 días) y crónica (media 4 semanas); el <strong>ACWR</strong> se calcula solo y alimenta el estado automático (zona óptima 0,8–1,3). Encabezados ordenables.</p>
   </div>
   <div className="cc-gestion-tabla">
    <table className="cc-tabla">
     <thead>
      <tr>
       {th('Jugador', 'nombre')}
       {th('Altura', 'alt', 'cc-c')}
       {th('Pie', null, 'cc-c')}
       {th('Peso (kg)', 'peso', 'cc-c')}
       {th('IMC', 'imc', 'cc-c')}
       {th('Min', 'min', 'cc-c')}
       {th('Min/PJ', 'mpj', 'cc-c')}
       {th('Carga de minutos', 'carga')}
       {th('Nivel', null, 'cc-c')}
       {th('GPS 7d (km)', null, 'cc-c')}
       {th('GPS crón. (km)', null, 'cc-c')}
       {th('ACWR', 'acwr', 'cc-c')}
      </tr>
     </thead>
     <tbody>
      {lista.map(s => (
       <tr key={s.nombre}>
        <td><DTJugador s={s}></DTJugador></td>
        <td className="cc-c">{s.altura ? s.altura + ' cm' : '—'}</td>
        <td className="cc-c">{s.pie || '—'}</td>
        <td className="cc-c">
         {puedeEditar
          ? <input className="cc-input cc-dt-peso" type="number" min="50" max="110" placeholder="—"
            value={s.peso || ''} onChange={e => CC_DT.setFis(s.nombre, { peso: e.target.value ? Number(e.target.value) : null })}></input>
          : (s.peso || '—')}
        </td>
        <td className="cc-c">{s.imc != null ? s.imc : <span className="cc-falta">—</span>}</td>
        <td className="cc-c">{s.min}'</td>
        <td className="cc-c">{s.minPJ ? s.minPJ + "'" : '—'}</td>
        <td>
         <div className="cc-dt-cond">
          <div className="cc-dt-cond-bar"><span style={{ width: s.carga + '%', background: s.riesgoCarga ? 'var(--rojo)' : s.cargaNivel === 'Media' ? '#F59E0B' : 'var(--exito)' }}></span></div>
          <span className="cc-dt-cond-num">{s.carga}%</span>
         </div>
        </td>
        <td className="cc-c">
         <span className={'cc-dt-badge ' + (s.riesgoCarga ? 'les' : s.cargaNivel === 'Media' ? 'sus' : 'ok')}>{s.cargaNivel}</span>
        </td>
        <td className="cc-c">
         {puedeEditar
          ? <input className="cc-input cc-dt-peso" type="number" min="0" max="120" step="0.1" placeholder="—"
            value={(s.gps && s.gps.aguda) || ''} onChange={e => CC_DT.setGps(s.nombre, { aguda: e.target.value ? Number(e.target.value) : null })}></input>
          : ((s.gps && s.gps.aguda) || '—')}
        </td>
        <td className="cc-c">
         {puedeEditar
          ? <input className="cc-input cc-dt-peso" type="number" min="0" max="120" step="0.1" placeholder="—"
            value={(s.gps && s.gps.cronica) || ''} onChange={e => CC_DT.setGps(s.nombre, { cronica: e.target.value ? Number(e.target.value) : null })}></input>
          : ((s.gps && s.gps.cronica) || '—')}
        </td>
        <td className="cc-c">
         {s.acwr != null
          ? <span className={'cc-dt-badge ' + (s.gpsRiesgo ? 'les' : 'ok')} title={s.gpsVigente ? 'En ventana (≤7 días)' : 'Dato GPS vencido'}>{s.acwr}</span>
          : <span className="cc-falta">—</span>}
        </td>
       </tr>
      ))}
     </tbody>
    </table>
   </div>
  </Card>
 );
}

// ---------- Pestaña Wellness (historial por fecha) ----------
// Calificación 1–5 estrellas (1 bajo · 5 mejor). Clic en la misma estrella la borra.
function DTStars({ value, onChange, disabled }) {
 return (
  <span className="cc-dt-stars" role="radiogroup" aria-label="Calificación de 1 a 5 estrellas">
   {[1, 2, 3, 4, 5].map(n => (
    <button key={n} type="button" disabled={disabled}
     className={'cc-star' + (n <= (value || 0) ? ' on' : '')}
     title={n + ' de 5'}
     onClick={() => onChange(value === n ? null : n)}>★</button>
   ))}
  </span>
 );
}

function DTWellForm({ nombre, registro, onDone }) {
 const hoy = new Date().toISOString().slice(0, 10);
 const [f, setF] = React.useState(() => registro ? { ...registro } : { fecha: hoy });
 React.useEffect(() => { setF(registro ? { ...registro } : { fecha: hoy }); }, [registro && registro.fecha]);
 const set = (k, v) => setF(prev => ({ ...prev, [k]: v }));
 const score = CC_DT.wellScore(f);
 return (
  <div className="cc-dt-wform">
   <label className="cc-esc-campo"><span>Fecha</span>
    <input className="cc-input" type="date" max={hoy} value={f.fecha || hoy} onChange={e => set('fecha', e.target.value)}></input>
   </label>
   {CC_DT.WELL_ITEMS.map(it => (
    <label key={it.k} className="cc-esc-campo"><span>{it.label}</span>
     <DTStars value={f[it.k] || 0} onChange={v => set(it.k, v)}></DTStars>
    </label>
   ))}
   <div className="cc-dt-wform-foot">
    <span className="cc-dt-cond-num" style={{ color: dtWellColor(score) }}>{score != null ? score + '/100' : '—'}</span>
    <button className="cc-btn-mini" onClick={() => {
     const { fecha, ...vals } = f;
     CC_DT.setWellDia(nombre, fecha || hoy, vals);
     onDone && onDone();
    }}><Icon name="check" size={14}></Icon> {registro ? 'Actualizar' : 'Registrar'}</button>
   </div>
  </div>
 );
}

function DTWellness({ plantel, puedeEditar }) {
 const [abierto, setAbierto] = React.useState(null);  // nombre expandido
 const [editando, setEditando] = React.useState(null); // fecha en edición
 const { th, aplicar } = useDTSort({
  nombre: s => s.nombre, score: s => s.wellScore == null ? -1 : s.wellScore, reg: s => s.wellRegistros
 });
 const lista = aplicar(plantel);
 return (
  <Card>
   <div className="cc-pad cc-dt-tabhead">
    <h3 className="cc-card-title">Wellness diario del plantel</h3>
    <p className="cc-card-note">Calificación de 1 a 5 estrellas en todos los ítems (1 bajo · 5 mejor) → puntaje 0–100. Cada registro guarda su día: abre el historial para agregar, editar o borrar fechas. Bajo 55 genera alerta y ajusta la condición estimada.</p>
   </div>
   <div className="cc-gestion-tabla">
    <table className="cc-tabla">
     <thead>
      <tr>
       {th('Jugador', 'nombre')}
       {th('Puntaje actual', 'score')}
       {th('Último registro', null, 'cc-c')}
       {th('Registros', 'reg', 'cc-c')}
       {th('Historial', null, 'cc-c')}
      </tr>
     </thead>
     <tbody>
      {lista.map(s => {
       const w = s.well || {};
       const open = abierto === s.nombre;
       const hist = open ? CC_DT.wellHist(s.nombre) : [];
       return (
        <React.Fragment key={s.nombre}>
         <tr className={open ? 'cc-dt-tr-open' : ''}>
          <td><DTJugador s={s}></DTJugador></td>
          <td>
           <div className="cc-dt-cond">
            <div className="cc-dt-cond-bar"><span style={{ width: (s.wellScore || 0) + '%', background: dtWellColor(s.wellScore) }}></span></div>
            <span className="cc-dt-cond-num" style={{ color: dtWellColor(s.wellScore) }}>{s.wellScore != null ? s.wellScore : '—'}</span>
           </div>
          </td>
          <td className="cc-c">
           {w.fecha
            ? <span className={'cc-dt-fecha' + (s.wellVigente ? '' : ' viejo')}>{w.fecha}{s.wellVigente ? '' : ' · vencido'}</span>
            : <span className="cc-falta">Sin registro</span>}
          </td>
          <td className="cc-c">{s.wellRegistros || 0}</td>
          <td className="cc-c">
           <button className="cc-btn-mini cc-btn-ghost" onClick={() => { setAbierto(open ? null : s.nombre); setEditando(null); }}>
            {open ? 'Cerrar' : 'Abrir'}
           </button>
          </td>
         </tr>
         {open && (
          <tr className="cc-dt-hist-row">
           <td colSpan="5">
            <div className="cc-dt-hist">
             {puedeEditar && (
              <DTWellForm nombre={s.nombre}
               registro={editando ? CC_DT.wellHist(s.nombre).find(r => r.fecha === editando) : null}
               onDone={() => setEditando(null)}></DTWellForm>
             )}
             <div className="cc-dt-hist-list">
              {hist.length === 0 && <p className="cc-empty">Sin registros. {puedeEditar ? 'Usa el formulario para agregar el primero.' : ''}</p>}
              {hist.map(r => {
               const sc = CC_DT.wellScore(r);
               return (
                <div key={r.fecha} className={'cc-dt-hist-item' + (editando === r.fecha ? ' edit' : '')}>
                 <span className="cc-dt-fecha">{r.fecha}</span>
                 <span className="cc-dt-hist-vals">
                  {CC_DT.WELL_ITEMS.map(it => <em key={it.k} title={it.label}>{it.label.slice(0, 3)} {r[it.k] ? r[it.k] + '★' : '—'}</em>)}
                 </span>
                 <span className="cc-dt-cond-num" style={{ color: dtWellColor(sc) }}>{sc != null ? sc : '—'}</span>
                 {puedeEditar && (
                  <span className="cc-dt-hist-acc">
                   <button className="cc-escuela-edit" title="Editar" onClick={() => setEditando(r.fecha)}><Icon name="lapiz" size={13}></Icon></button>
                   <button className="cc-escuela-edit cc-btn-danger" title="Borrar" onClick={() => { CC_DT.delWellDia(s.nombre, r.fecha); if (editando === r.fecha) setEditando(null); }}><Icon name="basura" size={13}></Icon></button>
                  </span>
                 )}
                </div>
               );
              })}
             </div>
            </div>
           </td>
          </tr>
         )}
        </React.Fragment>
       );
      })}
     </tbody>
    </table>
   </div>
  </Card>
 );
}

// ---------- Pestaña Nutrición ----------
function DTNutricion({ plantel, puedeEditar }) {
 const setN = (n, k, v) => { if (puedeEditar) CC_DT.setNutri(n, { [k]: v }); };
 const PLANES = ['', 'Mantenimiento', 'Pérdida de grasa', 'Ganancia muscular', 'Recuperación de lesión', 'Personalizado'];
 const FASES = [{ k: 'pre', label: 'Pre-temporada' }, { k: 'mitad', label: 'Mitad de temporada' }, { k: 'reg', label: 'Temporada regular' }];
 const { th, aplicar } = useDTSort({ nombre: s => s.nombre, peso: s => s.peso, imc: s => s.imc });
 const lista = aplicar(plantel);
 return (
  <Card>
   <div className="cc-pad cc-dt-tabhead">
    <h3 className="cc-card-title">Plan nutricional del plantel</h3>
    <p className="cc-card-note">Registro manual del área de nutrición: plan, suma de pliegues cutáneos (mm) medida en cada fase de la temporada, restricciones o alergias (generan alerta en el Panel) y suplementación.</p>
   </div>
   <div className="cc-gestion-tabla">
    <table className="cc-tabla">
     <thead>
      <tr>
       <th rowSpan="2">{'Jugador'}</th>
       <th rowSpan="2" className="cc-c">Peso (kg)</th>
       <th rowSpan="2" className="cc-c">IMC</th>
       <th rowSpan="2">Plan</th>
       <th colSpan="3" className="cc-c cc-dt-th-grupo">Pliegues (mm)</th>
       <th rowSpan="2">Restricciones / alergias</th>
       <th rowSpan="2">Suplementación</th>
      </tr>
      <tr>
       {FASES.map(f => <th key={f.k} className="cc-c cc-dt-th-fase">{f.label}</th>)}
      </tr>
     </thead>
     <tbody>
      {lista.map(s => {
       const n = s.nutri || {};
       const pl = n.pliegues || {};
       return (
        <tr key={s.nombre}>
         <td><DTJugador s={s}></DTJugador></td>
         <td className="cc-c">{s.peso || '—'}</td>
         <td className="cc-c">{s.imc != null ? s.imc : '—'}</td>
         <td>
          <select className="cc-dt-wsel cc-dt-nsel" disabled={!puedeEditar} value={n.plan || ''}
           onChange={e => setN(s.nombre, 'plan', e.target.value)}>
           {PLANES.map(p => <option key={p} value={p}>{p || '—'}</option>)}
          </select>
         </td>
         {FASES.map(f => (
          <td key={f.k} className="cc-c">
           <input className="cc-input cc-dt-peso" type="number" min="30" max="200" placeholder="—" disabled={!puedeEditar}
            value={pl[f.k] || ''} title={f.label}
            onChange={e => setN(s.nombre, 'pliegues', Object.assign({}, pl, { [f.k]: e.target.value ? Number(e.target.value) : null }))}></input>
          </td>
         ))}
         <td><input className="cc-input cc-dt-ninp" disabled={!puedeEditar} placeholder="—" value={n.restricciones || ''} onChange={e => setN(s.nombre, 'restricciones', e.target.value)}></input></td>
         <td><input className="cc-input cc-dt-ninp" disabled={!puedeEditar} placeholder="—" value={n.suplementos || ''} onChange={e => setN(s.nombre, 'suplementos', e.target.value)}></input></td>
        </tr>
       );
      })}
     </tbody>
    </table>
   </div>
  </Card>
 );
}

// ---------- Página ----------
function PageDT({ usuario }) {
 const rol = (() => { try { return window.ccRolDe ? window.ccRolDe(usuario) : null; } catch (e) { return null; } })();
 const puedeEditar = rol === 'Administrador' || rol === 'Editor';
 const [tab, setTab] = React.useState('fisico');
 const [tick, setTick] = React.useState(0);
 React.useEffect(() => {
  const f = () => setTick(t => t + 1);
  window.addEventListener('cc-dt-change', f);
  return () => window.removeEventListener('cc-dt-change', f);
 }, []);

 const plantel = React.useMemo(() => CC_DT.plantelCC(), [tick]);
 const wellConDato = plantel.filter(s => s.wellScore != null && s.wellVigente);
 const wellProm = wellConDato.length ? Math.round(wellConDato.reduce((a, s) => a + s.wellScore, 0) / wellConDato.length) : null;

 const kpi = {
  disp: plantel.filter(s => s.disponible).length,
  les: plantel.filter(s => s.lesionado).length,
  sus: plantel.filter(s => s.suspendido).length,
  carga: plantel.filter(s => s.riesgoCarga).length,
  well: wellProm
 };

 return (
  <div className="cc-page">
   <PageHeader icon="dt" title="Dirección Técnica" subtitle="Centro de rendimiento del plantel · cada registro se refleja en toda la plataforma"></PageHeader>

   <div className="cc-grid-5">
    <StatCard label="Disponibles" value={kpi.disp} tone="v"></StatCard>
    <StatCard label="Lesionados" value={kpi.les} tone={kpi.les ? 'd' : 'v'}></StatCard>
    <StatCard label="Suspendidos" value={kpi.sus} tone={kpi.sus ? 'd' : 'v'}></StatCard>
    <StatCard label="Carga alta" value={kpi.carga} tone={kpi.carga ? 'd' : 'v'}></StatCard>
    <StatCard label="Wellness promedio" value={kpi.well != null ? kpi.well + '/100' : '—'} sub={kpi.well == null ? 'Sin registros vigentes' : wellConDato.length + ' con registro'} tone="accent"></StatCard>
   </div>

   <SegTabs value={tab} onChange={setTab} options={[
    { value: 'fisico', label: 'Físico y cargas' },
    { value: 'well', label: 'Wellness' },
    { value: 'nutri', label: 'Nutrición' },
    { value: 'gps', label: 'GPS Catapult' }
   ]}></SegTabs>

   {!puedeEditar && <p className="cc-card-note" style={{ padding: '0 4px' }}>Tu rol ({rol || 'Visita'}) es de solo lectura.</p>}

   {tab === 'fisico' && <DTFisico plantel={plantel} puedeEditar={puedeEditar}></DTFisico>}
   {tab === 'well' && <DTWellness plantel={plantel} puedeEditar={puedeEditar}></DTWellness>}
   {tab === 'nutri' && <DTNutricion plantel={plantel} puedeEditar={puedeEditar}></DTNutricion>}
   {tab === 'gps' && <DTGps puedeEditar={puedeEditar} usuario={usuario}></DTGps>}
  </div>
 );
}

Object.assign(window, { PageDT });
