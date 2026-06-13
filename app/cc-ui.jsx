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
  avion: 'M21 3 3 10.5l6 2.5M21 3l-6.5 18-3.5-8M21 3 9.5 13',
  video: 'M3 6h13v12H3zM16 10l5-3v10l-5-3',
  pdf: 'M6 3h9l4 4v14H6zM15 3v4h4M9 12h6M9 16h4',
  mas: 'M12 5v14M5 12h14',
  basura: 'M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6',
  candado: 'M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11',
  escudo: 'M12 3 4.5 6v6c0 5 3.5 8 7.5 9 4-1 7.5-4 7.5-9V6z',
  descargar: 'M12 4v11M7 10.5 12 15l5-4.5M4 19.5h16'
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

function DataTable({ columns, rows, highlightRow }) {
  return (
    <div className="cc-table-wrap">
      <table className="cc-table">
        <thead>
          <tr>{columns.map(c => <th key={c.key} style={{ textAlign: c.align || 'left' }}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
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
  { id: 'inicio',        icon: 'inicio',        label: 'Inicio' },
  { id: 'calendario',    icon: 'calendario',    label: 'Calendario' },
  { id: 'resumen',       icon: 'resumen',       label: 'Resumen de Temporada' },
  { id: 'analisis',      icon: 'analisis',      label: 'Análisis Avanzado' },
  { id: 'ppda',          icon: 'ppda',          label: 'PPDA' },
  { id: 'tiros',         icon: 'tiros',         label: 'Tiros y xG' },
  { id: 'reporte',       icon: 'reporte',       label: 'Reporte Post-Partido' },
  { id: 'comp-equipos',  icon: 'compEquipos',   label: 'Comparación de Equipos' },
  { id: 'comp-jugadores',icon: 'compJugadores', label: 'Comparación de Jugadores' },
  { id: 'rank-equipos',  icon: 'rankEquipos',   label: 'Ranking de Equipos' },
  { id: 'rank-jugadores',icon: 'rankJugadores', label: 'Ranking de Jugadores' },
  { id: 'disp-jugadores',icon: 'dispJug',       label: 'Dispersión · Jugadores' },
  { id: 'disp-equipos',  icon: 'dispEq',        label: 'Dispersión · Equipos' },
  { id: 'scouting',      icon: 'scouting',      label: 'Informes de Scouting' },
  { id: 'campograma',    icon: 'campograma',    label: 'Campograma' }
];

const CC_NAV_ADMIN = [
  { id: 'config',   icon: 'config',   label: 'Configuración' },
  { id: 'usuarios', icon: 'usuarios', label: 'Gestión de Usuarios' }
];

function Sidebar({ page, onNavigate, open, onClose, permitidas }) {
  const visible = items => permitidas ? items.filter(i => permitidas.includes(i.id)) : items;
  const navPrincipal = visible(CC_NAV);
  const navAdmin = visible(CC_NAV_ADMIN);
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
          <p className="cc-nav-section">Plataforma</p>
          <ul>
            {navPrincipal.map(item => (
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
            ))}
          </ul>
          {navAdmin.length > 0 && <p className="cc-nav-section">Administración</p>}
          <ul>
            {navAdmin.map(item => (
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
            ))}
          </ul>
        </nav>
        <div className="cc-sidebar-footer">
          <p><strong>Club Social y Deportivo Colo-Colo</strong></p>
          <p>Área de Análisis · Scouting</p>
        </div>
      </aside>
    </React.Fragment>
  );
}

Object.assign(window, {
  Icon, Card, PageHeader, StatCard, Select, SegTabs, DataTable,
  ResultPill, Estrellas, EstrellasInput, Localia, Sidebar, CC_NAV, CC_NAV_ADMIN,
  CCTeamLogo, CCTournamentLogo
});
