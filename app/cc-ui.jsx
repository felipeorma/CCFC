// ============================================================
// ColoColo Football Center — UI base
// Iconos, Card, StatCard, Select, Tabs, Tabla, Sidebar, Shell
// ============================================================
/* global React */

const { useState: uiUseState, useEffect: uiUseEffect } = React;

// ---------------- Iconos (trazos propios, 24x24) ----------------
const CC_ICON_PATHS = {
  inicio: 'M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5',
  calendario: 'M4 5.5h16v15H4zM4 9.5h16M8 3v4M16 3v4',
  resumen: 'M5 20V10M12 20V4M19 20v-7',
  analisis: 'M12 3a4.5 4.5 0 0 0-2 8.5V14h4v-2.5A4.5 4.5 0 0 0 12 3zM10 17h4M10.5 20h3',
  ppda: 'M4 18a8 8 0 0 1 16 0M12 18l4-6M12 18h.01',
  tiros: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zM12 13a1 1 0 1 1 0-2',
  reporte: 'M6 3h9l4 4v14H6zM15 3v4h4M9 17v-3.5M12 17v-6M15 17v-2',
  compEquipos: 'M5 20V8M10 20V4M15 20v-9M20 20V7',
  compJugadores: 'M7 8 3 12l4 4M17 8l4 4-4 4M3 12h18',
  rankEquipos: 'M7 4h10v4a5 5 0 0 1-10 0zM7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3M12 13v4M8 21h8M12 17c-1.5 0-2.5 1-2.5 4h5c0-3-1-4-2.5-4',
  rankJugadores: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 14 7 21l5-2.5L17 21l-1.5-7',
  dispJug: 'M4 20h16M4 20V4M8 14h.01M11 9h.01M14 12h.01M17 6h.01M15 16h.01',
  dispEq: 'M4 20h16M4 20V4M9 16h.01M9 8h.01M13 11h.01M17 14h.01M17 7h.01',
  scouting: 'M6 3h9l4 4v14H6zM15 3v4h4M9 12h6M9 16h6M9 8h2',
  campograma: 'M3 4h18v16H3zM12 4v16M12 12m-2.5 0a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0M3 9h3v6H3M21 9h-3v6h3',
  config: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8',
  usuarios: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c0-3.5 2.9-5.5 6.5-5.5s6.5 2 6.5 5.5M16 4.6a3.5 3.5 0 0 1 0 6.8M17.8 14.9c2.2.6 3.7 2.2 3.7 5.1',
  salir: 'M9 21H4V3h5M14 16l4-4-4-4M8 12h10',
  menu: 'M4 6h16M4 12h16M4 18h16',
  cerrar: 'M5 5l14 14M19 5 5 19',
  reloj: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.5 2',
  alerta: 'M12 4 2.5 20h19zM12 10v4M12 17.2h.01',
  subir: 'M12 16V5M7 9.5 12 5l5 4.5M4 19.5h16',
  estrella: 'm12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 16.8 6.4 20l1.3-6.2L3 9.5l6.3-.7z',
  check: 'M4.5 12.5 10 18 19.5 7',
  flecha: 'M5 12h14M13 6l6 6-6 6',
  buscar: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 21 21',
  casa: 'M3 10.5 12 3l9 7.5M5.5 9.5V21h13V9.5M9.5 21v-6h5v6',
  mail: 'M3 6h18v12H3zM3 7l9 6 9-6',
  telefono: 'M5 4h4l1.5 5-2 1.5a12 12 0 0 0 5 5l1.5-2 5 1.5v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z',
  lapiz: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  dt: 'M4 4.5h16v12.5H4zM9 21h6M12 17v4M7.5 8l2.6 2.6M10.1 8 7.5 10.6M14.6 9.8a1.9 1.9 0 1 0 3.8 0 1.9 1.9 0 1 0-3.8 0',
  avion: 'M21 3 3 10.5l6 2.5M21 3l-6.5 18-3.5-8M21 3 9.5 13',
  video: 'M3 6h13v12H3zM16 10l5-3v10l-5-3',
  pdf: 'M6 3h9l4 4v14H6zM15 3v4h4M9 12h6M9 16h4',
  mas: 'M12 5v14M5 12h14',
  basura: 'M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6',
  candado: 'M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11',
  escudo: 'M12 3 4.5 6v6c0 5 3.5 8 7.5 9 4-1 7.5-4 7.5-9V6z',
  descargar: 'M12 4v11M7 10.5 12 15l5-4.5M4 19.5h16',
  actualizar: 'M20 11a8 8 0 1 0-2.34 5.66M20 4v7h-7',
  gestion: 'M7 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 14c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5M14 5h7M14 9h7M14 14h7M14 18h4',
  captacion: 'M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  ofrecidos: 'M14 5l5 4.5-5 4.5M19 9.5H5M9 19H5V5',
  paraOfrecer: 'M10 5 5 9.5l5 4.5M5 9.5h14M15 19h4V5'
};

function Icon({ name, size = 20, className = '', color }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      className={'cc-icon ' + className} aria-hidden="true"
    >
      <path d={CC_ICON_PATHS[name] || ''}></path>
    </svg>
  );
}

// ---------------- Logos (Sofascore CDN con respaldo a siglas) ----------------
function CCTeamLogo({ team, size = 24, className = '' }) {
  const [, setTick] = uiUseState(0);
  const [failed, setFailed] = uiUseState(false);
  uiUseEffect(() => {
    const f = () => { setFailed(false); setTick(t => t + 1); };
    window.addEventListener('cc-logos-ready', f);
    return () => window.removeEventListener('cc-logos-ready', f);
  }, []);
  uiUseEffect(() => { setFailed(false); }, [team]);
  const url = window.CC_LOGOS ? window.CC_LOGOS.teamUrl(team) : null;
  if (url && !failed) {
    return (
      <img
        className={'cc-logo ' + className} src={url} alt={'Escudo ' + team}
        width={size} height={size} loading="lazy"
        style={{ width: size + 'px', height: size + 'px' }}
        onError={() => setFailed(true)}
      ></img>
    );
  }
  const eq = ((window.CC_DATA && window.CC_DATA.equipos) || []).find(e => e.nombre === team);
  const abrev = eq ? eq.abrev : (team || '?').slice(0, 3).toUpperCase();
  const grande = size > 40;
  return (
    <span
      className={'cc-team-badge ' + (grande ? 'grande ' : '') + className}
      style={grande ? { minWidth: size + 'px', width: size + 'px', height: size + 'px', fontSize: Math.round(size / 3.6) + 'px' } : {}}
    >{abrev}</span>
  );
}

function CCTournamentLogo({ size = 22, className = '' }) {
  const [failed, setFailed] = uiUseState(false);
  const url = window.CC_LOGOS ? window.CC_LOGOS.tournamentUrl() : null;
  if (!url || failed) return null;
  return (
    <img
      className={'cc-logo ' + className} src={url} alt="Liga de Primera"
      width={size} height={size} loading="lazy"
      style={{ width: size + 'px', height: size + 'px' }}
      onError={() => setFailed(true)}
    ></img>
  );
}

// ---------------- Primitivas ----------------
function Card({ children, className = '', style }) {
  return <div className={'cc-card ' + className} style={style}>{children}</div>;
}

function PageHeader({ icon, title, subtitle, right }) {
  return (
    <div className="cc-page-header">
      <div className="cc-page-header-left">
        <div className="cc-page-icon"><Icon name={icon} size={22}></Icon></div>
        <div>
          <h2 className="cc-page-title">{title}</h2>
          {subtitle && <p className="cc-page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="cc-page-header-right">{right}</div>}
    </div>
  );
}

function StatCard({ label, value, sub, tone }) {
  return (
    <div className={'cc-stat' + (tone ? ' cc-stat-' + tone : '')}>
      <p className="cc-stat-label">{label}</p>
      <p className="cc-stat-value">{value}</p>
      {sub && <p className="cc-stat-sub">{sub}</p>}
    </div>
  );
}

function Select({ label, value, onChange, options, style }) {
  return (
    <label className="cc-select-wrap" style={style}>
      {label && <span className="cc-select-label">{label}</span>}
      <select className="cc-select" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => (
          typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function SegTabs({ value, onChange, options }) {
  return (
    <div className="cc-segtabs" role="tablist">
      {options.map(o => (
        <button
          key={o.value || o} role="tab"
          className={'cc-segtab' + ((o.value || o) === value ? ' active' : '')}
          onClick={() => onChange(o.value || o)}
        >{o.label || o}</button>
      ))}
    </div>
  );
}

function ccCsvCell(v) {
  if (v == null) return '';
  const s = String(v).replace(/"/g, '""');
  return /[",;\n]/.test(s) ? '"' + s + '"' : s;
}
function ccDescargarCSV(nombre, encabezados, filas) {
  const sep = ';';
  const lineas = [encabezados.map(ccCsvCell).join(sep)].concat(filas.map(f => f.map(ccCsvCell).join(sep)));
  const blob = new Blob(['\ufeff' + lineas.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = nombre + '.csv';
  a.click();
}
window.ccDescargarCSV = ccDescargarCSV;

function DataTable({ columns, rows, highlightRow, sortable, csv }) {
  const [orden, setOrden] = React.useState(null); // { key, dir } · 3er clic = orden original
  const puede = sortable !== false;
  const filas = React.useMemo(() => {
    if (!orden) return rows;
    const c = columns.find(x => x.key === orden.key);
    if (!c) return rows;
    const get = r => (c.sortValue ? c.sortValue(r) : r[c.key]);
    const vacio = v => (v == null || v === '' ? 1 : 0);
    return [...rows].sort((a, b) => {
      const va = get(a), vb = get(b);
      if (vacio(va) !== vacio(vb)) return vacio(va) - vacio(vb);
      const na = typeof va === 'number' ? va : parseFloat(va);
      const nb = typeof vb === 'number' ? vb : parseFloat(vb);
      const num = !isNaN(na) && !isNaN(nb);
      const cmp = num ? na - nb : String(va).localeCompare(String(vb), 'es');
      return cmp * orden.dir;
    });
  }, [rows, columns, orden]);
  const exportar = () => {
    const cols = columns.filter(c => c.key !== 'forma');
    ccDescargarCSV(csv,
      cols.map(c => (typeof c.label === 'string' ? c.label : c.key)),
      filas.map(r => cols.map(c => { const v = c.sortValue ? c.sortValue(r) : r[c.key]; return typeof v === 'object' ? '' : v; })));
  };
  return (
    <div className="cc-table-wrap">
      {csv ? (
        <div className="cc-table-tools">
          <button className="cc-btn-mini cc-btn-ghost" onClick={exportar}>Exportar CSV</button>
        </div>
      ) : null}
      <table className="cc-table">
        <thead>
          <tr>{columns.map(c => (
            <th key={c.key} style={{ textAlign: c.align || 'left' }}
              className={puede ? 'cc-th-sort' : ''} title={puede ? 'Ordenar' : undefined}
              onClick={() => { if (!puede) return; setOrden(prev => prev && prev.key === c.key ? (prev.dir === 1 ? { key: c.key, dir: -1 } : null) : { key: c.key, dir: 1 }); }}>
              <span className="cc-th-sort-in">{c.label}{orden && orden.key === c.key ? <span className="cc-th-arrow">{orden.dir === 1 ? '\u25B2' : '\u25BC'}</span> : null}</span>
            </th>
          ))}</tr>
        </thead>
        <tbody>
          {filas.map((r, i) => (
            <tr key={i} className={highlightRow && highlightRow(r) ? 'hot' : ''}>
              {columns.map(c => (
                <td key={c.key} style={{ textAlign: c.align || 'left' }}>
                  {c.render ? c.render(r, i) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResultPill({ resultado, local }) {
  if (!resultado) return <span className="cc-pill cc-pill-pendiente">Por jugar</span>;
  const [gf, gc] = resultado.split('-').map(Number);
  const tone = gf > gc ? 'v' : gf === gc ? 'e' : 'd';
  const txt = tone === 'v' ? 'V' : tone === 'e' ? 'E' : 'D';
  return <span className={'cc-pill cc-pill-' + tone}>{txt} {resultado}</span>;
}

// Local / Visita con icono de casa o avión
function Localia({ local, mini }) {
  return (
    <span className={'cc-localia ' + (local ? 'l' : 'v') + (mini ? ' mini' : '')} title={local ? 'Local' : 'Visita'}>
      <Icon name={local ? 'casa' : 'avion'} size={mini ? 11 : 13}></Icon>
    </span>
  );
}

function Estrellas({ valor }) {
  return (
    <span className="cc-estrellas" title={valor + ' / 5'}>
      {[1, 2, 3, 4, 5].map(i => (
        <Icon key={i} name="estrella" size={14} className={valor >= i - 0.25 ? 'fill' : valor >= i - 0.75 ? 'half' : 'off'}></Icon>
      ))}
    </span>
  );
}

function EstrellasInput({ valor, onChange }) {
  return (
    <span className="cc-estrellas-input">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)} aria-label={i + ' estrellas'}>
          <Icon name="estrella" size={19} className={valor >= i ? 'fill' : 'off'}></Icon>
        </button>
      ))}
    </span>
  );
}

// ---------------- Navegación ----------------
const CC_NAV = [
  { id: 'inicio',        icon: 'inicio',        label: 'Inicio',                 seccion: 'Equipo' },
  { id: 'calendario',    icon: 'calendario',    label: 'Calendario',             seccion: 'Equipo' },
  { id: 'resumen',       icon: 'resumen',       label: 'Resumen de Temporada',   seccion: 'Equipo' },
  { id: 'ppda',          icon: 'ppda',          label: 'PPDA',                   seccion: 'Equipo' },
  { id: 'tiros',         icon: 'tiros',         label: 'Tiros y xG',             seccion: 'Equipo' },
  { id: 'reporte',       icon: 'reporte',       label: 'Reporte Post-Partido',   seccion: 'Equipo' },
  { id: 'comp-equipos',  icon: 'compEquipos',   label: 'Comparación de Equipos',  seccion: 'Análisis comparativo' },
  { id: 'comp-jugadores',icon: 'compJugadores', label: 'Comparación de Jugadores',seccion: 'Análisis comparativo' },
  { id: 'rank-equipos',  icon: 'rankEquipos',   label: 'Ranking de Equipos',     seccion: 'Análisis comparativo' },
  { id: 'rank-jugadores',icon: 'rankJugadores', label: 'Ranking de Jugadores',   seccion: 'Análisis comparativo' },
  { id: 'disp-jugadores',icon: 'dispJug',       label: 'Dispersión · Jugadores',  seccion: 'Análisis comparativo' },
  { id: 'disp-equipos',  icon: 'dispEq',        label: 'Dispersión · Equipos',    seccion: 'Análisis comparativo' },
  { id: 'campograma',    icon: 'campograma',    label: 'Campograma',             seccion: 'Análisis comparativo' },
  { id: 'scouting',      icon: 'scouting',      label: 'Informes de Scouting',   seccion: 'Scouting de jugadores' },
  { id: 'ofrecidos',     icon: 'ofrecidos',     label: 'Jugadores ofrecidos',    seccion: 'Scouting de jugadores' },
  { id: 'para-ofrecer',  icon: 'paraOfrecer',   label: 'Jugadores para ofrecer', seccion: 'Scouting de jugadores' },
  { id: 'dt',            icon: 'dt',            label: 'Dirección Técnica',      seccion: 'Plantel' },
  { id: 'gestion',       icon: 'gestion',       label: 'Gestión de Jugadores',   seccion: 'Plantel' },
  { id: 'captacion',     icon: 'captacion',     label: 'Captación',              seccion: 'Plantel' }
];

const CC_NAV_ADMIN = [
  { id: 'config',   icon: 'config',   label: 'Configuración' },
  { id: 'usuarios', icon: 'usuarios', label: 'Gestión de Usuarios' }
];

function Sidebar({ page, onNavigate, open, onClose, permitidas }) {
  const visible = items => permitidas ? items.filter(i => permitidas.includes(i.id)) : items;
  const navPrincipal = visible(CC_NAV);
  const navAdmin = visible(CC_NAV_ADMIN);
  // Agrupar la navegación principal por sección preservando el orden
  const secciones = [];
  navPrincipal.forEach(item => {
    const s = item.seccion || 'Plataforma';
    let g = secciones.find(x => x.titulo === s);
    if (!g) { g = { titulo: s, items: [] }; secciones.push(g); }
    g.items.push(item);
  });
  const renderItem = item => (
    <li key={item.id}>
      <button
        className={'cc-nav-item' + (page === item.id ? ' active' : '')}
        onClick={() => { onNavigate(item.id); onClose(); }}
      >
        <span className="cc-nav-indicator"></span>
        <Icon name={item.icon} size={19}></Icon>
        <span className="cc-nav-label">{item.label}</span>
      </button>
    </li>
  );
  return (
    <React.Fragment>
      {open && <div className="cc-scrim" onClick={onClose}></div>}
      <aside className={'cc-sidebar' + (open ? ' open' : '')}>
        <div className="cc-sidebar-brand">
          <CCTeamLogo team="Colo-Colo" size={44}></CCTeamLogo>
          <div className="cc-sidebar-brand-text">
            <strong>ColoColo</strong>
            <span>Football Center</span>
          </div>
        </div>
        <nav className="cc-nav">
          {secciones.map(g => (
            <React.Fragment key={g.titulo}>
              <p className="cc-nav-section">{g.titulo}</p>
              <ul>{g.items.map(renderItem)}</ul>
            </React.Fragment>
          ))}
          {navAdmin.length > 0 && <p className="cc-nav-section">Administración</p>}
          <ul>{navAdmin.map(renderItem)}</ul>
        </nav>
        <div className="cc-sidebar-footer">
          <p><strong>Club Social y Deportivo Colo-Colo</strong></p>
          <p>Área de Análisis · Scouting</p>
        </div>
      </aside>
    </React.Fragment>
  );
}

// Logo oficial en alta calidad (SVG) para membrete y marca de agua de PDF.
// Se carga como <img>; si el host no lo sirve, cae al escudo del sistema.
var CC_LOGO_HQ = 'https://upload.wikimedia.org/wikipedia/en/b/be/Colo-Colo.svg';

function CCLogoHQ({ size, className }) {
  const [fail, setFail] = uiUseState(false);
  if (fail) return <CCTeamLogo team="Colo-Colo" size={size} className={className}></CCTeamLogo>;
  return <img src={CC_LOGO_HQ} alt="Colo-Colo" width={size} height={size}
    className={className} style={{ objectFit: 'contain' }} onError={() => setFail(true)}></img>;
}

// Membrete de PDF, repetido en cada página (print-only)
function CCPrintHeader({ titulo }) {
  return (
    <div className="cc-print-only cc-print-membrete" aria-hidden="true">
      <CCLogoHQ size={34}></CCLogoHQ>
      <div>
        <strong>Colo-Colo · {titulo}</strong>
        <span>ColoColo Football Center · Departamento de Análisis</span>
      </div>
    </div>
  );
}

// Marca de agua del escudo, centrada en cada página (print-only)
function CCPrintMarca() {
  return (
    <div className="cc-print-only cc-print-marca" aria-hidden="true">
      <CCLogoHQ size={470}></CCLogoHQ>
    </div>
  );
}

// Fuentes web embebidas como data-URL para que el JPG use la misma tipografía
// que la pantalla (dentro de un SVG-imagen no se cargan fuentes externas y el
// texto cambiaba de ancho → solapes). Se cachea tras la primera exportación.
let ccFontCSSCache = null;
async function ccFontCSSInline() {
  if (ccFontCSSCache != null) return ccFontCSSCache;
  let css = '';
  try {
    const links = [...document.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis"]')];
    for (const l of links) {
      const r = await fetch(l.href); if (!r.ok) continue;
      let t = await r.text();
      const urls = [...new Set((t.match(/url\(([^)]+)\)/g) || []).map(u => u.slice(4, -1).replace(/["']/g, '')))];
      for (const u of urls) {
        try {
          const rf = await fetch(u); if (!rf.ok) continue;
          const b = await rf.blob();
          const d = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(null); fr.readAsDataURL(b); });
          if (d) t = t.split(u).join(d);
        } catch (e) {}
      }
      css += t;
    }
  } catch (e) {}
  ccFontCSSCache = css;
  return css;
}

// Exporta un nodo del DOM a JPG con diseño profesional: copia los estilos
// reales de cada elemento (para que se vea igual que en pantalla), inlina
// los logos, y añade una cabecera de marca (escudo + título).
async function ccExportNodeJPG(node, filename, titulo) {
  if (!node) return;
  const esReportePartido = node.id === 'cc-reporte-partido-cap';
  const proxies = [u => u, u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u), u => 'https://corsproxy.io/?url=' + encodeURIComponent(u)];
  const toData = async url => {
    if (!url || url.startsWith('data:')) return url;
    for (const mk of proxies) {
      try {
        const ab = new AbortController();                       // sin timeout, un proxy caído
        const timer = setTimeout(() => ab.abort(), 4000);       // colgaba el export minutos
        const r = await fetch(mk(url), { signal: ab.signal });
        clearTimeout(timer);
        if (!r.ok) continue;
        const b = await r.blob();
        return await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(null); fr.readAsDataURL(b); });
      } catch (e) {}
    }
    return null;
  };
  // Propiedades a copiar (mantienen el diseño sin inflar demasiado)
  const PROPS = ['color', 'background-color', 'background-image', 'background-size', 'background-position',
    'font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-align',
    'text-transform', 'text-decoration', 'display', 'flex-direction', 'flex-wrap', 'align-items', 'justify-content',
    'gap', 'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row', 'width', 'height', 'min-width',
    'max-width', 'padding', 'margin', 'border', 'border-radius', 'box-shadow', 'opacity', 'position', 'top', 'left',
    'right', 'bottom', 'object-fit', 'white-space', 'overflow', 'fill', 'stroke', 'stroke-width', 'transform', 'vertical-align',
    // clave para que el layout no se desconfigure al exportar:
    'box-sizing', 'flex-grow', 'flex-shrink', 'flex-basis', 'align-self', 'justify-self', 'order',
    'min-height', 'max-height', 'z-index', 'text-overflow', 'aspect-ratio', 'grid-auto-flow',
    'grid-auto-columns', 'grid-auto-rows', 'border-collapse', 'border-spacing', 'table-layout', 'visibility'];
  const copyStyles = (src, dst) => {
    const cs = getComputedStyle(src);
    let s = '';
    for (const p of PROPS) {
      const v = cs.getPropertyValue(p);
      if (v && v !== 'normal' && v !== 'auto' && (v !== 'none' || p === 'display')) s += p + ':' + v + ';';
    }
    if (src.tagName && src.tagName.toLowerCase() === 'svg') {
      const r = src.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        dst.setAttribute('width', Math.ceil(r.width));
        dst.setAttribute('height', Math.ceil(r.height));
        s += 'width:' + Math.ceil(r.width) + 'px;height:' + Math.ceil(r.height) + 'px;max-height:none;overflow:visible;';
      }
    }
    if (!(src.tagName && src.tagName.toLowerCase() === 'svg')) {
      // Si el elemento vivo tenía contenido recortado (scroll interno u
      // overflow oculto), el clon se expande para que TODO salga en la imagen.
      if (src.scrollHeight - src.clientHeight > 4) s += 'height:auto;max-height:none;overflow:visible;';
      if (src.scrollWidth - src.clientWidth > 4) s += 'min-width:' + src.scrollWidth + 'px;overflow:visible;';
    }
    dst.setAttribute('style', s);
    const sc = src.children, dc = dst.children;
    for (let i = 0; i < sc.length; i++) copyStyles(sc[i], dc[i]);
  };
  // Ensancha temporalmente el nodo según el mayor desborde horizontal oculto
  // (p. ej. los 2 shotmaps lado a lado en pantallas angostas): así todo el
  // contenido cabe completo en la imagen en vez de salir cortado.
  let extraW = 0;
  node.querySelectorAll('*').forEach(el => { const d = el.scrollWidth - el.clientWidth; if (d > extraW) extraW = d; });
  const prevNodeW = node.style.width;
  if (extraW > 4) {
    node.style.width = Math.ceil(node.getBoundingClientRect().width + extraW + 16) + 'px';
    await new Promise(r => setTimeout(r, 90));
  }
  const clone = node.cloneNode(true);
  copyStyles(node, clone);
  // Los bloques de primer nivel siempre ocupan todo el ancho del lienzo:
  // sin esto, al ensanchar el nodo (extraW) las tarjetas superiores quedaban
  // con su ancho viejo (marcador a mitad de página) o solapadas.
  Array.from(clone.children).forEach(ch => {
    const st = ch.getAttribute('style') || '';
    if (/display:\s*inline/.test(st)) return;
    ch.style.width = '100%';
    ch.style.maxWidth = 'none';
    ch.style.boxSizing = 'border-box';
  });
  if (esReportePartido) {
    const reporteGrid = clone.querySelector('.cc-reporte-partido-sec');
    const shotCard = reporteGrid && reporteGrid.children[0];
    const metricasCard = reporteGrid && reporteGrid.children[1];
    const dual = shotCard && shotCard.querySelector('.cc-print-dualshot');
    if (reporteGrid && shotCard && dual) {
      reporteGrid.style.display = 'grid';
      reporteGrid.style.gridTemplateColumns = 'minmax(0, 820px) minmax(380px, 1fr)';
      reporteGrid.style.gridTemplateRows = 'auto';
      reporteGrid.style.gridAutoRows = 'auto';
      reporteGrid.style.gap = '18px';
      reporteGrid.style.width = '100%';
      reporteGrid.style.height = 'auto';
      reporteGrid.style.minHeight = '0';
      reporteGrid.style.maxHeight = 'none';
      reporteGrid.style.alignItems = 'stretch';
      shotCard.style.overflow = 'visible';
      shotCard.style.width = 'auto';
      shotCard.style.height = 'auto';
      shotCard.style.minHeight = '0';
      shotCard.style.maxHeight = 'none';
      shotCard.style.display = 'flex';
      shotCard.style.flexDirection = 'column';
      shotCard.style.justifyContent = 'center';
      if (metricasCard) {
        metricasCard.style.width = 'auto';
        metricasCard.style.height = 'auto';
        metricasCard.style.minHeight = '0';
        metricasCard.style.maxHeight = 'none';
        metricasCard.style.display = 'flex';
        metricasCard.style.flexDirection = 'column';
        metricasCard.style.justifyContent = 'center';
        const metricasTitulo = metricasCard.querySelector('.cc-card-title');
        if (metricasTitulo) {
          metricasTitulo.style.alignSelf = 'center';
          metricasTitulo.style.textAlign = 'center';
        }
      }
      Array.from(shotCard.children).forEach(el => {
        if (el === dual) return;
        if (el.classList.contains('cc-chart-head') || el.classList.contains('cc-shotmap2')) el.style.display = 'none';
      });
      dual.style.display = 'grid';
      dual.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
      dual.style.gap = '28px';
      dual.style.width = '100%';
      dual.style.alignItems = 'start';
      dual.querySelectorAll('.cc-dualshot-col').forEach(el => {
        el.style.minWidth = '0';
        const tituloShot = el.querySelector('.cc-dualshot-t');
        if (tituloShot) tituloShot.style.justifyContent = 'center';
      });
    }
  }
  // Sincronizar el estado REAL de los controles (cloneNode no copia checked/
  // value dinámicos): sin esto, los radios del export vuelven a su valor por
  // defecto (p. ej. "Colo-Colo" seleccionado aunque el usuario eligió al rival).
  const ctrlO = node.querySelectorAll('input, select, textarea');
  const ctrlC = clone.querySelectorAll('input, select, textarea');
  for (let i = 0; i < ctrlC.length; i++) {
    const o = ctrlO[i], c = ctrlC[i];
    if (!o) break;
    if (o.tagName === 'INPUT') {
      if (o.type === 'checkbox' || o.type === 'radio') {
        if (o.checked) c.setAttribute('checked', 'checked'); else c.removeAttribute('checked');
      } else {
        c.setAttribute('value', o.value);
      }
    } else if (o.tagName === 'SELECT') {
      for (let k = 0; k < c.options.length; k++) {
        if (k === o.selectedIndex) c.options[k].setAttribute('selected', 'selected');
        else c.options[k].removeAttribute('selected');
      }
    } else {
      c.textContent = o.value;
    }
  }
  clone.querySelectorAll('.cc-no-print').forEach(el => el.remove());
  // Inlinar imágenes (logos)
  const imgsO = node.querySelectorAll('img'), imgsC = clone.querySelectorAll('img');
  for (let i = 0; i < imgsC.length; i++) {
    const d = await toData(imgsO[i].currentSrc || imgsO[i].src);
    if (d) imgsC[i].setAttribute('src', d); else imgsC[i].remove();
  }
  const logo = await toData(CC_LOGO_HQ);
  const rect = node.getBoundingClientRect();
  const W = esReportePartido ? Math.max(1320, Math.ceil(rect.width)) : Math.ceil(rect.width);
  node.style.width = prevNodeW;   // restaurar el ancho real de la página
  clone.style.width = W + 'px';
  clone.style.margin = '0';

  // Contenedor con cabecera de marca
  const wrap = document.createElement('div');
  wrap.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  wrap.style.cssText = 'width:' + (W + 48) + 'px;background:#ffffff;font-family:' + getComputedStyle(document.body).fontFamily + ';';
  const head = document.createElement('div');
  head.style.cssText = 'display:flex;align-items:center;gap:14px;background:#0b0b0d;padding:16px 24px;border-bottom:4px solid #be1622;';
  head.innerHTML = (logo ? '<img src="' + logo + '" width="40" height="40" style="object-fit:contain"/>' : '') +
    '<div style="display:flex;flex-direction:column;line-height:1.2;">' +
    '<span style="color:#fff;font-size:19px;font-weight:800;">Colo-Colo · ' + (titulo || 'Análisis') + '</span>' +
    '<span style="color:#9aa1ac;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;">ColoColo Football Center · Departamento de Análisis</span>' +
    '</div>';
  const body = document.createElement('div');
  body.style.cssText = 'padding:24px;';
  body.appendChild(clone);
  wrap.appendChild(head); wrap.appendChild(body);
  document.body.appendChild(wrap);
  clone.querySelectorAll('svg').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) {
      el.setAttribute('width', Math.ceil(r.width));
      el.setAttribute('height', Math.ceil(r.height));
      el.style.width = Math.ceil(r.width) + 'px';
      el.style.height = Math.ceil(r.height) + 'px';
      el.style.maxHeight = 'none';
      el.style.overflow = 'visible';
    }
  });
  const totalH = Math.ceil(Math.max(wrap.getBoundingClientRect().height, wrap.scrollHeight)) + 10;
  const totalW = Math.ceil(Math.max(W + 48, wrap.scrollWidth));
  document.body.removeChild(wrap);

  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + totalW + '" height="' + totalH + '">' +
    '<foreignObject width="100%" height="100%"><style>' + (await ccFontCSSInline()) + '</style>' + new XMLSerializer().serializeToString(wrap) + '</foreignObject></svg>';
  const img = new Image();
  img.onload = () => {
    const sc = 2, c = document.createElement('canvas'); c.width = totalW * sc; c.height = totalH * sc;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
    try {
      const a = document.createElement('a'); a.href = c.toDataURL('image/jpeg', 0.95); a.download = (filename || 'colocolo') + '.jpg'; a.click();
    } catch (e) { alert('No se pudo exportar la imagen (contenido protegido).'); }
  };
  img.onerror = () => alert('No se pudo generar la imagen.');
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function ExportJPGButton({ targetSelector, filename, titulo }) {
  const [busy, setBusy] = uiUseState(false);
  return (
    <button className="cc-btn-ghost cc-no-print" style={{ width: 'auto' }} disabled={busy}
      onClick={async () => { setBusy(true); try { await ccExportNodeJPG(document.querySelector(targetSelector), filename, titulo); } finally { setBusy(false); } }}>
      <Icon name="subir" size={14}></Icon> {busy ? 'Generando…' : 'Exportar JPG'}
    </button>
  );
}

Object.assign(window, {
  Icon, Card, PageHeader, StatCard, Select, SegTabs, DataTable,
  ResultPill, Estrellas, EstrellasInput, Localia, Sidebar, CC_NAV, CC_NAV_ADMIN,
  CCTeamLogo, CCTournamentLogo, CCPrintHeader, CCPrintMarca, ccExportNodeJPG, ExportJPGButton
});
