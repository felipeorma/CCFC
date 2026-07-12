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

// ---------- Auditoría: cambios de base local y accesos ----------
const CC_AUDIT_KEY = 'cc_audit_log_v1';
const CC_AUDIT_CFG_KEY = 'cc_audit_config_v1';
function ccAuditFecha(iso) {
 if (!iso) return '—';
 try { return new Date(iso).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }); } catch (e) { return iso; }
}
function ccAuditBrowser(ua) {
 ua = ua || '';
 if (/Edg\//.test(ua)) return 'Edge';
 if (/OPR\//.test(ua) || /Opera/i.test(ua)) return 'Opera';
 if (/Chrome\//.test(ua) && !/Chromium/i.test(ua)) return 'Chrome';
 if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
 if (/Firefox\//.test(ua)) return 'Firefox';
 return 'Navegador';
}
function ccAuditWhere() {
 const nav = typeof navigator !== 'undefined' ? navigator : {};
 const loc = typeof location !== 'undefined' ? location : {};
 const ua = nav.userAgent || '';
 let zona = '';
 try { zona = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
 return {
  ruta: ((loc.origin || '') + (loc.pathname || '')) || (loc.href || ''),
  navegador: ccAuditBrowser(ua),
  plataforma: (nav.userAgentData && nav.userAgentData.platform) || nav.platform || '—',
  idioma: nav.language || '',
  zona,
  pantalla: (typeof screen !== 'undefined' && screen.width && screen.height) ? (screen.width + 'x' + screen.height) : '',
  online: nav.onLine !== false
 };
}
function ccAuditActor(usuario) {
 if (usuario) return usuario;
 try { return localStorage.getItem('cc_sesion') || 'Sistema'; } catch (e) {}
 return 'Sistema';
}
function ccLeerAudit() {
 try {
  const raw = localStorage.getItem(CC_AUDIT_KEY);
  const lista = raw ? JSON.parse(raw) : [];
  return Array.isArray(lista) ? lista : [];
 } catch (e) { return []; }
}
function ccGuardarAudit(lista) {
 try { localStorage.setItem(CC_AUDIT_KEY, JSON.stringify((lista || []).slice(0, 800))); } catch (e) {}
}
function ccAuditConfig() {
 try {
  const raw = localStorage.getItem(CC_AUDIT_CFG_KEY);
  const cfg = raw ? JSON.parse(raw) : {};
  const next = Object.assign({ webhookUrl: '', pedirGps: false }, cfg || {});
  delete next.abstractKey;
  return next;
 } catch (e) {
  return { webhookUrl: '', pedirGps: false };
 }
}
function ccGuardarAuditConfig(cfg) {
 const next = {
  webhookUrl: String((cfg && cfg.webhookUrl) || '').trim(),
  pedirGps: !!(cfg && cfg.pedirGps)
 };
 try { localStorage.setItem(CC_AUDIT_CFG_KEY, JSON.stringify(next)); } catch (e) {}
 try { window.dispatchEvent(new Event('cc-audit-change')); } catch (e) {}
}
function ccAuditCountryName(code) {
 if (!code) return '';
 const txt = String(code).trim();
 if (txt.length !== 2) return txt;
 try {
  if (typeof Intl !== 'undefined' && Intl.DisplayNames) {
   return new Intl.DisplayNames(['es'], { type: 'region' }).of(txt.toUpperCase()) || txt.toUpperCase();
  }
 } catch (e) {}
 return txt.toUpperCase();
}
function ccAuditGeoTxt(geo) {
 if (!geo) return 'Sin geolocalización';
 const partes = [geo.ciudad, geo.region, geo.pais].filter(Boolean);
 return partes.length ? partes.join(', ') : (geo.ip ? 'IP ' + geo.ip : 'Sin geolocalización');
}
function ccAuditRedTxt(geo) {
 if (!geo) return '—';
 return [geo.ip, geo.isp].filter(Boolean).join(' · ') || '—';
}
function ccAuditCoordsTxt(geo) {
 if (!geo || geo.lat == null || geo.lon == null) return '';
 return Number(geo.lat).toFixed(4) + ', ' + Number(geo.lon).toFixed(4);
}
function ccAuditActualizar(id, patch) {
 const lista = ccLeerAudit();
 const next = lista.map(x => x.id === id ? Object.assign({}, x, patch || {}, { meta: Object.assign({}, x.meta || {}, (patch && patch.meta) || {}) }) : x);
 ccGuardarAudit(next);
 const item = next.find(x => x.id === id);
 if (item) ccAuditEnviarRemoto(item);
 try { window.dispatchEvent(new Event('cc-audit-change')); } catch (e) {}
 return item;
}
function ccAuditEnviarRemoto(entry) {
 const cfg = ccAuditConfig();
 if (!cfg.webhookUrl || !/^https?:\/\//i.test(cfg.webhookUrl)) return;
 try {
  fetch(cfg.webhookUrl, { method: 'POST', mode: 'no-cors', body: JSON.stringify(entry) }).catch(function () {});
 } catch (e) {}
}
function ccAuditFetchJson(url, proveedor, normalizar) {
 const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
 const timer = ctl ? setTimeout(function () { try { ctl.abort(); } catch (e) {} }, 6500) : null;
 const opts = Object.assign({ cache: 'no-store' }, ctl ? { signal: ctl.signal } : {});
 return fetch(url, opts)
  .then(function (r) {
   if (timer) clearTimeout(timer);
   if (!r.ok) throw new Error('HTTP ' + r.status);
   return r.json();
  })
  .then(function (d) {
   const geo = Object.assign({ estado: 'ok', proveedor: proveedor }, normalizar(d) || {});
   return Object.assign(geo, { proveedor: geo.proveedor || proveedor, raw: d });
  })
  .catch(function (e) {
   if (timer) clearTimeout(timer);
   return { estado: 'error', proveedor: proveedor, error: String((e && e.message) || e) };
  });
}
function ccAuditFetchIpWho() {
 return ccAuditFetchJson('https://ipwho.is/', 'ipwho.is', function (d) {
  if (!d || d.success === false) return { estado: 'error', error: (d && d.message) || 'Respuesta inválida' };
  return {
    ip: d.ip_address || d.ip || '',
    pais: d.country || ccAuditCountryName(d.country_code),
    region: d.region || '',
    ciudad: d.city || '',
    lat: d.latitude,
    lon: d.longitude,
    zonaIp: (d.timezone && (d.timezone.id || d.timezone.name || d.timezone.abbr)) || '',
    isp: (d.connection && (d.connection.isp || d.connection.org || d.connection.organization)) || d.isp || '',
    vpn: d.security ? !!(d.security.vpn || d.security.proxy || d.security.tor) : null
   };
 });
}
function ccAuditFetchGeoJs() {
 return ccAuditFetchJson('https://get.geojs.io/v1/ip/geo.json', 'GeoJS', function (d) {
  return {
   ip: d.ip || '',
   pais: d.country || ccAuditCountryName(d.country_code),
   region: d.region || '',
   ciudad: d.city || '',
   lat: d.latitude ? Number(d.latitude) : null,
   lon: d.longitude ? Number(d.longitude) : null,
   zonaIp: d.timezone || '',
   isp: d.organization_name || d.organization || '',
   vpn: null
  };
 });
}
function ccAuditFetchIpInfo() {
 return ccAuditFetchJson('https://ipinfo.io/json', 'ipinfo.io', function (d) {
  const loc = String(d.loc || '').split(',');
  return {
   ip: d.ip || '',
   pais: ccAuditCountryName(d.country) || '',
   region: d.region || '',
   ciudad: d.city || '',
   lat: loc[0] ? Number(loc[0]) : null,
   lon: loc[1] ? Number(loc[1]) : null,
   zonaIp: d.timezone || '',
   isp: d.org || '',
   vpn: null
  };
 });
}
function ccAuditFetchDbIp() {
 return ccAuditFetchJson('https://api.db-ip.com/v2/free/self', 'db-ip', function (d) {
  return {
   ip: d.ipAddress || d.ip || '',
   pais: d.countryName || ccAuditCountryName(d.countryCode),
   region: d.stateProv || d.region || '',
   ciudad: d.city || '',
   lat: null,
   lon: null,
   zonaIp: '',
   isp: '',
   vpn: null
  };
 });
}
function ccAuditFetchGeoAuto() {
 const proveedores = [ccAuditFetchIpWho, ccAuditFetchGeoJs, ccAuditFetchIpInfo, ccAuditFetchDbIp];
 let idx = 0;
 let ultimo = null;
 const next = function () {
  if (idx >= proveedores.length) {
   return Promise.resolve({
    estado: 'error',
    proveedor: 'auto',
    error: ultimo && ultimo.error ? ultimo.error : 'No hubo respuesta de geolocalización',
    ultimoProveedor: ultimo && ultimo.proveedor
   });
  }
  const fn = proveedores[idx++];
  return fn().then(function (geo) {
   if (geo && geo.estado === 'ok' && (geo.ip || geo.pais || geo.ciudad)) return geo;
   ultimo = geo;
   return next();
  });
 };
 return next();
}
function ccAuditBrowserGps() {
 const cfg = ccAuditConfig();
 if (!cfg.pedirGps || !navigator.geolocation) return Promise.resolve(null);
 return new Promise(function (resolve) {
  let done = false;
  const finish = v => { if (!done) { done = true; resolve(v); } };
  const t = setTimeout(function () { finish({ estado: 'timeout' }); }, 7000);
  navigator.geolocation.getCurrentPosition(function (pos) {
   clearTimeout(t);
   finish({
    estado: 'ok',
    lat: pos.coords.latitude,
    lon: pos.coords.longitude,
    precisionM: Math.round(pos.coords.accuracy || 0)
   });
  }, function (err) {
   clearTimeout(t);
   finish({ estado: 'error', error: err && err.message ? err.message : 'Permiso denegado' });
  }, { enableHighAccuracy: false, timeout: 6500, maximumAge: 300000 });
 });
}
function ccAuditCompletarLogin(entryId, email) {
 ccAuditFetchGeoAuto().then(function (geo) {
  return ccAuditBrowserGps().then(function (gps) {
   const patch = { geo: geo, gps: gps, meta: { geoActualizado: new Date().toISOString() } };
   const item = ccAuditActualizar(entryId, patch);
   if (email && item) {
   try {
     const lista = ccLeerUsuarios();
     const desdeTxt = geo && geo.estado === 'ok' ? ccAuditGeoTxt(geo) : (item.navegador + ' · ' + item.plataforma);
     ccGuardarUsuarios(lista.map(u => u.email === email ? Object.assign({}, u, {
      ultimoAcceso: ccAuditFecha(item.fecha),
      ultimoAccesoDesde: desdeTxt,
      ultimoAccesoIp: geo && geo.estado === 'ok' && geo.ip ? geo.ip : '',
      ultimoAccesoRed: ccAuditRedTxt(geo)
     }) : u));
    } catch (e) {}
   }
  });
 });
}
function ccAudit(accion, entidad, detalle, usuario, meta) {
 const donde = ccAuditWhere();
 const entry = {
  id: 'audit-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
  fecha: new Date().toISOString(),
  usuario: ccAuditActor(usuario),
  accion: accion || 'editar',
  entidad: entidad || 'Base de datos',
  detalle: detalle || '',
  ruta: donde.ruta,
  navegador: donde.navegador,
  plataforma: donde.plataforma,
  idioma: donde.idioma,
  zona: donde.zona,
  pantalla: donde.pantalla,
  online: donde.online,
  meta: meta || null
 };
 ccGuardarAudit([entry, ...ccLeerAudit()]);
 ccAuditEnviarRemoto(entry);
 try { window.dispatchEvent(new Event('cc-audit-change')); } catch (e) {}
 return entry;
}
function ccAuditAccionTxt(a) {
 return ({ crear: 'Agregó', editar: 'Editó', eliminar: 'Eliminó', login: 'Ingresó', exportar: 'Exportó', restaurar: 'Restauró', descargar: 'Descargó', pausar: 'Pausó' })[a] || a || 'Cambio';
}

// ---------------- Informes de Scouting ----------------
function ccLeerInformes() {
 try {
  const raw = localStorage.getItem('cc_informes_v1');
  if (raw) { const x = JSON.parse(raw); if (Array.isArray(x)) return x; }
 } catch (e) {}
 return [];
}
function ccPdfHref(r) {
 if (!r) return '';
 const href = r.pdfUrl || r.pdfData || r.pdfHref || r.pdfLink || r.pdf;
 if (!href) return '';
 return /^(https?:|data:application\/pdf|blob:)/i.test(href) ? href : '';
}
function ccPdfNombre(r) {
 const n = (r && (r.pdfNombre || r.pdfName || r.pdf)) || 'Informe PDF';
 return /^data:/i.test(n) ? 'Informe PDF' : n;
}
function ccPdfCorto(r) {
 const n = ccPdfNombre(r);
 return n.length > 22 ? n.slice(0, 20) + '…' : n;
}

// Extracción "mejor esfuerzo" de la ficha de Transfermarkt vía proxy CORS público
// (el navegador no puede llamar a transfermarkt.es directamente por CORS/anti-bot).
async function ccScrapeTransfermarkt(profileUrl) {
 const proxies = [
  u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
  u => 'https://corsproxy.io/?url=' + encodeURIComponent(u),
  u => 'https://thingproxy.freeboard.io/fetch/' + u
 ];
 let html = null, err;
 for (const mk of proxies) {
  try {
   const res = await fetch(mk(profileUrl), { headers: { 'Accept': 'text/html,*/*' } });
   if (!res.ok) throw new Error('HTTP ' + res.status);
   const t = await res.text();
   if (t && t.length > 1500 && /data-header|transfermarkt/i.test(t)) { html = t; break; }
   throw new Error('respuesta vacía o bloqueada');
  } catch (e) { err = e; }
 }
 if (!html) throw err || new Error('sin respuesta');
 const doc = new DOMParser().parseFromString(html, 'text/html');
 const clean = s => (s || '').replace(/\s+/g, ' ').trim();
 const abs = u => !u ? null : u.startsWith('//') ? 'https:' + u : u;
 const best = img => {
  if (!img) return null;
  const ss = img.getAttribute('srcset');
  if (ss) return ss.split(',').pop().trim().split(' ')[0];
  return img.getAttribute('data-src') || img.getAttribute('src');
 };
 const head = doc.querySelector('.data-header') || doc;
 const bump = u => u ? u.replace('/verytiny/', '/normal/').replace('/tiny/', '/normal/').replace('/small/', '/normal/') : u;
 const h1 = doc.querySelector('h1.data-header__headline-wrapper');
 let nombre = h1 ? clean(h1.textContent).replace(/^#\d+\s*/, '') : null;
 let fotoUrl = abs(best(doc.querySelector('img.data-header__profile-image')));
 if (fotoUrl && /default\.(jpg|png)/i.test(fotoUrl)) fotoUrl = null; // placeholder sin foto real
 let clubA = head.querySelector('span.data-header__club a[href*="/verein/"]') || head.querySelector('a[href*="/startseite/verein/"]');
 let club = null, escudoUrl = null;
 if (clubA) {
  club = clean(clubA.getAttribute('title') || clubA.textContent);
  const ci = clubA.querySelector('img');
  if (ci) { club = club || ci.getAttribute('alt'); escudoUrl = abs(best(ci)); }
 }
 // Fallback robusto: los escudos de club viven en /wappen/
 if (!escudoUrl) {
  const w = doc.querySelector('img[src*="/wappen/"], img[data-src*="/wappen/"], img[srcset*="/wappen/"]');
  if (w) escudoUrl = abs(best(w));
 }
 escudoUrl = bump(escudoUrl);
 let liga = null, ligaUrl = null;
 const lA = [...head.querySelectorAll('a[href*="/startseite/wettbewerb/"]')].find(a => clean(a.textContent));
 if (lA) { liga = clean(lA.textContent); const li = lA.querySelector('img'); if (li) ligaUrl = bump(abs(best(li))); }
 return { nombre, fotoUrl, club, escudoUrl, liga, ligaUrl };
}

// Selector en cascada País → Liga → Equipo (catálogo cacheado)
function CatalogoPicker({ value, onChange }) {
 const cat = window.CC_CATALOGO;
 const [paises, setPaises] = p4State(() => (cat && cat.paisesCache()) || []);
 const [ligas, setLigas] = p4State(() => (cat && value.paisId && cat.ligasCache(value.paisId)) || []);
 const [equipos, setEquipos] = p4State(() => (cat && value.ligaId && cat.equiposCache(value.ligaId)) || []);
 const [cargando, setCargando] = p4State(null);
 const [err, setErr] = p4State(false);

 p4Effect(() => {
  if (!cat || paises.length) return;
  setCargando('paises'); setErr(false);
  cat.paises().then(p => { setPaises(p); setCargando(null); }).catch(() => { setCargando(null); setErr(true); });
 }, []);

 const pickPais = id => {
  const p = paises.find(x => String(x.id) === String(id));
  onChange({ paisId: id, pais: p ? p.nombre : '', ligaId: '', liga: '', equipoId: '', club: '' });
  setLigas([]); setEquipos([]);
  if (!id || !cat) return;
  const c = cat.ligasCache(id);
  if (c) { setLigas(c); return; }
  setCargando('ligas'); setErr(false);
  cat.ligas(id).then(l => { setLigas(l); setCargando(null); }).catch(() => { setCargando(null); setErr(true); });
 };
 const pickLiga = id => {
  const l = ligas.find(x => String(x.id) === String(id));
  onChange({ ligaId: id, liga: l ? l.nombre : '', equipoId: '', club: '' });
  setEquipos([]);
  if (!id || !cat) return;
  const c = cat.equiposCache(id);
  if (c) { setEquipos(c); return; }
  setCargando('equipos'); setErr(false);
  cat.equipos(id).then(e => { setEquipos(e); setCargando(null); }).catch(() => { setCargando(null); setErr(true); });
 };
 const pickEquipo = id => {
  const e = equipos.find(x => String(x.id) === String(id));
  onChange({ equipoId: id, club: e ? e.nombre : '' });
 };
 const opt = (arr, ph) => [{ value: '', label: ph }, ...arr.map(x => ({ value: String(x.id), label: x.nombre }))];

 return (
  <div className="cc-cat-picker">
   <div className="cc-form-grid">
    <label className="cc-select-wrap"><span className="cc-select-label">País {cargando === 'paises' && '·…'}</span>
     <Select value={value.paisId || ''} onChange={pickPais} options={opt(paises, paises.length ? 'Selecciona país' : 'Cargando…')}></Select>
    </label>
    <label className="cc-select-wrap"><span className="cc-select-label">Liga {cargando === 'ligas' && '·…'}</span>
     <Select value={value.ligaId || ''} onChange={pickLiga} options={opt(ligas, value.paisId ? (ligas.length ? 'Selecciona liga' : 'Cargando…') : 'Elige país primero')}></Select>
    </label>
    <label className="cc-select-wrap"><span className="cc-select-label">Equipo {cargando === 'equipos' && '·…'}</span>
     <Select value={value.equipoId || ''} onChange={pickEquipo} options={opt(equipos, value.ligaId ? (equipos.length ? 'Selecciona equipo' : 'Cargando…') : 'Elige liga primero')}></Select>
    </label>
   </div>
   {err && <p className="cc-tm-msg cc-tm-err"><Icon name="alerta" size={13}></Icon> No se pudo consultar. Escribe el club manualmente abajo.</p>}
  </div>
 );
}

function FormInforme({ onGuardar, onCancelar, inicial }) {
 const base = {
  jugador: '', club: CC_DATA.equipos[0].nombre, posicion: 'CF', edad: 20,
  partido: '', video: '', pdf: '', pdfUrl: '', pdfSize: 0, fortalezas: '', debilidades: '',
  transfermarkt: '', liga: '', fotoUrl: '', escudoUrl: '', ligaUrl: '',
  recomendacion: 'Seguir observando', prioridad: 'Media',
  ratings: { 'Técnica': 3, 'Táctica': 3, 'Física': 3, 'Mental': 3 }
 };
 const [f, setF] = p4State(() => inicial ? Object.assign({}, base, inicial) : base);
 const [tmEstado, setTmEstado] = p4State(null); // null | 'cargando' | 'ok' | 'error'
 const [pdfEstado, setPdfEstado] = p4State(null); // null | 'leyendo' | 'ok' | 'error'
 const set = (k, v) => setF(prev => Object.assign({}, prev, { [k]: v }));
 const setRating = (k, v) => setF(prev => Object.assign({}, prev, { ratings: Object.assign({}, prev.ratings, { [k]: v }) }));
 const posiciones = [...new Set(CC_DATA.jugadores.map(j => j.posicion))].filter(p => p && p !== '—').sort();

 const autoTM = async () => {
  if (!f.transfermarkt.trim()) return;
  setTmEstado('cargando');
  try {
   const d = await ccScrapeTransfermarkt(f.transfermarkt.trim());
   setF(prev => Object.assign({}, prev, {
    jugador: prev.jugador || d.nombre || '',
    liga: d.liga || prev.liga,
    fotoUrl: d.fotoUrl || prev.fotoUrl,
    escudoUrl: d.escudoUrl || prev.escudoUrl,
    ligaUrl: d.ligaUrl || prev.ligaUrl
   }));
   setTmEstado(d.fotoUrl || d.escudoUrl || d.liga ? 'ok' : 'error');
  } catch (e) { setTmEstado('error'); }
 };

 const cargarPdf = e => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  setPdfEstado('leyendo');
  const fr = new FileReader();
  fr.onload = () => {
   setF(prev => Object.assign({}, prev, { pdf: file.name, pdfUrl: fr.result, pdfSize: file.size }));
   setPdfEstado('ok');
  };
  fr.onerror = () => setPdfEstado('error');
  fr.readAsDataURL(file);
 };

 const enviar = e => {
  e.preventDefault();
  if (!f.jugador.trim()) return;
  onGuardar(Object.assign({}, f, {
   jugador: f.jugador.trim(),
   edad: Number(f.edad) || 0,
   fecha: inicial && inicial.fecha ? inicial.fecha : new Date().toISOString().slice(0, 10),
   scout: inicial && inicial.scout ? inicial.scout : 'Área de Scouting'
  }));
 };

 return (
  <Card className="cc-pad cc-form-informe">
   <h3 className="cc-card-title">{inicial ? 'Editar informe de scouting' : 'Nuevo informe de scouting'}</h3>
   <form onSubmit={enviar}>
    <div className="cc-form-grid">
     <label className="cc-select-wrap">
      <span className="cc-select-label">Jugador *</span>
      <input className="cc-input" value={f.jugador} onChange={e => set('jugador', e.target.value)} placeholder="Nombre del jugador"></input>
     </label>
     <Select label="Posición" value={f.posicion} onChange={v => set('posicion', v)} options={posiciones}></Select>
     <label className="cc-select-wrap" style={{ minWidth: '90px' }}>
      <span className="cc-select-label">Edad</span>
      <input className="cc-input" type="number" min="15" max="45" value={f.edad} onChange={e => set('edad', e.target.value)}></input>
     </label>
    </div>

    <div className="cc-cat-block">
     <span className="cc-esc-sub"><Icon name="buscar" size={13}></Icon> País → Liga → Equipo (catálogo)</span>
     <CatalogoPicker value={f} onChange={patch => setF(prev => Object.assign({}, prev, patch))}></CatalogoPicker>
     <label className="cc-select-wrap">
      <span className="cc-select-label">Club {f.club ? '' : '(o escríbelo a mano)'}</span>
      <input className="cc-input" value={f.club || ''} onChange={e => set('club', e.target.value)} placeholder="Club del jugador"></input>
     </label>
    </div>

    <div className="cc-form-grid">
     <label className="cc-select-wrap" style={{ gridColumn: '1 / -1' }}>
      <span className="cc-select-label">Notas acerca del jugador</span>
      <textarea className="cc-input cc-textarea" value={f.partido} onChange={e => set('partido', e.target.value)} rows="2" placeholder="Observaciones generales, contexto, en qué partido se le vio…"></textarea>
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
      <span className="cc-select-label">Link de video (YouTube,…)</span>
     <input className="cc-input" type="url" value={f.video} onChange={e => set('video', e.target.value)} placeholder="https://…"></input>
     </label>
     <label className="cc-select-wrap">
      <span className="cc-select-label">Adjuntar PDF</span>
      <input
       className="cc-input cc-input-file" type="file" accept="application/pdf"
       onChange={cargarPdf}
      ></input>
      {f.pdf && (
       <span className="cc-pdf-form-status">
        {ccPdfHref(f)
         ? <a href={ccPdfHref(f)} target="_blank" rel="noopener noreferrer"><Icon name="pdf" size={12}></Icon> {ccPdfCorto(f)}</a>
         : <span><Icon name="pdf" size={12}></Icon> {ccPdfCorto(f)}</span>}
        {pdfEstado === 'leyendo' && <em>Leyendo PDF…</em>}
        {pdfEstado === 'ok' && <em>PDF listo para ver o descargar.</em>}
        {pdfEstado === 'error' && <em className="cc-falta">No se pudo leer el PDF.</em>}
       </span>
      )}
     </label>
     <Select label="Recomendación" value={f.recomendacion} onChange={v => set('recomendacion', v)} options={['Fichar', 'Seguir observando', 'Descartar']}></Select>
     <Select label="Prioridad" value={f.prioridad} onChange={v => set('prioridad', v)} options={['Alta', 'Media', 'Baja']}></Select>
    </div>

    <div className="cc-tm-fieldset">
     <div className="cc-tm-fieldset-head">
      <span className="cc-esc-sub"><Icon name="buscar" size={13}></Icon> Ficha Transfermarkt (opcional)</span>
      <span className="cc-tm-hint">Pega el link del perfil y pulsa “Obtener datos” para autocompletar liga, foto, escudo y logo. Si el servicio no responde, completa las URLs a mano (clic derecho → “Copiar dirección de imagen” en la página del jugador).</span>
     </div>
     <div className="cc-form-grid">
      <label className="cc-select-wrap" style={{ gridColumn: '1 / -1' }}>
       <span className="cc-select-label">Link Transfermarkt</span>
       <div className="cc-tm-link-row">
        <input className="cc-input" type="url" value={f.transfermarkt} onChange={e => set('transfermarkt', e.target.value)} placeholder="https://www.transfermarkt.es/.../profil/spieler/..."></input>
        <button type="button" className="cc-btn-primary cc-tm-fetch" onClick={autoTM} disabled={!f.transfermarkt.trim() || tmEstado === 'cargando'}>
         {tmEstado === 'cargando' ? 'Obteniendo…' : 'Obtener datos'}
        </button>
       </div>
      </label>
     </div>
     {tmEstado === 'ok' && <p className="cc-tm-msg cc-tm-ok"><Icon name="check" size={13}></Icon> Datos obtenidos desde Transfermarkt. Revisa y ajusta si es necesario.</p>}
     {tmEstado === 'error' && <p className="cc-tm-msg cc-tm-err"><Icon name="alerta" size={13}></Icon> No se pudo leer el perfil automáticamente (Transfermarkt bloqueó la consulta). Completa las URLs manualmente.</p>}
     <div className="cc-form-grid">
      <label className="cc-select-wrap">
       <span className="cc-select-label">Liga actual</span>
       <input className="cc-input" value={f.liga} onChange={e => set('liga', e.target.value)} placeholder="Ej: Primera División de Chile"></input>
      </label>
      <label className="cc-select-wrap">
       <span className="cc-select-label">URL foto del jugador</span>
       <input className="cc-input" type="url" value={f.fotoUrl} onChange={e => set('fotoUrl', e.target.value)} placeholder="https://img.a.transfermarkt.technology/…"></input>
      </label>
      <label className="cc-select-wrap">
       <span className="cc-select-label">URL escudo del club</span>
       <input className="cc-input" type="url" value={f.escudoUrl} onChange={e => set('escudoUrl', e.target.value)} placeholder="https://tmssl.akamaized.net/…"></input>
      </label>
      <label className="cc-select-wrap">
       <span className="cc-select-label">URL logo de la liga</span>
       <input className="cc-input" type="url" value={f.ligaUrl} onChange={e => set('ligaUrl', e.target.value)} placeholder="https://tmssl.akamaized.net/…"></input>
      </label>
     </div>
     {(f.fotoUrl || f.escudoUrl || f.ligaUrl) && (
      <div className="cc-tm-preview">
       {f.fotoUrl && <img src={f.fotoUrl} alt="Jugador" className="cc-tm-prev-foto" onError={e => { e.target.style.display = 'none'; }}></img>}
       {f.escudoUrl && <img src={f.escudoUrl} alt="Club" className="cc-tm-prev-logo" onError={e => { e.target.style.display = 'none'; }}></img>}
       {f.ligaUrl && <img src={f.ligaUrl} alt="Liga" className="cc-tm-prev-logo" onError={e => { e.target.style.display = 'none'; }}></img>}
       <span className="cc-tm-prev-nota">Vista previa</span>
      </div>
     )}
    </div>

    <div className="cc-form-acciones">
     <button type="submit" className="cc-btn-primary" style={{ width: 'auto' }}>{inicial ? 'Guardar cambios' : 'Guardar informe'}</button>
     <button type="button" className="cc-btn-ghost" onClick={onCancelar}>Cancelar</button>
    </div>
   </form>
  </Card>
 );
}

function PageScouting({ usuario }) {
 const rol = (() => { try { return window.ccRolDe ? window.ccRolDe(usuario) : null; } catch (e) { return null; } })();
 const puedeEditar = rol === 'Administrador' || rol === 'Editor';
 const [filtroRec, setFiltroRec] = p4State('Todas');
 const [filtroPos, setFiltroPos] = p4State('Todas');
 const [abierto, setAbierto] = p4State(null);
 const [creando, setCreando] = p4State(false);
 const [editando, setEditando] = p4State(null);  // key del informe en edición
 const [propios, setPropios] = p4State(ccLeerInformes);
 const [overrides, setOverrides] = p4State(() => { try { return JSON.parse(localStorage.getItem('cc_scout_overrides_v1')) || {}; } catch (e) { return {}; } });
 const [notas, setNotas] = p4State(() => { try { return JSON.parse(localStorage.getItem('cc_scout_notas_v1')) || {}; } catch (e) { return {}; } });
 const [ocultos, setOcultos] = p4State(() => { try { return JSON.parse(localStorage.getItem('cc_scout_ocultos_v1')) || []; } catch (e) { return []; } });
 const [notaTxt, setNotaTxt] = p4State('');

 const keyOf = r => r.jugador + '|' + r.fecha;
 const aplicar = r => { const ov = overrides[keyOf(r)]; return ov ? Object.assign({}, r, ov) : r; };

 const todos = [...propios, ...CC_DATA.informes].map(aplicar).filter(r => !ocultos.includes(keyOf(r)));
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
  ccAudit('crear', 'Informe de scouting', informe.jugador + ' · ' + (informe.club || 'Sin club'), usuario);
  setCreando(false);
  setAbierto(informe.jugador);
 };

 const eliminar = r => {
  const key = keyOf(r);
  if (propios.some(p => keyOf(p) === key)) {
   const nuevos = propios.filter(p => keyOf(p) !== key);
   setPropios(nuevos);
   try { localStorage.setItem('cc_informes_v1', JSON.stringify(nuevos)); } catch (e) {}
  } else {
   const next = [...ocultos, key];
   setOcultos(next);
   try { localStorage.setItem('cc_scout_ocultos_v1', JSON.stringify(next)); } catch (e) {}
  }
  ccAudit('eliminar', 'Informe de scouting', r.jugador + ' · ' + (r.club || 'Sin club'), usuario);
 };

 const guardarEdicion = (key, datos) => {
  const propio = propios.find(p => keyOf(p) === key);
  if (propio) {
   const nuevos = propios.map(p => keyOf(p) === key ? Object.assign({}, p, datos) : p);
   setPropios(nuevos);
   try { localStorage.setItem('cc_informes_v1', JSON.stringify(nuevos)); } catch (e) {}
  } else {
   const next = Object.assign({}, overrides, { [key]: datos });
   setOverrides(next);
   try { localStorage.setItem('cc_scout_overrides_v1', JSON.stringify(next)); } catch (e) {}
  }
  ccAudit('editar', 'Informe de scouting', (datos.jugador || key.split('|')[0]) + ' · ' + (datos.club || 'Sin club'), usuario);
  setEditando(null);
 };

 const agregarNota = key => {
  const t = notaTxt.trim();
  if (!t) return;
  const lista = [...(notas[key] || []), { autor: usuario, texto: t, fecha: new Date().toISOString() }];
  const next = Object.assign({}, notas, { [key]: lista });
  setNotas(next);
  try { localStorage.setItem('cc_scout_notas_v1', JSON.stringify(next)); } catch (e) {}
  ccAudit('crear', 'Nota scouting', key.split('|')[0] + ' · ' + t.slice(0, 60), usuario);
  setNotaTxt('');
 };

 return (
  <div className="cc-page">
   <PageHeader
    icon="scouting" title="Informes de Scouting"
    subtitle="Seguimiento de jugadores objetivo · elaborados por el área de scouting"
    right={puedeEditar ? (
     <button className="cc-btn-primary" style={{ width: 'auto' }} onClick={() => setCreando(!creando)}>
      <Icon name="mas" size={15}></Icon> Nuevo informe
     </button>
    ) : null}
   ></PageHeader>

   {creando && puedeEditar && <FormInforme onGuardar={guardar} onCancelar={() => setCreando(false)}></FormInforme>}

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
     const key = keyOf(r);
     if (editando === key) {
      return <FormInforme key={key} inicial={r} onGuardar={datos => guardarEdicion(key, datos)} onCancelar={() => setEditando(null)}></FormInforme>;
     }
     const hilo = [
      ...(r.partido ? [{ autor: r.scout || 'Área de Scouting', texto: r.partido, fecha: r.fecha }] : []),
      ...(notas[key] || [])
     ];
     return (
      <Card key={r.jugador + r.fecha} className="cc-pad cc-scout-card">
       <div className="cc-scout-head">
        <div className="cc-scout-head-id">
         {r.fotoUrl && <img src={r.fotoUrl} alt={r.jugador} className="cc-scout-foto" onError={e => { e.target.style.display = 'none'; }}></img>}
         <div>
          <h3>{r.jugador}</h3>
          <p className="cc-scout-meta">{r.posicion} · {r.edad} años · {r.club}</p>
          {(r.escudoUrl || r.ligaUrl || r.liga) && (
           <p className="cc-scout-clubliga">
            {r.escudoUrl && <img src={r.escudoUrl} alt="" onError={e => { e.target.style.display = 'none'; }}></img>}
            {r.ligaUrl && <img src={r.ligaUrl} alt="" onError={e => { e.target.style.display = 'none'; }}></img>}
            {r.liga && <span>{r.liga}</span>}
           </p>
          )}
         </div>
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
        {r.pdf && (() => {
         const pdfHref = ccPdfHref(r);
         return pdfHref ? (
          <React.Fragment>
           <a className="cc-pill cc-pill-link" href={pdfHref} target="_blank" rel="noopener noreferrer" title={'Ver ' + ccPdfNombre(r)}>
            <Icon name="pdf" size={12}></Icon> Ver PDF
           </a>
           <a className="cc-pill cc-pill-link cc-pill-icon" href={pdfHref} download={ccPdfNombre(r)} title={'Descargar ' + ccPdfNombre(r)}>
            <Icon name="descargar" size={12}></Icon> Descargar
           </a>
          </React.Fragment>
         ) : (
          <span className="cc-pill cc-pill-pendiente" title="Este informe solo tiene el nombre del archivo. Vuelve a adjuntar el PDF para poder verlo o descargarlo.">
           <Icon name="pdf" size={12}></Icon> {ccPdfCorto(r)}
          </span>
         );
        })()}
        {r.transfermarkt && (
         <a className="cc-pill cc-pill-link" href={r.transfermarkt} target="_blank" rel="noopener noreferrer">
          <Icon name="buscar" size={12}></Icon> Transfermarkt
         </a>
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
         {r.fortalezas && <p><strong>Fortalezas:</strong> {r.fortalezas}</p>}
         {r.debilidades && <p><strong>Aspectos a mejorar:</strong> {r.debilidades}</p>}
         <div className="cc-scout-notas">
          <span className="cc-esc-sub"><Icon name="reporte" size={13}></Icon> Notas acerca del jugador</span>
          {hilo.length === 0 && <p className="cc-empty">Sin notas todavía.</p>}
          {hilo.map((n, k) => (
           <div key={k} className="cc-scout-nota">
            <div className="cc-scout-nota-head">
             <span className="cc-scout-nota-autor">{n.autor}</span>
             <span className="cc-scout-nota-fecha">{(n.fecha || '').slice(0, 10)}</span>
            </div>
            <p className="cc-scout-nota-txt">{n.texto}</p>
           </div>
          ))}
          <div className="cc-scout-nota-form">
           <textarea className="cc-input cc-textarea" rows="2" placeholder={'Agregar una nota como ' + usuario + '…'} value={abierto === r.jugador ? notaTxt : ''} onChange={e => setNotaTxt(e.target.value)}></textarea>
           <button className="cc-btn-primary" style={{ width: 'auto' }} onClick={() => agregarNota(key)} disabled={!notaTxt.trim()}>
            <Icon name="mas" size={14}></Icon> Agregar nota
           </button>
          </div>
         </div>
         <p className="cc-scout-firma">Informe creado por {r.scout} · {r.fecha}</p>
        </div>
       )}
       <div className="cc-scout-pie">
        <button className="cc-btn-ghost" onClick={() => { setAbierto(open ? null : r.jugador); setNotaTxt(''); }}>
         {open ? 'Ocultar informe' : 'Ver informe completo'}
        </button>
        {puedeEditar && (
         <button className="cc-btn-ghost" onClick={() => setEditando(key)} title="Editar informe">
          <Icon name="lapiz" size={14}></Icon> Editar
         </button>
        )}
        {puedeEditar && (
         <button className="cc-btn-ghost cc-btn-peligro" onClick={() => { if (window.confirm('¿Eliminar el informe de ' + r.jugador + '?')) eliminar(r); }} title="Eliminar informe">
          <Icon name="basura" size={14}></Icon> Eliminar
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
 return (CC_DATA.equipos || [])
  .map(function (e) { return e.nombre; })
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
    archivo: 'TeamStats_' + nombre.replace(/[^A-Za-z0-9]+/g, '') + '.xlsx',
    fecha: '2026-06-11'
   };
  }),
  players: { archivo: CC_DATA.datasets[1].archivo, detalle: CC_DATA.datasets[1].detalle, fecha: '2026-06-11' },
  extra: []
 };
}
function ccDatasetsKey(t) { return !t || t === '2026' ? 'cc_datasets_v1' : 'cc_datasets_' + t + '_v1'; }
function ccLeerDatasets(t) {
 try {
  const d = JSON.parse(localStorage.getItem(ccDatasetsKey(t)) || 'null');
  if (d && Array.isArray(d.teamFiles)) return d;
 } catch (e) {}
 if (t && t !== '2026') return { teamFiles: [], players: null, extra: [] };
 return ccDatasetsDefault();
}
function ccGuardarDatasets(d, t) {
 try { localStorage.setItem(ccDatasetsKey(t), JSON.stringify(d)); } catch (e) {}
}
function ccHoyISO() { return new Date().toISOString().slice(0, 10); }

function GestorDatos({ temporada }) {
 const [ds, setDs] = p4State(() => ccLeerDatasets(temporada));
 const [tipoSubida, setTipoSubida] = p4State('team');
 const [equipoSel, setEquipoSel] = p4State(() => (ccEquiposDe(temporada)[0] || ''));
 const [arrastrando, setArrastrando] = p4State(false);
 const [msg, setMsg] = p4State(null);
 React.useEffect(() => { setDs(ccLeerDatasets(temporada)); setEquipoSel(ccEquiposDe(temporada)[0] || ''); setMsg(null); }, [temporada]);

 const persistir = next => { setDs(next); ccGuardarDatasets(next, temporada); };
 const equipos = ccEquiposDe(temporada);

 const registrarTeam = (file, equipo) => {
  const entry = { id: equipo, equipo: equipo, archivo: file.name, fecha: ccHoyISO() };
  const resto = (ds.teamFiles || []).filter(t => t.id !== equipo);
  persistir({ ...ds, teamFiles: [entry, ...resto].sort((a, b) => a.equipo.localeCompare(b.equipo, 'es')) });
  ccAudit('editar', 'Wyscout Team Stats', equipo + ' · ' + file.name + ' · temporada ' + temporada);
  setMsg({ tipo: 'ok', texto: 'Team Stats de ' + equipo + ' actualizado (' + file.name + ').' });
 };
 const registrar = (file, tipo) => {
  if (tipo === 'team') { registrarTeam(file, equipoSel); return; }
  if (tipo === 'players') {
   persistir({ ...ds, players: { archivo: file.name, detalle: Math.round(file.size / 1024) + ' KB · subido por el usuario', fecha: ccHoyISO() } });
   ccAudit('editar', 'Wyscout jugadores', file.name + ' · temporada ' + temporada);
   setMsg({ tipo: 'ok', texto: '«' + file.name + '» guardado en la temporada ' + temporada + '.' });
   return;
  }
  persistir({ ...ds, extra: [{ id: Date.now(), nombre: file.name, tipo: 'Adicional', fecha: ccHoyISO() }, ...(ds.extra || [])] });
  ccAudit('crear', 'Archivo adicional', file.name + ' · temporada ' + temporada);
  setMsg({ tipo: 'ok', texto: '«' + file.name + '» guardado como archivo adicional.' });
 };

 const onDrop = e => {
  e.preventDefault();
  setArrastrando(false);
  Array.from(e.dataTransfer.files || []).forEach(f => registrar(f, tipoSubida));
 };

 const eliminarTeam = id => {
  const item = (ds.teamFiles || []).find(t => t.id === id);
  persistir({ ...ds, teamFiles: (ds.teamFiles || []).filter(t => t.id !== id) });
  ccAudit('eliminar', 'Wyscout Team Stats', (item ? item.equipo + ' · ' + item.archivo : id) + ' · temporada ' + temporada);
 };
 const eliminarPlayers = () => {
  const archivo = ds.players && ds.players.archivo;
  persistir({ ...ds, players: null });
  ccAudit('eliminar', 'Wyscout jugadores', (archivo || 'Archivo de jugadores') + ' · temporada ' + temporada);
  setMsg({ tipo: 'ok', texto: 'Estadísticas de jugadores eliminadas.' });
 };
 const eliminarExtra = id => {
  const item = (ds.extra || []).find(x => x.id === id);
  persistir({ ...ds, extra: (ds.extra || []).filter(x => x.id !== id) });
  ccAudit('eliminar', 'Archivo adicional', (item ? item.nombre : id) + ' · temporada ' + temporada);
 };

 const totalEquipos = equipos.length;
 const cargados = (ds.teamFiles || []).length;

 return (
  <React.Fragment>
   <Card className="cc-pad">
    <div className="cc-chart-head">
     <h3 className="cc-card-title">1 · Team Stats (un archivo por equipo)</h3>
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
    <p className="cc-card-note"><strong>Regla de precisión:</strong> el club de cada jugador se toma de la columna «Equipo durante el período seleccionado» del Excel de Wyscout (no de la columna «Equipo»), para reflejar traspasos y cesiones dentro de la temporada.</p>
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

// Acciones por jugador: descarga DESDE LA PLATAFORMA (misma vía que la
// tabla y los shotmaps). Lista por partido con estado, descarga individual,
// alta de partidos nuevos por link + jornada, y export del archivo.
function AccionesScript() {
 const [, setTick] = p4State(0);
 React.useEffect(() => {
  const f = () => setTick(t => t + 1);
  window.addEventListener('cc-actions-dl', f);
  return () => window.removeEventListener('cc-actions-dl', f);
 }, []);
 const dl = window.CC_ACTIONS_DL || null;
 const st = dl ? dl.estado() : { activo: false, msg: '', error: null, quota: false };
 const res = dl ? dl.resumen() : { conEventos: 0, total: 0, completos: 0, pendientes: 0 };
 const listaPartidos = dl ? dl.lista() : [];
 const [urlNuevo, setUrlNuevo] = p4State('');
 const [jNuevo, setJNuevo] = p4State('16');
 const [avisoLink, setAvisoLink] = p4State('');
 const [verCmd, setVerCmd] = p4State(false);
 const [ruta, setRuta] = p4State(() => { try { return localStorage.getItem('cc_ruta_carpeta_v1') || '~/Desktop/colocoloapp/ColoColo'; } catch (e) { return '~/Desktop/colocoloapp/ColoColo'; } });
 const [copiado, setCopiado] = p4State(false);
 const rutaSh = ruta.trim().includes(' ') ? '"' + ruta.trim() + '"' : ruta.trim();
 const cmd = 'cd ' + rutaSh + ' && python3.11 scripts/update_player_actions.py';
 const copiar = () => { const fin = () => { setCopiado(true); setTimeout(() => setCopiado(false), 1600); }; try { navigator.clipboard.writeText(cmd).then(fin, fin); } catch (e) { fin(); } };
 const fxDe = j => { let out = null; try { (CC_DATA.fixture || []).forEach(x => { if (x && String(x.j) === String(j)) out = x; }); } catch (e) {} return out; };
 const EST = { completo: ['Completado', 'cc-pill-v'], parcial: ['Parcial', 'cc-pill-pendiente'], pendiente: ['Pendiente', 'cc-pill-gris'] };

 return (
  <Card className="cc-pad">
   <div className="cc-chart-head">
    <h3 className="cc-card-title">Acciones por jugador</h3>
    <span className={'cc-pill ' + (res.total && res.completos >= res.total ? 'cc-pill-v' : 'cc-pill-pendiente')}>{res.completos} de {res.total} completados</span>
   </div>
   <p className="cc-card-note">Descarga desde la plataforma los eventos espaciales de cada jugador (pases, centros, regates, defensivas…). Va guardando a medida que avanza: si se corta o pausas, retoma <strong>solo lo faltante</strong>. Un partido queda <strong>Completado</strong> cuando todos sus jugadores con minutos tienen sus eventos. Al final usa «Exportar archivo» y reemplaza <code>app/cc-actions-data.js</code> en tu carpeta para dejarlo permanente.</p>

   <div className="cc-cat-acciones">
    {!st.activo
     ? <button className="cc-btn-primary" style={{ width: 'auto' }} onClick={() => dl && dl.descargar()} disabled={!dl || res.pendientes === 0}>
        {res.pendientes > 0 ? 'Descargar todos los pendientes (' + res.pendientes + ')' : 'Todo completado ✓'}
       </button>
     : <button className="cc-btn-ghost" onClick={() => dl && dl.cancelar()}>Pausar</button>}
    {res.conEventos > 0 && <button className="cc-btn-ghost" onClick={() => dl && dl.exportar()}>Exportar archivo (cc-actions-data.js)</button>}
   </div>

   {(st.activo || st.msg) ? (
    <div className={'cc-dl-status' + (st.activo ? ' activo' : '')}>
     {st.activo && <span className="cc-dl-spin"></span>}
     <span>{st.msg}</span>
    </div>
   ) : null}
   {st.quota && <p className="cc-card-note" style={{ color: 'var(--rojo)' }}>El almacenamiento del navegador está lleno: exporta el archivo ahora para no perder lo descargado.</p>}

   <div className="cc-dl-lista">
    {listaPartidos.map(p => {
     const f = fxDe(p.j);
     const par = EST[p.estado] || EST.pendiente;
     return (
      <div key={p.eventId} className={'cc-dl-row' + (p.estado === 'completo' ? ' ok' : '')}>
       <span className="cc-dl-row-j">F{p.j}</span>
       <span className="cc-dl-row-rival">{f ? (f.local ? 'vs ' : '@ ') + f.rival : 'Partido ' + p.eventId}</span>
       <span className={'cc-pill ' + par[1]}>{par[0]}{p.estado === 'completo' ? ' ✓' : ''}</span>
       {p.estado !== 'completo' && !st.activo && dl && (
        <button className="cc-btn-mini" onClick={() => dl.descargar(p.eventId)}>Descargar</button>
       )}
      </div>
     );
    })}
    {!listaPartidos.length && <p className="cc-empty">Sin partidos con identificador conocido.</p>}
   </div>

   <div className="cc-dl-add">
    <span className="cc-esc-sub">Agregar partido por link</span>
    <p className="cc-card-note">Para fechas nuevas: pega el link del partido, elige su jornada y la plataforma baja la alineación y todas las acciones.</p>
    <div className="cc-dl-add-grid">
     <label className="cc-select-wrap"><span className="cc-select-label">Link del partido</span>
      <input className="cc-input" placeholder="https://www.sofascore.com/football/match/…#id:15353060" value={urlNuevo} onChange={e => setUrlNuevo(e.target.value)}></input>
     </label>
     <label className="cc-select-wrap"><span className="cc-select-label">Jornada</span>
      <select className="cc-dt-wsel cc-dl-jsel" value={jNuevo} onChange={e => setJNuevo(e.target.value)}>
       {(CC_DATA.fixture || []).map(x => <option key={x.j} value={x.j}>{'F' + x.j + ' · ' + (x.local ? 'vs' : '@') + ' ' + x.rival}</option>)}
      </select>
     </label>
     <button className="cc-btn-primary cc-dl-add-btn" disabled={!dl || st.activo || !urlNuevo.trim()}
      onClick={() => { setAvisoLink(''); dl.agregarPorLink(urlNuevo.trim(), jNuevo).then(() => setUrlNuevo('')).catch(e => setAvisoLink(String((e && e.message) || e))); }}>
      Agregar y descargar
     </button>
    </div>
    {avisoLink && <p className="cc-card-note" style={{ color: 'var(--rojo)' }}>{avisoLink}</p>}
   </div>

   <button className="cc-btn-ghost cc-dl-toggle" onClick={() => setVerCmd(!verCmd)}>{verCmd ? 'Ocultar plan B (Terminal)' : 'Plan B: descargar desde Terminal'}</button>
   {verCmd && (
    <React.Fragment>
     <div className="cc-form-grid">
      <label className="cc-select-wrap"><span className="cc-select-label">Carpeta del proyecto en tu Mac</span>
       <input className="cc-input" value={ruta} onChange={e => { setRuta(e.target.value); try { localStorage.setItem('cc_ruta_carpeta_v1', e.target.value); } catch (err) {} }}></input>
      </label>
     </div>
     <div className="cc-cmd-box">
      <code>{cmd}</code>
      <button className="cc-btn-primary cc-cmd-btn" onClick={copiar}>{copiado ? 'Copiado ✓' : 'Copiar comando'}</button>
     </div>
     <p className="cc-card-note">Primera vez: <code>python3.11 -m pip install curl_cffi</code>. El script se hace pasar por Chrome real, toma cookies de la portada y baja alineación + eventos por jugador; escribe el mismo archivo.</p>
    </React.Fragment>
   )}
  </Card>
 );
}

function SubirShotmaps() {
 const apiInicial = window.CC_SHOTMAPS;
 const baseInicial = CC_DATA.fixture || CC_DATA.partidos;
 const tieneStatsInicial = j => (CC_DATA.partidos || []).some(p => String(p.j) === String(j));
 const jugadosInicial = baseInicial.filter(x => x && x.resultado);
 const jugadosConStatsInicial = jugadosInicial.filter(x => tieneStatsInicial(x.j));
 const resumenInicial = apiInicial && apiInicial.resumen ? apiInicial.resumen() : null;
 const jDefault = (resumenInicial && resumenInicial.pendientes && resumenInicial.pendientes[0]) ||
  (jugadosConStatsInicial[jugadosConStatsInicial.length - 1] && jugadosConStatsInicial[jugadosConStatsInicial.length - 1].j) ||
  (jugadosInicial.find(x => x && !tieneStatsInicial(x.j)) && jugadosInicial.find(x => x && !tieneStatsInicial(x.j)).j) ||
  (baseInicial[baseInicial.length - 1] && baseInicial[baseInicial.length - 1].j);
 const [, setTick] = p4State(0);
 const [jSel, setJSel] = p4State(String(jDefault));
 const [url, setUrl] = p4State(() => apiInicial && apiInicial.matchUrl ? apiInicial.matchUrl(jDefault) : '');
 const [msg, setMsg] = p4State(null);
 const [cargando, setCargando] = p4State(false);
 p4Effect(() => {
  const f = () => setTick(t => t + 1);
  window.addEventListener('cc-shotmaps-ready', f);
  return () => window.removeEventListener('cc-shotmaps-ready', f);
 }, []);

 const api = window.CC_SHOTMAPS;
 const basePartidos = CC_DATA.fixture || CC_DATA.partidos;
 const tieneStats = j => (CC_DATA.partidos || []).some(p => String(p.j) === String(j));
 const tieneShotmap = j => !!(api && api.get && api.get(j));
 const tieneDatosCompletos = j => tieneStats(j) && tieneShotmap(j);
 const jugados = basePartidos.filter(x => x && x.resultado);
 const jugadosConStats = jugados.filter(x => tieneStats(x.j));
 const pendientesCargaDatos = jugados.filter(x => !tieneDatosCompletos(x.j));
 const resumen = api && api.resumen
  ? api.resumen()
  : { totalJugados: jugadosConStats.length, cargados: jugadosConStats.filter(x => tieneDatosCompletos(x.j)).length, pendientes: [] };
 const cuantos = resumen.cargados || 0;
 const totalJugados = resumen.totalJugados || jugadosConStats.length || 0;
 const partido = basePartidos.find(x => String(x.j) === jSel);
 const urlSugerida = api && partido && api.matchUrl ? api.matchUrl(partido.j) : '';
 const cambiarPartido = v => {
  setJSel(v);
  setMsg(null);
  const p = basePartidos.find(x => String(x.j) === String(v));
  const sugerida = api && p && api.matchUrl ? api.matchUrl(p.j) : '';
  setUrl(sugerida || '');
 };

 const cargar = e => {
  e.preventDefault();
  if (!api || !partido) return;
  if (!url.trim()) { setMsg({ tipo: 'error', texto: 'Pega la URL o el ID del partido.' }); return; }
  setCargando(true);
  setMsg(null);
  api.cargarDesdeUrl(partido.j, url.trim(), partido.local)
   .then(r => { setMsg({ tipo: 'ok', texto: r.tiros + ' tiros cargados para P' + partido.j + ' (evento ' + r.eventId + ').' }); ccAudit('descargar', 'Shotmap Sofascore', 'F' + partido.j + ' · evento ' + r.eventId + ' · ' + r.tiros + ' tiros'); setUrl(''); })
   .catch(err => setMsg({ tipo: 'error', texto: String(err && err.message || err) }))
   .then(() => setCargando(false));
 };

 return (
  <Card className="cc-pad">
   <div className="cc-chart-head">
    <h3 className="cc-card-title">Shotmaps por partido</h3>
    <span className={'cc-pill ' + (cuantos >= totalJugados && totalJugados ? 'cc-pill-v' : 'cc-pill-pendiente')}>
     {cuantos + ' de ' + totalJugados + ' partidos con Wyscout + shotmap'}
    </span>
   </div>
   <p className="cc-card-note">Pega el ID del partido o la URL de Sofascore y la plataforma descarga y arma el shotmap automáticamente. Ejemplos: <code>15353054</code> · <code>https://www.sofascore.com/api/v1/event/15353054</code></p>
   <form className="cc-filters" onSubmit={cargar}>
    <Select label="Partido" value={jSel} onChange={cambiarPartido} options={basePartidos.map(x => {
     const incompleto = x.resultado && !tieneDatosCompletos(x.j);
     const estado = !x.resultado ? ' · por jugar' : (incompleto ? ' · Pendiente carga de datos' : ' (' + x.resultado + ')');
     return { value: String(x.j), label: 'F' + x.j + ' · ' + (x.local ? 'vs' : 'en') + ' ' + x.rival + estado + (tieneDatosCompletos(x.j) ? ' ✓' : '') };
    })}></Select>
    <label className="cc-select-wrap" style={{ flex: 1, minWidth: '320px' }}>
     <span className="cc-select-label">ID o URL del partido</span>
     <input className="cc-input" type="text" inputMode="url" value={url} onChange={e => setUrl(e.target.value)} placeholder={urlSugerida || '15353054'}></input>
    </label>
    <button type="submit" className="cc-btn-primary" style={{ width: 'auto', alignSelf: 'flex-end' }} disabled={cargando}>{cargando ? 'Descargando…' : 'Cargar shotmap'}</button>
    {api && partido && api.get(partido.j) && (
     <button type="button" className="cc-btn-ghost" style={{ alignSelf: 'flex-end' }} onClick={() => { api.quitar(partido.j); ccAudit('eliminar', 'Shotmap Sofascore', 'F' + partido.j + ' · ' + partido.rival); setMsg({ tipo: 'ok', texto: 'Shotmap de P' + partido.j + ' eliminado.' }); }}>Quitar shotmap de P{partido.j}</button>
    )}
   </form>
   {msg && <p className={msg.tipo === 'ok' ? 'cc-card-note' : 'cc-login-error'} style={{ marginTop: '8px' }}>{msg.texto}</p>}
   {api && partido && partido.resultado && !tieneDatosCompletos(partido.j) && (
    <p className="cc-card-note" style={{ marginTop: '8px' }}>
     F{partido.j} queda como <strong>Pendiente carga de datos</strong>: para entrar al análisis debe tener Team Stats de Wyscout y shotmap real de SofaScore.
    </p>
   )}
   <p className="cc-card-note" style={{ marginBottom: 0 }}>Si bloquea la conexión desde tu red, se conservan los {cuantos} partidos completos ya precargados. Las fechas sin Wyscout + shotmap quedan como Pendiente carga de datos.</p>
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
   if (res.ok) { setEstado({ filas: res.filas, fecha: new Date().toISOString().slice(0, 10) }); setError(''); ccAudit('editar', 'Tabla Sofascore', file.name + ' · ' + res.filas + ' equipos'); }
   else setError(res.error || 'No se pudo leer el archivo.');
  };
  fr.readAsText(file);
 };

 return (
  <Card className="cc-pad">
   <div className="cc-chart-head">
    <h3 className="cc-card-title">3 · Tabla de posiciones (CSV)</h3>
    {estado && <span className="cc-pill cc-pill-v">Cargada · {estado.filas} equipos · {estado.fecha}</span>}
   </div>
   <p className="cc-card-note">La API bloquea conexiones del navegador. Genera el CSV con tu función <strong>get_league_standings</strong> (columnas position, team, matches, wins, draws, losses, goals_for, goals_against, points) y súbelo aquí: el Calendario mostrará la tabla completa con G/E/P y goles.</p>
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
 const [eqSel, setEqSel] = p4State('Colo-Colo');
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
 const equipos = CC_DATA.equipos.filter(e => e.nombre !== 'Promedio adversarios');

 const guardarLogo = e => {
  e.preventDefault();
  if (window.CC_LOGOS) {
   window.CC_LOGOS.setManual(eqSel, url.trim());
   ccAudit('editar', 'Logo de equipo', eqSel + (url.trim() ? ' · URL manual guardada' : ' · URL manual eliminada'));
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
     {!st.listo ? 'Cargando…' : 'SofaScore · PNG empaquetados'}
    </span>
   </div>
   <p className="cc-card-note">Los escudos fueron extraídos desde SofaScore y están incluidos en la aplicación. Puedes reemplazar uno manualmente pegando su URL.</p>
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

function CatalogoConfig() {
 const fmt = iso => { try { return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return '—'; } };
 const [est, setEst] = p4State(() => window.CC_CATALOGO ? window.CC_CATALOGO.estado() : { fecha: null, regiones: {}, paises: 0, ligas: 0, equipos: 0 });
 const [cargando, setCargando] = p4State(null); // id de región en curso
 const regiones = window.CC_CATALOGO_REGIONS || [];

 const actualizarRegion = id => {
 if (!window.CC_CATALOGO) return;
 setCargando(id);
  const region = regiones.find(r => r.id === id);
  window.CC_CATALOGO.actualizarRegion(id).then(() => { setEst(window.CC_CATALOGO.estado()); setCargando(null); ccAudit('descargar', 'Catálogo país-liga-equipo', (region ? region.nombre : id) + ' actualizado'); });
 };

 return (
  <Card className="cc-pad">
   <div className="cc-chart-head">
    <h3 className="cc-card-title">Catálogo de ligas y torneos por país</h3>
    <span className="cc-pill cc-pill-v">Base de datos interna</span>
   </div>
   <p className="cc-card-note">Alimenta los selectores de país → liga → equipo (por ejemplo, en Informes de Scouting). Las ligas principales están guardadas en la plataforma con su listado completo de equipos —no se cortan por límites externos. Actualízalas por partes cuando cambie una temporada.</p>

   <div className="cc-cat-regiones">
    {regiones.map(r => {
     const fecha = (est.regiones || {})[r.id];
     return (
      <div key={r.id} className="cc-cat-region">
       <div className="cc-cat-region-info">
        <strong>{r.nombre}</strong>
        <span>{r.paises.length} países · {fecha ? 'Actualizado ' + fmt(fecha) : 'Sin actualizar'}</span>
       </div>
       <button className="cc-btn-primary" style={{ width: 'auto' }} onClick={() => actualizarRegion(r.id)} disabled={cargando === r.id}>
        {cargando === r.id ? 'Actualizando…' : fecha ? 'Actualizar' : 'Descargar'}
       </button>
      </div>
     );
    })}
   </div>
   <p className="cc-card-note">El resto de países (fuera de estas regiones) se consulta en vivo desde TheSportsDB al seleccionarlos; en su capa gratuita esa fuente puede entregar listas parciales.</p>
  </Card>
 );
}

// Equipos por temporada (editable): al cambiar de temporada pueden entrar o
// salir clubes (ascensos/descensos). La lista alimenta los cupos de Team
// Stats de «Cargar datos» y los logos de toda la plataforma.
const CC_EQ_TEMP_KEY = 'cc_equipos_temp_v1';
function ccEquiposDe(temporada) {
 try {
  const m = JSON.parse(localStorage.getItem(CC_EQ_TEMP_KEY)) || {};
  if (Array.isArray(m[temporada]) && m[temporada].length) return m[temporada];
 } catch (e) {}
 return (window.CC_DATA && CC_DATA.equipos ? CC_DATA.equipos.map(e => e.nombre) : []);
}
window.ccEquiposDe = ccEquiposDe;

function EquiposTemporada({ temporada }) {
 const [lista, setLista] = p4State(() => ccEquiposDe(temporada));
 const [nuevo, setNuevo] = p4State('');
 const [nuevoLogo, setNuevoLogo] = p4State('');
 const [logoTorneo, setLogoTorneo] = p4State(() => { try { return localStorage.getItem('cc_logo_torneo') || ''; } catch (e) { return ''; } });
 React.useEffect(() => { setLista(ccEquiposDe(temporada)); }, [temporada]);
 const persistir = l => {
  setLista(l);
  try { const m = JSON.parse(localStorage.getItem(CC_EQ_TEMP_KEY)) || {}; m[temporada] = l; localStorage.setItem(CC_EQ_TEMP_KEY, JSON.stringify(m)); } catch (e) {}
 };
 const agregar = () => {
  const n = nuevo.trim(); if (!n || lista.includes(n)) return;
  persistir([...lista, n].sort((a, b) => a.localeCompare(b, 'es')));
  if (nuevoLogo.trim() && window.CC_LOGOS) CC_LOGOS.setManual(n, nuevoLogo.trim());
  ccAudit('crear', 'Equipo de temporada', n + ' · temporada ' + temporada);
  setNuevo(''); setNuevoLogo('');
 };
 const quitar = n => {
  if (window.confirm('¿Quitar a ' + n + ' de la temporada ' + temporada + '? Sus datos cargados no se borran; solo deja de aparecer en los cupos.')) {
   persistir(lista.filter(x => x !== n));
   ccAudit('eliminar', 'Equipo de temporada', n + ' · temporada ' + temporada);
  }
 };
 const setLogo = (n, url) => { if (window.CC_LOGOS) { CC_LOGOS.setManual(n, url); ccAudit('editar', 'Logo de equipo', n + ' · temporada ' + temporada); } };
 const guardarTorneo = () => { try { localStorage.setItem('cc_logo_torneo', logoTorneo.trim()); } catch (e) {} try { window.dispatchEvent(new Event('cc-logos-ready')); } catch (e) {} ccAudit('editar', 'Logo del torneo', 'Temporada ' + temporada); };
 return (
  <Card className="cc-pad">
   <div className="cc-chart-head">
    <h3 className="cc-card-title">Equipos y logos · Temporada {temporada}</h3>
    <span className="cc-pill cc-pill-v">{lista.length} equipos</span>
   </div>
   <p className="cc-card-note">Al cambiar de temporada pueden entrar o salir clubes. Esta lista define los cupos de Team Stats en «Cargar datos · Temporada {temporada}». Cada equipo puede tener su logo por URL; también el torneo.</p>
   <div className="cc-eqtemp-torneo">
    <label className="cc-esc-campo" style={{ flex: 1 }}><span>Logo del torneo (URL)</span>
     <input className="cc-input" type="url" value={logoTorneo} onChange={e => setLogoTorneo(e.target.value)} placeholder="https://…/logo-liga.png"></input>
    </label>
    <button className="cc-btn-mini" onClick={guardarTorneo}><Icon name="check" size={13}></Icon> Guardar</button>
    {logoTorneo ? <img className="cc-eqtemp-logo" src={logoTorneo} alt="" onError={e => { e.target.style.display = 'none'; }}></img> : null}
   </div>
   <div className="cc-eqtemp-lista">
    {lista.map(n => (
     <div key={n} className="cc-eqtemp-row">
      <span className="cc-eqtemp-nombre"><CCTeamLogo team={n} size={20}></CCTeamLogo> {n}</span>
      <input className="cc-input cc-eqtemp-url" defaultValue={window.CC_LOGOS ? CC_LOGOS.getManual(n) : ''} placeholder="URL del logo (opcional)" onBlur={e => setLogo(n, e.target.value.trim())}></input>
      <button className="cc-escuela-edit cc-btn-danger" title="Quitar de la temporada" onClick={() => quitar(n)}><Icon name="basura" size={13}></Icon></button>
     </div>
    ))}
   </div>
   <div className="cc-eqtemp-add">
    <input className="cc-input" placeholder="Nuevo equipo (ej. Deportes Melipilla)" value={nuevo} onChange={e => setNuevo(e.target.value)}></input>
    <input className="cc-input" placeholder="URL del logo (opcional)" value={nuevoLogo} onChange={e => setNuevoLogo(e.target.value)}></input>
    <button className="cc-btn-primary" style={{ width: 'auto' }} onClick={agregar}><Icon name="mas" size={14}></Icon> Agregar</button>
   </div>
  </Card>
 );
}

// Respaldo de la base de datos local: exporta/restaura todas las claves cc_*
// (plantel, notas, informes, escuelas, mercado, usuarios, catálogo, shotmaps).
function RespaldoDatos() {
 const [msg, setMsg] = p4State(null);
 const fileRef = React.useRef(null);
 const exportar = () => {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
   const k = localStorage.key(i);
   if (k && k.indexOf('cc_') === 0) { try { data[k] = localStorage.getItem(k); } catch (e) {} }
  }
  const blob = new Blob([JSON.stringify({ app: 'ColoColo Football Center', version: 1, fecha: new Date().toISOString(), datos: data }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ccfc-respaldo-' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  ccAudit('exportar', 'Respaldo de datos', Object.keys(data).length + ' claves cc_* exportadas');
  setMsg('ok-exp');
 };
 const importar = e => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  const fr = new FileReader();
  fr.onload = () => {
   try {
    const j = JSON.parse(fr.result);
    if (!j || !j.datos || typeof j.datos !== 'object') throw new Error('formato');
    Object.keys(j.datos).forEach(k => { if (k.indexOf('cc_') === 0) { try { localStorage.setItem(k, j.datos[k]); } catch (e) {} } });
    ccAudit('restaurar', 'Respaldo de datos', Object.keys(j.datos).filter(k => k.indexOf('cc_') === 0).length + ' claves cc_* restauradas');
    setMsg('ok-imp');
    setTimeout(() => location.reload(), 900);
   } catch (err) { setMsg('err'); }
  };
  fr.readAsText(f);
  e.target.value = '';
 };
 return (
  <Card className="cc-pad">
   <div className="cc-chart-head">
    <h3 className="cc-card-title">Respaldo de datos</h3>
    <span className="cc-pill cc-pill-v">Base de datos local</span>
   </div>
   <p className="cc-card-note">Todo lo editado en la plataforma (plantel, notas, informes, escuelas, mercado, usuarios, catálogo, shotmaps) vive en este navegador. Descarga un respaldo periódicamente; puedes restaurarlo aquí mismo o en otro computador para migrar la información.</p>
   <div className="cc-esc-btns">
    <button className="cc-btn-primary" style={{ width: 'auto' }} onClick={exportar}>Descargar respaldo (.json)</button>
    <button className="cc-btn-mini cc-btn-ghost" onClick={() => fileRef.current && fileRef.current.click()}>Restaurar desde archivo…</button>
    <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={importar}></input>
   </div>
   {msg === 'ok-exp' && <p className="cc-card-note">Respaldo descargado ✓ — guárdalo en un lugar seguro.</p>}
   {msg === 'ok-imp' && <p className="cc-card-note">Datos restaurados ✓ — recargando la plataforma…</p>}
   {msg === 'err' && <p className="cc-card-note" style={{ color: 'var(--rojo)' }}>El archivo no es un respaldo válido de la plataforma.</p>}
  </Card>
 );
}

function FixtureFechaRow({ partido, puedeEditar, usuario }) {
 const [fecha, setFecha] = p4State(partido.fecha || '');
 const [hora, setHora] = p4State(partido.hora || '');
 const [msg, setMsg] = p4State(null);

 p4Effect(() => { setFecha(partido.fecha || ''); setHora(partido.hora || ''); setMsg(null); }, [partido.fecha, partido.hora]);

 const guardar = () => {
  if (!puedeEditar || !window.CC_FIXTURE) return;
  const res = window.CC_FIXTURE.guardar(partido.j, { fecha, hora });
  if (res.ok) ccAudit('editar', 'Fecha de partido', 'F' + partido.j + ' · ' + (partido.local ? 'vs ' : 'en ') + partido.rival + ' · ' + fecha + (hora ? ' ' + hora : ''), usuario);
  setMsg(res.ok ? { ok: true, texto: 'Guardado' } : { ok: false, texto: res.error });
 };
 const restaurar = () => {
  if (!puedeEditar || !window.CC_FIXTURE) return;
  window.CC_FIXTURE.restaurar(partido.j);
  ccAudit('restaurar', 'Fecha de partido', 'F' + partido.j + ' · ' + (partido.local ? 'vs ' : 'en ') + partido.rival, usuario);
  setMsg({ ok: true, texto: 'Fecha oficial restaurada' });
 };
 const vencida = window.CC_FIXTURE && partido.fecha < window.CC_FIXTURE.hoyISO();

 return (
  <tr>
   <td><strong>F{partido.j}</strong></td>
   <td><span className="cc-team-cell"><CCTeamLogo team={partido.rival} size={20}></CCTeamLogo>{partido.local ? 'vs ' : 'en '}{partido.rival}</span></td>
   <td>{partido.fechaOriginal ? ccFechaConfig(partido.fechaOriginal) : '—'}</td>
   <td><span className={'cc-pill ' + (partido.reprogramado ? 'cc-pill-e' : vencida ? 'cc-pill-pendiente' : 'cc-pill-v')}>{partido.reprogramado ? 'Reprogramado' : vencida ? 'Fecha por actualizar' : 'Programado'}</span></td>
   <td><input className="cc-input cc-fixture-date" type="date" aria-label={'Fecha vigente jornada ' + partido.j} value={fecha} disabled={!puedeEditar} onChange={e => { setFecha(e.target.value); setMsg(null); }}></input></td>
   <td><input className="cc-input cc-fixture-time" type="time" aria-label={'Hora jornada ' + partido.j} value={hora} disabled={!puedeEditar} onChange={e => { setHora(e.target.value); setMsg(null); }}></input></td>
   <td>
    {puedeEditar && <div className="cc-fixture-config-actions">
     <button className="cc-btn-mini" onClick={guardar}>Guardar</button>
     {partido.reprogramado && <button className="cc-btn-mini cc-btn-ghost" onClick={restaurar}>Restaurar</button>}
    </div>}
    {msg && <span className={msg.ok ? 'cc-fixture-ok' : 'cc-login-error'}>{msg.texto}</span>}
   </td>
  </tr>
 );
}

function ccFechaConfig(iso) {
 try { return new Date(iso + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }); } catch (e) { return iso; }
}

function FixtureConfig({ usuario }) {
 const [, setTick] = p4State(0);
 const rol = (() => { try { return window.ccRolDe ? window.ccRolDe(usuario) : null; } catch (e) { return null; } })();
 const puedeEditar = rol === 'Administrador';
 p4Effect(() => {
  const f = () => setTick(t => t + 1);
  window.addEventListener('cc-fixture-change', f);
  return () => window.removeEventListener('cc-fixture-change', f);
 }, []);
 const fixture = window.CC_FIXTURE ? window.CC_FIXTURE.actual() : (CC_DATA.fixture || []);
 const pendientes = fixture.filter(m => !m.resultado).sort((a, b) => Number(a.j) - Number(b.j));

 return (
  <Card className="cc-fixture-config">
   <div className="cc-pad">
    <div className="cc-chart-head">
     <h3 className="cc-card-title">Fechas del fixture</h3>
     <span className="cc-pill cc-pill-v">{pendientes.length} partidos no jugados</span>
    </div>
    <p className="cc-card-note">La fecha oficial permanece como referencia. Registra una fecha vigente solo cuando la reprogramación esté confirmada.</p>
    {!puedeEditar && <p className="cc-card-note">Tu rol ({rol || 'Visita'}) es de solo lectura.</p>}
   </div>
   <div className="cc-gestion-tabla">
    <table className="cc-tabla">
     <thead><tr><th>Jornada</th><th>Partido</th><th>Fecha oficial</th><th>Estado</th><th>Fecha vigente</th><th>Hora</th><th></th></tr></thead>
     <tbody>{pendientes.map(m => <FixtureFechaRow key={m.j} partido={m} puedeEditar={puedeEditar} usuario={usuario}></FixtureFechaRow>)}</tbody>
    </table>
   </div>
  </Card>
 );
}

function AuditLog({ usuario }) {
 const [, setTick] = p4State(0);
 const [usuarioFiltro, setUsuarioFiltro] = p4State('Todos');
 const [accionFiltro, setAccionFiltro] = p4State('Todas');
 const [buscar, setBuscar] = p4State('');
 const [cfgDraft, setCfgDraft] = p4State(ccAuditConfig);
 const [cfgMsg, setCfgMsg] = p4State('');
 const [probandoGeo, setProbandoGeo] = p4State(false);
 p4Effect(() => {
  const f = () => setTick(t => t + 1);
  window.addEventListener('cc-audit-change', f);
  return () => window.removeEventListener('cc-audit-change', f);
 }, []);
 const logs = ccLeerAudit();
 const usuarios = ccLeerUsuarios();
 const esAdmin = ccRolDe(usuario) === 'Administrador';
 const correos = ['Todos', ...Array.from(new Set([...usuarios.map(u => u.email), ...logs.map(l => l.usuario).filter(Boolean)]))];
 const acciones = ['Todas', ...Array.from(new Set(logs.map(l => l.accion).filter(Boolean)))];
 const q = buscar.trim().toLowerCase();
 const filtrados = logs.filter(l => {
  if (usuarioFiltro !== 'Todos' && l.usuario !== usuarioFiltro) return false;
  if (accionFiltro !== 'Todas' && l.accion !== accionFiltro) return false;
  if (!q) return true;
  const geo = l.geo || {};
  return [l.usuario, l.accion, l.entidad, l.detalle, l.ruta, l.navegador, l.plataforma, geo.ip, geo.ciudad, geo.region, geo.pais, geo.isp].some(v => String(v || '').toLowerCase().includes(q));
 });
 const ultimosLogin = usuarios.map(u => ({ usuario: u, login: logs.find(l => l.accion === 'login' && l.usuario === u.email) }));
 const ultimoLogin = logs.find(l => l.accion === 'login');
 const cambios = logs.filter(l => ['crear', 'editar', 'eliminar', 'restaurar'].includes(l.accion)).length;
 const loginConIp = logs.filter(l => l.accion === 'login' && l.geo && l.geo.ip).length;
 const guardarCfg = () => {
  ccGuardarAuditConfig(cfgDraft);
  setCfgDraft(ccAuditConfig());
  setCfgMsg('Preferencias de login guardadas en este navegador.');
  setTimeout(() => setCfgMsg(''), 2500);
 };
 const probarGeo = () => {
  setProbandoGeo(true);
  setCfgMsg('Probando geolocalización automática…');
  ccAuditFetchGeoAuto().then(g => {
   setProbandoGeo(false);
   setCfgMsg(g.estado === 'ok'
    ? 'OK (' + g.proveedor + '): ' + ccAuditGeoTxt(g) + ' · ' + ccAuditRedTxt(g)
    : 'No se pudo obtener IP pública: ' + (g.error || 'intenta nuevamente'));
  });
 };
 const exportar = () => {
  const esc = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const header = ['fecha', 'usuario', 'accion', 'entidad', 'detalle', 'ip', 'pais', 'region', 'ciudad', 'isp', 'vpn_proxy', 'lat', 'lon', 'gps_lat', 'gps_lon', 'gps_precision_m', 'ruta', 'navegador', 'plataforma', 'idioma', 'zona'];
  const valor = (l, k) => {
   const geo = l.geo || {}, gps = l.gps || {};
   const m = {
    ip: geo.ip, pais: geo.pais, region: geo.region, ciudad: geo.ciudad, isp: geo.isp,
    vpn_proxy: geo.vpn == null ? '' : (geo.vpn ? 'si' : 'no'),
    lat: geo.lat, lon: geo.lon, gps_lat: gps.lat, gps_lon: gps.lon, gps_precision_m: gps.precisionM
   };
   return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : l[k];
  };
  const lines = [header.join(',')].concat(filtrados.map(l => header.map(k => esc(valor(l, k))).join(',')));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ccfc-log-auditoria-' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  ccAudit('exportar', 'Log de auditoría', filtrados.length + ' registros exportados', usuario);
 };
 const limpiar = () => {
  if (!esAdmin) return;
  if (!window.confirm('¿Vaciar el log de auditoría de este navegador?')) return;
  ccGuardarAudit([]);
  ccAudit('eliminar', 'Log de auditoría', 'Log vaciado por administrador', usuario);
  setTick(t => t + 1);
  try { window.dispatchEvent(new Event('cc-audit-change')); } catch (e) {}
 };
 const clsAccion = a => a === 'eliminar' ? 'cc-pill-pendiente' : a === 'crear' || a === 'login' ? 'cc-pill-v' : a === 'editar' ? 'cc-pill-e' : 'cc-pill-gris';
 return (
  <React.Fragment>
   <Card className="cc-pad cc-config-intro">
    <div className="cc-chart-head">
     <h3 className="cc-card-title">Log de auditoría</h3>
     <span className="cc-pill cc-pill-v">{logs.length} eventos guardados</span>
    </div>
    <div className="cc-audit-resumen">
     <div><span>Cambios de datos</span><strong>{cambios}</strong></div>
     <div><span>Último login</span><strong>{ultimoLogin ? ccAuditFecha(ultimoLogin.fecha) : '—'}</strong></div>
     <div><span>Logins con IP</span><strong>{loginConIp}</strong></div>
    </div>
    <p className="cc-card-note">Registra altas, ediciones, eliminaciones, respaldos, cargas de datos y accesos. Cada login intenta guardar automáticamente IP pública, ciudad, región, país, coordenadas aproximadas, red y zona horaria, sin API key por usuario.</p>
    <div className="cc-audit-login-panel">
     <div className="cc-audit-login-status">
      <span className="cc-pill cc-pill-v">Geolocalización automática</span>
      <span className="cc-audit-meta">Proveedores sin key: ipwho.is, GeoJS, ipinfo.io y db-ip como respaldo.</span>
     </div>
     {esAdmin && (
      <div className="cc-audit-login-tools">
       <label className="cc-select-wrap cc-audit-webhook">
       <span className="cc-select-label">Webhook central opcional</span>
       <input className="cc-input" type="url" value={cfgDraft.webhookUrl || ''} onChange={e => setCfgDraft(Object.assign({}, cfgDraft, { webhookUrl: e.target.value }))} placeholder="https://…/audit-login"></input>
      </label>
      <label className="cc-audit-check">
       <input type="checkbox" checked={!!cfgDraft.pedirGps} onChange={e => setCfgDraft(Object.assign({}, cfgDraft, { pedirGps: e.target.checked }))}></input>
       <span>Pedir GPS exacto en login</span>
      </label>
       <button className="cc-btn-primary" style={{ width: 'auto' }} onClick={guardarCfg}>Guardar</button>
       <button className="cc-btn-mini cc-btn-ghost" disabled={probandoGeo} onClick={probarGeo}>{probandoGeo ? 'Probando…' : 'Probar IP ahora'}</button>
      </div>
     )}
     {cfgMsg && <p className="cc-card-note">{cfgMsg}</p>}
     <p className="cc-card-note">El historial visible aquí queda guardado en este navegador. Para ver en el panel del administrador los logins hechos desde otros computadores, conecta un webhook central que reciba estos eventos.</p>
    </div>
   </Card>

   <Card className="cc-pad">
    <div className="cc-chart-head">
     <h3 className="cc-card-title">Inicios de sesión por usuario</h3>
     <button className="cc-btn-mini cc-btn-ghost" onClick={exportar}>Exportar CSV</button>
    </div>
    <div className="cc-gestion-tabla">
     <table className="cc-tabla">
      <thead><tr><th>Usuario</th><th>Rol</th><th>Último login</th><th>Ubicación</th><th>IP / red</th><th>Dispositivo</th></tr></thead>
      <tbody>
       {ultimosLogin.map(x => (
        <tr key={x.usuario.email}>
         <td><strong>{x.usuario.nombre}</strong><span className="cc-audit-meta">{x.usuario.email}</span></td>
         <td><span className={'cc-pill ' + (x.usuario.rol === 'Administrador' ? 'cc-pill-v' : x.usuario.rol === 'Editor' ? 'cc-pill-e' : 'cc-pill-pendiente')}>{x.usuario.rol}</span></td>
         <td>{x.login ? ccAuditFecha(x.login.fecha) : (x.usuario.ultimoAcceso || 'Nunca')}</td>
         <td className="cc-audit-where">{x.login ? ccAuditGeoTxt(x.login.geo) : '—'}{x.login && ccAuditCoordsTxt(x.login.geo) ? <span className="cc-audit-meta">{ccAuditCoordsTxt(x.login.geo)}</span> : null}</td>
         <td className="cc-audit-where">{x.login ? ccAuditRedTxt(x.login.geo) : '—'}{x.login && x.login.geo && x.login.geo.vpn ? <span className="cc-pill cc-pill-pendiente">VPN / proxy</span> : null}</td>
         <td className="cc-audit-where">{x.login ? (x.login.navegador + ' · ' + x.login.plataforma) : '—'}{x.login ? <span className="cc-audit-meta">{x.login.ruta}</span> : null}</td>
        </tr>
       ))}
      </tbody>
     </table>
    </div>
   </Card>

   <Card className="cc-pad">
    <div className="cc-chart-head">
     <h3 className="cc-card-title">Actividad de base de datos</h3>
     {esAdmin && <button className="cc-btn-mini cc-btn-danger" onClick={limpiar}>Vaciar log</button>}
    </div>
    <div className="cc-filters">
     <Select label="Usuario" value={usuarioFiltro} onChange={setUsuarioFiltro} options={correos}></Select>
     <Select label="Acción" value={accionFiltro} onChange={setAccionFiltro} options={acciones.map(a => a === 'Todas' ? a : { value: a, label: ccAuditAccionTxt(a) })}></Select>
     <label className="cc-select-wrap" style={{ flex: 1, minWidth: '240px' }}>
      <span className="cc-select-label">Buscar</span>
      <input className="cc-input" value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Usuario, módulo, detalle…"></input>
     </label>
    </div>
   </Card>

   <Card>
    <div className="cc-table-wrap cc-audit-table">
     <table className="cc-table">
      <thead><tr><th>Fecha</th><th>Acción</th><th>Entidad</th><th>Usuario</th><th>Desde dónde</th></tr></thead>
      <tbody>
       {filtrados.map(l => (
        <tr key={l.id}>
         <td>{ccAuditFecha(l.fecha)}</td>
         <td><span className={'cc-pill ' + clsAccion(l.accion)}>{ccAuditAccionTxt(l.accion)}</span></td>
         <td className="cc-audit-detail"><strong>{l.entidad}</strong><span className="cc-audit-meta">{l.detalle || '—'}</span></td>
         <td>{l.usuario}</td>
         <td className="cc-audit-where">
          {l.navegador} · {l.plataforma}
          <span className="cc-audit-meta">{ccAuditGeoTxt(l.geo)}{l.geo && l.geo.ip ? ' · ' + l.geo.ip : ''}</span>
          <span className="cc-audit-meta">{l.ruta}</span>
         </td>
        </tr>
       ))}
       {!filtrados.length && <tr><td colSpan="5"><p className="cc-empty">Sin eventos para estos filtros.</p></td></tr>}
      </tbody>
     </table>
    </div>
   </Card>
  </React.Fragment>
 );
}

function PageConfig({ usuario }) {
 const [temporada, setTemporada] = p4State(() => { try { return localStorage.getItem('cc_temporada_activa') || '2026'; } catch (e) { return '2026'; } });
 const [tabRaw, setTab] = p4State('temporada');
 // Compatibilidad con valores de pestaña antiguos ya persistidos
 const tab = ({ datos: 'wyscout', fixture: 'sofascore', shotmaps: 'sofascore', logos: 'logoscat', catalogo: 'logoscat' })[tabRaw] || tabRaw;

 return (
  <div className="cc-page">
   <PageHeader icon="config" title="Configuración" subtitle="Fuentes de datos, temporada activa y logos de la plataforma"></PageHeader>

   <SegTabs value={tab} onChange={setTab} options={[
    { value: 'temporada', label: 'Temporada' },
    { value: 'wyscout', label: 'Datos Wyscout' },
    { value: 'sofascore', label: 'Datos Sofascore' },
    { value: 'logoscat', label: 'Logos y ligas' },
    { value: 'respaldo', label: 'Respaldo' },
    { value: 'auditoria', label: 'Log' }
   ]}></SegTabs>

   {tab === 'temporada' && (
    <React.Fragment>
   <Card className="cc-pad">
    <div className="cc-chart-head">
     <h3 className="cc-card-title">Temporada activa</h3>
     <span className="cc-pill cc-pill-v">Todos los datos cargados pertenecen a esta temporada</span>
    </div>
    <div className="cc-temporadas">
     <button
      className={'cc-temporada' + (temporada === '2026' ? ' activa' : '')}
      onClick={() => { try { localStorage.setItem('cc_temporada_activa', '2026'); } catch (e) {} setTemporada('2026'); ccAudit('editar', 'Temporada activa', 'Cambió a temporada 2026', usuario); }}
     >
      <strong>2026</strong>
      <span>Liga de Primera · en curso</span>
      <span className="cc-temporada-detalle">14 partidos · {CC_DATA.jugadores.length} jugadores · datos</span>
     </button>
     <button
      className={'cc-temporada' + (temporada === '2027' ? ' activa' : '')}
      onClick={() => {
       if (temporada === '2027') return;
       if (!localStorage.getItem('cc_arch_2026')) {
        if (!window.confirm('¿Iniciar la temporada 2027? Se crea un archivo interno con todo lo de 2026 (además puedes descargar un respaldo .json más abajo). Podrás volver a 2026 cuando quieras.')) return;
        const snap = {};
        for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf('cc_') === 0 && k.indexOf('cc_arch_') !== 0) { try { snap[k] = localStorage.getItem(k); } catch (e) {} } }
       try { localStorage.setItem('cc_arch_2026', JSON.stringify({ fecha: new Date().toISOString(), datos: snap })); } catch (e) {}
        ccAudit('crear', 'Archivo de temporada', 'Archivó la temporada 2026 al iniciar 2027', usuario);
       }
       try { localStorage.setItem('cc_temporada_activa', '2027'); } catch (e) {}
       setTemporada('2027');
       ccAudit('editar', 'Temporada activa', 'Cambió a temporada 2027', usuario);
      }}
     >
      <strong>2027</strong>
      <span>{temporada === '2027' ? 'Temporada activa' : 'Iniciar temporada nueva'}</span>
      <span className="cc-temporada-detalle">{temporada === '2027' ? 'Cupos y datos propios de 2027' : 'Archiva 2026 y abre la carga de datos 2027'}</span>
     </button>
    </div>
    <p className="cc-card-note">Cada temporada mantiene sus propios archivos. Al crear la temporada 2027, los datos 2026 quedarán archivados y consultables.</p>
   </Card>

   <EquiposTemporada temporada={temporada}></EquiposTemporada>
    </React.Fragment>
   )}

   {tab === 'wyscout' && (
    <React.Fragment>
     <Card className="cc-pad cc-config-intro">
      <h3 className="cc-card-title">Datos Wyscout · temporada {temporada}</h3>
      <p className="cc-card-note">Archivos que sube el club: Team Stats (un Excel por equipo) y estadísticas de jugadores. Alimentan resumen, comparaciones, rankings y dispersión.</p>
     </Card>
     <GestorDatos temporada={temporada}></GestorDatos>
    </React.Fragment>
   )}

   {tab === 'sofascore' && (
    <React.Fragment>
     <Card className="cc-pad cc-config-intro">
      <h3 className="cc-card-title">Datos Sofascore</h3>
      <div className="cc-sofa-estado">
       <div><span>Tabla y fixture</span><strong>{(window.CC_SOFA_SNAPSHOT && CC_SOFA_SNAPSHOT.fecha) ? 'Instantánea del ' + CC_SOFA_SNAPSHOT.fecha : '—'}</strong></div>
       <div><span>Shotmaps reales</span><strong>{window.CC_SHOTMAPS && CC_SHOTMAPS.cuantos ? CC_SHOTMAPS.cuantos() + ' partidos' : (window.CC_SHOTMAPS_BUNDLE ? Object.keys(CC_SHOTMAPS_BUNDLE).length + ' partidos' : '—')}</strong></div>
       <div><span>Estadísticas por jugador</span><strong>{window.CC_LINEUPS_BUNDLE ? Object.keys(CC_LINEUPS_BUNDLE).length + ' partidos' : '—'}</strong></div>
       <div><span>Eventos espaciales</span><strong>{(() => {
        const bundle = window.CC_ACTIONS_BUNDLE || {};
        const n = Object.values(bundle).filter(m => m && m.actions && Object.values(m.actions).some(arr => Array.isArray(arr) && arr.length)).length;
        return n ? n + ' partidos' : 'Pendiente backend';
       })()}</strong></div>
      </div>
      <p className="cc-card-note">Descargados y empaquetados en la plataforma (no dependen de conexión). Las acciones completas de jugadores se actualizan por lotes backend; si faltan, no se inventan coordenadas.</p>
     </Card>
     <FixtureConfig usuario={usuario}></FixtureConfig>
     <SubirShotmaps></SubirShotmaps>
     <AccionesScript></AccionesScript>
    </React.Fragment>
   )}

   {tab === 'respaldo' && <RespaldoDatos></RespaldoDatos>}
   {tab === 'auditoria' && <AuditLog usuario={usuario}></AuditLog>}

   {tab === 'logoscat' && (
    <React.Fragment>
     <EstadoLogos></EstadoLogos>
     <CatalogoConfig></CatalogoConfig>
    </React.Fragment>
   )}
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
  ccAudit('editar', 'Usuario', email + ' · rol cambiado a ' + rol, sesion);
 };
 const asignarPass = email => {
  if (!passVal.trim()) return;
  guardar(usuarios.map(u => u.email === email ? Object.assign({}, u, { pass: passVal.trim() }) : u));
  ccAudit('editar', 'Usuario', email + ' · contraseña actualizada', sesion);
  setPassEdit(null); setPassVal('');
 };
 const eliminar = email => {
  guardar(usuarios.filter(u => u.email !== email));
  ccAudit('eliminar', 'Usuario', email, sesion);
 };
 const togglePagina = (email, id) => {
  guardar(usuarios.map(u => {
   if (u.email !== email) return u;
   const todas = [...window.CC_NAV, ...window.CC_NAV_ADMIN].map(n => n.id);
   const actuales = Array.isArray(u.paginas) ? u.paginas : todas;
   const nuevas = actuales.includes(id) ? actuales.filter(x => x !== id) : [...actuales, id];
   return Object.assign({}, u, { paginas: nuevas });
  }));
  ccAudit('editar', 'Accesos de usuario', email + ' · página ' + id, sesion);
 };
 const todasLasPaginas = email => {
  guardar(usuarios.map(u => u.email === email ? Object.assign({}, u, { paginas: undefined }) : u));
  ccAudit('editar', 'Accesos de usuario', email + ' · acceso total', sesion);
 };
 const agregar = e => {
  e.preventDefault();
  if (!nuevo.nombre.trim() || !nuevo.email.trim()) return;
  guardar([...usuarios, {
   nombre: nuevo.nombre.trim(), email: nuevo.email.trim().toLowerCase(),
   rol: nuevo.rol, pass: nuevo.pass || '', ultimoAcceso: 'Nunca'
  }]);
  ccAudit('crear', 'Usuario', nuevo.email.trim().toLowerCase() + ' · rol ' + nuevo.rol, sesion);
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
          <td>{u.ultimoAcceso}<span className="cc-audit-meta">{u.ultimoAccesoDesde || u.ultimoAccesoDispositivo || ''}{u.ultimoAccesoIp ? ' · ' + u.ultimoAccesoIp : ''}</span></td>
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
    <p><strong>Administrador</strong> gestiona usuarios y datos · <strong>Editor</strong> crea informes, carga archivos y edita Captación · <strong>Visita</strong> solo lectura. La cuenta principal no puede ser eliminada ni degradada.</p>
   </Card>
  </div>
 );
}

// ---------------- Login ----------------
function PageLogin({ onLogin }) {
 const [email, setEmail] = p4State('datos@colocolofc.cl');
 const [pass, setPass] = p4State('');
 const [error, setError] = p4State('');
 const [ingresando, setIngresando] = p4State(false);

 const entrar = e => {
  e.preventDefault();
  if (ingresando) return;
  const lista = ccLeerUsuarios();
  const u = lista.find(x => x.email === email.trim().toLowerCase());
  if (!u) { setError('Cuenta no encontrada. Pide acceso al administrador (datos@colocolofc.cl).'); return; }
  if (u.pass && u.pass !== pass) { setError('Contraseña incorrecta.'); return; }
  setIngresando(true);
  const iso = new Date().toISOString();
  const desde = ccAuditWhere();
  ccGuardarUsuarios(lista.map(x => x.email === u.email ? Object.assign({}, x, {
   ultimoAcceso: ccAuditFecha(iso),
   ultimoAccesoDesde: 'Actualizando ubicación…',
   ultimoAccesoDispositivo: desde.navegador + ' · ' + desde.plataforma
  }) : x));
  const entry = ccAudit('login', 'Sesión', 'Inicio de sesión correcto', u.email, { geoEstado: 'pendiente' });
  ccAuditCompletarLogin(entry.id, u.email);
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
     <button type="submit" className="cc-btn-primary" disabled={ingresando}>{ingresando ? 'Ingresando…' : 'Ingresar'}</button>
    </form>
    <p className="cc-login-foot">Cuenta principal: datos@colocolofc.cl · Los roles se administran en Gestión de Usuarios</p>
   </div>
  </div>
 );
}

Object.assign(window, { PageScouting, PageCampograma, PageConfig, PageUsuarios, PageLogin, EstadoLogos, SubirShotmaps, CatalogoPicker, ccLeerUsuarios, ccRolDe, ccPaginasDe, ccAudit, ccLeerAudit, ccGuardarAudit, ccAuditConfig, ccGuardarAuditConfig, ccAuditFetchGeoAuto });
