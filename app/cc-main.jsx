// ============================================================
// ColoColo Football Center — App principal
// Router por hash, shell, tweaks
// ============================================================
/* global React, ReactDOM, Sidebar, Icon, CC_NAV, CC_NAV_ADMIN */
/* global PageInicio, PageCalendario, PageResumen, PageAnalisis, PagePPDA, PageTiros */
/* global PageRankEquipos, PageRankJugadores, PageCompEquipos, PageCompJugadores */
/* global PageDispJugadores, PageDispEquipos, PageScouting, PageCampograma, PageConfig, PageUsuarios, PageLogin */
/* global PageGestion, PageCaptacion, PageOfrecidos, PageParaOfrecer */
/* global useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor */

const { useState, useEffect } = React;

const CC_PAGES = {
  inicio: { titulo: 'Inicio', comp: p => <PageInicio usuario={p.usuario}></PageInicio> },
  calendario: { titulo: 'Calendario', comp: () => <PageCalendario></PageCalendario> },
  resumen: { titulo: 'Resumen de Temporada', comp: () => <PageResumen></PageResumen> },
  ppda: { titulo: 'PPDA', comp: () => <PagePPDA></PagePPDA> },
  tiros: { titulo: 'Tiros y xG', comp: () => <PageTiros></PageTiros> },
  reporte: { titulo: 'Reporte Post-Partido', comp: () => <PageReporte></PageReporte> },
  'comp-equipos': { titulo: 'Comparación de Equipos', comp: () => <PageCompEquipos></PageCompEquipos> },
  'comp-jugadores': { titulo: 'Comparación de Jugadores', comp: () => <PageCompJugadores></PageCompJugadores> },
  'rank-equipos': { titulo: 'Ranking de Equipos', comp: () => <PageRankEquipos></PageRankEquipos> },
  'rank-jugadores': { titulo: 'Ranking de Jugadores', comp: () => <PageRankJugadores></PageRankJugadores> },
  'disp-jugadores': { titulo: 'Dispersión · Jugadores', comp: () => <PageDispJugadores></PageDispJugadores> },
  'disp-equipos': { titulo: 'Dispersión · Equipos', comp: () => <PageDispEquipos></PageDispEquipos> },
  scouting: { titulo: 'Informes de Scouting', comp: p => <PageScouting usuario={p.usuario}></PageScouting> },
  ofrecidos: { titulo: 'Jugadores ofrecidos', comp: p => <PageOfrecidos usuario={p.usuario}></PageOfrecidos> },
  'para-ofrecer': { titulo: 'Jugadores para ofrecer', comp: p => <PageParaOfrecer usuario={p.usuario}></PageParaOfrecer> },
  dt: { titulo: 'Dirección Técnica', comp: p => <PageDT usuario={p.usuario}></PageDT> },
  gestion: { titulo: 'Gestión de Jugadores', comp: p => <PageGestion usuario={p.usuario}></PageGestion> },
  captacion: { titulo: 'Captación', comp: p => <PageCaptacion usuario={p.usuario}></PageCaptacion> },
  campograma: { titulo: 'Campograma', comp: () => <PageCampograma></PageCampograma> },
  config: { titulo: 'Configuración', comp: p => <PageConfig usuario={p.usuario}></PageConfig> },
  usuarios: { titulo: 'Gestión de Usuarios', comp: p => <PageUsuarios sesion={p.usuario}></PageUsuarios> }
};

const CC_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "modo": "Claro",
  "acento": "#141414",
  "densidad": "Cómoda"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(CC_TWEAK_DEFAULTS);
  const [page, setPage] = useState(() => {
    const h = (window.location.hash || '').replace('#', '');
    return CC_PAGES[h] ? h : 'inicio';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sesion, setSesion] = useState(() => {
    try { return localStorage.getItem('cc_sesion') || ''; } catch (e) { return ''; }
  });

  useEffect(() => {
    const onHash = () => {
      const h = (window.location.hash || '').replace('#', '');
      if (CC_PAGES[h]) setPage(h);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navegar = id => {
    setPage(id);
    try { window.history.replaceState(null, '', '#' + id); } catch (e) {}
    const main = document.querySelector('.cc-main');
    if (main) main.scrollTop = 0;
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', t.modo === 'Oscuro' ? 'oscuro' : 'claro');
    document.documentElement.setAttribute('data-densidad', t.densidad === 'Compacta' ? 'compacta' : 'comoda');
    document.documentElement.style.setProperty('--accent', t.acento);
  }, [t.modo, t.densidad, t.acento]);

  const cerrarSesion = () => {
    try { localStorage.setItem('cc_sesion', ''); } catch (e) {}
    setSesion('');
  };
  const iniciarSesion = email => {
    try { localStorage.setItem('cc_sesion', email); } catch (e) {}
    setSesion(email);
  };

  const tweaks = (
    <TweaksPanel>
      <TweakSection label="Apariencia"></TweakSection>
      <TweakRadio label="Modo" value={t.modo} options={['Claro', 'Oscuro']} onChange={v => setTweak('modo', v)}></TweakRadio>
      <TweakColor label="Acento" value={t.acento} options={['#141414', '#BE1622', '#8A8A86']} onChange={v => setTweak('acento', v)}></TweakColor>
      <TweakRadio label="Densidad" value={t.densidad} options={['Cómoda', 'Compacta']} onChange={v => setTweak('densidad', v)}></TweakRadio>
    </TweaksPanel>
  );

  if (!sesion) {
    return (
      <React.Fragment>
        <PageLogin onLogin={iniciarSesion}></PageLogin>
        {tweaks}
      </React.Fragment>
    );
  }

  const actual = CC_PAGES[page] || CC_PAGES.inicio;
  const permitidas = (() => { try { return window.ccPaginasDe ? window.ccPaginasDe(sesion) : null; } catch (e) { return null; } })();
  const pagina = !permitidas || permitidas.includes(page) ? page : (permitidas[0] || 'inicio');
  const actualPermitida = CC_PAGES[pagina] || CC_PAGES.inicio;

  return (
    <div className="cc-shell">
      <Sidebar page={pagina} onNavigate={navegar} open={sidebarOpen} onClose={() => setSidebarOpen(false)} permitidas={permitidas}></Sidebar>

      <div className="cc-main-col">
        <header className="cc-topbar" data-screen-label={actualPermitida.titulo}>
          <button className="cc-burger" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Menú">
            <Icon name={sidebarOpen ? 'cerrar' : 'menu'} size={20}></Icon>
          </button>
          <div className="cc-topbar-title">
            <h1>{actualPermitida.titulo}</h1>
            <span className="cc-topbar-liga"><CCTournamentLogo size={20}></CCTournamentLogo>{window.CC_DATA.club.temporada}</span>
          </div>
          <div className="cc-topbar-right">
            <div className="cc-lang-switch" role="group" aria-label="Idioma / Language">
              <button className="cc-lang-opt" data-lang="es" onClick={() => window.CC_I18N && window.CC_I18N.set('es')}>ES</button>
              <button className="cc-lang-opt" data-lang="en" onClick={() => window.CC_I18N && window.CC_I18N.set('en')}>EN</button>
            </div>
            <span className="cc-topbar-user">{sesion}{(() => { try { const r = window.ccRolDe && window.ccRolDe(sesion); return r ? ' · ' + r : ''; } catch (e) { return ''; } })()}</span>
            <button className="cc-btn-ghost" onClick={cerrarSesion}>
              <Icon name="salir" size={16}></Icon>
              <span>Salir</span>
            </button>
          </div>
        </header>

        <main className="cc-main" data-screen-label={actualPermitida.titulo}>
          {actualPermitida.comp({ usuario: sesion })}
          <footer className="cc-foot">
            ColoColo Football Center · Plataforma interna de análisis
          </footer>
        </main>
      </div>

      {tweaks}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App></App>);
