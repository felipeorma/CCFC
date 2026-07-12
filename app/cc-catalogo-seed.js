// ============================================================
// ColoColo Football Center — Catálogo curado (nuestra "base de datos")
// Las ligas no cambian de formato seguido, así que se guardan aquí
// completas y fiables, agrupadas por región. Se actualizan por partes
// desde Configuración (CONMEBOL, UEFA, por país). La capa gratuita de
// TheSportsDB corta los equipos en 10 y omite divisiones; por eso
// estas ligas no dependen de ella.
// Chile · Primera usa el listado oficial de la plataforma.
// ============================================================
(function () {
  var CL_PRIMERA = (function () {
    try { return (window.CC_DATA.equipos || []).map(function (e) { return e.nombre; }); } catch (e) { return []; }
  })();

  // Mapa plano país → liga → equipos (nombres de país en inglés para
  // alinear con la API en vivo y evitar duplicados).
  window.CC_CATALOGO_SEED = {
    'Chile': {
      'Primera División de Chile': CL_PRIMERA.length ? CL_PRIMERA : [
        'Colo-Colo', 'Universidad de Chile', 'Universidad Católica', 'Audax Italiano', 'Cobresal',
        'Coquimbo Unido', 'Deportes La Serena', 'Deportes Limache', 'Everton', 'Huachipato',
        'Ñublense', "O'Higgins", 'Palestino', 'Unión Española', 'Unión La Calera', 'D. Concepción'
      ],
      'Primera B de Chile': [
        'Cobreloa', 'Curicó Unido', 'Deportes Antofagasta', 'Deportes Copiapó', 'Deportes Iquique',
        'Deportes Puerto Montt', 'Deportes Recoleta', 'Deportes Santa Cruz', 'Magallanes',
        'Rangers', 'San Marcos de Arica', 'Santiago Morning', 'Santiago Wanderers', 'Unión San Felipe'
      ]
    },
    'Argentina': {
      'Liga Profesional Argentina': [
        'Boca Juniors', 'River Plate', 'Racing Club', 'Independiente', 'San Lorenzo',
        'Estudiantes de La Plata', 'Vélez Sarsfield', 'Talleres', 'Argentinos Juniors', 'Lanús',
        'Defensa y Justicia', 'Rosario Central', "Newell's Old Boys", 'Gimnasia La Plata', 'Banfield',
        'Huracán', 'Instituto', 'Godoy Cruz', 'Platense', 'Tigre', 'Barracas Central',
        'Central Córdoba', 'Sarmiento', 'Unión', 'Atlético Tucumán', 'Belgrano',
        'Independiente Rivadavia', 'Deportivo Riestra', 'Aldosivi', 'San Martín de San Juan'
      ],
      'Primera Nacional (Argentina)': [
        'San Martín de Tucumán', 'Atlanta', 'Chacarita Juniors', 'Ferro Carril Oeste', 'Gimnasia de Jujuy',
        'Estudiantes de Río Cuarto', 'Almirante Brown', 'Defensores de Belgrano', 'Deportivo Morón',
        'Quilmes', 'Temperley', 'Nueva Chicago', 'Colón', 'Gimnasia de Mendoza', 'Agropecuario',
        'Chaco For Ever', 'Patronato', 'San Telmo', 'Almagro', 'Deportivo Maipú'
      ]
    },
    'Brazil': {
      'Brasileirão Série A': [
        'Flamengo', 'Palmeiras', 'Corinthians', 'São Paulo', 'Fluminense', 'Botafogo',
        'Vasco da Gama', 'Grêmio', 'Internacional', 'Atlético Mineiro', 'Cruzeiro', 'Bahia',
        'Fortaleza', 'Red Bull Bragantino', 'Juventude', 'Vitória', 'Criciúma', 'Cuiabá',
        'Athletico Paranaense', 'Atlético Goianiense'
      ],
      'Brasileirão Série B': [
        'Santos', 'Sport Recife', 'Novorizontino', 'Mirassol', 'Ceará', 'América Mineiro',
        'Goiás', 'Coritiba', 'Operário', 'Avaí', 'Chapecoense', 'Vila Nova', 'Paysandu',
        'CRB', 'Botafogo-SP', 'Amazonas', 'Ponte Preta', 'Guarani', 'Ituano', 'Brusque'
      ]
    },
    'Uruguay': {
      'Primera División de Uruguay': [
        'Peñarol', 'Nacional', 'Defensor Sporting', 'Danubio', 'Liverpool', 'Montevideo City Torque',
        'Cerro Largo', 'Boston River', 'Plaza Colonia', 'Racing', 'Montevideo Wanderers',
        'Progreso', 'Miramar Misiones', 'Cerro', 'River Plate (URU)', 'Juventud de Las Piedras'
      ],
      'Segunda División de Uruguay': [
        'Rampla Juniors', 'Central Español', 'Albion', 'Colón', 'Oriental', 'Rentistas',
        'Villa Española', 'Uruguay Montevideo', 'La Luz', 'Tacuarembó', 'Atenas de San Carlos',
        'Deportivo Maldonado'
      ]
    },
    'Colombia': {
      'Categoría Primera A (Colombia)': [
        'Atlético Nacional', 'Millonarios', 'América de Cali', 'Deportivo Cali', 'Junior',
        'Independiente Santa Fe', 'Independiente Medellín', 'Deportes Tolima', 'Once Caldas',
        'Atlético Bucaramanga', 'Águilas Doradas', 'La Equidad', 'Deportivo Pasto', 'Envigado',
        'Alianza FC', 'Fortaleza CEIF', 'Boyacá Chicó', 'Llaneros'
      ],
      'Categoría Primera B (Colombia)': [
        'Atlético Bucaramanga', 'Real Cartagena', 'Cúcuta Deportivo', 'Patriotas', 'Tigres FC',
        'Orsomarso', 'Bogotá FC', 'Barranquilla', 'Quindío', 'Real Santander', 'Atlético FC',
        'Leones', 'Internacional de Palmira'
      ]
    },
    'Peru': {
      'Liga 1 (Perú)': [
        'Universitario', 'Alianza Lima', 'Sporting Cristal', 'Melgar', 'Cienciano',
        'Sport Boys', 'Cusco FC', 'Atlético Grau', 'Deportivo Garcilaso', 'Sport Huancayo',
        'Unión Comercio', 'Los Chankas', 'Comerciantes Unidos', 'Alianza Atlético', 'ADT', 'UTC'
      ]
    },
    'Paraguay': {
      'Primera División de Paraguay': [
        'Olimpia', 'Cerro Porteño', 'Libertad', 'Guaraní', 'Nacional', 'Sportivo Luqueño',
        'Sportivo Trinidense', 'Sportivo Ameliano', '2 de Mayo', 'Tacuary', 'General Caballero',
        'Recoleta'
      ]
    },
    'Ecuador': {
      'Liga Pro (Ecuador)': [
        'Barcelona SC', 'Emelec', 'Liga de Quito', 'Independiente del Valle', 'Universidad Católica (ECU)',
        'Aucas', 'El Nacional', 'Deportivo Cuenca', 'Orense', 'Técnico Universitario',
        'Macará', 'Mushuc Runa', 'Delfín', 'Libertad', 'Vinotinto', 'Imbabura'
      ]
    },
    'Bolivia': {
      'División Profesional (Bolivia)': [
        'Bolívar', 'The Strongest', 'Always Ready', 'Oriente Petrolero', 'Blooming',
        'Nacional Potosí', 'Real Tomayapo', 'Aurora', 'San Antonio Bulo Bulo', 'Guabirá',
        'Independiente Petrolero', 'GV San José', 'Real Oruro'
      ]
    },
    'Spain': {
      'LaLiga (España)': [
        'Real Madrid', 'Barcelona', 'Atlético de Madrid', 'Athletic Club', 'Real Sociedad',
        'Real Betis', 'Villarreal', 'Valencia', 'Sevilla', 'Girona', 'Osasuna', 'Celta de Vigo',
        'Rayo Vallecano', 'Mallorca', 'Getafe', 'Espanyol', 'Las Palmas', 'Leganés', 'Alavés', 'Valladolid'
      ]
    },
    'Italy': {
      'Serie A (Italia)': [
        'Inter', 'Milan', 'Juventus', 'Napoli', 'Roma', 'Lazio', 'Atalanta', 'Fiorentina',
        'Bologna', 'Torino', 'Udinese', 'Genoa', 'Monza', 'Lecce', 'Cagliari', 'Hellas Verona',
        'Parma', 'Como', 'Empoli', 'Venezia'
      ]
    },
    'England': {
      'Premier League (Inglaterra)': [
        'Manchester City', 'Arsenal', 'Liverpool', 'Manchester United', 'Chelsea', 'Tottenham Hotspur',
        'Newcastle United', 'Aston Villa', 'Brighton & Hove Albion', 'West Ham United', 'Everton',
        'Fulham', 'Crystal Palace', 'Brentford', 'Nottingham Forest', 'Bournemouth',
        'Wolverhampton', 'Leicester City', 'Ipswich Town', 'Southampton'
      ]
    },
    'Germany': {
      'Bundesliga (Alemania)': [
        'Bayern München', 'Bayer Leverkusen', 'Borussia Dortmund', 'RB Leipzig', 'VfB Stuttgart',
        'Eintracht Frankfurt', 'Borussia Mönchengladbach', 'VfL Wolfsburg', 'SC Freiburg', 'Hoffenheim',
        'Mainz 05', 'Werder Bremen', 'FC Augsburg', 'Union Berlin', 'VfL Bochum', 'Heidenheim',
        'St. Pauli', 'Holstein Kiel'
      ]
    },
    'France': {
      'Ligue 1 (Francia)': [
        'Paris Saint-Germain', 'Marseille', 'Monaco', 'Lille', 'Lyon', 'Nice', 'Lens', 'Rennes',
        'Strasbourg', 'Brest', 'Toulouse', 'Reims', 'Nantes', 'Montpellier', 'Auxerre',
        'Le Havre', 'Angers', 'Saint-Étienne'
      ]
    },
    'Portugal': {
      'Primeira Liga (Portugal)': [
        'Benfica', 'Porto', 'Sporting CP', 'Sporting Braga', 'Vitória de Guimarães', 'Boavista',
        'Famalicão', 'Rio Ave', 'Gil Vicente', 'Moreirense', 'Estoril', 'Casa Pia', 'Arouca',
        'Farense', 'Estrela da Amadora', 'Santa Clara', 'Nacional', 'AVS'
      ]
    },
    'Netherlands': {
      'Eredivisie (Países Bajos)': [
        'Ajax', 'PSV', 'Feyenoord', 'AZ Alkmaar', 'Twente', 'Utrecht', 'Heerenveen',
        'Sparta Rotterdam', 'Go Ahead Eagles', 'NEC Nijmegen', 'Fortuna Sittard', 'PEC Zwolle',
        'Heracles', 'Willem II', 'Almere City', 'RKC Waalwijk', 'Groningen', 'NAC Breda'
      ]
    }
  };

  // Agrupación por región para las actualizaciones por partes (Configuración)
  window.CC_CATALOGO_REGIONS = [
    { id: 'conmebol', nombre: 'CONMEBOL (Sudamérica)', paises: ['Argentina', 'Bolivia', 'Brazil', 'Chile', 'Colombia', 'Ecuador', 'Paraguay', 'Peru', 'Uruguay'] },
    { id: 'uefa', nombre: 'UEFA — principales', paises: ['England', 'France', 'Germany', 'Italy', 'Netherlands', 'Portugal', 'Spain'] }
  ];
})();
