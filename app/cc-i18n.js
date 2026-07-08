// ============================================================
// ColoColo Football Center — Traducción ES ⇄ EN en runtime
// No reescribe los componentes: traduce el DOM por diccionario
// (nodos de texto + atributos title/placeholder/aria-label) y
// mantiene la traducción con un MutationObserver. Tres capas:
//   1) DICT  — coincidencia exacta de la cadena completa
//   2) RX    — reglas regex para patrones con números
//   3) PHRASES — reemplazo de fragmentos (para "8 goles", etc.)
// Los nombres propios (jugadores, clubes, archivos, correos) no
// se traducen. El idioma se guarda en localStorage.
// ============================================================
(function () {
  var DICT = {
    // ---- Topbar / generales ----
    'Salir': 'Sign out', 'Menú': 'Menu',
    'Administrador': 'Administrator', 'Editor': 'Editor', 'Visita': 'Viewer',
    'ColoColo Football Center · Plataforma interna de análisis': 'ColoColo Football Center · Internal analytics platform',
    'Liga de Primera · Chile': 'Primera División · Chile',
    'Liga de Primera · Temporada 2026': 'Primera División · Season 2026',
    'Liga de Primera · en curso': 'Primera División · ongoing',
    // ---- Secciones del menú ----
    'Equipo': 'Team', 'Análisis comparativo': 'Comparative analysis',
    'Scouting de jugadores': 'Player scouting', 'Plantel': 'Squad', 'Administración': 'Administration',
    // ---- Navegación ----
    'Inicio': 'Home', 'Calendario': 'Schedule', 'Resumen de Temporada': 'Season Summary',
    'PPDA': 'PPDA', 'Tiros y xG': 'Shots & xG', 'Reporte Post-Partido': 'Post-Match Report',
    'Comparación de Equipos': 'Team Comparison', 'Comparación de Jugadores': 'Player Comparison',
    'Ranking de Equipos': 'Team Ranking', 'Ranking de Jugadores': 'Player Ranking',
    'Dispersión · Jugadores': 'Scatter · Players', 'Dispersión · Equipos': 'Scatter · Teams',
    'Campograma': 'Tactics Board', 'Informes de Scouting': 'Scouting Reports',
    // ---- Dirección Técnica ----
    'Dirección Técnica': 'Technical Direction',
    'Estado 360° del plantel · cada decisión se refleja en toda la plataforma': '360° squad status · every decision propagates across the platform',
    'Disponibles': 'Available', 'Lesionados': 'Injured', 'Suspendidos': 'Suspended',
    'En capilla': 'One booking away', 'En mercado': 'On the market',
    'Entrenamiento semanal': 'Weekly training',
    'El foco ajusta la condición estimada de todo el plantel (recuperación la sube, intensivo la baja).': 'The focus adjusts the estimated fitness of the whole squad (recovery raises it, intensive lowers it).',
    'Recuperación': 'Recovery', 'Táctico': 'Tactical', 'Físico intensivo': 'Intensive physical', 'Balón parado': 'Set pieces',
    'Plan de partido': 'Match plan',
    'Se muestra en el Campograma como referencia táctica del próximo rival.': 'Shown on the Tactics Board as the tactical reference for the next opponent.',
    'Presión': 'Pressing', 'Línea defensiva': 'Defensive line', 'Amplitud': 'Width',
    'Alta': 'High', 'Media': 'Medium', 'Baja': 'Low', 'Amplia': 'Wide', 'Normal': 'Normal', 'Estrecha': 'Narrow',
    'Plantel — estado individual': 'Squad — individual status',
    'Suspender': 'Suspend', 'Quitar suspensión': 'Remove suspension',
    'En plantel': 'In squad', 'Mercado: venta': 'Market: transfer', 'Mercado: cesión': 'Market: loan',
    'Suspendido': 'Suspended', 'Disponible': 'Available', 'Cedido': 'On loan', 'capilla': 'at risk',
    'Suspendido · Dirección Técnica': 'Suspended · Technical Direction',
    'Nota táctica (opcional)…': 'Tactical note (optional)…',
    // ---- DT v2: centro de rendimiento ----
    'Centro de rendimiento del plantel · cada registro se refleja en toda la plataforma': 'Squad performance center · every record propagates across the platform',
    'Panel': 'Overview', 'Disponibilidad': 'Availability', 'Físico y cargas': 'Physical & loads', 'Wellness': 'Wellness', 'Nutrición': 'Nutrition',
    'Carga alta': 'High load', 'Wellness promedio': 'Average wellness', 'Sin registros vigentes': 'No current records',
    'Alertas de rendimiento': 'Performance alerts',
    'Sin alertas: plantel disponible, cargas y wellness en rango.': 'No alerts: squad available, loads and wellness in range.',
    'Disponibilidad y estado competitivo': 'Availability and competitive status',
    'Datos físicos y carga de minutos': 'Physical data and minutes load',
    'Wellness diario del plantel': 'Daily squad wellness',
    'Plan nutricional del plantel': 'Squad nutrition plan',
    'Jugador': 'Player', 'Condición': 'Fitness', 'Moral': 'Morale', 'Tarjetas': 'Cards', 'Mercado': 'Market',
    'Altura': 'Height', 'Pie': 'Foot', 'Peso (kg)': 'Weight (kg)', 'IMC': 'BMI', 'Nivel': 'Level',
    'Carga de minutos': 'Minutes load', 'Sueño': 'Sleep', 'Fatiga': 'Fatigue', 'Dolor musc.': 'Muscle soreness',
    'Estrés': 'Stress', 'Ánimo': 'Mood', 'Puntaje': 'Score', 'Último registro': 'Last record',
    'Sin registro': 'No record', 'Plan': 'Plan', 'Restricciones / alergias': 'Restrictions / allergies',
    'Suplementación': 'Supplements', 'Observaciones': 'Notes',
    'Mantenimiento': 'Maintenance', 'Pérdida de grasa': 'Fat loss', 'Ganancia muscular': 'Muscle gain',
    'Recuperación de lesión': 'Injury recovery', 'Personalizado': 'Custom',
    'Venta': 'Transfer', 'Cesión': 'Loan', 'Suspender': 'Suspend', 'Quitar': 'Remove',
    'derecho': 'right', 'izquierdo': 'left',
    // ---- DT v3 ----
    'Castigo': 'Sanction', 'Sin castigo': 'No sanction',
    'Acumulación de tarjetas': 'Card accumulation', 'Secretaría / Tribunal': 'Disciplinary tribunal',
    'Puntaje actual': 'Current score', 'Registros': 'Records', 'Historial': 'History',
    'Abrir': 'Open', 'Cerrar': 'Close', 'Registrar': 'Save record', 'Actualizar': 'Update',
    'Fecha': 'Date', 'Torneo': 'Tournament', 'Rival': 'Opponent',
    'Sin marcar': 'Unmarked',
    '— Sin torneo —': '— No tournament —', '— Sin rival —': '— No opponent —',
    'Campeonato Chileno': 'Chilean Championship',
    'Pliegues (mm)': 'Skinfolds (mm)', 'Pre-temporada': 'Pre-season',
    'Mitad de temporada': 'Mid-season', 'Temporada regular': 'Regular season',
    'Sueño (5 mejor)': 'Sleep (5 best)', 'Fatiga (1 mejor)': 'Fatigue (1 best)',
    'Dolor muscular (1 mejor)': 'Muscle soreness (1 best)', 'Estrés (1 mejor)': 'Stress (1 best)',
    'Ánimo (5 mejor)': 'Mood (5 best)',
    'Energía': 'Energy', 'Estado muscular': 'Muscle status', 'Calma': 'Calmness',
    'Situación fin de temporada': 'End-of-season status',
    'Acciones por jugador — descarga con un clic': 'Player actions — one-click download',
    'Carpeta del proyecto en tu Mac': 'Project folder on your Mac',
    'Link del partido (opcional)': 'Match link (optional)',
    'Copiar comando': 'Copy command', 'Copiado ✓': 'Copied ✓', 'Copiar (solo la 1ª vez)': 'Copy (first time only)',
    'Acciones por jugador': 'Player actions', 'Pausar': 'Pause', 'Todo descargado ✓': 'All downloaded ✓',
    'Exportar archivo (cc-actions-data.js)': 'Export file (cc-actions-data.js)',
    'Plan B: descargar desde Terminal': 'Plan B: download from Terminal', 'Ocultar plan B (Terminal)': 'Hide plan B (Terminal)',
    'Completado': 'Completed', 'Completado ✓': 'Completed ✓', 'Parcial': 'Partial', 'Pendiente': 'Pending',
    'Todo completado ✓': 'All completed ✓', 'Descargar': 'Download',
    'Agregar partido por link': 'Add match by link', 'Jornada': 'Round', 'Link del partido': 'Match link',
    'Agregar y descargar': 'Add and download', 'Continúa': 'Stays', 'Libre': 'Free agent',
    'Préstamo': 'Loan', 'Transferencia': 'Transfer', 'Fin de cesión': 'Loan ended', 'Retiro': 'Retired',
    '— (sigue en el club)': '— (still at the club)',
    'Calificación de 1 a 5 estrellas en todos los ítems (1 bajo · 5 mejor) → puntaje 0–100. Cada registro guarda su día: abre el historial para agregar, editar o borrar fechas. Bajo 55 genera alerta y ajusta la condición estimada.': 'A 1-to-5 star rating on every item (1 low · 5 best) → 0–100 score. Each entry keeps its day: open the history to add, edit or delete dates. Below 55 raises an alert and adjusts the estimated fitness.',
    // ---- DT: estado auto + GPS ----
    'Temporada': 'Season', 'Carga de datos': 'Data upload', 'Shotmaps': 'Shotmaps', 'Logos': 'Logos', 'Catálogo de ligas': 'League catalog', 'Respaldo': 'Backup',
    'Estado (auto)': 'Status (auto)', 'Óptimo': 'Optimal', 'Apto': 'Fit', 'En gestión': 'Managing', 'Riesgo': 'At risk', 'No disponible': 'Unavailable',
    'GPS 7d (km)': 'GPS 7d (km)', 'GPS crón. (km)': 'GPS chronic (km)', 'ACWR': 'ACWR',
    'En ventana (≤7 días)': 'In window (≤7 days)', 'Dato GPS vencido': 'GPS data expired',
    // ---- GPS Catapult ----
    'GPS Catapult': 'GPS Catapult', 'Sin sesiones GPS cargadas': 'No GPS sessions loaded',
    'Subir CSV de Catapult': 'Upload Catapult CSV',
    'Subir CSV': 'Upload CSV', 'Sesión': 'Session', 'Jugadores': 'Players',
    'Distancia total equipo': 'Team total distance', 'Intensidad media': 'Average intensity', 'Vel. máx del día': 'Top speed of the day',
    'Resumen de sesión · Partido': 'Session summary · Match', 'Resumen de sesión · Entrenamiento': 'Session summary · Training',
    'Jugador (archivo)': 'Player (file)', 'Plantel': 'Squad', 'Sin casar': 'Unmatched', 'Carga': 'Load',
    'Perfil de intensidad — distancia por jugador': 'Intensity profile — distance per player',
    'Carga: Player Load vs Distancia': 'Load: Player Load vs Distance',
    'Casado de nombres con el plantel': 'Name matching with the squad',
    'Alta': 'High', 'Media': 'Medium', 'Baja': 'Low', 'Parcial': 'Partial',
    // ---- GPS: nuevas visualizaciones ----
    'Carga total del equipo': 'Team total load', 'suma de distancia': 'sum of distance',
    'Índice de intensidad': 'Intensity index', 'promedio del equipo': 'team average',
    'Sprints del equipo': 'Team sprints', 'total de esfuerzos': 'total efforts', 'pico individual': 'individual peak',
    'Sin enlazar': 'Unlinked', '— Sin enlazar —': '— Unlinked —',
    'Aceleraciones vs desaceleraciones': 'Accelerations vs decelerations',
    'Este export no incluye conteo de aceleraciones/desaceleraciones.': 'This export does not include acceleration/deceleration counts.',
    'Evolución del equipo': 'Team evolution',
    'Evolución del equipo — partidos y entrenamientos': 'Team evolution — matches and training',
    'Carga total (km)': 'Total load (km)', 'Intensidad (m/min)': 'Intensity (m/min)',
    'Carga al menos dos sesiones para ver la evolución (partidos y entrenamientos).': 'Load at least two sessions to see the evolution (matches and training).',





    'Jugadores ofrecidos': 'Players Offered', 'Jugadores para ofrecer': 'Players to Offer',
    'Gestión de Jugadores': 'Player Management', 'Captación': 'Recruitment',
    'Configuración': 'Settings', 'Gestión de Usuarios': 'User Management',
    // ---- Subtítulos de páginas ----
    'Temporada 2026 · tabla general de la liga · fixture oficial de 30 fechas': 'Season 2026 · league table · official 30-round fixture',
    'Promedios de los 14 partidos · plantel real de Colo-Colo': 'Averages over 14 matches · Colo-Colo real squad',
    'Pases que permitimos al rival antes de robar el balón · menos pases = presión más intensa': 'Passes allowed before regaining the ball · fewer passes = more intense pressing',
    '¿Cuánto peligro generamos y qué tan bien lo convertimos?': 'How much danger we create and how well we convert it',
    'Análisis completo del partido': 'Full match analysis',
    'Cara a cara con promedios Wyscout de temporada completa': 'Head-to-head with full-season Wyscout averages',
    'Equipos con Team Stats Wyscout cargado · promedios de temporada completa': 'Teams with Wyscout Team Stats loaded · full-season averages',
    'Toda la liga · líneas punteadas = promedio del filtro': 'Whole league · dashed lines = filter average',
    'Equipos con datos Wyscout de temporada completa · Colo-Colo destacado': 'Teams with full-season Wyscout data · Colo-Colo highlighted',
    'Pizarra táctica · arrastra para intercambiar, cambia el esquema y analiza al rival': 'Tactics board · drag to swap, change the formation and analyze the opponent',
    'Seguimiento de jugadores objetivo · elaborados por el área de scouting': 'Tracking of target players · produced by the scouting department',
    'Plantel 2026 · contratos, lesiones, cesiones, representantes y valor': 'Squad 2026 · contracts, injuries, loans, agents and value',
    'Red nacional de escuelas de fútbol Colo-Colo · temporada 2026': 'National network of Colo-Colo football schools · season 2026',
    'Fuentes de datos, temporada activa y logos de la plataforma': 'Data sources, active season and platform logos',
    'Mercado entrante · jugadores que ofrecen a Colo-Colo': 'Incoming market · players offered to Colo-Colo',
    'Mercado saliente · jugadores propios disponibles para transferencia o cesión': 'Outgoing market · own players available for transfer or loan',
    'Roles, accesos y contraseñas · cuenta principal: datos@colocolofc.cl': 'Roles, access and passwords · main account: datos@colocolofc.cl',
    // ---- Inicio / tablero ----
    'Sesión de': 'Session by', 'Posición': 'Position', 'Puntos': 'Points', 'Dif. de gol': 'Goal diff.',
    'Forma': 'Form', 'Próximo partido': 'Next match', 'Fecha': 'Round', 'Horario por confirmar': 'Time TBC',
    'Últimos resultados': 'Recent results', 'Goles a favor': 'Goals for', 'Goles en contra': 'Goals against',
    'Pendiente carga de datos': 'Data load pending',
    'Goleador': 'Top scorer', 'Asistidor': 'Top assister', 'Muro de avisos': 'Notice board',
    'Aviso': 'Notice', 'Urgente': 'Urgent', 'Táctico': 'Tactical', 'Reunión': 'Meeting', 'Publicar': 'Post',
    'Tareas pendientes': 'Pending tasks', 'Próximos cumpleaños': 'Upcoming birthdays',
    'Renovar contrato de Arturo Vidal (vence dic-2026)': 'Renew Arturo Vidal\u2019s contract (expires Dec-2026)',
    'Confirmar retorno de Javier Méndez (LCA)': 'Confirm Javier Méndez\u2019s return (ACL)',
    'Revisar informe de B. Cabrera (CB ofrecido)': 'Review report on B. Cabrera (CB offered)',
    'Lesion de Diego Ulloa, no viaja el domingo': 'Diego Ulloa injured, not travelling on Sunday',
    'Sala de reuniones #2 15:30 hrs': 'Meeting room #2, 15:30',
    // ---- Calendario ----
    'Victorias': 'Wins', 'Empates': 'Draws', 'Derrotas': 'Losses',
    'Tabla de posiciones': 'Standings', 'Fixture y resultados': 'Fixture & results',
    'Club': 'Club', 'GF': 'GF', 'GC': 'GA', 'DIF': 'GD', 'PTS': 'PTS',
    // ---- Resumen ----
    'Colo-Colo vs promedio de sus adversarios': 'Colo-Colo vs opponents\u2019 average',
    'Goles': 'Goals', 'Posesión': 'Possession', 'Posesión %': 'Possession %',
    'Precisión pases': 'Pass accuracy', 'Presión (PPDA)': 'Pressing (PPDA)', 'Duelos def.': 'Def. duels',
    'Valla': 'Goals against', 'Tiros al arco': 'Shots on target', 'Promedio adversarios': 'Opponents\u2019 average',
    'Métrica': 'Metric', 'Adversarios': 'Opponents', 'Goleadores': 'Top scorers', 'Asistencias': 'Assists',
    'Minutos jugados': 'Minutes played', 'Tarjetas': 'Cards',
    // ---- PPDA ----
    'PPDA — Presión': 'PPDA — Pressing', '¿Qué tan intensa es nuestra presión?': 'How intense is our pressing?',
    'PPDA promedio': 'Average PPDA', 'Rivales': 'Opponents', '◀ Presión intensa': '◀ Intense pressing',
    'Presión pasiva ▶': 'Passive pressing ▶', 'Partido con más presión': 'Highest-pressing match',
    'Partido con menos presión': 'Lowest-pressing match', 'Evolución fecha a fecha': 'Round-by-round trend',
    'Más presión que nuestro promedio': 'More pressing than our average', 'Menos presión': 'Less pressing',
    'Duelo de presión partido a partido': 'Pressing duel match by match',
    'CC presionó más': 'CC pressed more', 'Presionó más el rival': 'Opponent pressed more',
    // ---- Tiros y xG ----
    'Goles anotados': 'Goals scored', 'xG generado (goles esperados)': 'xG created (expected goals)',
    'Tiros al arco / partido': 'Shots on target / match', 'xG / partido': 'xG / match',
    'Mejor producción (xG)': 'Best output (xG)',
    'La carrera de la temporada: goles vs xG acumulado': 'Season race: goals vs cumulative xG',
    'Goles acumulados': 'Cumulative goals', 'xG acumulado': 'Cumulative xG',
    'Goles vs xG en cada partido': 'Goals vs xG per match', 'Detalle por partido': 'Match-by-match detail',
    'Eficiencia': 'Efficiency', 'Tiros': 'Shots',
    // ---- Reporte Post-Partido ----
    'Visita': 'Away', 'Esquema': 'Formation', 'Shotmap': 'Shotmap',
    'xG — pasa el cursor sobre un tiro': 'xG — hover over a shot', 'Gol': 'Goal', 'Tiro': 'Shot',
    'Automático': 'Automatic', 'Métricas del partido': 'Match metrics',
    'PPDA (presión)': 'PPDA (pressing)', 'Pases último tercio': 'Final-third passes',
    'Córners con remate': 'Corners with shot', 'Remates por jugador': 'Shots by player',
    'Shotmap real no disponible': 'Real shotmap unavailable',
    'Acción a mostrar': 'Action to show', 'Todas las acciones': 'All actions',
    'Pases y asistencias': 'Passes & assists', 'Centros': 'Crosses', 'Carreras con balón': 'Ball carries',
    'Regates': 'Dribbles', 'Defensivas (entradas, intercep., despejes, recup.)': 'Defensive (tackles, intercep., clearances, recov.)',
    'Remates': 'Shots', 'Pases': 'Passes', 'Pases largos': 'Long passes', 'Carreras': 'Carries',
    'Entradas': 'Tackles', 'Intercepciones': 'Interceptions', 'Despejes': 'Clearances',
    'Recuperaciones': 'Recoveries', 'ATAQUE →': 'ATTACK →',
    'Pase exitoso': 'Successful pass', 'Pase fallado': 'Failed pass', 'Pase largo exitoso': 'Successful long pass',
    'Carrera con balón': 'Ball carry', 'Despeje': 'Clearance', 'Entrada fallada': 'Failed tackle',
    'Entrada ganada': 'Won tackle', 'Intercepción': 'Interception', 'Recuperación': 'Recovery',
    // ---- Comparación de equipos ----
    'Equipo A': 'Team A', 'Equipo B': 'Team B', 'Ventaja por métrica': 'Edge per metric',
    'Métrica a métrica': 'Metric by metric', 'Pases precisos %': 'Accurate passes %',
    '(menos es mejor)': '(lower is better)', 'Duelos def. ganados %': 'Def. duels won %',
    'Tiros al arco %': 'Shots on target %', 'Equipo B: promedio de los rivales.': 'Team B: Wyscout · opponents\u2019 average.',
    'Perfil comparado': 'Compared profile',
    'Radar normalizado sobre la liga · más área = mejor.': 'Radar normalized over the league · more area = better.',
    // ---- Ranking de equipos ----
    'Posición en el ranking': 'Ranking position', 'Criterio': 'Criterion', 'Más es mejor': 'Higher is better',
    'Promedios por partido': 'Per-match averages', 'Centros': 'Crosses',
    'Córners': 'Corners', 'Faltas': 'Fouls',
    // ---- Ranking de jugadores ----
    'Goles / 90': 'Goals / 90', 'Remates / 90': 'Shots / 90', 'Precisión de pase %': 'Pass accuracy %',
    'Pases progresivos / 90': 'Progressive passes / 90', 'Jugadas claves / 90': 'Key passes / 90',
    'Duelos ganados %': 'Duels won %', 'Regates / 90': 'Dribbles / 90',
    'Carreras en progresión / 90': 'Progressive runs / 90', 'Acciones defensivas / 90': 'Defensive actions / 90',
    'Interceptaciones / 90': 'Interceptions / 90', 'Valor de mercado': 'Market value',
    'Toda la liga': 'Whole league', 'Línea': 'Line', 'Todos': 'All', 'Todas': 'All',
    'Arquero': 'Goalkeeper', 'Defensa': 'Defender', 'Mediocampista': 'Midfielder',
    'Extremo': 'Winger', 'Delantero': 'Forward',
    // ---- Dispersión ----
    'Eje horizontal': 'Horizontal axis', 'Eje vertical': 'Vertical axis', 'Duelos %': 'Duels %',
    'Acciones def. / 90': 'Def. actions / 90', 'Minutos': 'Minutes', 'Edad': 'Age',
    'Pasa el cursor sobre un punto para identificar al jugador.': 'Hover over a point to identify the player.',
    // ---- Scouting ----
    'Nuevo informe': 'New report', 'Recomendación': 'Recommendation', 'Fichar': 'Sign',
    'Seguir observando': 'Keep watching', 'Descartar': 'Discard', 'Técnica': 'Technical',
    'Táctica': 'Tactical', 'Física': 'Physical', 'Mental': 'Mental', 'Prioridad': 'Priority',
    'Ver informe completo': 'View full report', 'Ocultar informe': 'Hide report', 'Ver informe': 'View report',
    'Editar informe': 'Edit report', 'Editar': 'Edit', 'Eliminar informe': 'Delete report', 'Eliminar': 'Delete',
    'alta': 'high', 'media': 'medium', 'baja': 'low',
    'Notas acerca del jugador': 'Notes about the player', 'Agregar nota': 'Add note',
    'Liga actual': 'Current league', 'Obtener datos': 'Fetch data',
    'Ver PDF': 'View PDF', 'PDF listo para ver o descargar.': 'PDF ready to view or download.',
    'Leyendo PDF…': 'Reading PDF…', 'No se pudo leer el PDF.': 'Could not read the PDF.',
    'Este informe solo tiene el nombre del archivo. Vuelve a adjuntar el PDF para poder verlo o descargarlo.': 'This report only has the file name. Reattach the PDF to view or download it.',
    // ---- Mercado ----
    'Agregar jugador': 'Add player', 'Transferencia': 'Transfer', 'Cesión': 'Loan',
    'En análisis': 'Under review', 'Descartado': 'Discarded', 'Negociando': 'Negotiating',
    'Ofrecido': 'Offered', 'Cerrado': 'Closed', 'Valor': 'Value', 'Agente': 'Agent',
    'Motivo': 'Reason', 'Interesados': 'Interested', 'Ver informe': 'View report',
    'Zaguero zurdo, buen juego aéreo. Pide 3 años.': 'Left-footed CB, strong in the air. Asks for 3 years.',
    'Cesión con opción de compra de US$2.5M.': 'Loan with US$2.5M buy option.',
    'Salario fuera de presupuesto.': 'Salary out of budget.', '9 de área, 11 goles en Serie B.': 'Penalty-box striker, 11 goals in Serie B.',
    'Links de video': 'Video links', 'Informe / observaciones': 'Report / observations',
    // ---- Gestión de jugadores ----
    'En plantel': 'In squad', 'Lesionados': 'Injured', 'Cedidos fuera': 'Loaned out',
    'Extranjeros': 'Foreigners', 'Contrato por vencer': 'Contract expiring', 'Estado': 'Status',
    'Disponible': 'Available', 'Lesionado': 'Injured', 'Cedido': 'On loan', 'Jugador': 'Player',
    'Pos.': 'Pos.', 'Edad': 'Age', 'Contrato': 'Contract', 'Valor / Cláusula': 'Value / Buyout',
    'Representante': 'Agent', 'Sin valuación': 'No valuation', 'Cláusula': 'Buyout',
    'Cedido a': 'Loaned to', 'Rotura LCA rodilla izq.': 'Left knee ACL tear', 'Desgarro isquiotibial': 'Hamstring strain',
    'expira pronto': 'expiring soon', 'Sin representante': 'No agent', 'Editar jugador': 'Edit player',
    'Quitar del plantel': 'Remove from squad', 'Agencia de representación': 'Representation agency',
    'Contacto (persona)': 'Contact (person)', 'Teléfono': 'Phone', 'Nacionalidad': 'Nationality',
    'Fin de contrato (AAAA-MM-DD)': 'Contract end (YYYY-MM-DD)', 'Nacimiento (AAAA-MM-DD)': 'Birth (YYYY-MM-DD)',
    'Valor de mercado (US$)': 'Market value (US$)', 'Cláusula de rescisión (US$)': 'Buyout clause (US$)',
    // ---- Captación ----
    'Regiones con escuela': 'Regions with a school', 'Escuelas oficiales': 'Official schools',
    'Niños y niñas': 'Children', 'Agregar escuela en': 'Add school in', 'Agregar': 'Add',
    'Mapa de cobertura': 'Coverage map', 'o editarla': 'or edit it', 'Escuelas por región': 'Schools per region',
    'Resumen de la red de escuelas': 'School network summary', 'Región': 'Region', 'Escuelas': 'Schools',
    'Niños': 'Children', 'Niños/escuela': 'Children/school', 'Encargados': 'Managers', 'Encargado': 'Manager',
    'Categorías': 'Age groups', 'Destacados': 'Standouts', 'Total nacional': 'National total',
    'Jugadores destacados': 'Standout players', 'Falta agregar email': 'Email missing',
    'Falta agregar teléfono': 'Phone missing', 'Ciudad / sede': 'City / venue', 'N° de niños': 'No. of children',
    'Email de contacto': 'Contact email', 'Teléfono de contacto': 'Contact phone',
    'Año de nacimiento': 'Year of birth',
    // ---- Configuración ----
    'Temporada activa': 'Active season', 'Fixture': 'Schedule', 'Todos los datos cargados pertenecen a esta temporada': 'All loaded data belongs to this season',
    'Fechas del fixture': 'Schedule dates', 'Jornada': 'Round', 'Partido': 'Match',
    'Fecha oficial': 'Official date', 'Fecha vigente': 'Current date', 'Hora': 'Time',
    'Programado': 'Scheduled', 'Reprogramado': 'Rescheduled', 'Fecha por actualizar': 'Date needs updating',
    'Restaurar': 'Restore', 'Guardado': 'Saved',
    'Próximamente': 'Coming soon', 'Se habilitará al iniciar la próxima temporada': 'Will be enabled when the next season starts',
    '1 · Team Stats (un archivo por equipo)': '1 · Team Stats (one file per team)',
    'Equipo': 'Team', 'Archivo': 'File', 'Última actualización': 'Last update',
    '2 · Estadísticas de jugadores (liga completa)': '2 · Player statistics (full league)',
    'Cargado': 'Loaded', 'Detalle': 'Detail',
    'Tipo de archivo': 'File type', 'Team Stats (por equipo)': 'Team Stats (per team)',
    'Estadísticas de jugadores': 'Player statistics', 'Otro / adicional': 'Other / additional',
    'Seleccionar archivo': 'Select file', 'Arrastra aquí tu CSV o Excel': 'Drag your CSV or Excel here',
    'Shotmaps por partido': 'Per-match shotmaps', 'ID o URL del partido': 'Match ID or URL', 'URL del partido': 'Match URL',
    'Cargar shotmap': 'Load shotmap', 'Logos del torneo y equipos': 'Tournament & team logos',
    'Actualización automática por lotes': 'Automatic batch update',
    'Eventos espaciales': 'Spatial events', 'Pendiente backend': 'Backend pending',
    'Respaldo a siglas': 'Fallback to initials', 'URL del logo (PNG/SVG)': 'Logo URL (PNG/SVG)',
    'Guardar': 'Save', 'Catálogo de ligas y torneos por país': 'League & tournament catalog by country',
    'Base de datos interna': 'Internal database', 'CONMEBOL (Sudamérica)': 'CONMEBOL (South America)',
    'UEFA — principales': 'UEFA — main', 'Sin actualizar': 'Not updated', 'Actualizar': 'Update', 'Descargar': 'Download',
    'Cargar datos · Temporada': 'Load data · Season',
    // ---- Usuarios ----
    'Agregar usuario': 'Add user', 'Nombre': 'Name', 'Correo': 'Email', 'Rol': 'Role',
    'Contraseña': 'Password', 'Último acceso': 'Last access', 'Datos · Cuenta principal': 'Data · Main account',
    'Cuenta principal': 'Main account', 'Tú': 'You', 'Cambiar': 'Change', 'Hoy': 'Today',
    'Acceso total': 'Full access', 'Cuerpo Técnico': 'Coaching staff', 'Área de Scouting': 'Scouting department',
    'Sin contraseña': 'No password', 'Asignar': 'Assign', 'Gerencia Deportiva': 'Sporting management',
    'Eliminar usuario': 'Delete user', 'Permisos de acceso': 'Access permissions',
    // ---- Botones / comunes ----
    'Guardar cambios': 'Save changes', 'Cancelar': 'Cancel', 'Quitar': 'Remove', 'Exportar JPG': 'Export JPG',
    'Restaurar once con más minutos': 'Reset to most-used XI', 'Nuevo agente': 'New agent',
    'Marcar sin representante': 'Mark as no agent', 'Agregar representante': 'Add agent', 'Guardar agente': 'Save agent',
    'Banca / plantel': 'Bench / squad', 'Recomendaciones tácticas': 'Tactical recommendations',
    'Oportunidades': 'Opportunities', 'Debilidades a cuidar': 'Weaknesses to watch'
  };

  // Reglas regex para patrones con números (se prueban tras DICT)
  var RX = [
    [/^en (\d+) d$/, 'in $1 d'],
    [/^(\d+)°? de (\d+)$/, '$1 of $2'],
    [/^(\d+)° de (\d+)$/, '$1 of $2']
  ];

  // Fragmentos (se reemplazan en orden, de más largo a más corto)
  var PHRASES = [
    ['Estadísticas del plantel (', 'Squad statistics ('],
    ['Cada club aporta un archivo de', 'Each club provides a file from'],
    ['jugadores de la liga', 'league players'],
    ['Se asignará al equipo:', 'Will be assigned to team:'],
    ['· con su fecha de subida', '· with its upload date'],
    ['partidos con Wyscout + shotmap', 'matches with Wyscout + shotmap'],
    ['partidos con shotmap', 'matches with shotmap'],
    ['partidos jugados', 'matches played'],
    ['Pendiente carga de datos', 'Data load pending'],
    ['métricas a favor', 'metrics in favor'],
    ['Quitar shotmap de', 'Remove shotmap from'],
    ['Shotmap real', 'Real shotmap'],
    ['tamaño = xG', 'size = xG'],
    ['gestiona usuarios y datos', 'manages users and data'],
    ['crea informes, carga archivos y edita Captación', 'creates reports, uploads files and edits Recruitment'],
    ['es de solo lectura en Captación.', 'is read-only in Recruitment.'],
    ['La edición está disponible para roles Editor y Administrador.', 'Editing is available for Editor and Administrator roles.'],
    ['Posición en el ranking', 'Ranking position'],
    ['Minutos mínimos:', 'Minimum minutes:'],
    ['Edad mín:', 'Min age:'],
    ['Edad máx:', 'Max age:'],
    ['Pases último tercio:', 'Final-third passes:'],
    ['logrados de', 'completed of'],
    ['Sesión de', 'Session by'],
    ['xG generado', 'xG created'],
    ['Cedido a', 'Loaned to'],
    ['· en ', '· at '],
    ['· vuelve', '· returns'],
    ['· hasta', '· until'],
    ['· editado', '· edited'],
    ['años', 'years'],
    ['goles', 'goals'],
    ['asist.', 'assists'],
    ['partidos', 'matches'],
    ['jugadores', 'players'],
    ['encargados', 'managers'],
    ['equipos', 'teams'],
    ['países', 'countries'],
    ['páginas', 'pages'],
    ['métricas', 'metrics'],
    ['sin contacto', 'no contact'],
    ['de 30', 'of 30'],
    ['de 16', 'of 16'],
    ['° de ', '° of ']
  ].sort(function (a, b) { return b[0].length - a[0].length; });

  var origText = new WeakMap();
  var origAttr = new WeakMap();
  var ATTRS = ['title', 'placeholder', 'aria-label'];
  var lang = 'es';
  var observer = null;
  var timer = null;
  var selfWrites = new Set();   // nodos que el propio motor acaba de escribir

  function toEN(orig) {
    var key = (orig || '').trim();
    if (!key) return null;
    if (DICT[key] !== undefined) return orig.replace(key, DICT[key]);
    // regex
    for (var i = 0; i < RX.length; i++) {
      if (RX[i][0].test(key)) return orig.replace(RX[i][0], RX[i][1]);
    }
    // fragmentos
    var s = orig, changed = false;
    for (var j = 0; j < PHRASES.length; j++) {
      if (s.indexOf(PHRASES[j][0]) !== -1) { s = s.split(PHRASES[j][0]).join(PHRASES[j][1]); changed = true; }
    }
    return changed ? s : null;
  }

  function applyText(node) {
    var orig = origText.has(node) ? origText.get(node) : node.nodeValue;
    var en = toEN(orig);
    if (en === null) return;
    if (!origText.has(node)) origText.set(node, orig);
    if (node.nodeValue !== en) { selfWrites.add(node); node.nodeValue = en; }
  }
  function restoreText(node) { if (origText.has(node)) { selfWrites.add(node); node.nodeValue = origText.get(node); } }

  function applyAttrs(el) {
    ATTRS.forEach(function (a) {
      if (!el.hasAttribute(a)) return;
      var saved = origAttr.get(el) || {};
      var orig = (a in saved) ? saved[a] : el.getAttribute(a);
      var en = toEN(orig);
      if (en === null) return;
      saved[a] = orig; origAttr.set(el, saved);
      el.setAttribute(a, en);
    });
  }
  function restoreAttrs(el) {
    var saved = origAttr.get(el); if (!saved) return;
    ATTRS.forEach(function (a) { if (a in saved && el.hasAttribute(a)) el.setAttribute(a, saved[a]); });
  }

  function eachText(root, fn) {
    if (root.nodeType === 3) { fn(root); return; }
    if (root.nodeType !== 1) return;
    var it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n; while ((n = it.nextNode())) fn(n);
  }
  function eachEl(root, fn) {
    if (root.nodeType !== 1) return;
    if (root.hasAttribute('title') || root.hasAttribute('placeholder') || root.hasAttribute('aria-label')) fn(root);
    root.querySelectorAll('[title],[placeholder],[aria-label]').forEach(fn);
  }

  function translateAll() { eachText(document.body, applyText); eachEl(document.body, applyAttrs); }
  function restoreAll() { eachText(document.body, restoreText); eachEl(document.body, restoreAttrs); }

  function schedule() {
    if (lang !== 'en' || timer) return;
    timer = setTimeout(function () { timer = null; translateAll(); }, 30);
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.type === 'characterData') {
          if (selfWrites.has(m.target)) { selfWrites.delete(m.target); return; } // escritura del motor: conservar original
          if (origText.has(m.target)) origText.delete(m.target);                 // React reescribió: olvidar original viejo
        }
      });
      schedule();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  window.CC_I18N = {
    get: function () { return lang; },
    set: function (l) {
      lang = (l === 'en') ? 'en' : 'es';
      try { localStorage.setItem('cc_lang', lang); } catch (e) {}
      document.documentElement.setAttribute('data-cc-lang', lang);
      if (lang === 'en') { startObserver(); translateAll(); }
      else { restoreAll(); }
    }
  };

  function init() {
    var saved = 'es';
    try { saved = localStorage.getItem('cc_lang') || 'es'; } catch (e) {}
    lang = saved;
    document.documentElement.setAttribute('data-cc-lang', saved);
    startObserver();
    if (saved === 'en') translateAll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
