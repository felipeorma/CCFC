// ============================================================
// ColoColo Football Center — Estadísticas REALES por jugador
// y por partido (alineaciones Sofascore, descargadas y
// transcritas al construir la plataforma). Un partido terminado
// no cambia. SOLO DATOS REALES — nada generado.
//
// Claves por jugador (se omiten los ceros):
//  n nombre · p posición (G/D/M/F) · min minutos · r rating
//  to toques · pt/pa pases tot/acertados · lt/la p. largos
//  ct/ca centros · dt/da regates (intentados/ganados)
//  kp pases clave · tk entradas · it intercepciones
//  cl despejes · bl bloqueos · re recuperaciones
//  dw/dl duelos ganados/perdidos · fc/fr faltas com./recibidas
//  pl pérdidas de posesión · g goles · as asistencias · og autogol
//  sh tiros · sv atajadas (GK)
//  km kilómetros recorridos · sp sprints · ts velocidad máx (km/h)
//  (km/sp/ts solo en los partidos donde Sofascore los publicó)
// ============================================================
window.CC_LINEUPS_BUNDLE = {
 "15": {
  eventId: 15353054, ccEs: 'home',
  cc: [
   { n: 'Gabriel Maureira', p: 'G', min: 90, r: 7.2, to: 20, pt: 12, pa: 11, lt: 4, la: 3, cl: 1, re: 7, pl: 1, sv: 3 },
   { n: 'Jonathan Villagra', p: 'D', min: 90, r: 7.2, to: 76, pt: 63, pa: 59, lt: 2, la: 2, dt: 2, da: 1, tk: 1, it: 2, cl: 3, re: 8, dw: 3, dl: 3, pl: 6, sh: 1, km: 9.59, sp: 14, ts: 32.3 },
   { n: 'Arturo Vidal', p: 'D', min: 90, r: 9.2, to: 135, pt: 110, pa: 100, lt: 10, la: 9, dt: 1, da: 1, kp: 2, tk: 5, it: 3, cl: 4, re: 7, dw: 10, dl: 7, fc: 3, pl: 13, sh: 1, km: 9.33, sp: 3, ts: 29.6 },
   { n: 'Erick Wiemberg', p: 'D', min: 90, r: 7.8, to: 96, pt: 79, pa: 74, lt: 2, la: 1, dt: 1, tk: 2, it: 2, cl: 3, bl: 1, re: 8, dw: 4, dl: 4, pl: 7, km: 9.83, sp: 11, ts: 31.8 },
   { n: 'Jeyson Rojas', p: 'M', min: 88, r: 7.4, to: 69, pt: 47, pa: 42, lt: 3, ct: 4, ca: 2, dt: 5, da: 2, kp: 1, tk: 3, it: 1, re: 4, dw: 5, dl: 5, fc: 1, pl: 11, g: 1, sh: 1, km: 9.16, sp: 7, ts: 31.8 },
   { n: 'Tomás Alarcón', p: 'M', min: 90, r: 9.2, to: 172, pt: 152, pa: 145, lt: 7, la: 3, ct: 7, ca: 2, dt: 1, da: 1, kp: 6, tk: 5, cl: 2, re: 6, dw: 7, dl: 2, fc: 3, pl: 14, sh: 3, km: 11.1, sp: 5, ts: 29.3 },
   { n: 'Víctor Felipe Méndez', p: 'M', min: 90, r: 9.8, to: 165, pt: 156, pa: 145, lt: 5, la: 5, ct: 1, dt: 1, da: 1, kp: 5, tk: 1, it: 1, re: 10, dw: 2, dl: 2, fc: 1, pl: 13, g: 1, sh: 4, km: 10.66, sp: 4, ts: 29.3 },
   { n: 'Diego Ulloa', p: 'M', min: 88, r: 7.1, to: 61, pt: 38, pa: 35, lt: 2, la: 2, ct: 4, ca: 1, dt: 1, cl: 1, re: 3, dw: 2, dl: 3, fc: 1, fr: 1, pl: 10, km: 9.98, sp: 18, ts: 31.8 },
   { n: 'Leandro Hernández', p: 'F', min: 67, r: 7.8, to: 63, pt: 47, pa: 44, lt: 2, la: 2, dt: 6, da: 3, kp: 3, tk: 1, re: 3, dw: 8, dl: 5, fc: 1, fr: 3, pl: 9, sh: 2, km: 8.24, sp: 6, ts: 35.3 },
   { n: 'Javier Correa', p: 'F', min: 90, r: 5.9, to: 52, pt: 25, pa: 18, lt: 1, la: 1, dt: 6, da: 2, kp: 3, tk: 1, cl: 1, re: 3, dw: 3, dl: 7, fc: 2, pl: 17, as: 2, sh: 10, km: 8.67, sp: 9, ts: 29.2 },
   { n: 'Lautaro Pastrán', p: 'F', min: 78, r: 8.4, to: 67, pt: 48, pa: 43, ct: 1, dt: 4, da: 2, kp: 3, tk: 2, cl: 2, bl: 1, re: 2, dw: 6, dl: 5, fc: 1, fr: 1, pl: 11, g: 1, sh: 3, km: 8.42, sp: 6, ts: 31.0 },
   { n: 'Álvaro Madrid', p: 'M', min: 23, r: 7.3, to: 44, pt: 35, pa: 33, lt: 1, la: 1, ct: 1, dt: 3, da: 1, kp: 3, it: 1, re: 1, dw: 2, dl: 2, pl: 5, sh: 1, km: 3.52, ts: 24.9 },
   { n: 'Maximiliano Romero', p: 'F', min: 12, r: 6.7, to: 10, pt: 4, pa: 4, dt: 2, da: 1, tk: 1, re: 1, dw: 3, dl: 1, pl: 2, sh: 1, km: 1.45, sp: 1, ts: 27.2 },
   { n: 'Matías Fernández', p: 'D', min: 9, r: 6.9, to: 12, pt: 10, pa: 9, dw: 1, fr: 1, pl: 1, km: 1.32, sp: 2, ts: 29.8 },
   { n: 'Francisco Marchant', p: 'M', min: 9, r: 6.4, to: 8, pt: 5, pa: 5, dl: 1, pl: 2, km: 1.21, sp: 2, ts: 31.4 }
  ],
  rv: [
   { n: 'Alejandro Santander', p: 'G', min: 90, r: 7.0, to: 41, pt: 26, pa: 15, lt: 24, la: 13, re: 11, dw: 1, fr: 1, pl: 12, sv: 8 },
   { n: 'Guillermo Pacheco', p: 'D', min: 90, r: 5.9, to: 54, pt: 36, pa: 26, lt: 10, la: 3, ct: 1, ca: 1, dt: 1, kp: 1, tk: 1, it: 1, cl: 2, re: 1, dw: 2, dl: 2, pl: 15, sh: 1, km: 10.23, sp: 13, ts: 32.7 },
   { n: 'Franco Bechtholdt', p: 'D', min: 90, r: 6.1, to: 37, pt: 18, pa: 16, lt: 4, la: 2, tk: 1, it: 2, cl: 13, re: 3, dw: 2, dl: 3, pl: 2, km: 8.92, sp: 2, ts: 31.4 },
   { n: 'José Tiznado', p: 'D', min: 90, r: 7.7, to: 47, pt: 27, pa: 22, lt: 10, la: 6, tk: 5, it: 1, cl: 2, bl: 3, re: 3, dw: 6, dl: 2, fr: 1, pl: 5, sh: 2, km: 8.47, sp: 1, ts: 27.9 },
   { n: 'Anibal Gajardo', p: 'D', min: 45, r: 6.3, to: 21, pt: 8, pa: 6, lt: 3, la: 2, tk: 1, it: 1, cl: 3, re: 4, dw: 1, dl: 2, pl: 5, km: 4.75, sp: 1, ts: 26.4 },
   { n: 'Benjamín Valenzuela', p: 'M', min: 85, r: 6.3, to: 34, pt: 19, pa: 14, lt: 3, ct: 3, dt: 2, da: 1, tk: 2, cl: 2, re: 1, dw: 4, dl: 5, fc: 2, fr: 1, pl: 9, km: 9.99, sp: 9, ts: 34.9 },
   { n: 'Aaron Astudillo', p: 'M', min: 90, r: 7.0, to: 36, pt: 23, pa: 20, lt: 1, la: 1, ct: 1, dt: 1, tk: 4, it: 2, bl: 2, re: 2, dw: 5, dl: 3, fc: 1, fr: 1, pl: 6, km: 10.95, sp: 6, ts: 32.5 },
   { n: 'Agustin Nadruz', p: 'M', min: 45, r: 6.3, to: 22, pt: 16, pa: 15, lt: 1, bl: 1, re: 3, dl: 3, fc: 1, pl: 1, km: 5.32, sp: 2, ts: 28.1 },
   { n: 'Esteban Valencia', p: 'M', min: 66, r: 6.4, to: 28, pt: 23, pa: 21, lt: 2, la: 2, dt: 1, kp: 1, re: 2, dl: 2, pl: 5, km: 7.35, sp: 4, ts: 28.1 },
   { n: 'Steffan Pino', p: 'F', min: 66, r: 6.4, to: 32, pt: 17, pa: 12, lt: 2, la: 2, dt: 2, da: 1, cl: 1, re: 2, dw: 6, dl: 7, fr: 2, pl: 12, sh: 3, km: 6.16, sp: 7, ts: 29.2 },
   { n: 'Julián Brea', p: 'F', min: 90, r: 7.0, to: 47, pt: 16, pa: 12, ct: 7, ca: 1, dt: 8, da: 3, kp: 1, tk: 2, re: 4, dw: 10, dl: 13, fr: 4, pl: 23, sh: 1, km: 9.67, sp: 13, ts: 34.3 },
   { n: 'Antonio Castillo', p: 'D', min: 45, r: 6.8, to: 26, pt: 12, pa: 9, ct: 2, dt: 1, tk: 2, bl: 1, re: 2, dw: 2, dl: 4, fc: 1, pl: 7, km: 5.37, ts: 25.4 },
   { n: 'Rodrigo Sandoval', p: 'D', min: 45, r: 7.4, to: 40, pt: 25, pa: 19, lt: 7, la: 2, dt: 1, tk: 5, it: 3, cl: 1, bl: 1, re: 7, dw: 5, dl: 3, fc: 1, pl: 9, km: 5.47, sp: 2, ts: 27.2 },
   { n: 'Bryan Carvallo', p: 'M', min: 24, r: 6.3, to: 16, pt: 8, pa: 4, tk: 1, it: 1, re: 3, dw: 2, dl: 4, fr: 1, pl: 6, sh: 1, km: 3.54, sp: 4, ts: 28.0 },
   { n: 'Franco Frías', p: 'F', min: 24, r: 6.6, to: 10, pt: 5, pa: 5, ct: 1, ca: 1, dt: 1, da: 1, kp: 1, cl: 1, dw: 1, dl: 3, pl: 2, km: 3.3, sp: 4, ts: 31.9 },
   { n: 'Benjamín Villarroel', p: 'D', min: 12, r: 6.6, to: 3, pt: 1, pl: 1, km: 1.14, sp: 1, ts: 28.0 }
  ]
 },
 "14": {
  eventId: 15353051, ccEs: 'away',
  cc: [
   { n: 'Gabriel Maureira', p: 'G', min: 90, r: 6.0, to: 30, pt: 24, pa: 18, lt: 12, la: 6, cl: 2, re: 5, pl: 6, sv: 1 },
   { n: 'Jonathan Villagra', p: 'D', min: 90, r: 6.6, to: 73, pt: 62, pa: 59, lt: 4, la: 1, tk: 1, it: 2, cl: 1, bl: 1, re: 5, dw: 4, dl: 1, fr: 2, pl: 3, km: 9.31, sp: 5, ts: 32.0 },
   { n: 'Arturo Vidal', p: 'D', min: 90, r: 7.3, to: 95, pt: 80, pa: 76, lt: 12, la: 11, dt: 1, kp: 2, tk: 4, it: 1, cl: 3, re: 4, dw: 7, dl: 6, fc: 3, pl: 7, as: 1, sh: 1, km: 8.85, sp: 2, ts: 26.4 },
   { n: 'Joaquín Sosa', p: 'D', min: 90, r: 6.4, to: 96, pt: 77, pa: 66, lt: 9, la: 4, dt: 2, da: 1, tk: 1, it: 1, cl: 1, re: 7, dw: 6, dl: 7, fc: 2, fr: 1, pl: 15, sh: 1, km: 9.41, sp: 13, ts: 29.9 },
   { n: 'Jeyson Rojas', p: 'M', min: 90, r: 6.6, to: 59, pt: 38, pa: 29, lt: 1, ct: 3, dt: 1, kp: 1, tk: 5, cl: 1, re: 6, dw: 6, dl: 4, pl: 19, km: 9.74, sp: 11, ts: 30.9 },
   { n: 'Álvaro Madrid', p: 'M', min: 60, r: 6.6, to: 64, pt: 54, pa: 46, lt: 4, la: 2, dt: 1, tk: 1, cl: 1, re: 2, dw: 4, dl: 4, fr: 1, pl: 10, sh: 2, km: 6.45, sp: 1, ts: 27.8 },
   { n: 'Víctor Felipe Méndez', p: 'M', min: 90, r: 7.2, to: 80, pt: 73, pa: 66, lt: 2, ct: 2, dt: 1, kp: 4, tk: 2, re: 12, dw: 3, dl: 3, fr: 1, pl: 10, g: 1, sh: 1, km: 9.55, sp: 3, ts: 28.0 },
   { n: 'Diego Ulloa', p: 'M', min: 90, r: 5.9, to: 60, pt: 34, pa: 27, ct: 8, ca: 1, dt: 2, tk: 1, it: 1, cl: 2, re: 3, dw: 3, dl: 6, fc: 1, fr: 2, pl: 18, sh: 1, km: 10.06, sp: 13, ts: 29.8 },
   { n: 'Leandro Hernández', p: 'F', min: 78, r: 7.1, to: 43, pt: 22, pa: 15, lt: 1, ct: 3, dt: 2, da: 2, tk: 1, re: 1, dw: 5, dl: 4, fc: 1, fr: 1, pl: 18, g: 1, sh: 2, km: 8.45, sp: 4, ts: 29.6 },
   { n: 'Javier Correa', p: 'F', min: 90, r: 6.3, to: 30, pt: 20, pa: 16, kp: 1, cl: 1, bl: 1, re: 3, dw: 1, dl: 6, fc: 1, pl: 7, as: 1, sh: 3, km: 7.89, sp: 7, ts: 30.4 },
   { n: 'Lautaro Pastrán', p: 'F', min: 89, r: 8.4, to: 61, pt: 39, pa: 32, ct: 1, dt: 6, da: 5, kp: 4, tk: 3, re: 2, dw: 9, dl: 9, fc: 2, fr: 1, pl: 16, g: 1, sh: 2, km: 9.61, sp: 11, ts: 32.4 },
   { n: 'Maximiliano Romero', p: 'F', min: 30, r: 6.3, to: 10, pt: 3, pa: 1, dw: 2, dl: 1, pl: 6, km: 3.22, sp: 5, ts: 31.0 },
   { n: 'Francisco Marchant', p: 'M', min: 12, r: 6.8, to: 18, pt: 11, pa: 9, ct: 3, dt: 1, da: 1, dw: 1, pl: 5, g: 1, sh: 2, km: 2.14, sp: 4, ts: 31.0 },
   { n: 'Erick Wiemberg', p: 'D', min: 1, to: 4, pt: 4, pa: 4, dw: 1 }
  ],
  rv: [
   { n: 'Federico Lanzillotta', p: 'G', min: 90, r: 5.6, to: 31, pt: 20, pa: 11, lt: 14, la: 5, re: 8, dw: 1, pl: 9, sv: 3 },
   { n: 'Bruno Gutiérrez', p: 'D', min: 90, r: 7.0, to: 44, pt: 17, pa: 13, lt: 4, la: 1, dt: 1, kp: 1, tk: 2, cl: 4, re: 3, dw: 3, dl: 3, fc: 2, pl: 10, g: 1, sh: 2, km: 8.82, sp: 4, ts: 27.7 },
   { n: 'Francis Mac Allister', p: 'D', min: 90, r: 6.2, to: 42, pt: 32, pa: 24, lt: 13, la: 7, cl: 6, re: 3, dw: 4, dl: 2, fr: 2, pl: 8, km: 8.81, sp: 4, ts: 28.0 },
   { n: 'Rafael Delgado', p: 'D', min: 90, r: 5.8, to: 50, pt: 35, pa: 21, lt: 19, la: 8, tk: 3, it: 2, cl: 6, re: 1, dw: 4, dl: 3, fc: 1, pl: 15, km: 8.38, sp: 4, ts: 27.0 },
   { n: 'Yahir Salazar', p: 'D', min: 90, r: 5.6, to: 44, pt: 26, pa: 19, lt: 5, la: 1, ct: 1, dt: 2, kp: 1, tk: 2, it: 2, cl: 4, bl: 1, re: 4, dw: 2, dl: 5, fc: 2, pl: 12, km: 9.37, sp: 7, ts: 30.1 },
   { n: 'Ángelo Henríquez', p: 'F', min: 37, r: 6.3, to: 10, pt: 6, pa: 2, lt: 2, bl: 1, dl: 2, pl: 6, sh: 1, km: 3.77, sp: 5, ts: 30.5 },
   { n: 'Sebastián Díaz', p: 'M', min: 90, r: 6.4, to: 43, pt: 27, pa: 19, lt: 3, la: 1, dt: 1, tk: 5, it: 5, re: 5, dw: 7, dl: 9, fc: 3, pl: 11, km: 10.3, sp: 5, ts: 35.1 },
   { n: 'Gonzalo Escalante', p: 'M', min: 89, r: 6.0, to: 51, pt: 38, pa: 28, lt: 7, la: 3, tk: 2, it: 3, cl: 2, re: 3, dw: 6, fc: 1, fr: 3, pl: 10, sh: 1, km: 9.8, sp: 4, ts: 27.8 },
   { n: 'Felipe Chamorro', p: 'M', min: 89, r: 6.4, to: 36, pt: 15, pa: 9, lt: 3, la: 1, dt: 2, cl: 1, re: 6, dw: 9, dl: 11, fc: 1, fr: 4, pl: 15, sh: 1, km: 10.33, sp: 10, ts: 29.1 },
   { n: 'Diego Rubio', p: 'F', min: 68, r: 7.7, to: 27, pt: 15, pa: 8, lt: 1, la: 1, ct: 1, dt: 1, tk: 3, cl: 1, re: 1, dw: 9, dl: 6, pl: 12, g: 1, sh: 1, km: 6.67, sp: 1, ts: 30.0 },
   { n: 'Jeisson Vargas', p: 'F', min: 90, r: 6.5, to: 42, pt: 24, pa: 17, lt: 4, la: 1, ct: 4, ca: 2, dt: 3, da: 2, kp: 2, cl: 1, re: 6, dw: 2, dl: 7, fc: 1, pl: 14, sh: 2, km: 9.54, sp: 12, ts: 29.0 },
   { n: 'Joaquín Gutiérrez', p: 'D', min: 53, r: 5.4, to: 18, pt: 13, pa: 7, lt: 2, la: 1, ct: 1, tk: 1, re: 2, dw: 2, dl: 2, fc: 1, pl: 10, km: 6.77, sp: 14, ts: 31.3 },
   { n: 'Milovan Velásquez', p: 'M', min: 22, r: 6.4, to: 9, pt: 4, pa: 3, dt: 2, da: 1, tk: 1, dw: 2, dl: 2, pl: 3, km: 3.3, sp: 1, ts: 25.9 },
   { n: 'Matías Pinto', p: 'D', min: 1, km: 0.61, sp: 1 },
   { n: 'Matías Marín', p: 'M', min: 1, to: 1, pt: 1, re: 1, pl: 1 }
  ]
 },
 "13": {
  eventId: 15353044, ccEs: 'away',
  cc: [
   { n: 'Gabriel Maureira', p: 'G', min: 90, r: 7.5, to: 43, pt: 32, pa: 13, lt: 26, la: 7, kp: 1, cl: 1, re: 12, pl: 19, sv: 3 },
   { n: 'Jonathan Villagra', p: 'D', min: 90, r: 6.6, to: 37, pt: 23, pa: 19, lt: 2, tk: 1, it: 1, cl: 6, bl: 1, re: 2, dw: 3, dl: 4, fc: 1, fr: 1, pl: 5, km: 9.05, sp: 12, ts: 34.4 },
   { n: 'Arturo Vidal', p: 'D', min: 90, r: 6.2, to: 67, pt: 55, pa: 49, lt: 10, la: 6, tk: 1, cl: 7, re: 7, dw: 2, dl: 5, fc: 3, pl: 6, og: 1, km: 8.51, sp: 4, ts: 32.5 },
   { n: 'Joaquín Sosa', p: 'D', min: 90, r: 7.1, to: 62, pt: 33, pa: 26, lt: 3, la: 1, ct: 1, dt: 1, tk: 3, cl: 3, re: 2, dw: 8, dl: 3, fr: 2, pl: 17, sh: 2, km: 10.14, sp: 11, ts: 31.4 },
   { n: 'Jeyson Rojas', p: 'M', min: 90, r: 6.4, to: 45, pt: 22, pa: 16, lt: 3, la: 1, dt: 2, kp: 1, tk: 2, cl: 1, re: 2, dw: 2, dl: 4, fc: 1, pl: 14, km: 9.99, sp: 13, ts: 32.0 },
   { n: 'Tomás Alarcón', p: 'M', min: 90, r: 6.5, to: 61, pt: 49, pa: 40, lt: 5, la: 3, ct: 1, dt: 1, da: 1, kp: 1, tk: 3, cl: 1, bl: 1, re: 5, dw: 4, dl: 7, fc: 4, pl: 11, as: 1, sh: 1, km: 10.56, sp: 6, ts: 28.4 },
   { n: 'Víctor Felipe Méndez', p: 'M', min: 90, r: 6.8, to: 52, pt: 45, pa: 42, lt: 1, dt: 2, da: 2, kp: 1, cl: 1, re: 7, dw: 2, dl: 3, fc: 1, pl: 5, km: 9.94, sp: 3, ts: 29.6 },
   { n: 'Diego Ulloa', p: 'M', min: 82, r: 6.5, to: 40, pt: 25, pa: 20, lt: 2, la: 1, ct: 3, dt: 3, da: 2, tk: 1, it: 2, cl: 1, bl: 2, re: 5, dw: 4, dl: 7, fc: 3, pl: 10, sh: 1, km: 9.37, sp: 8, ts: 31.6 },
   { n: 'Álvaro Madrid', p: 'F', min: 66, r: 6.7, to: 27, pt: 17, pa: 13, lt: 1, ct: 2, ca: 1, dt: 1, it: 1, cl: 2, bl: 1, re: 5, dw: 2, dl: 3, fc: 1, fr: 1, pl: 8, km: 7.44, sp: 6, ts: 32.5 },
   { n: 'Javier Correa', p: 'F', min: 45, r: 8.9, to: 15, pt: 6, pa: 3, lt: 2, la: 1, dt: 1, da: 1, kp: 1, tk: 1, re: 0, dw: 2, dl: 1, pl: 4, g: 2, sh: 4 },
   { n: 'Leandro Hernández', p: 'F', min: 89, r: 6.5, to: 40, pt: 22, pa: 18, lt: 2, la: 2, ct: 1, dt: 2, da: 1, kp: 1, tk: 1, cl: 1, re: 3, dw: 4, dl: 6, fc: 2, fr: 2, pl: 12, as: 1, km: 10.68, sp: 10, ts: 32.4 },
   { n: 'Maximiliano Romero', p: 'F', min: 45, r: 6.2, to: 8, pt: 4, pa: 3, kp: 1, cl: 2, dl: 5, pl: 3 },
   { n: 'Claudio Aquino', p: 'M', min: 24, r: 6.6, to: 16, pt: 13, pa: 8, lt: 1, re: 1, dw: 1, dl: 2, pl: 8, km: 2.99, sp: 4, ts: 30.6 },
   { n: 'Erick Wiemberg', p: 'D', min: 8, r: 6.9, to: 12, pt: 8, pa: 7, tk: 1, re: 4, dw: 1, pl: 1, km: 1.79, sp: 6, ts: 30.6 },
   { n: 'Lautaro Pastrán', p: 'F', min: 9, r: 6.5, to: 3, dw: 1, dl: 1, fc: 1, fr: 1, pl: 1, sh: 1, km: 0.92, sp: 3, ts: 27.6 }
  ],
  rv: [
   { n: 'Vicente Bernedo', p: 'G', min: 90, r: 6.6, to: 33, pt: 27, pa: 24, lt: 18, la: 15, cl: 2, re: 8, pl: 3, sv: 2 },
   { n: 'Sebastián Arancibia', p: 'D', min: 90, r: 5.9, to: 45, pt: 23, pa: 19, lt: 2, ct: 3, ca: 1, dt: 1, da: 1, kp: 2, it: 1, cl: 2, re: 6, dw: 1, dl: 4, pl: 11, km: 11.01, sp: 15, ts: 30.5 },
   { n: 'Daniel González', p: 'D', min: 90, r: 6.4, to: 44, pt: 36, pa: 28, lt: 6, la: 3, it: 1, cl: 1, bl: 2, re: 5, dw: 3, dl: 2, pl: 8 },
   { n: 'Branco Ampuero', p: 'D', min: 90, r: 6.4, to: 46, pt: 34, pa: 27, lt: 5, la: 2, dt: 1, it: 2, cl: 3, bl: 1, re: 7, dw: 6, dl: 2, fc: 1, fr: 1, pl: 10 },
   { n: 'Eugenio Mena', p: 'D', min: 45, r: 6.4, to: 21, pt: 9, pa: 8, ct: 2, ca: 1, dt: 1, da: 1, kp: 1, tk: 2, re: 1, dw: 3, pl: 4, km: 4.82, sp: 6, ts: 33.1 },
   { n: 'Jhojan Valencia', p: 'M', min: 90, r: 8.3, to: 61, pt: 40, pa: 34, lt: 6, la: 4, dt: 1, da: 1, tk: 7, it: 2, re: 9, dw: 14, dl: 3, fc: 1, fr: 3, pl: 7, sh: 1, km: 10.76, sp: 10, ts: 32.0 },
   { n: 'Cristián Cuevas', p: 'M', min: 90, r: 7.3, to: 65, pt: 42, pa: 33, lt: 11, la: 7, ct: 3, kp: 2, tk: 1, it: 2, re: 4, dw: 7, dl: 4, fc: 2, fr: 4, pl: 16, sh: 1, km: 10.26, sp: 15, ts: 31.4 },
   { n: 'Clemente Montes', p: 'M', min: 72, r: 6.1, to: 31, pt: 10, pa: 7, ct: 5, dt: 1, kp: 1, re: 1, dw: 2, dl: 5, fr: 2, pl: 16, sh: 1, km: 7.2, sp: 15, ts: 32.7 },
   { n: 'Matías Palavecino', p: 'M', min: 72, r: 7.2, to: 42, pt: 19, pa: 13, lt: 3, la: 2, ct: 9, ca: 5, dt: 1, da: 1, kp: 3, it: 1, re: 4, dw: 3, dl: 3, fr: 2, pl: 13, sh: 3, km: 7.88, sp: 8, ts: 31.4 },
   { n: 'Justo Giani', p: 'M', min: 90, r: 6.4, to: 36, pt: 19, pa: 17, lt: 1, ct: 1, tk: 1, cl: 1, re: 4, dw: 3, dl: 5, fc: 2, fr: 1, pl: 9, sh: 4, km: 10.01, sp: 10, ts: 35.3 },
   { n: 'Juan Francisco Rossel', p: 'F', min: 45, r: 6.7, to: 23, pt: 12, pa: 10, ct: 1, dt: 3, da: 2, kp: 2, cl: 1, re: 2, dw: 3, dl: 2, fr: 1, pl: 4, sh: 2, km: 5.1, sp: 12, ts: 34.9 },
   { n: 'Fernando Zuqui', p: 'M', min: 45, r: 6.8, to: 40, pt: 28, pa: 22, lt: 4, la: 1, ct: 4, re: 3, dw: 2, dl: 4, fc: 1, fr: 1, pl: 14, km: 5.62, sp: 2, ts: 26.5 },
   { n: 'Fernando Zampedri', p: 'F', min: 45, r: 6.9, to: 11, pt: 3, pa: 1, dt: 1, da: 1, re: 1, dw: 3, pl: 2, sh: 5, km: 4.61, sp: 6, ts: 29.9 },
   { n: 'Jimmy Martínez', p: 'M', min: 18, r: 6.7, to: 15, pt: 10, pa: 9, ct: 2, re: 3, pl: 3, km: 2.95, sp: 3, ts: 32.5 },
   { n: 'Diego Corral', p: 'F', min: 18, r: 6.3, to: 16, pt: 7, pa: 5, ct: 3, dt: 1, da: 1, dw: 1, dl: 2, fc: 2, pl: 9, km: 2.78, sp: 6, ts: 28.0 }
  ]
 },
 "12": {
  eventId: 15353041, ccEs: 'home',
  cc: [
   { n: 'Gabriel Maureira', p: 'G', min: 90, r: 6.9, to: 22, pt: 13, pa: 12, lt: 1, re: 7, dw: 1, fr: 1, pl: 1, sv: 2 },
   { n: 'Jonathan Villagra', p: 'D', min: 90, r: 7.0, to: 83, pt: 61, pa: 55, lt: 3, la: 1, dt: 1, da: 1, kp: 1, tk: 1, it: 4, cl: 2, bl: 1, re: 5, dw: 7, dl: 2, pl: 9, km: 9.1, sp: 5, ts: 29.9 },
   { n: 'Arturo Vidal', p: 'D', min: 79, r: 8.0, to: 88, pt: 68, pa: 59, lt: 15, la: 8, tk: 4, it: 3, cl: 6, re: 6, dw: 10, dl: 3, fr: 1, pl: 10, g: 1, og: 1, sh: 1 },
   { n: 'Joaquín Sosa', p: 'D', min: 90, r: 7.7, to: 83, pt: 71, pa: 68, lt: 1, ct: 1, ca: 1, dt: 1, da: 1, kp: 1, cl: 4, re: 4, dw: 3, dl: 5, fc: 1, pl: 3, g: 1, sh: 1, km: 9.49, sp: 15, ts: 30.8 },
   { n: 'Jeyson Rojas', p: 'M', min: 90, r: 6.7, to: 69, pt: 46, pa: 38, lt: 1, ct: 2, kp: 1, tk: 1, it: 1, cl: 2, re: 4, dw: 3, pl: 15, as: 1, km: 9.6, sp: 10, ts: 30.7 },
   { n: 'Tomás Alarcón', p: 'M', min: 90, r: 7.2, to: 110, pt: 94, pa: 80, lt: 7, la: 4, ct: 6, ca: 2, kp: 2, tk: 2, it: 2, cl: 2, re: 5, dw: 3, pl: 18, as: 1, sh: 2, km: 10.47, sp: 2, ts: 26.9 },
   { n: 'Víctor Felipe Méndez', p: 'M', min: 90, r: 7.2, to: 90, pt: 77, pa: 68, lt: 3, la: 2, ct: 1, dt: 1, da: 1, kp: 1, tk: 2, it: 1, cl: 1, re: 8, dw: 4, dl: 5, fc: 1, fr: 1, pl: 13, km: 9.66, sp: 10, ts: 29.2 },
   { n: 'Diego Ulloa', p: 'M', min: 74, r: 7.7, to: 44, pt: 26, pa: 24, ct: 4, ca: 1, dt: 3, da: 2, kp: 1, it: 1, re: 3, dw: 4, dl: 4, fc: 1, fr: 1, pl: 7, as: 1, sh: 2, km: 7.82, sp: 9, ts: 31.1 },
   { n: 'Álvaro Madrid', p: 'F', min: 79, r: 6.8, to: 47, pt: 29, pa: 22, lt: 4, la: 1, ct: 3, ca: 1, dt: 1, kp: 2, re: 5, dl: 2, fc: 1, pl: 14, sh: 1, km: 8.74, sp: 3, ts: 26.6 },
   { n: 'Javier Correa', p: 'F', min: 64, r: 7.9, to: 23, pt: 15, pa: 10, kp: 3, re: 1, dw: 1, dl: 2, pl: 8, g: 2, sh: 4, km: 5.56, sp: 3, ts: 28.0 },
   { n: 'Leandro Hernández', p: 'F', min: 74, r: 7.8, to: 55, pt: 35, pa: 27, lt: 1, ct: 2, dt: 3, da: 3, kp: 1, it: 1, re: 3, dw: 5, dl: 2, fc: 1, pl: 19, g: 1, sh: 4, km: 8.07, sp: 13, ts: 32.5 },
   { n: 'Yastin Cuevas', p: 'F', min: 26, r: 6.3, to: 19, pt: 10, pa: 9, ct: 1, dt: 1, da: 1, kp: 1, re: 2, dw: 2, dl: 5, fr: 1, pl: 7, km: 3.1, sp: 7, ts: 29.4 },
   { n: 'Erick Wiemberg', p: 'D', min: 16, r: 7.6, to: 21, pt: 12, pa: 10, lt: 1, la: 1, ct: 1, ca: 1, kp: 1, tk: 1, it: 1, re: 2, dw: 3, dl: 1, pl: 3, as: 1, sh: 1, km: 2.48, sp: 9, ts: 32.7 },
   { n: 'Lautaro Pastrán', p: 'F', min: 16, r: 7.5, to: 15, pt: 9, pa: 8, lt: 1, tk: 1, re: 1, dw: 1, pl: 3, g: 1, sh: 2, km: 2.27, sp: 3, ts: 27.0 },
   { n: 'Javier Méndez', p: 'D', min: 11, r: 6.6, to: 11, pt: 9, pa: 7, lt: 3, la: 1, dl: 2, fc: 1, pl: 3, km: 1.53, sp: 1, ts: 26.9 },
   { n: 'Claudio Aquino', p: 'M', min: 11, r: 6.8, to: 29, pt: 21, pa: 19, lt: 2, la: 2, dt: 2, da: 1, tk: 1, re: 2, dw: 2, dl: 2, pl: 6, km: 1.42, sp: 2, ts: 27.5 }
  ],
  rv: [
   { n: 'Nicola Pérez', p: 'G', min: 90, r: 5.1, to: 40, pt: 26, pa: 11, lt: 19, la: 5, cl: 1, re: 13, dw: 1, dl: 1, pl: 15, sv: 5 },
   { n: 'Diego Sanhueza', p: 'D', min: 64, r: 6.2, to: 31, pt: 16, pa: 9, lt: 1, dt: 1, tk: 1, cl: 3, bl: 1, re: 4, dw: 3, dl: 4, fr: 2, pl: 11, g: 1, sh: 1, km: 6.52, sp: 6, ts: 30.0 },
   { n: 'Felipe Campos', p: 'D', min: 90, r: 5.3, to: 29, pt: 12, pa: 11, lt: 2, la: 1, dt: 1, tk: 1, it: 2, cl: 6, re: 4, dw: 1, dl: 5, fc: 1, pl: 5, km: 9.0, sp: 5, ts: 28.8 },
   { n: 'Osvaldo Bosso', p: 'D', min: 90, r: 5.2, to: 27, pt: 20, pa: 14, lt: 6, la: 2, tk: 1, it: 2, cl: 4, re: 3, dw: 3, dl: 2, fc: 1, pl: 6, km: 8.08, sp: 2, ts: 26.4 },
   { n: 'Diego Céspedes', p: 'D', min: 45, r: 6.1, to: 28, pt: 22, pa: 14, lt: 7, la: 1, cl: 4, re: 2, dw: 1, pl: 8, km: 5.22, sp: 5, ts: 31.7 },
   { n: 'Jovany Campusano', p: 'D', min: 90, r: 5.0, to: 42, pt: 27, pa: 16, lt: 6, la: 1, dt: 1, tk: 2, it: 1, cl: 3, re: 4, dw: 3, dl: 1, fc: 1, fr: 1, pl: 16, km: 9.4, sp: 6, ts: 27.1 },
   { n: 'Matías Plaza', p: 'M', min: 64, r: 6.8, to: 33, pt: 19, pa: 14, lt: 1, la: 1, ct: 5, ca: 3, kp: 3, tk: 1, it: 1, cl: 1, re: 3, dw: 2, dl: 5, fr: 1, pl: 12, as: 1, km: 6.67, sp: 13, ts: 28.0 },
   { n: 'Lorenzo Reyes', p: 'M', min: 90, r: 5.7, to: 42, pt: 34, pa: 28, lt: 1, cl: 1, re: 6, dl: 2, fc: 1, pl: 10, sh: 1, km: 9.37, sp: 1, ts: 26.1 },
   { n: 'Manuel Rivera', p: 'M', min: 90, r: 5.9, to: 44, pt: 31, pa: 21, lt: 5, la: 2, tk: 1, cl: 2, re: 5, dw: 3, dl: 4, fr: 2, pl: 14, km: 10.86, sp: 7, ts: 28.9 },
   { n: 'Giovanny Ávalos', p: 'F', min: 78, r: 6.2, to: 23, pt: 13, pa: 9, ct: 2, ca: 1, dt: 3, da: 3, kp: 1, cl: 1, re: 6, dw: 3, dl: 7, pl: 8, km: 8.02, sp: 6, ts: 31.9 },
   { n: 'Ignacio Jeraldino', p: 'F', min: 45, r: 6.2, to: 15, pt: 8, pa: 4, lt: 1, dt: 1, da: 1, dw: 4, dl: 5, pl: 6, sh: 2, km: 5.28, sp: 4, ts: 27.4 },
   { n: 'Gabriel Graciani', p: 'F', min: 45, r: 6.5, to: 18, pt: 9, pa: 6, ct: 1, dt: 1, da: 1, cl: 1, re: 2, dw: 4, dl: 3, fc: 1, pl: 6, sh: 2, km: 4.89, sp: 8, ts: 31.5 },
   { n: 'Franco Rami', p: 'F', min: 45, r: 6.1, to: 17, pt: 13, pa: 8, kp: 1, dl: 4, fc: 1, pl: 5, km: 4.96, sp: 5, ts: 31.5 },
   { n: 'Pablo Calderón', p: 'D', min: 26, r: 6.9, to: 14, pt: 7, pa: 5, lt: 2, la: 1, tk: 1, cl: 5, bl: 1, re: 1, dw: 2, pl: 2, km: 2.83, sp: 4, ts: 29.5 },
   { n: 'Fernando Ovelar', p: 'F', min: 26, r: 7.2, to: 20, pt: 4, pa: 3, ct: 2, ca: 2, dt: 4, da: 2, kp: 1, tk: 2, re: 2, dw: 4, dl: 5, pl: 6, sh: 1, km: 3.24, sp: 4, ts: 27.8 },
   { n: 'Christian Mansilla', p: 'M', min: 12, r: 6.6, to: 11, pt: 8, pa: 6, lt: 1, la: 1, tk: 1, dw: 1, dl: 1, pl: 3 }
  ]
 },
 "11": {
  eventId: 15353028, ccEs: 'away',
  cc: [
   { n: 'Gabriel Maureira', p: 'G', min: 90, r: 7.5, to: 35, pt: 23, pa: 17, lt: 6, la: 1, cl: 2, re: 8, pl: 6, sv: 4 },
   { n: 'Jeyson Rojas', p: 'D', min: 90, r: 6.1, to: 50, pt: 31, pa: 26, lt: 1, la: 1, ct: 1, tk: 1, it: 2, cl: 1, bl: 1, re: 2, dw: 1, dl: 4, fc: 1, pl: 10, sh: 1, km: 9.1, sp: 12, ts: 33.6 },
   { n: 'Jonathan Villagra', p: 'D', min: 81, r: 6.8, to: 69, pt: 56, pa: 48, lt: 5, la: 1, ct: 1, tk: 3, it: 1, cl: 3, re: 4, dw: 5, dl: 6, fr: 1, pl: 11, km: 8.65, sp: 5, ts: 28.8 },
   { n: 'Joaquín Sosa', p: 'D', min: 90, r: 7.0, to: 75, pt: 66, pa: 55, lt: 13, la: 8, tk: 1, cl: 3, re: 3, dw: 8, dl: 5, fc: 2, fr: 1, pl: 12, km: 9.18, sp: 5, ts: 29.1 },
   { n: 'Diego Ulloa', p: 'D', min: 90, r: 6.4, to: 62, pt: 41, pa: 32, lt: 4, la: 1, ct: 2, ca: 1, tk: 2, it: 2, cl: 2, bl: 1, re: 6, dw: 3, dl: 3, fc: 1, fr: 1, pl: 13, km: 9.98, sp: 12, ts: 31.6 },
   { n: 'Álvaro Madrid', p: 'M', min: 90, r: 7.3, to: 59, pt: 40, pa: 33, lt: 3, la: 2, ct: 1, dt: 2, da: 1, tk: 6, re: 6, dw: 12, dl: 5, fc: 1, fr: 3, pl: 11, sh: 1, km: 8.46, sp: 3, ts: 28.8 },
   { n: 'Tomás Alarcón', p: 'M', min: 87, r: 7.2, to: 95, pt: 77, pa: 64, lt: 17, la: 9, ct: 1, dt: 3, da: 1, kp: 2, tk: 3, it: 1, cl: 3, bl: 1, re: 3, dw: 7, dl: 4, fc: 1, fr: 1, pl: 16, sh: 1, km: 9.41, sp: 4, ts: 27.9 },
   { n: 'Víctor Felipe Méndez', p: 'M', min: 90, r: 7.0, to: 82, pt: 69, pa: 58, lt: 7, la: 4, ct: 1, kp: 4, tk: 1, it: 1, re: 7, dw: 3, dl: 3, fc: 1, fr: 1, pl: 17, sh: 2, km: 10.3, sp: 16, ts: 31.8 },
   { n: 'Francisco Marchant', p: 'F', min: 73, r: 6.9, to: 54, pt: 37, pa: 33, lt: 3, la: 2, ct: 5, ca: 1, dt: 2, da: 2, kp: 2, it: 1, re: 9, dw: 4, fr: 2, pl: 10, sh: 2, km: 7.4, sp: 12, ts: 33.4 },
   { n: 'Maximiliano Romero', p: 'F', min: 73, r: 6.9, to: 21, pt: 11, pa: 8, dt: 3, da: 1, kp: 1, re: 1, dw: 2, dl: 7, fr: 1, pl: 7, g: 1, sh: 2, km: 8.17, sp: 6, ts: 29.6 },
   { n: 'Lautaro Pastrán', p: 'F', min: 87, r: 6.8, to: 65, pt: 34, pa: 28, ct: 5, ca: 3, dt: 4, da: 2, kp: 2, tk: 6, re: 4, dw: 10, dl: 10, fc: 1, fr: 1, pl: 18, sh: 5, km: 8.8, sp: 8, ts: 33.3 },
   { n: 'Leandro Hernández', p: 'F', min: 17, r: 6.7, to: 13, pt: 4, pa: 2, ct: 1, dt: 2, da: 1, tk: 1, re: 1, dw: 3, dl: 3, fc: 1, pl: 7, sh: 1 },
   { n: 'Javier Correa', p: 'F', min: 17, r: 7.2, to: 10, pt: 5, pa: 4, tk: 1, dw: 2, dl: 3, pl: 3, g: 1, sh: 2 },
   { n: 'Matías Fernández', p: 'D', min: 9, r: 6.5, to: 4, pt: 2, dl: 2, fc: 1, pl: 3, km: 1.78, sp: 3, ts: 28.2 },
   { n: 'Claudio Aquino', p: 'M', min: 11, r: 7.2, to: 7, pt: 4, pa: 4, lt: 1, la: 1, ct: 3, ca: 2, kp: 2, pl: 1, as: 1, km: 1.04, sp: 2, ts: 33.4 },
   { n: 'Yastin Cuevas', p: 'F', min: 11, r: 6.7, to: 4, pt: 3, pa: 2, kp: 1, re: 1, dw: 1, fc: 1, fr: 1, pl: 1, km: 0.94, sp: 1, ts: 25.9 }
  ],
  rv: [
   { n: 'José Sanhueza', p: 'G', min: 90, r: 6.5, to: 29, pt: 24, pa: 13, lt: 15, la: 4, cl: 1, re: 5, pl: 11, sv: 3 },
   { n: 'Jorge Espejo', p: 'D', min: 90, r: 5.9, to: 48, pt: 18, pa: 13, lt: 5, la: 2, ct: 3, dt: 3, da: 1, tk: 3, it: 1, cl: 2, re: 3, dw: 4, dl: 8, fc: 2, pl: 17, sh: 1, km: 9.24, sp: 12, ts: 31.7 },
   { n: 'Osvaldo González', p: 'D', min: 90, r: 7.6, to: 37, pt: 27, pa: 20, lt: 6, la: 2, tk: 3, cl: 3, re: 3, dw: 7, dl: 2, fr: 1, pl: 7, g: 1, sh: 1, km: 8.51, sp: 3, ts: 30.5 },
   { n: 'David Retamal', p: 'D', min: 90, r: 6.0, to: 51, pt: 32, pa: 25, lt: 6, la: 3, dt: 1, da: 1, kp: 1, tk: 1, cl: 11, bl: 3, re: 3, dw: 5, dl: 1, fc: 1, pl: 9, km: 9.47, sp: 17, ts: 30.6 },
   { n: 'Yerco Oyanedel', p: 'D', min: 90, r: 6.4, to: 48, pt: 27, pa: 19, lt: 4, la: 1, ct: 2, dt: 1, da: 1, tk: 2, it: 1, cl: 2, re: 4, dw: 3, dl: 3, fc: 1, pl: 14, km: 9.63, sp: 6, ts: 31.4 },
   { n: 'Bryan Ogaz', p: 'M', min: 69, r: 6.5, to: 36, pt: 27, pa: 25, lt: 1, la: 1, dt: 2, it: 2, bl: 1, re: 6, dw: 3, dl: 5, fc: 1, fr: 1, pl: 5, km: 8.07, sp: 9, ts: 30.3 },
   { n: 'Agustín Urzi', p: 'M', min: 69, r: 6.4, to: 31, pt: 14, pa: 8, lt: 2, la: 1, ct: 1, dt: 2, tk: 4, cl: 1, re: 4, dw: 5, dl: 3, fc: 1, fr: 1, pl: 14, sh: 1, km: 7.83, sp: 13, ts: 29.4 },
   { n: 'Facundo Mater', p: 'M', min: 90, r: 7.1, to: 53, pt: 29, pa: 17, lt: 2, la: 2, dt: 3, da: 1, kp: 2, tk: 3, it: 3, cl: 5, bl: 1, re: 9, dw: 6, dl: 7, fc: 2, fr: 1, pl: 18, sh: 2, km: 9.98, sp: 16, ts: 32.8 },
   { n: 'Jeison Fuentealba', p: 'M', min: 89, r: 6.2, to: 31, pt: 12, pa: 7, lt: 1, la: 1, ct: 3, dt: 3, da: 2, kp: 1, it: 1, dw: 4, dl: 7, fc: 2, fr: 2, pl: 16, sh: 1, km: 9.01, sp: 9, ts: 32.1 },
   { n: 'Antonio Díaz', p: 'M', min: 88, r: 6.7, to: 38, pt: 20, pa: 13, dt: 4, da: 1, kp: 1, tk: 3, cl: 1, bl: 1, re: 7, dw: 5, dl: 6, fc: 1, pl: 15, km: 8.78, sp: 17, ts: 31.3 },
   { n: 'Cecilio Waterman', p: 'F', min: 90, r: 7.0, to: 30, pt: 20, pa: 13, lt: 2, ct: 1, ca: 1, re: 1, dw: 7, dl: 11, fc: 1, fr: 2, pl: 9, sh: 3 },
   { n: 'Bastián Ubal', p: 'D', min: 21, r: 6.3, to: 14, pt: 9, pa: 6, lt: 1, kp: 1, tk: 1, it: 1, cl: 1, re: 2, dw: 2, dl: 2, fc: 1, pl: 3, km: 2.62, sp: 4, ts: 27.4 },
   { n: 'Luca Kmet', p: 'F', min: 21, r: 6.4, to: 20, pt: 6, pa: 5, lt: 1, ct: 2, dt: 2, tk: 1, it: 1, re: 3, dw: 2, dl: 4, fc: 1, fr: 1, pl: 6 },
   { n: 'Moisés González', p: 'D', min: 10, r: 6.2, to: 2, pt: 1, pa: 1, cl: 1, dl: 1 },
   { n: 'Ariel Uribe', p: 'M', min: 1, to: 4, pt: 2, pa: 2, dt: 1, da: 1, dw: 2, fr: 1 }
  ]
 },
 "10": {
  eventId: 15353024, ccEs: 'home',
  cc: [
   { n: 'Fernando de Paul', p: 'G', min: 70, r: 6.8, to: 28, pt: 21, pa: 18, lt: 7, la: 4, re: 6, pl: 3, sv: 3 },
   { n: 'Jonathan Villagra', p: 'D', min: 90, r: 7.2, to: 93, pt: 76, pa: 70, lt: 4, la: 3, kp: 1, tk: 1, it: 1, cl: 3, re: 7, dw: 8, dl: 4, fc: 1, fr: 1, pl: 10, sh: 3, km: 10.46, sp: 5, ts: 33.1 },
   { n: 'Arturo Vidal', p: 'D', min: 63, r: 7.3, to: 68, pt: 61, pa: 51, lt: 12, la: 9, kp: 1, tk: 1, it: 2, bl: 1, re: 4, dw: 6, dl: 2, pl: 11, km: 6.76, sp: 7, ts: 30.2 },
   { n: 'Joaquín Sosa', p: 'D', min: 70, r: 6.9, to: 77, pt: 63, pa: 58, lt: 6, la: 3, ct: 2, kp: 2, tk: 1, cl: 4, re: 4, dw: 6, dl: 3, fr: 1, pl: 9, sh: 2, km: 7.6, sp: 12, ts: 31.2 },
   { n: 'Jeyson Rojas', p: 'M', min: 90, r: 6.5, to: 51, pt: 33, pa: 28, ct: 3, tk: 3, cl: 2, bl: 1, dw: 4, dl: 5, pl: 9, sh: 2, km: 10.48, sp: 12, ts: 32.3 },
   { n: 'Álvaro Madrid', p: 'M', min: 90, r: 6.6, to: 66, pt: 49, pa: 42, lt: 2, la: 1, ct: 5, ca: 1, tk: 1, cl: 1, re: 2, dw: 4, dl: 3, fc: 1, fr: 3, pl: 12, sh: 1, km: 10.58, sp: 4, ts: 30.6 },
   { n: 'Víctor Felipe Méndez', p: 'M', min: 90, r: 7.6, to: 74, pt: 69, pa: 64, lt: 3, la: 3, ct: 4, ca: 2, kp: 5, it: 1, re: 6, dw: 1, dl: 2, fc: 1, pl: 7, km: 9.88, sp: 7, ts: 29.6 },
   { n: 'Diego Ulloa', p: 'M', min: 90, r: 6.4, to: 90, pt: 50, pa: 43, lt: 3, la: 1, ct: 8, ca: 1, dt: 4, da: 1, tk: 2, it: 2, cl: 5, re: 4, dw: 8, dl: 7, fr: 1, pl: 22, sh: 1, km: 10.53, sp: 15, ts: 33.7 },
   { n: 'Leandro Hernández', p: 'F', min: 45, r: 6.2, to: 21, pt: 16, pa: 14, ct: 2, kp: 1, re: 2, dl: 4, fc: 2, pl: 5, sh: 1, km: 5.46, sp: 9, ts: 33.3 },
   { n: 'Maximiliano Romero', p: 'F', min: 45, r: 6.4, to: 8, pt: 3, pa: 3, tk: 1, kp: 1, dw: 2, dl: 3, pl: 2, km: 4.76, sp: 8, ts: 29.9 },
   { n: 'Lautaro Pastrán', p: 'F', min: 90, r: 6.3, to: 59, pt: 39, pa: 33, lt: 2, ct: 5, ca: 1, dt: 4, da: 2, re: 3, dw: 4, dl: 6, fc: 1, fr: 1, pl: 16, sh: 3, km: 10.86, sp: 14, ts: 33.7 },
   { n: 'Claudio Aquino', p: 'M', min: 45, r: 7.4, to: 68, pt: 45, pa: 34, lt: 2, la: 1, ct: 6, ca: 2, dt: 1, kp: 1, re: 4, dw: 2, dl: 3, fr: 2, pl: 24, sh: 2, km: 4.16, sp: 3, ts: 28.1 },
   { n: 'Javier Correa', p: 'F', min: 45, r: 6.0, to: 9, pt: 4, pa: 2, dw: 1, dl: 2, pl: 5, sh: 1, km: 4.26, sp: 13, ts: 32.7 },
   { n: 'Francisco Marchant', p: 'M', min: 27, r: 6.9, to: 25, pt: 10, pa: 9, ct: 6, ca: 2, kp: 2, it: 1, dl: 2, fc: 1, pl: 9, km: 3.24, sp: 6, ts: 32.9 },
   { n: 'Gabriel Maureira', p: 'G', min: 20, r: 6.6, to: 8, pt: 7, pa: 7, lt: 1, la: 1, cl: 1 },
   { n: 'Erick Wiemberg', p: 'D', min: 20, r: 6.9, to: 33, pt: 30, pa: 28, lt: 3, la: 2, cl: 1, bl: 1, re: 2, dw: 2, dl: 1, fc: 1, pl: 2, sh: 1, km: 3.12, sp: 2, ts: 32.1 }
  ],
  rv: [
   { n: 'Sebastián Pérez', p: 'G', min: 90, r: 9.0, to: 49, pt: 36, pa: 20, lt: 29, la: 13, cl: 2, re: 14, pl: 16, sv: 6 },
   { n: 'Ian Garguez', p: 'D', min: 90, r: 7.4, to: 57, pt: 22, pa: 14, lt: 6, la: 3, ct: 2, kp: 1, tk: 4, it: 1, cl: 10, bl: 1, re: 7, dw: 6, dl: 4, fr: 1, pl: 16, km: 9.7, sp: 12, ts: 30.6 },
   { n: 'Vicente Espinoza', p: 'D', min: 90, r: 7.2, to: 40, pt: 25, pa: 16, lt: 10, la: 4, dt: 1, da: 1, cl: 10, bl: 1, re: 3, dw: 2, dl: 1, pl: 10, km: 9.13, sp: 8, ts: 32.2 },
   { n: 'Enzo Roco', p: 'D', min: 83, r: 7.1, to: 24, pt: 12, pa: 9, lt: 5, la: 3, dt: 1, da: 1, cl: 10, dw: 5, dl: 3, fc: 1, pl: 4, km: 7.37, sp: 6, ts: 30.9 },
   { n: 'Dilan Zúñiga', p: 'D', min: 90, r: 7.7, to: 39, pt: 20, pa: 14, lt: 2, la: 1, dt: 5, da: 3, kp: 1, it: 2, cl: 2, re: 3, dw: 3, dl: 3, pl: 12, g: 1, sh: 1, km: 9.83, sp: 8, ts: 32.4 },
   { n: 'Jason León', p: 'D', min: 69, r: 7.1, to: 29, pt: 17, pa: 13, lt: 2, la: 1, ct: 2, dt: 1, da: 1, tk: 1, it: 2, cl: 2, re: 5, dw: 3, dl: 1, pl: 8, km: 7.48, sp: 9, ts: 30.5 },
   { n: 'Francisco Montes', p: 'M', min: 90, r: 6.6, to: 42, pt: 27, pa: 19, lt: 6, la: 2, dt: 1, tk: 1, it: 1, cl: 3, re: 5, dw: 5, dl: 7, fc: 4, fr: 3, pl: 12, km: 11.31, sp: 11, ts: 32.5 },
   { n: 'Nicolás Meza', p: 'M', min: 85, r: 7.0, to: 32, pt: 20, pa: 18, lt: 4, la: 2, tk: 3, it: 1, cl: 3, bl: 1, dw: 3, dl: 2, pl: 4, sh: 1, km: 9.46, sp: 4, ts: 26.2 },
   { n: 'Sebastián Gallegos', p: 'M', min: 90, r: 6.9, to: 33, pt: 16, pa: 10, lt: 2, ct: 3, ca: 1, kp: 1, tk: 3, cl: 1, re: 3, dw: 5, dl: 3, fc: 1, fr: 2, pl: 10, sh: 3, km: 10.62, sp: 20, ts: 31.7 },
   { n: 'César Munder', p: 'F', min: 69, r: 6.3, to: 24, pt: 9, pa: 6, lt: 1, la: 1, ct: 1, dt: 2, da: 1, tk: 1, re: 1, dw: 2, dl: 6, fc: 1, pl: 12, sh: 2, km: 7.24, sp: 11, ts: 31.0 },
   { n: 'Ronnie Fernández', p: 'F', min: 69, r: 7.0, to: 26, pt: 14, pa: 8, lt: 3, la: 1, kp: 1, tk: 1, cl: 1, re: 3, dw: 7, dl: 8, fc: 1, fr: 1, pl: 10, as: 1, km: 7.4, sp: 8, ts: 28.9 },
   { n: 'Martín Araya', p: 'F', min: 21, r: 6.6, to: 8, pt: 4, pa: 2, kp: 1, dw: 2, dl: 5, pl: 4, km: 3.09, sp: 5, ts: 30.6 },
   { n: 'Dilan Salgado', p: 'F', min: 21, r: 6.5, to: 8, pt: 3, tk: 1, cl: 4, dw: 2, dl: 2, fc: 2, pl: 3, km: 3.28, sp: 6, ts: 31.0 },
   { n: 'Gonzalo Tapia', p: 'F', min: 21, r: 6.6, to: 9, pt: 2, pa: 1, cl: 1, dw: 2, dl: 3, fr: 1, pl: 2, sh: 1, km: 3.27, sp: 5, ts: 31.1 },
   { n: 'Fernando Meza', p: 'D', min: 16, r: 6.6, to: 1, pt: 1, re: 1, pl: 1 },
   { n: 'Julián Fernández', p: 'M', min: 14, r: 6.6, to: 3, pt: 1, cl: 2, pl: 1, km: 1.71, sp: 2, ts: 30.6 }
  ]
 },
 "9": {
  eventId: 15353018, ccEs: 'home',
  cc: [
   { n: 'Gabriel Maureira', p: 'G', min: 90, r: 7.3, to: 30, pt: 19, pa: 13, lt: 10, la: 4, cl: 2, re: 9, dw: 1, pl: 6, sv: 2 },
   { n: 'Jonathan Villagra', p: 'D', min: 90, r: 7.0, to: 65, pt: 51, pa: 45, lt: 1, tk: 1, it: 1, cl: 5, re: 6, dw: 4, dl: 1, fr: 1, pl: 10, sh: 1, km: 9.71, sp: 15, ts: 32.5 },
   { n: 'Arturo Vidal', p: 'D', min: 63, r: 6.6, to: 62, pt: 53, pa: 41, lt: 13, la: 7, tk: 1, it: 2, cl: 4, re: 4, dw: 2, dl: 2, pl: 14, km: 6.0, sp: 5, ts: 30.5 },
   { n: 'Joaquín Sosa', p: 'D', min: 90, r: 6.9, to: 79, pt: 60, pa: 45, lt: 10, la: 4, dt: 1, da: 1, tk: 2, cl: 6, re: 7, dw: 8, dl: 4, fc: 1, pl: 17, sh: 3, km: 9.06, sp: 15, ts: 30.5 },
   { n: 'Tomás Alarcón', p: 'M', min: 90, r: 7.2, to: 80, pt: 63, pa: 51, lt: 9, la: 5, ct: 3, ca: 1, kp: 4, tk: 1, it: 3, cl: 3, re: 5, dw: 2, dl: 1, fc: 1, pl: 17, sh: 1, km: 10.39, sp: 7, ts: 29.3 },
   { n: 'Matías Fernández', p: 'M', min: 90, r: 6.5, to: 62, pt: 44, pa: 36, lt: 5, la: 1, ct: 5, ca: 2, kp: 1, tk: 1, it: 1, dw: 1, dl: 2, pl: 12, km: 10.05, sp: 19, ts: 33.4 },
   { n: 'Álvaro Madrid', p: 'M', min: 78, r: 6.2, to: 49, pt: 32, pa: 26, lt: 2, la: 1, ct: 3, ca: 1, kp: 1, cl: 1, re: 4, dw: 1, dl: 8, fc: 1, fr: 1, pl: 13, sh: 1, km: 8.96, sp: 7, ts: 27.5 },
   { n: 'Víctor Felipe Méndez', p: 'M', min: 90, r: 7.3, to: 90, pt: 78, pa: 69, lt: 6, la: 6, ct: 1, dt: 2, da: 1, kp: 4, tk: 1, re: 7, dw: 3, dl: 4, fc: 1, fr: 1, pl: 16, km: 9.77, sp: 10, ts: 28.6 },
   { n: 'Diego Ulloa', p: 'M', min: 90, r: 7.1, to: 72, pt: 43, pa: 33, lt: 4, la: 1, ct: 3, dt: 2, da: 1, tk: 1, it: 2, cl: 1, bl: 1, re: 6, dw: 10, dl: 5, fc: 2, fr: 3, pl: 20, sh: 1, km: 9.91, sp: 20, ts: 33.2 },
   { n: 'Maximiliano Romero', p: 'F', min: 78, r: 6.9, to: 17, pt: 9, pa: 9, cl: 1, re: 2, dw: 1, dl: 3, fr: 1, pl: 2, g: 1, sh: 2, km: 6.31, sp: 16, ts: 32.0 },
   { n: 'Javier Correa', p: 'F', min: 89, r: 9.3, to: 50, pt: 20, pa: 13, lt: 4, la: 1, dt: 7, da: 3, it: 1, re: 5, dw: 5, dl: 10, fr: 1, pl: 18, g: 2, sh: 6, km: 8.38, sp: 20, ts: 31.8 },
   { n: 'Claudio Aquino', p: 'M', min: 27, r: 6.6, to: 30, pt: 18, pa: 16, lt: 3, la: 2, ct: 1, dt: 2, da: 1, kp: 1, it: 1, re: 2, dw: 1, dl: 4, pl: 11, as: 1, sh: 1, km: 2.78, sp: 2, ts: 26.7 },
   { n: 'Francisco Marchant', p: 'M', min: 12, r: 7.0, to: 7, pt: 5, pa: 5, lt: 1, la: 1, kp: 1, cl: 1, pl: 1, as: 1, km: 1.81, sp: 3, ts: 29.0 },
   { n: 'Yastin Cuevas', p: 'F', min: 12, r: 6.5, to: 5, pt: 4, pa: 3, re: 1, dl: 1, pl: 1, km: 1.97, sp: 5, ts: 31.5 },
   { n: 'Javier Méndez', p: 'D', min: 1, to: 2, dw: 1, dl: 2, fc: 1, pl: 1 }
  ],
  rv: [
   { n: 'Diego Sánchez', p: 'G', min: 90, r: 6.8, to: 34, pt: 25, pa: 11, lt: 23, la: 9, re: 8, pl: 14, sv: 5 },
   { n: 'Dylan Escobar', p: 'D', min: 90, r: 5.6, to: 67, pt: 30, pa: 21, lt: 3, la: 1, ct: 4, dt: 2, da: 1, tk: 3, it: 1, cl: 2, re: 8, dw: 8, dl: 6, fc: 3, fr: 1, pl: 25, km: 10.23, sp: 21, ts: 34.6 },
   { n: 'Elvis Hernández', p: 'D', min: 90, r: 6.0, to: 40, pt: 26, pa: 15, lt: 7, la: 1, tk: 1, it: 1, cl: 9, re: 6, dw: 5, dl: 2, fc: 1, pl: 12, km: 8.12, sp: 10, ts: 32.1 },
   { n: 'Manuel Fernández', p: 'D', min: 90, r: 6.6, to: 35, pt: 19, pa: 12, lt: 5, la: 2, tk: 3, it: 2, cl: 9, bl: 1, re: 1, dw: 7, dl: 4, fc: 2, pl: 7, km: 8.05, sp: 8, ts: 30.3 },
   { n: 'Juan Cornejo', p: 'D', min: 90, r: 6.7, to: 67, pt: 39, pa: 25, lt: 9, la: 5, ct: 6, kp: 1, tk: 2, it: 3, cl: 4, re: 8, dw: 3, pl: 23, sh: 1, km: 9.14, sp: 3, ts: 30.3 },
   { n: 'Dylan Glaby', p: 'M', min: 80, r: 6.8, to: 33, pt: 25, pa: 19, lt: 5, la: 3, tk: 2, cl: 2, re: 1, dw: 4, dl: 1, pl: 8, km: 9.27, sp: 6, ts: 32.1 },
   { n: 'Salvador Cordero', p: 'M', min: 90, r: 6.6, to: 45, pt: 33, pa: 24, lt: 5, la: 3, ct: 1, tk: 3, it: 2, cl: 1, re: 3, dw: 6, dl: 3, fc: 1, fr: 1, pl: 12, sh: 1, km: 9.83, sp: 7, ts: 27.5 },
   { n: 'Luis Riveros', p: 'M', min: 72, r: 6.2, to: 38, pt: 26, pa: 16, lt: 3, ct: 3, tk: 2, cl: 1, re: 4, dw: 2, dl: 6, fc: 1, pl: 17, sh: 1, as: 1, km: 7.6, sp: 15, ts: 33.8 },
   { n: 'Guido Vadalá', p: 'M', min: 72, r: 7.0, to: 26, pt: 16, pa: 11, lt: 1, cl: 1, re: 4, dw: 1, dl: 2, fr: 1, pl: 10, g: 1, sh: 2, km: 7.67, sp: 19, ts: 33.9 },
   { n: 'Benjamín Chandía', p: 'M', min: 65, r: 6.4, to: 29, pt: 18, pa: 16, lt: 1, ct: 2, dt: 5, da: 1, kp: 2, re: 4, dw: 1, dl: 4, pl: 10, sh: 1, km: 7.25, sp: 10, ts: 29.7 },
   { n: 'Lucas Pratto', p: 'F', min: 65, r: 7.3, to: 26, pt: 17, pa: 11, kp: 1, cl: 1, bl: 1, re: 1, dw: 3, dl: 5, pl: 8, sh: 1, km: 6.29, sp: 7, ts: 30.8 },
   { n: 'Cristián Zavala', p: 'F', min: 25, r: 6.4, to: 8, pt: 6, pa: 6, lt: 1, la: 1, dw: 1, dl: 3, fc: 1, fr: 1, pl: 1, km: 2.89, sp: 9, ts: 30.9 },
   { n: 'Nicolás Johansen', p: 'F', min: 25, r: 6.6, to: 11, pt: 10, pa: 5, lt: 1, la: 1, kp: 1, dw: 1, dl: 2, pl: 5, km: 2.82, sp: 6, ts: 29.1 },
   { n: 'Alejandro Azócar', p: 'F', min: 18, r: 6.6, to: 14, pt: 8, pa: 6, ct: 3, dt: 2, da: 1, tk: 1, re: 1, dw: 2, dl: 2, pl: 6, km: 2.24, sp: 6, ts: 32.1 },
   { n: 'Pablo Rodríguez', p: 'M', min: 18, r: 6.6, to: 9, pt: 7, pa: 5, dt: 1, da: 1, re: 2, dw: 2, fr: 1, pl: 2, km: 2.55, sp: 5, ts: 27.9 },
   { n: 'Sebastián Galani', p: 'M', min: 10, r: 6.6, to: 9, pt: 5, pa: 4, lt: 1, la: 1, ct: 1, cl: 1, re: 1, dw: 1, fr: 1, pl: 3, km: 1.76, sp: 2, ts: 26.3 }
  ]
 },
 "8": {
  eventId: 15353006, ccEs: 'away',
  cc: [
   { n: 'Fernando de Paul', p: 'G', min: 90, r: 6.6, to: 26, pt: 22, pa: 12, lt: 12, la: 2, cl: 1, re: 2, dw: 1, pl: 10, sv: 1 },
   { n: 'Arturo Vidal', p: 'D', min: 89, r: 8.2, to: 103, pt: 82, pa: 74, lt: 11, la: 7, dt: 3, da: 3, tk: 1, it: 2, cl: 8, re: 9, dw: 10, dl: 3, fc: 1, fr: 1, pl: 8, km: 7.71, sp: 6, ts: 28.7 },
   { n: 'Joaquín Sosa', p: 'D', min: 90, r: 6.9, to: 77, pt: 53, pa: 42, lt: 10, la: 5, ct: 2, ca: 1, dt: 2, da: 2, tk: 3, it: 1, cl: 2, re: 6, dw: 7, dl: 9, fc: 1, fr: 1, pl: 15, km: 8.69, sp: 9, ts: 29.1 },
   { n: 'Jonathan Villagra', p: 'D', min: 90, r: 7.2, to: 69, pt: 54, pa: 48, lt: 2, la: 1, ct: 1, dt: 1, kp: 1, tk: 1, cl: 2, bl: 1, re: 6, dw: 3, dl: 4, fc: 1, fr: 1, pl: 10, km: 9.54, sp: 11, ts: 31.8 },
   { n: 'Tomás Alarcón', p: 'M', min: 70, r: 7.1, to: 79, pt: 65, pa: 59, lt: 13, la: 11, ct: 5, kp: 1, it: 1, cl: 3, bl: 1, re: 5, dl: 4, pl: 13, km: 7.46, sp: 7, ts: 31.2 },
   { n: 'Jeyson Rojas', p: 'M', min: 90, r: 6.3, to: 53, pt: 30, pa: 23, lt: 3, la: 1, ct: 4, ca: 1, dt: 2, da: 1, kp: 1, tk: 1, re: 3, dw: 5, dl: 5, fc: 1, fr: 1, pl: 14, sh: 1, km: 9.54, sp: 16, ts: 32.2 },
   { n: 'Álvaro Madrid', p: 'M', min: 90, r: 7.7, to: 52, pt: 37, pa: 30, lt: 1, la: 1, ct: 3, dt: 4, da: 2, tk: 1, cl: 1, re: 2, dw: 5, dl: 5, fc: 1, fr: 1, pl: 14, g: 1, sh: 1, km: 10.45, sp: 14, ts: 31.4 },
   { n: 'Víctor Felipe Méndez', p: 'M', min: 45, r: 6.6, to: 41, pt: 37, pa: 34, lt: 2, la: 1, it: 1, cl: 1, re: 3, dl: 1, pl: 3, km: 5.29, sp: 5, ts: 30.3 },
   { n: 'Diego Ulloa', p: 'M', min: 90, r: 7.0, to: 63, pt: 31, pa: 27, ct: 6, ca: 1, dt: 5, da: 4, tk: 1, cl: 5, re: 6, dw: 8, dl: 3, fc: 1, pl: 18, km: 9.05, sp: 18, ts: 34.6 },
   { n: 'Maximiliano Romero', p: 'F', min: 89, r: 6.5, to: 19, pt: 9, pa: 4, dt: 2, da: 1, it: 1, dw: 5, dl: 3, fc: 1, fr: 1, pl: 9, sh: 1, km: 6.5, sp: 10, ts: 33.1 },
   { n: 'Claudio Aquino', p: 'F', min: 85, r: 6.7, to: 75, pt: 60, pa: 51, lt: 1, la: 1, ct: 1, dt: 3, re: 4, dl: 5, pl: 17, sh: 3, km: 8.18, sp: 10, ts: 32.4 },
   { n: 'Leandro Hernández', p: 'F', min: 45, r: 7.0, to: 32, pt: 14, pa: 14, lt: 2, la: 2, dt: 5, da: 3, kp: 1, tk: 1, re: 3, dw: 5, dl: 6, fr: 1, pl: 8, sh: 1, km: 5.1, sp: 10, ts: 30.4 },
   { n: 'Francisco Marchant', p: 'M', min: 20, r: 6.0, to: 18, pt: 11, pa: 4, lt: 1, ct: 1, dt: 3, re: 2, dl: 6, fc: 1, pl: 13, sh: 1, km: 2.81, sp: 6, ts: 28.0 },
   { n: 'Javier Méndez', p: 'D', min: 12, r: 6.6, to: 5, pt: 3, pa: 2, lt: 1, cl: 1, pl: 1 },
   { n: 'Rodrigo Catalán', p: 'F', min: 8, r: 6.5, to: 4, pt: 3, pa: 3 },
   { n: 'Yastin Cuevas', p: 'F', min: 8, r: 6.4, to: 2, pt: 1, pa: 1, kp: 1, dl: 2, pl: 1, km: 0.89, sp: 2, ts: 27.6 }
  ],
  rv: [
   { n: 'Nicolás Araya', p: 'G', min: 90, r: 6.4, to: 19, pt: 11, pa: 8, lt: 8, la: 5, re: 5, pl: 3, sv: 3 },
   { n: 'Norman Rodríguez', p: 'D', min: 81, r: 6.6, to: 39, pt: 22, pa: 11, lt: 8, la: 3, ct: 2, tk: 2, cl: 2, re: 2, dw: 3, dl: 1, pl: 16, sh: 1, km: 6.5, sp: 9, ts: 32.4 },
   { n: 'Cristián Suárez', p: 'D', min: 90, r: 6.9, to: 44, pt: 24, pa: 19, lt: 6, la: 5, dt: 1, kp: 1, tk: 1, cl: 11, re: 2, dw: 2, dl: 3, fr: 1, pl: 7, km: 8.19, sp: 3, ts: 28.8 },
   { n: 'Fausto Grillo', p: 'D', min: 90, r: 7.5, to: 43, pt: 26, pa: 19, lt: 10, la: 5, dt: 2, da: 2, tk: 4, cl: 6, bl: 1, re: 4, dw: 8, dl: 2, fc: 1, pl: 7, sh: 1, km: 9.32, sp: 9, ts: 32.1 },
   { n: 'Diego Carrasco', p: 'D', min: 76, r: 6.3, to: 35, pt: 15, pa: 9, lt: 4, la: 1, tk: 3, cl: 4, re: 3, dw: 4, dl: 4, fc: 1, pl: 9, km: 8.44, sp: 14, ts: 31.5 },
   { n: 'Nelson Sepúlveda', p: 'M', min: 90, r: 7.1, to: 53, pt: 32, pa: 21, lt: 11, la: 6, dt: 1, tk: 3, it: 2, cl: 4, bl: 1, re: 6, dw: 5, dl: 5, fr: 1, pl: 12, km: 9.24, sp: 5, ts: 33.3 },
   { n: 'Aldrix Jara', p: 'M', min: 81, r: 6.6, to: 40, pt: 16, pa: 12, ct: 8, dt: 4, da: 3, kp: 1, tk: 2, re: 5, dw: 7, dl: 7, fr: 1, pl: 18, km: 7.26, sp: 12, ts: 31.2 },
   { n: 'Leonardo Valencia', p: 'M', min: 60, r: 7.0, to: 24, pt: 14, pa: 10, lt: 3, la: 2, ct: 2, ca: 2, cl: 1, re: 5, dw: 1, dl: 1, fc: 1, fr: 1, pl: 5, sh: 3, km: 5.66, sp: 3, ts: 28.1 },
   { n: 'Misael Dávila', p: 'M', min: 90, r: 6.6, to: 22, pt: 13, pa: 8, lt: 3, dt: 1, tk: 1, cl: 3, re: 3, dw: 3, dl: 1, fr: 1, pl: 7, sh: 1, km: 9.29, sp: 9, ts: 31.8 },
   { n: 'Matías Cavalleri', p: 'M', min: 61, r: 6.7, to: 24, pt: 10, pa: 8, lt: 1, la: 1, ct: 2, dt: 2, da: 1, tk: 3, cl: 1, dw: 6, dl: 6, fr: 1, pl: 7, sh: 1, km: 6.71, sp: 7, ts: 32.4 },
   { n: 'Joaquín Larrivey', p: 'F', min: 90, r: 6.5, to: 35, pt: 23, pa: 12, lt: 2, la: 1, dt: 1, kp: 1, tk: 1, it: 1, cl: 2, re: 2, dw: 8, dl: 10, fc: 2, pl: 17, km: 8.82, sp: 10, ts: 33.3 },
   { n: 'Ethan Espinoza', p: 'M', min: 30, r: 6.7, to: 20, pt: 8, pa: 6, lt: 2, la: 1, ct: 1, dt: 3, da: 2, kp: 1, tk: 1, cl: 2, re: 5, dw: 5, dl: 5, fc: 1, fr: 1, pl: 5, km: 3.57, sp: 8, ts: 31.7 },
   { n: 'Javier Rojas', p: 'D', min: 29, r: 6.5, to: 15, pt: 9, pa: 8, lt: 1, la: 1, tk: 1, bl: 1, re: 1, dw: 1, pl: 4, sh: 1 },
   { n: 'Ángel Gillard', p: 'F', min: 14, r: 6.5, to: 5, pt: 3, pa: 2, lt: 1, re: 1, dw: 1, dl: 1, fc: 1, fr: 1, pl: 2, km: 2.34, sp: 4, ts: 29.2 },
   { n: 'Brayan Véjar', p: 'M', min: 9, r: 6.7, to: 14, pt: 7, pa: 2, lt: 1, tk: 1, cl: 1, dw: 2, pl: 7, km: 1.59, sp: 2, ts: 28.3 },
   { n: 'Jorge Henríquez', p: 'M', min: 9, r: 6.3, to: 11, pt: 7, pa: 5, lt: 1, ct: 2, re: 2, dl: 3, fc: 1, pl: 4, km: 1.69, sp: 2, ts: 26.9 }
  ]
 },
 "7": {
  eventId: 15352997, ccEs: 'home',
  cc: [
   { n: 'Fernando de Paul', p: 'G', min: 90, r: 7.3, to: 32, pt: 19, pa: 16, lt: 6, la: 3, cl: 1, re: 14, dw: 1, fr: 1, pl: 3, sv: 2 },
   { n: 'Jeyson Rojas', p: 'D', min: 90, r: 7.3, to: 58, pt: 30, pa: 24, lt: 4, la: 1, ct: 7, dt: 2, tk: 3, it: 1, cl: 5, bl: 1, re: 5, dw: 5, dl: 5, pl: 15, km: 8.63, sp: 15, ts: 30.6 },
   { n: 'Jonathan Villagra', p: 'D', min: 90, r: 7.1, to: 65, pt: 44, pa: 41, lt: 5, la: 4, dt: 1, da: 1, it: 2, cl: 10, bl: 1, re: 2, dw: 5, dl: 6, fc: 2, fr: 1, pl: 5, km: 9.03, sp: 9, ts: 30.8 },
   { n: 'Arturo Vidal', p: 'D', min: 90, r: 7.7, to: 76, pt: 61, pa: 56, lt: 10, la: 7, dt: 1, da: 1, tk: 1, it: 3, cl: 5, bl: 1, re: 4, dw: 5, dl: 2, fc: 1, fr: 1, pl: 5, sh: 2, km: 8.15, sp: 10, ts: 29.9 },
   { n: 'Joaquín Sosa', p: 'D', min: 35, r: 6.9, to: 31, pt: 26, pa: 23, lt: 3, la: 2, ct: 1, ca: 1, dw: 1, dl: 1, pl: 4, km: 3.28, sp: 6, ts: 30.2 },
   { n: 'Diego Ulloa', p: 'D', min: 90, r: 6.8, to: 45, pt: 20, pa: 17, lt: 2, ct: 1, dt: 1, da: 1, kp: 1, tk: 2, cl: 2, bl: 1, re: 4, dw: 5, dl: 3, fc: 1, fr: 2, pl: 10, sh: 1, km: 9.84, sp: 11, ts: 28.8 },
   { n: 'Álvaro Madrid', p: 'M', min: 86, r: 7.4, to: 62, pt: 46, pa: 40, lt: 5, la: 3, ct: 3, cl: 1, re: 5, dw: 1, dl: 7, fc: 1, fr: 1, pl: 16, g: 1, sh: 2, km: 8.97, sp: 12, ts: 30.1 },
   { n: 'Tomás Alarcón', p: 'M', min: 90, r: 7.1, to: 88, pt: 71, pa: 59, lt: 3, la: 2, ct: 9, ca: 3, kp: 3, tk: 1, it: 1, cl: 1, re: 8, dw: 2, dl: 3, fc: 1, pl: 21, sh: 1, km: 9.44, sp: 5, ts: 35.2 },
   { n: 'Víctor Felipe Méndez', p: 'M', min: 90, r: 7.0, to: 68, pt: 55, pa: 46, lt: 4, la: 2, ct: 1, dt: 1, da: 1, kp: 2, cl: 1, re: 3, dw: 2, dl: 2, fc: 1, pl: 13, sh: 1, km: 9.0, sp: 7, ts: 29.0 },
   { n: 'Lautaro Pastrán', p: 'F', min: 70, r: 6.4, to: 51, pt: 32, pa: 24, lt: 1, ct: 1, dt: 5, da: 2, tk: 2, re: 4, dw: 6, dl: 10, fc: 3, fr: 1, pl: 16, sh: 1, km: 7.73, sp: 11, ts: 33.6 },
   { n: 'Maximiliano Romero', p: 'F', min: 86, r: 6.6, to: 12, pt: 5, pa: 4, ct: 1, kp: 1, dl: 3, pl: 7, as: 1, km: 7.31, sp: 11, ts: 31.2 },
   { n: 'Erick Wiemberg', p: 'D', min: 55, r: 6.6, to: 33, pt: 27, pa: 20, lt: 2, ct: 1, dt: 1, cl: 2, bl: 1, re: 1, dw: 1, dl: 3, fc: 1, pl: 9, sh: 1, km: 6.18, sp: 4, ts: 26.0 },
   { n: 'Claudio Aquino', p: 'M', min: 20, r: 7.6, to: 17, pt: 14, pa: 11, lt: 2, la: 1, ct: 1, kp: 1, re: 1, pl: 5, g: 1, sh: 1, km: 1.76, sp: 3, ts: 29.3 },
   { n: 'Leandro Hernández', p: 'F', min: 13, r: 6.6, to: 6, pt: 1, dt: 2, da: 1, dw: 2, dl: 1, fr: 1, pl: 2, sh: 1 },
   { n: 'Javier Correa', p: 'F', min: 13, r: 6.4, to: 4, pt: 1, dl: 3, pl: 2, km: 0.77, ts: 24.0 }
  ],
  rv: [
   { n: 'Sebastián Mella', p: 'G', min: 90, r: 6.4, to: 31, pt: 26, pa: 21, lt: 10, la: 5, dt: 1, da: 1, cl: 1, re: 6, dw: 1, pl: 5 },
   { n: 'Cristian Toro', p: 'D', min: 90, r: 6.2, to: 60, pt: 43, pa: 35, lt: 6, la: 3, tk: 1, it: 1, cl: 8, re: 2, dw: 2, dl: 4, fc: 3, fr: 1, pl: 11, km: 8.03, sp: 9, ts: 29.9 },
   { n: 'Rafael Caroca', p: 'D', min: 90, r: 7.0, to: 49, pt: 34, pa: 30, lt: 2, tk: 2, it: 1, cl: 9, re: 1, dw: 5, dl: 2, fr: 1, pl: 4, km: 7.72, sp: 3, ts: 27.6 },
   { n: 'Renzo Malanca', p: 'D', min: 90, r: 7.1, to: 64, pt: 46, pa: 38, lt: 8, la: 3, tk: 2, it: 2, cl: 4, re: 3, dw: 5, dl: 1, fr: 2, pl: 11, km: 9.05, sp: 15, ts: 32.6 },
   { n: 'Maicol León', p: 'M', min: 90, r: 6.4, to: 49, pt: 34, pa: 26, lt: 3, ct: 2, dt: 1, da: 1, kp: 1, it: 1, re: 6, dw: 1, pl: 15, sh: 1, km: 9.96, sp: 7, ts: 34.5 },
   { n: 'Claudio Sepúlveda', p: 'M', min: 85, r: 7.0, to: 61, pt: 50, pa: 46, lt: 4, la: 3, ct: 1, tk: 1, it: 1, cl: 1, bl: 1, re: 7, dw: 1, pl: 5, sh: 1, km: 8.33, sp: 3, ts: 29.8 },
   { n: 'Nicolás Vargas', p: 'M', min: 85, r: 7.1, to: 61, pt: 43, pa: 36, lt: 9, la: 6, ct: 5, tk: 2, cl: 2, re: 3, dw: 5, dl: 2, fr: 2, pl: 14, km: 7.5, sp: 4, ts: 30.0 },
   { n: 'Claudio Torres', p: 'M', min: 67, r: 7.0, to: 43, pt: 21, pa: 11, lt: 1, ct: 2, ca: 1, dt: 1, da: 1, kp: 1, tk: 6, cl: 1, re: 1, dw: 11, dl: 2, fc: 1, pl: 14, sh: 2, km: 7.02, sp: 12, ts: 31.1 },
   { n: 'Santiago Silva', p: 'F', min: 90, r: 6.8, to: 44, pt: 28, pa: 23, lt: 2, la: 1, dt: 2, kp: 2, tk: 3, it: 1, cl: 1, bl: 1, re: 3, dw: 4, dl: 6, fc: 2, fr: 1, pl: 11, km: 9.49, sp: 10, ts: 31.6 },
   { n: 'Maximiliano Rodríguez', p: 'F', min: 85, r: 6.6, to: 35, pt: 16, pa: 13, lt: 1, dt: 3, da: 1, kp: 1, cl: 3, bl: 1, re: 1, dw: 6, dl: 7, fc: 2, fr: 2, pl: 11, sh: 1, km: 7.86, sp: 4, ts: 28.0 },
   { n: 'Cris Martínez', p: 'F', min: 67, r: 6.2, to: 21, pt: 10, pa: 6, lt: 1, ct: 1, dt: 1, da: 1, tk: 1, cl: 1, re: 3, dw: 4, dl: 7, fr: 1, pl: 7, sh: 2, km: 6.53, sp: 16, ts: 30.7 },
   { n: 'Ezequiel Cañete', p: 'M', min: 23, r: 6.4, to: 20, pt: 15, pa: 12, lt: 3, la: 2, ct: 2, it: 1, re: 1, dl: 2, fc: 1, pl: 6, km: 2.53, sp: 2, ts: 26.8 },
   { n: 'Lionel Altamirano', p: 'F', min: 23, r: 6.5, to: 14, pt: 11, pa: 9, lt: 1, dw: 2, dl: 1, fr: 1, pl: 3, km: 1.83, ts: 27.0 },
   { n: 'Juan Figueroa', p: 'F', min: 14, r: 6.6, to: 3, dl: 1, pl: 2, sh: 1, km: 0.94, ts: 23.8 },
   { n: 'Harold Antiñirre', p: 'M', min: 14, r: 6.7, to: 8, pt: 1, ct: 2, pl: 5, km: 1.09, sp: 2, ts: 27.6 },
   { n: 'Luciano Arriagada', p: 'F', min: 14, r: 6.5, to: 8, pt: 2, pa: 1, tk: 2, it: 1, dw: 2, dl: 1, pl: 3, sh: 1, km: 1.0, sp: 2, ts: 28.8 }
  ]
 },
 "6": {
  eventId: 15352988, ccEs: 'away',
  cc: [
   { n: 'Fernando de Paul', p: 'G', min: 90, r: 6.6, to: 34, pt: 24, pa: 13, lt: 16, la: 6, cl: 2, re: 9, pl: 11 },
   { n: 'Jeyson Rojas', p: 'D', min: 90, r: 7.1, to: 41, pt: 20, pa: 17, lt: 2, la: 1, ct: 3, dt: 2, da: 1, tk: 1, cl: 2, re: 4, dw: 5, dl: 4, fc: 1, fr: 1, pl: 10, sh: 1, km: 10.1, sp: 23, ts: 34.2 },
   { n: 'Jonathan Villagra', p: 'D', min: 90, r: 6.8, to: 42, pt: 29, pa: 21, lt: 1, tk: 1, it: 1, cl: 5, dw: 4, dl: 4, fc: 3, pl: 9, sh: 1, km: 9.97, sp: 14, ts: 32.3 },
   { n: 'Arturo Vidal', p: 'D', min: 90, r: 7.6, to: 70, pt: 60, pa: 52, lt: 8, la: 4, tk: 2, it: 1, cl: 2, bl: 3, re: 5, dw: 6, dl: 3, fr: 2, pl: 8, km: 8.93, sp: 10, ts: 30.7 },
   { n: 'Joaquín Sosa', p: 'D', min: 90, r: 6.9, to: 66, pt: 39, pa: 28, lt: 8, la: 2, ct: 2, dt: 1, tk: 3, it: 1, cl: 8, re: 4, dw: 9, dl: 10, fc: 3, fr: 1, pl: 18, km: 10.14, sp: 16, ts: 31.0 },
   { n: 'Diego Ulloa', p: 'D', min: 69, r: 7.3, to: 52, pt: 28, pa: 23, lt: 2, la: 2, ct: 5, dt: 4, da: 3, kp: 1, tk: 2, re: 8, dw: 8, dl: 4, fc: 1, fr: 1, pl: 11, km: 7.17, sp: 18, ts: 34.5 },
   { n: 'Álvaro Madrid', p: 'M', min: 90, r: 7.0, to: 60, pt: 45, pa: 37, lt: 6, la: 4, ct: 1, ca: 1, dt: 2, da: 1, kp: 1, tk: 1, cl: 1, re: 11, dw: 4, dl: 5, fr: 2, pl: 10, sh: 3, km: 11.24, sp: 14, ts: 32.0 },
   { n: 'Tomás Alarcón', p: 'M', min: 90, r: 7.0, to: 89, pt: 70, pa: 61, lt: 7, la: 4, ct: 6, ca: 2, dt: 2, da: 1, kp: 1, it: 1, cl: 1, re: 11, dw: 2, dl: 3, pl: 15, sh: 2, km: 10.39, sp: 6, ts: 31.3 },
   { n: 'Víctor Felipe Méndez', p: 'M', min: 90, r: 6.8, to: 62, pt: 45, pa: 36, lt: 3, la: 1, ct: 1, dt: 2, da: 1, kp: 2, it: 1, cl: 4, re: 6, dw: 3, dl: 4, fr: 1, pl: 15, km: 9.57, sp: 11, ts: 28.2 },
   { n: 'Maximiliano Romero', p: 'F', min: 77, r: 7.3, to: 18, pt: 13, pa: 9, lt: 2, la: 2, cl: 2, re: 1, dl: 2, pl: 6, g: 1, sh: 1, km: 7.48, sp: 8, ts: 33.2 },
   { n: 'Lautaro Pastrán', p: 'F', min: 45, r: 6.4, to: 33, pt: 16, pa: 12, lt: 2, ct: 1, ca: 1, dt: 1, kp: 1, tk: 1, re: 3, dw: 2, dl: 5, fc: 1, fr: 1, pl: 13, sh: 1, as: 1, km: 5.3, sp: 7, ts: 30.8 },
   { n: 'Leandro Hernández', p: 'F', min: 45, r: 6.5, to: 26, pt: 14, pa: 13, lt: 1, ct: 1, ca: 1, dt: 6, da: 1, kp: 3, tk: 1, re: 2, dw: 2, dl: 5, pl: 9, sh: 1, km: 5.52, sp: 19, ts: 33.9 },
   { n: 'Erick Wiemberg', p: 'D', min: 21, r: 6.6, to: 16, pt: 8, pa: 7, ct: 1, re: 1, dl: 2, pl: 5, km: 2.94, sp: 4, ts: 31.3 },
   { n: 'Javier Correa', p: 'F', min: 13, r: 6.3, to: 9, pt: 3, pa: 1, tk: 1, re: 1, dw: 2, dl: 4, pl: 5, sh: 2, km: 1.95, sp: 3, ts: 31.2 }
  ],
  rv: [
   { n: 'Tomás Ahumada', p: 'G', min: 90, r: 6.5, to: 45, pt: 42, pa: 28, lt: 18, la: 5, cl: 1, re: 11, dw: 1, pl: 14, sv: 2 },
   { n: 'Enzo Ferrario', p: 'D', min: 84, r: 7.1, to: 63, pt: 36, pa: 30, lt: 3, la: 1, ct: 1, dt: 1, da: 1, tk: 3, it: 1, cl: 3, re: 5, dw: 5, pl: 13, sh: 1, km: 9.42, sp: 21, ts: 32.4 },
   { n: 'Marcelo Ortíz', p: 'D', min: 90, r: 6.8, to: 58, pt: 49, pa: 40, lt: 11, la: 5, tk: 3, it: 1, cl: 5, re: 3, dw: 3, dl: 2, pl: 9, km: 9.24, sp: 14, ts: 30.6 },
   { n: 'Daniel Piña', p: 'D', min: 90, r: 6.7, to: 55, pt: 36, pa: 30, lt: 5, la: 3, cl: 8, re: 8, dw: 5, dl: 2, fc: 1, pl: 11, km: 10.37, sp: 23, ts: 34.0 },
   { n: 'Paolo Guajardo', p: 'M', min: 83, r: 6.3, to: 30, pt: 10, pa: 6, ct: 1, dt: 3, tk: 1, it: 1, cl: 4, re: 4, dw: 6, dl: 8, fc: 1, fr: 3, pl: 9, km: 8.77, sp: 19, ts: 35.5 },
   { n: 'Marco Collao', p: 'M', min: 74, r: 6.5, to: 42, pt: 23, pa: 12, lt: 3, la: 1, ct: 1, dt: 2, kp: 1, tk: 2, it: 3, cl: 1, re: 3, dw: 4, dl: 3, fr: 1, pl: 17, sh: 1, km: 8.23, sp: 5, ts: 29.4 },
   { n: 'Federico Mateos', p: 'M', min: 90, r: 6.6, to: 47, pt: 35, pa: 23, lt: 5, la: 3, tk: 3, cl: 3, re: 7, dw: 5, dl: 5, fc: 3, fr: 1, pl: 15, sh: 1, km: 10.78, sp: 11, ts: 29.6 },
   { n: 'Esteban Matus', p: 'M', min: 90, r: 6.7, to: 39, pt: 21, pa: 18, lt: 1, ct: 4, tk: 2, cl: 1, re: 1, dw: 2, dl: 3, pl: 9, sh: 2, km: 10.42, sp: 27, ts: 32.9 },
   { n: 'Nicolás Aedo', p: 'F', min: 60, r: 6.4, to: 38, pt: 19, pa: 12, lt: 2, ct: 3, ca: 1, dt: 2, kp: 1, tk: 3, it: 1, re: 2, dw: 4, dl: 7, fc: 1, fr: 1, pl: 15, sh: 1 },
   { n: 'Rodrigo Cabral', p: 'F', min: 90, r: 6.9, to: 39, pt: 18, pa: 14, lt: 2, la: 1, ct: 6, dt: 2, da: 2, kp: 1, tk: 1, re: 4, dw: 6, dl: 5, fr: 2, pl: 16, sh: 1, km: 10.27, sp: 21, ts: 32.7 },
   { n: 'Diego Coelho', p: 'F', min: 60, r: 6.4, to: 17, pt: 8, pa: 2, cl: 4, dw: 7, dl: 6, fc: 1, fr: 1, pl: 8, km: 6.92, sp: 7, ts: 32.1 },
   { n: 'Franco Troyansky', p: 'F', min: 30, r: 6.7, to: 10, pt: 7, pa: 6, lt: 2, la: 2, dt: 3, da: 3, dw: 3, dl: 4, fc: 2, pl: 1, km: 3.53, sp: 7, ts: 28.7 },
   { n: 'Giovani Chiaverano', p: 'F', min: 30, r: 6.7, to: 12, pt: 9, pa: 7, re: 1, dw: 3, dl: 1, fc: 1, pl: 4, km: 3.71, sp: 10, ts: 33.0 },
   { n: 'Mario Sandoval', p: 'M', min: 16, r: 6.6, to: 16, pt: 12, pa: 9, lt: 4, la: 3, dt: 1, tk: 1, it: 1, re: 2, dw: 1, dl: 1, pl: 4, km: 2.64, sp: 5, ts: 32.2 },
   { n: 'Martín Jiménez', p: 'D', min: 13, r: 6.6, to: 7, pt: 6, pa: 4, lt: 2, ct: 1, re: 2, pl: 3, km: 1.64, sp: 1, ts: 31.2 },
   { n: 'Favian Loyola', p: 'M', min: 12, r: 6.6, to: 6, pt: 5, pa: 4, lt: 1, la: 1, ct: 1, ca: 1, kp: 1, pl: 1, km: 1.72, ts: 24.6 }
  ]
 },
 "5": {
  eventId: 15352979, ccEs: 'home',
  cc: [
   { n: 'Fernando de Paul', p: 'G', min: 90, r: 6.4, to: 40, pt: 29, pa: 13, lt: 20, la: 6, re: 12, pl: 16, sv: 3 },
   { n: 'Jeyson Rojas', p: 'D', min: 90, r: 6.4, to: 71, pt: 38, pa: 27, lt: 9, la: 3, ct: 1, dt: 2, tk: 2, cl: 5, bl: 1, re: 5, dw: 5, dl: 6, fr: 2, pl: 20, sh: 1, km: 8.69, sp: 10, ts: 32.2 },
   { n: 'Jonathan Villagra', p: 'D', min: 90, r: 6.9, to: 41, pt: 22, pa: 17, lt: 5, la: 3, dt: 4, da: 2, it: 2, cl: 6, bl: 1, re: 4, dw: 5, dl: 8, fc: 1, fr: 2, pl: 7, km: 9.25, sp: 14, ts: 31.3 },
   { n: 'Joaquín Sosa', p: 'D', min: 90, r: 6.7, to: 79, pt: 55, pa: 44, lt: 9, la: 5, ct: 2, tk: 2, it: 1, cl: 8, re: 4, dw: 4, dl: 5, fc: 2, fr: 1, pl: 14, km: 10.22, sp: 18, ts: 31.0 },
   { n: 'Diego Ulloa', p: 'D', min: 85, r: 6.6, to: 65, pt: 34, pa: 28, lt: 4, la: 1, ct: 4, ca: 1, dt: 3, da: 2, tk: 3, it: 1, cl: 2, re: 8, dw: 7, dl: 4, fr: 1, pl: 15, km: 6.52, sp: 4, ts: 29.0 },
   { n: 'Arturo Vidal', p: 'M', min: 67, r: 7.6, to: 65, pt: 45, pa: 37, lt: 13, la: 9, kp: 2, tk: 6, it: 2, cl: 3, re: 7, dw: 9, dl: 7, fc: 1, fr: 1, pl: 11, km: 6.29, sp: 5, ts: 27.7 },
   { n: 'Maximiliano Romero', p: 'F', min: 66, r: 6.7, to: 16, pt: 9, pa: 6, dw: 3, dl: 2, pl: 8, sh: 1, km: 5.83, sp: 15, ts: 31.7 },
   { n: 'Tomás Alarcón', p: 'M', min: 80, r: 6.7, to: 57, pt: 40, pa: 29, lt: 5, la: 1, ct: 4, ca: 2, dt: 1, da: 1, tk: 4, re: 4, dw: 8, dl: 2, fc: 1, fr: 2, pl: 15, km: 7.54, sp: 8, ts: 31.3 },
   { n: 'Víctor Felipe Méndez', p: 'M', min: 90, r: 7.0, to: 58, pt: 43, pa: 39, lt: 2, la: 2, ct: 1, kp: 1, tk: 2, it: 1, re: 5, dw: 4, dl: 4, pl: 11, sh: 1, km: 9.02, sp: 9, ts: 28.6 },
   { n: 'Claudio Aquino', p: 'M', min: 67, r: 7.2, to: 50, pt: 38, pa: 24, lt: 4, la: 3, dt: 1, da: 1, kp: 2, re: 3, dw: 7, dl: 2, fc: 1, fr: 5, pl: 17, sh: 1, km: 6.56, sp: 12, ts: 30.1 },
   { n: 'Javier Correa', p: 'F', min: 90, r: 6.4, to: 35, pt: 15, pa: 7, dt: 4, da: 3, tk: 1, cl: 1, dw: 7, dl: 10, pl: 14, sh: 6, km: 8.21, sp: 14, ts: 32.6 },
   { n: 'Lautaro Pastrán', p: 'F', min: 24, r: 6.1, to: 27, pt: 11, pa: 6, lt: 3, dt: 2, da: 1, tk: 1, re: 1, dw: 3, dl: 7, fc: 2, fr: 1, pl: 14, sh: 2, km: 3.07, sp: 4, ts: 30.5 },
   { n: 'Álvaro Madrid', p: 'M', min: 23, r: 6.4, to: 15, pt: 12, pa: 8, lt: 3, la: 1, ct: 1, ca: 1, kp: 1, dl: 2, pl: 5, km: 3.04, sp: 3, ts: 33.1 },
   { n: 'Leandro Hernández', p: 'F', min: 23, r: 6.5, to: 10, pt: 8, pa: 5, lt: 1, dt: 1, da: 1, dw: 1, dl: 2, fc: 1, pl: 3 },
   { n: 'Yastin Cuevas', p: 'F', min: 10, r: 6.5, to: 1, km: 2.22, sp: 2, ts: 27.9 },
   { n: 'Francisco Marchant', p: 'M', min: 14, r: 6.9, to: 10, pt: 4, pa: 4, ct: 5, ca: 3, kp: 2, re: 1, dl: 1, pl: 3, km: 1.48, sp: 6, ts: 32.0 }
  ],
  rv: [
   { n: 'Gabriel Castellón', p: 'G', min: 90, r: 7.1, to: 36, pt: 27, pa: 17, lt: 15, la: 5, cl: 1, re: 9, pl: 10, sv: 4 },
   { n: 'Nicolás Ramírez', p: 'D', min: 90, r: 7.3, to: 48, pt: 31, pa: 22, lt: 9, la: 4, kp: 1, tk: 2, it: 1, cl: 7, re: 7, dw: 5, dl: 5, fc: 3, pl: 10, km: 8.87, sp: 13, ts: 29.8 },
   { n: 'Franco Calderón', p: 'D', min: 90, r: 7.1, to: 41, pt: 29, pa: 21, lt: 8, la: 3, it: 1, cl: 7, bl: 1, re: 2, dw: 8, dl: 6, pl: 9, km: 8.73, sp: 18, ts: 34.5 },
   { n: 'Matías Zaldivia', p: 'D', min: 90, r: 8.4, to: 46, pt: 24, pa: 19, lt: 6, la: 4, tk: 4, it: 3, cl: 9, re: 3, dw: 5, dl: 1, pl: 7, g: 1, sh: 1, km: 9.35, sp: 13, ts: 32.0 },
   { n: 'Fabián Hormazábal', p: 'D', min: 90, r: 6.6, to: 49, pt: 22, pa: 15, lt: 3, la: 1, ct: 4, dt: 1, kp: 1, tk: 2, it: 2, cl: 2, re: 4, dw: 4, dl: 8, fc: 1, fr: 1, pl: 18, km: 7.91, sp: 8, ts: 29.2 },
   { n: 'Israel Poblete', p: 'M', min: 90, r: 6.4, to: 51, pt: 32, pa: 17, lt: 5, dt: 2, da: 1, kp: 1, tk: 4, it: 1, cl: 2, re: 5, dw: 7, dl: 10, fc: 4, fr: 1, pl: 21, km: 10.09, sp: 13, ts: 31.6 },
   { n: 'Charles Aránguiz', p: 'M', min: 90, r: 6.6, to: 62, pt: 37, pa: 25, lt: 6, la: 1, dt: 3, da: 1, tk: 2, it: 3, cl: 3, re: 9, dw: 4, dl: 8, fc: 1, pl: 17, km: 9.26, sp: 12, ts: 29.4 },
   { n: 'Marcelo Morales', p: 'D', min: 72, r: 6.6, to: 36, pt: 20, pa: 12, lt: 7, la: 1, ct: 3, dt: 1, da: 1, tk: 1, bl: 1, re: 7, dw: 2, dl: 4, fc: 2, pl: 14, km: 6.37, sp: 12, ts: 33.8 },
   { n: 'Javier Altamirano', p: 'M', min: 84, r: 6.5, to: 44, pt: 25, pa: 18, dt: 5, da: 4, tk: 2, cl: 1, re: 4, dw: 9, dl: 6, fc: 2, fr: 2, pl: 13, sh: 1, km: 7.51, sp: 11, ts: 30.8 },
   { n: 'Eduardo Vargas', p: 'F', min: 61, r: 7.0, to: 32, pt: 15, pa: 9, lt: 2, dt: 5, da: 2, tk: 3, cl: 1, re: 3, dw: 7, dl: 5, fc: 1, fr: 1, pl: 11, sh: 1, km: 5.94, sp: 18, ts: 34.3 },
   { n: 'Juan Martín Lucero', p: 'F', min: 90, r: 6.5, to: 39, pt: 25, pa: 14, lt: 1, dt: 1, tk: 1, re: 2, dw: 5, dl: 7, fc: 1, fr: 2, pl: 16, sh: 2, km: 9.62, sp: 20, ts: 32.4 },
   { n: 'Maximiliano Guerrero', p: 'F', min: 29, r: 6.9, to: 23, pt: 7, pa: 4, lt: 1, ct: 1, dt: 3, da: 3, cl: 1, re: 1, dw: 6, dl: 1, fr: 2, pl: 8, sh: 1, km: 3.89, sp: 11, ts: 33.3 },
   { n: 'Felipe Salomoni', p: 'D', min: 18, r: 6.6, to: 9, pt: 2, pa: 2, ct: 1, dt: 1, dl: 2, pl: 2, km: 2.44, sp: 3, ts: 28.0 },
   { n: 'Lucas Romero', p: 'M', min: 15, r: 6.7, to: 4, pt: 2, pa: 2, lt: 1, la: 1, cl: 1, bl: 1, km: 1.85, sp: 1, ts: 25.8 }
  ]
 },
 "4": {
  eventId: 15352970, ccEs: 'away',
  cc: [
   { n: 'Fernando de Paul', p: 'G', min: 90, r: 7.3, to: 36, pt: 28, pa: 20, lt: 17, la: 9, re: 6, pl: 8, sv: 2 },
   { n: 'Jeyson Rojas', p: 'D', min: 90, r: 7.2, to: 53, pt: 30, pa: 23, lt: 6, la: 3, ct: 2, ca: 1, dt: 1, kp: 1, tk: 2, cl: 3, re: 3, dw: 5, dl: 2, fr: 2, pl: 12, km: 9.56, sp: 12, ts: 34.3 },
   { n: 'Jonathan Villagra', p: 'D', min: 90, r: 7.4, to: 56, pt: 39, pa: 34, lt: 7, la: 3, dt: 1, da: 1, tk: 2, it: 2, cl: 8, re: 3, dw: 5, dl: 5, fc: 1, fr: 1, pl: 7, km: 10.69, sp: 20, ts: 33.6 },
   { n: 'Joaquín Sosa', p: 'D', min: 90, r: 7.3, to: 56, pt: 45, pa: 43, lt: 1, la: 1, tk: 2, cl: 6, bl: 1, re: 1, dw: 4, dl: 2, fr: 1, pl: 2, sh: 1, km: 9.88, sp: 18, ts: 32.8 },
   { n: 'Diego Ulloa', p: 'D', min: 90, r: 6.7, to: 45, pt: 29, pa: 25, ct: 2, dt: 1, cl: 4, re: 4, dw: 4, dl: 5, fc: 3, fr: 3, pl: 7, km: 9.69, sp: 19, ts: 32.4 },
   { n: 'Arturo Vidal', p: 'M', min: 79, r: 7.1, to: 74, pt: 64, pa: 58, lt: 5, la: 3, tk: 3, it: 1, re: 2, dw: 8, dl: 6, fc: 2, fr: 2, pl: 6, sh: 2, km: 8.83, sp: 22, ts: 30.8 },
   { n: 'Leandro Hernández', p: 'M', min: 67, r: 6.6, to: 27, pt: 16, pa: 15, dt: 4, da: 2, re: 3, dw: 3, dl: 5, fc: 1, fr: 1, pl: 4, km: 7.45, sp: 17, ts: 31.9 },
   { n: 'Tomás Alarcón', p: 'M', min: 89, r: 6.3, to: 71, pt: 56, pa: 50, lt: 4, la: 2, ct: 6, ca: 1, dt: 2, da: 1, kp: 3, cl: 1, re: 3, dw: 3, dl: 9, fc: 4, pl: 15, km: 7.83, sp: 8, ts: 33.2 },
   { n: 'Víctor Felipe Méndez', p: 'M', min: 90, r: 6.7, to: 72, pt: 55, pa: 48, lt: 1, la: 1, dt: 3, da: 1, kp: 3, tk: 2, cl: 1, re: 4, dw: 4, dl: 4, pl: 12, sh: 1, km: 10.52, sp: 11, ts: 31.1 },
   { n: 'Claudio Aquino', p: 'M', min: 79, r: 8.1, to: 71, pt: 50, pa: 40, lt: 4, la: 3, dt: 1, da: 1, kp: 1, tk: 3, it: 1, re: 8, dw: 4, dl: 2, fc: 1, pl: 18, g: 1, sh: 4, km: 8.58, sp: 14, ts: 31.4 },
   { n: 'Maximiliano Romero', p: 'F', min: 89, r: 6.7, to: 19, pt: 10, pa: 8, kp: 1, tk: 1, re: 1, dw: 2, dl: 2, fc: 1, pl: 3, sh: 4, km: 8.88, sp: 8, ts: 29.9 },
   { n: 'Lautaro Pastrán', p: 'F', min: 23, r: 6.6, to: 25, pt: 16, pa: 14, dt: 3, da: 1, bl: 1, re: 4, dw: 2, dl: 5, fc: 2, fr: 1, pl: 4, km: 3.74, sp: 7, ts: 29.3 },
   { n: 'Álvaro Madrid', p: 'M', min: 11, r: 6.7, to: 7, pt: 5, pa: 3, lt: 3, la: 1, dt: 1, da: 1, cl: 1, re: 1, dw: 1, pl: 2, km: 2.3, sp: 7, ts: 35.0 },
   { n: 'Francisco Marchant', p: 'M', min: 11, r: 6.4, to: 11, pt: 5, pa: 2, lt: 2, dt: 1, cl: 2, re: 2, dl: 1, pl: 5, km: 2.38, sp: 10, ts: 31.2 },
   { n: 'Javier Méndez', p: 'D', min: 12, r: 6.7, to: 4, pt: 1, pa: 1, lt: 1, la: 1, it: 1, cl: 2, dl: 2 },
   { n: 'Yastin Cuevas', p: 'F', min: 11, r: 6.5, to: 4, pt: 3, pa: 2, pl: 2, km: 1.41, sp: 3, ts: 32.3 }
  ],
  rv: [
   { n: 'Omar Carabalí', p: 'G', min: 90, r: 7.4, to: 32, pt: 22, pa: 21, lt: 6, la: 5, re: 8, pl: 2, sv: 3 },
   { n: 'Felipe Faúndez', p: 'D', min: 90, r: 6.2, to: 43, pt: 22, pa: 15, lt: 6, la: 2, ct: 3, ca: 2, dt: 1, kp: 1, tk: 1, cl: 3, bl: 1, re: 2, dw: 1, dl: 3, fc: 2, pl: 16, sh: 1, km: 8.87, sp: 10, ts: 33.0 },
   { n: 'Alan Robledo', p: 'D', min: 90, r: 6.6, to: 48, pt: 35, pa: 31, lt: 3, la: 2, it: 1, cl: 6, bl: 2, re: 4, dw: 2, dl: 3, fc: 1, fr: 1, pl: 4, km: 9.49, sp: 15, ts: 33.8 },
   { n: 'Miguel Brizuela', p: 'D', min: 90, r: 7.6, to: 67, pt: 51, pa: 40, lt: 12, la: 4, tk: 4, it: 3, cl: 2, bl: 1, re: 4, dw: 7, dl: 4, fr: 1, pl: 12, sh: 2, km: 10.15, sp: 12, ts: 31.4 },
   { n: 'Luis Pavez Muñoz', p: 'D', min: 90, r: 6.8, to: 63, pt: 35, pa: 30, lt: 1, ct: 6, ca: 2, kp: 2, tk: 2, cl: 3, dw: 5, dl: 6, fc: 2, fr: 1, pl: 12, sh: 1, km: 10.44, sp: 14, ts: 32.6 },
   { n: 'Francisco González', p: 'M', min: 60, r: 6.3, to: 33, pt: 14, pa: 14, ct: 6, ca: 1, dt: 4, da: 2, kp: 1, cl: 1, re: 3, dw: 3, dl: 6, fc: 1, fr: 1, pl: 10, sh: 1, km: 5.66, sp: 12, ts: 34.6 },
   { n: 'Felipe Ogaz', p: 'M', min: 76, r: 6.9, to: 40, pt: 31, pa: 27, lt: 1, tk: 3, re: 4, dw: 6, dl: 3, fr: 3, pl: 4, km: 8.41, sp: 14, ts: 31.2 },
   { n: 'Juan Leiva', p: 'M', min: 90, r: 6.4, to: 46, pt: 35, pa: 30, lt: 3, la: 2, dt: 1, tk: 4, re: 5, dw: 4, dl: 4, pl: 9, sh: 1, km: 9.24, sp: 7, ts: 30.1 },
   { n: 'Bastián Yáñez', p: 'F', min: 76, r: 6.7, to: 35, pt: 16, pa: 12, lt: 2, ct: 8, ca: 1, dt: 2, da: 1, kp: 2, tk: 3, re: 3, dw: 5, dl: 1, fr: 1, pl: 15, km: 7.65, sp: 14, ts: 31.3 },
   { n: 'Martín Sarrafiore', p: 'F', min: 60, r: 6.4, to: 26, pt: 14, pa: 8, lt: 1, dt: 2, re: 2, dw: 3, dl: 7, fc: 1, fr: 2, pl: 14, km: 6.9, sp: 10, ts: 30.7 },
   { n: 'Arnaldo Castillo', p: 'F', min: 79, r: 7.0, to: 22, pt: 15, pa: 11, lt: 1, la: 1, cl: 1, re: 1, dw: 7, dl: 3, fc: 3, fr: 2, pl: 5, sh: 1, km: 8.32, sp: 20, ts: 30.2 },
   { n: 'Joaquín Tapia', p: 'F', min: 30, r: 6.7, to: 13, pt: 5, pa: 4, ct: 2, dt: 1, da: 1, kp: 1, dw: 2, fr: 1, pl: 5, sh: 1, km: 3.88, sp: 14, ts: 35.0 },
   { n: 'Bryan Rabello', p: 'M', min: 30, r: 6.6, to: 7, pt: 3, pa: 3, dt: 1, re: 1, dw: 1, dl: 1, fr: 1, pl: 1, sh: 2, km: 3.86, sp: 2, ts: 30.8 },
   { n: 'Benjamin Schamine', p: 'M', min: 14, r: 6.8, to: 22, pt: 18, pa: 16, lt: 3, la: 2, ct: 1, tk: 1, re: 1, dw: 2, dl: 1, fc: 1, fr: 1, pl: 4, km: 2.7, sp: 7, ts: 30.5 },
   { n: 'Rodrigo Godoy', p: 'F', min: 14, r: 6.2, to: 15, pt: 9, pa: 7, ct: 1, dt: 2, re: 1, dl: 3, fc: 1, pl: 5, km: 2.5, sp: 5, ts: 31.6 },
   { n: 'Thiago Vecino', p: 'F', min: 11, r: 6.7, to: 2, pt: 1, pa: 1, dw: 2, sh: 1, km: 2.18, sp: 3, ts: 27.5 }
  ]
 },
 "3": {
  eventId: 15352957, ccEs: 'home',
  cc: [
   { n: 'Fernando de Paul', p: 'G', min: 90, r: 6.7, to: 45, pt: 40, pa: 32, lt: 10, la: 3, re: 7, dw: 1, pl: 8 },
   { n: 'Jeyson Rojas', p: 'D', min: 90, r: 7.8, to: 80, pt: 43, pa: 35, lt: 6, la: 2, ct: 6, ca: 1, dt: 3, da: 1, kp: 2, tk: 5, it: 2, cl: 3, re: 4, dw: 7, dl: 5, fc: 1, pl: 17, sh: 2, km: 10.12, sp: 13, ts: 31.8 },
   { n: 'Jonathan Villagra', p: 'D', min: 90, r: 7.5, to: 76, pt: 66, pa: 58, lt: 6, la: 4, kp: 2, tk: 2, it: 1, cl: 4, bl: 1, re: 1, dw: 2, dl: 2, pl: 9, km: 9.92, sp: 9, ts: 30.5 },
   { n: 'Joaquín Sosa', p: 'D', min: 90, r: 7.7, to: 92, pt: 77, pa: 70, lt: 10, la: 4, ct: 1, tk: 6, cl: 3, re: 7, dw: 8, dl: 2, fr: 1, pl: 10, km: 9.6, sp: 12, ts: 31.2 },
   { n: 'Diego Ulloa', p: 'D', min: 45, r: 6.6, to: 29, pt: 17, pa: 12, lt: 1, la: 1, ct: 2, tk: 2, bl: 1, re: 1, dw: 4, dl: 4, fc: 2, pl: 8, sh: 1, km: 4.86, sp: 11, ts: 30.7 },
   { n: 'Arturo Vidal', p: 'M', min: 73, r: 7.3, to: 74, pt: 57, pa: 51, lt: 9, la: 5, kp: 2, tk: 3, it: 4, cl: 1, re: 5, dw: 7, fr: 1, pl: 6, sh: 6, km: 7.33, sp: 7, ts: 28.3 },
   { n: 'Maximiliano Romero', p: 'F', min: 90, r: 7.7, to: 22, pt: 10, pa: 7, ct: 1, dt: 1, da: 1, tk: 1, it: 1, re: 2, dw: 4, dl: 3, fc: 1, pl: 7, g: 1, sh: 3, km: 8.77, sp: 10, ts: 32.5 },
   { n: 'Tomás Alarcón', p: 'M', min: 64, r: 7.5, to: 49, pt: 38, pa: 34, lt: 2, la: 2, ct: 9, ca: 4, kp: 4, re: 3, dw: 2, dl: 3, fc: 3, fr: 1, pl: 9, km: 7.73, sp: 3, ts: 27.3 },
   { n: 'Víctor Felipe Méndez', p: 'M', min: 90, r: 7.3, to: 75, pt: 64, pa: 59, lt: 6, la: 5, ct: 2, dt: 2, kp: 4, tk: 1, re: 3, dw: 2, dl: 5, fr: 1, pl: 12, km: 10.27, sp: 6, ts: 28.9 },
   { n: 'Claudio Aquino', p: 'M', min: 64, r: 6.7, to: 51, pt: 32, pa: 25, lt: 5, la: 4, ct: 1, dt: 2, kp: 1, re: 4, dw: 3, dl: 7, fc: 1, fr: 2, pl: 18, sh: 2, km: 5.85, sp: 8, ts: 31.7 },
   { n: 'Javier Correa', p: 'F', min: 24, r: 6.3, to: 4, pt: 3, dt: 1, re: 1, dl: 1, pl: 4, km: 2.27, sp: 5, ts: 30.6 },
   { n: 'Leandro Hernández', p: 'F', min: 66, r: 6.6, to: 42, pt: 23, pa: 18, lt: 1, la: 1, ct: 2, dt: 7, da: 4, kp: 2, re: 5, dw: 5, dl: 8, fc: 1, fr: 1, pl: 17, sh: 2, km: 8.36, sp: 22, ts: 34.1 },
   { n: 'Erick Wiemberg', p: 'D', min: 45, r: 6.9, to: 38, pt: 18, pa: 14, ct: 2, dt: 2, da: 1, tk: 1, it: 1, cl: 1, re: 3, dw: 3, dl: 3, pl: 8, sh: 2, km: 5.05, sp: 7, ts: 32.8 },
   { n: 'Álvaro Madrid', p: 'M', min: 26, r: 6.7, to: 33, pt: 26, pa: 21, lt: 5, la: 3, kp: 1, tk: 2, it: 1, cl: 1, re: 4, dw: 2, dl: 4, fc: 1, pl: 6, sh: 1, km: 3.84, sp: 6, ts: 31.8 },
   { n: 'Francisco Marchant', p: 'M', min: 26, r: 6.7, to: 12, pt: 6, pa: 5, dt: 3, da: 2, cl: 2, re: 2, dw: 2, dl: 2, pl: 3, km: 3.25, sp: 1, ts: 26.9 },
   { n: 'Yastin Cuevas', p: 'F', min: 17, r: 6.4, to: 4, pt: 1, pa: 1, kp: 1, dl: 1, pl: 1, as: 1, sh: 2, km: 2.41, sp: 2, ts: 29.6 }
  ],
  rv: [
   { n: 'Nicolás Avellaneda', p: 'G', min: 90, r: 6.6, to: 61, pt: 49, pa: 35, lt: 27, la: 13, cl: 1, re: 11, dw: 1, dl: 1, pl: 15, sv: 4 },
   { n: 'Christopher Díaz', p: 'D', min: 90, r: 6.8, to: 42, pt: 30, pa: 24, lt: 7, la: 4, ct: 2, kp: 1, tk: 3, cl: 4, re: 7, dw: 3, dl: 2, fc: 1, pl: 8, km: 9.7, sp: 16, ts: 33.4 },
   { n: 'Rodrigo Caseres', p: 'D', min: 90, r: 6.8, to: 53, pt: 36, pa: 29, lt: 10, la: 6, it: 1, cl: 8, re: 4, dw: 1, dl: 2, pl: 8, km: 9.2, sp: 12, ts: 30.5 },
   { n: 'Nicolás Palma', p: 'D', min: 90, r: 6.4, to: 50, pt: 38, pa: 33, lt: 5, la: 3, it: 1, cl: 6, re: 2, dw: 1, dl: 3, fr: 1, pl: 7, km: 8.97, sp: 14, ts: 29.8 },
   { n: 'Daniel Gutiérrez', p: 'D', min: 90, r: 6.3, to: 48, pt: 27, pa: 19, lt: 3, la: 1, ct: 3, tk: 2, cl: 4, re: 4, dw: 4, dl: 4, fr: 2, pl: 15, sh: 1, km: 9.57, sp: 20, ts: 33.1 },
   { n: 'Bayron Oyarzo', p: 'M', min: 79, r: 5.9, to: 35, pt: 13, pa: 9, ct: 4, ca: 1, dt: 8, da: 1, kp: 2, tk: 1, cl: 1, re: 4, dw: 4, dl: 15, fc: 3, fr: 2, pl: 19, sh: 1, km: 8.84, sp: 10, ts: 30.1 },
   { n: 'Juan Manuel Requena', p: 'M', min: 90, r: 8.2, to: 70, pt: 41, pa: 38, lt: 4, la: 3, tk: 9, it: 6, cl: 5, re: 8, dw: 14, dl: 2, fc: 1, fr: 3, pl: 4, km: 10.47, sp: 5, ts: 29.0 },
   { n: 'Joaquín Soto', p: 'M', min: 58, r: 6.7, to: 25, pt: 20, pa: 19, lt: 1, la: 1, tk: 2, cl: 2, re: 3, dw: 2, dl: 2, pl: 1, sh: 1, km: 6.34, sp: 11, ts: 28.6 },
   { n: 'Cristián Gutiérrez', p: 'M', min: 58, r: 6.8, to: 28, pt: 10, pa: 9, lt: 1, ct: 3, dt: 1, da: 1, it: 2, cl: 1, bl: 2, re: 2, dw: 2, dl: 3, pl: 8, sh: 1, km: 6.14, sp: 4, ts: 35.7 },
   { n: 'Francisco Jose Pozzo', p: 'F', min: 68, r: 6.2, to: 17, pt: 6, pa: 4, dw: 1, dl: 3, fc: 1, pl: 10, km: 7.48, sp: 13, ts: 32.5 },
   { n: 'Sebastián Sáez', p: 'F', min: 90, r: 6.8, to: 40, pt: 26, pa: 18, lt: 6, la: 4, ct: 1, dt: 2, da: 1, kp: 1, tk: 1, cl: 2, dw: 7, dl: 4, fr: 1, pl: 13, sh: 1, km: 10.84, sp: 16, ts: 30.5 },
   { n: 'Javier Saldías', p: 'D', min: 32, r: 6.4, to: 17, pt: 8, pa: 5, lt: 1, ct: 1, ca: 1, kp: 1, tk: 3, re: 2, dw: 4, dl: 4, pl: 7, km: 4.29, sp: 9, ts: 32.0 },
   { n: 'Camilo Moya', p: 'M', min: 32, r: 6.3, to: 13, pt: 10, pa: 7, lt: 1, la: 1, cl: 1, dl: 2, fc: 1, pl: 3, km: 4.33, sp: 2, ts: 28.7 },
   { n: 'Matías Campos López', p: 'F', min: 22, r: 6.2, to: 12, pt: 3, pa: 2, lt: 1, la: 1, tk: 1, dw: 2, dl: 5, pl: 5, sh: 1, km: 3.47, sp: 7, ts: 28.9 },
   { n: 'Yerko Leiva', p: 'M', min: 11, r: 6.7, to: 14, pt: 7, pa: 6, lt: 1, ct: 1, dt: 1, da: 1, tk: 2, re: 1, dw: 4, fr: 1, pl: 3 }
  ]
 },
 "2": {
  eventId: 15352976, ccEs: 'home',
  cc: [
   { n: 'Fernando de Paul', p: 'G', min: 90, r: 7.1, to: 33, pt: 24, pa: 18, lt: 15, la: 9, re: 8, pl: 6, sv: 1 },
   { n: 'Jeyson Rojas', p: 'D', min: 90, r: 7.0, to: 71, pt: 44, pa: 35, lt: 5, la: 2, ct: 4, ca: 1, kp: 1, tk: 1, it: 2, cl: 5, re: 7, dw: 4, dl: 3, fc: 1, pl: 16, sh: 1, km: 10.08, sp: 23, ts: 30.7 },
   { n: 'Jonathan Villagra', p: 'D', min: 90, r: 7.2, to: 40, pt: 26, pa: 22, lt: 7, la: 4, tk: 2, it: 4, cl: 6, re: 3, dw: 5, dl: 3, fc: 3, pl: 4, sh: 1, km: 10.72, sp: 16, ts: 31.8 },
   { n: 'Joaquín Sosa', p: 'D', min: 90, r: 7.4, to: 57, pt: 38, pa: 30, lt: 15, la: 7, kp: 1, tk: 3, it: 2, cl: 6, bl: 1, re: 5, dw: 4, dl: 7, fc: 3, pl: 8, sh: 2, km: 9.02, sp: 11, ts: 29.9 },
   { n: 'Diego Ulloa', p: 'D', min: 90, r: 7.3, to: 67, pt: 38, pa: 27, lt: 5, la: 1, ct: 5, ca: 1, kp: 2, it: 2, cl: 6, bl: 1, re: 4, dw: 8, dl: 4, fr: 1, pl: 20, km: 10.2, sp: 23, ts: 32.7 },
   { n: 'Tomás Alarcón', p: 'M', min: 61, r: 7.0, to: 42, pt: 33, pa: 28, lt: 7, la: 4, ct: 2, ca: 2, kp: 3, tk: 1, it: 1, bl: 1, re: 1, dw: 1, dl: 2, fc: 2, pl: 6, sh: 1, km: 7.11, sp: 8, ts: 32.7 },
   { n: 'Arturo Vidal', p: 'M', min: 70, r: 7.5, to: 50, pt: 36, pa: 33, lt: 10, la: 8, tk: 3, it: 1, cl: 2, re: 7, dw: 6, dl: 3, fc: 1, pl: 4, sh: 3, km: 7.17, sp: 7, ts: 29.8 },
   { n: 'Víctor Felipe Méndez', p: 'M', min: 90, r: 8.2, to: 60, pt: 46, pa: 43, lt: 5, la: 5, ct: 3, ca: 3, dt: 3, kp: 6, tk: 1, it: 1, re: 8, dw: 2, dl: 4, fr: 1, pl: 8, as: 1, km: 10.31, sp: 12, ts: 29.1 },
   { n: 'Maximiliano Romero', p: 'F', min: 70, r: 6.6, to: 17, pt: 10, pa: 8, lt: 1, la: 1, dt: 1, kp: 1, re: 2, dw: 2, dl: 3, fr: 1, pl: 7, km: 6.92, sp: 8, ts: 32.8 },
   { n: 'Javier Correa', p: 'F', min: 90, r: 7.8, to: 42, pt: 20, pa: 12, lt: 1, la: 1, dt: 1, da: 1, kp: 3, tk: 2, it: 1, cl: 1, re: 3, dw: 6, dl: 6, fc: 1, pl: 15, g: 1, sh: 6, km: 9.74, sp: 19, ts: 32.7 },
   { n: 'Claudio Aquino', p: 'M', min: 79, r: 6.8, to: 61, pt: 41, pa: 31, lt: 7, la: 3, ct: 6, ca: 1, dt: 3, da: 1, kp: 2, tk: 2, re: 5, dw: 4, dl: 8, fc: 1, fr: 1, pl: 21, sh: 3, km: 8.01, sp: 9, ts: 33.0 },
   { n: 'Álvaro Madrid', p: 'M', min: 29, r: 6.8, to: 18, pt: 12, pa: 11, lt: 2, la: 1, dt: 1, da: 1, tk: 1, it: 1, dw: 2, dl: 2, fc: 2, pl: 1, sh: 1, km: 3.75, sp: 5, ts: 28.5 },
   { n: 'Francisco Marchant', p: 'M', min: 20, r: 6.9, to: 22, pt: 10, pa: 5, ct: 5, ca: 1, dt: 3, da: 1, kp: 1, it: 1, re: 2, dw: 2, dl: 2, fr: 1, pl: 11, km: 2.65, sp: 7, ts: 33.7 },
   { n: 'Leandro Hernández', p: 'F', min: 20, r: 7.7, to: 9, pt: 5, pa: 5, kp: 2, tk: 1, re: 2, dw: 3, dl: 1, fc: 1, fr: 1, pl: 0, as: 1, sh: 2, km: 3.22, sp: 12, ts: 30.9 },
   { n: 'Yastin Cuevas', p: 'F', min: 11, r: 7.4, to: 9, pt: 4, pa: 3, re: 1, pl: 1, g: 1, sh: 4, km: 2.04, sp: 9, ts: 28.9 }
  ],
  rv: [
   { n: 'Ignacio González', p: 'G', min: 90, r: 8.0, to: 42, pt: 28, pa: 14, lt: 17, la: 3, cl: 3, re: 9, dw: 1, pl: 14, sv: 6 },
   { n: 'Vicente Vega', p: 'D', min: 75, r: 6.7, to: 47, pt: 33, pa: 28, lt: 4, la: 1, ct: 2, dt: 1, da: 1, cl: 3, re: 2, dw: 3, dl: 6, fc: 1, fr: 1, pl: 9, km: 8.09, sp: 8, ts: 29.6 },
   { n: 'Ramiro González', p: 'D', min: 90, r: 7.0, to: 54, pt: 41, pa: 33, lt: 11, la: 7, kp: 1, tk: 1, it: 1, cl: 6, bl: 2, re: 5, dw: 3, dl: 4, pl: 10, km: 10.01, sp: 12, ts: 29.5 },
   { n: 'Valentín Vidal', p: 'D', min: 90, r: 6.4, to: 28, pt: 21, pa: 18, lt: 4, la: 4, kp: 1, tk: 1, cl: 3, bl: 1, re: 3, dw: 2, dl: 2, pl: 4, km: 8.97, sp: 14, ts: 30.4 },
   { n: 'Vicente Fernández', p: 'D', min: 90, r: 6.8, to: 56, pt: 36, pa: 27, lt: 4, la: 1, ct: 2, dt: 1, da: 1, it: 1, cl: 4, re: 5, dw: 4, dl: 2, fc: 1, fr: 1, pl: 12, sh: 2, km: 10.69, sp: 20, ts: 31.3 },
   { n: 'Cristopher Barrera', p: 'M', min: 90, r: 6.0, to: 50, pt: 39, pa: 31, lt: 5, la: 2, ct: 1, dt: 2, tk: 2, cl: 1, re: 5, dw: 2, dl: 4, fc: 4, pl: 15, km: 10.5, sp: 21, ts: 30.5 },
   { n: 'Joaquín Moya', p: 'M', min: 90, r: 7.8, to: 69, pt: 47, pa: 42, lt: 5, la: 5, dt: 3, da: 1, tk: 5, it: 3, cl: 1, bl: 4, re: 10, dw: 9, dl: 5, fr: 2, pl: 10, km: 9.7, sp: 9, ts: 28.9 },
   { n: 'Nicolás Baeza', p: 'M', min: 57, r: 6.8, to: 25, pt: 17, pa: 10, lt: 4, la: 1, ct: 3, dt: 1, da: 1, kp: 1, it: 1, re: 5, dw: 2, fr: 1, pl: 11, km: 6.61, sp: 17, ts: 31.5 },
   { n: 'Alan Medina', p: 'M', min: 57, r: 6.8, to: 33, pt: 16, pa: 14, ct: 1, dt: 3, da: 1, kp: 1, cl: 1, re: 3, dw: 5, dl: 7, fc: 1, fr: 2, pl: 10, sh: 1 },
   { n: 'Cristian Palacios', p: 'F', min: 74, r: 6.1, to: 20, pt: 11, pa: 4, ct: 1, dw: 3, dl: 5, pl: 11, sh: 3 },
   { n: 'Julián Alfaro', p: 'F', min: 70, r: 6.5, to: 44, pt: 23, pa: 19, lt: 1, la: 1, ct: 4, ca: 2, dt: 2, da: 2, kp: 3, re: 2, dw: 5, dl: 5, fc: 1, fr: 2, pl: 15, sh: 1, km: 7.25, sp: 18, ts: 31.7 },
   { n: 'Emiliano Ramos', p: 'F', min: 33, r: 6.5, to: 19, pt: 7, pa: 6, ct: 1, it: 1, re: 1, dw: 4, dl: 3, fr: 4, pl: 5, sh: 2, km: 3.94, sp: 5, ts: 29.0 },
   { n: 'Dieter Villalpando', p: 'M', min: 33, r: 6.5, to: 22, pt: 12, pa: 10, lt: 1, ct: 1, dt: 1, tk: 1, re: 3, dw: 3, dl: 2, fr: 2, pl: 6, sh: 1, km: 4.24, sp: 9, ts: 31.1 },
   { n: 'Byron Navarro', p: 'D', min: 20, r: 6.4, to: 11, pt: 6, pa: 5, lt: 1, cl: 2, bl: 1, re: 1, dl: 2, pl: 3, km: 2.76, sp: 8, ts: 31.5 },
   { n: 'Braian Martínez', p: 'F', min: 16, r: 5.9, to: 16, pt: 11, pa: 6, lt: 1, la: 1, ct: 1, dl: 2, pl: 8, km: 2.45, sp: 5, ts: 28.6 },
   { n: 'Martín Guzmán', p: 'D', min: 15, r: 6.3, to: 19, pt: 10, pa: 8, lt: 1, la: 1, kp: 1, tk: 2, dw: 2, pl: 3 }
  ]
 },
 "1": {
  eventId: 15352965, ccEs: 'away',
  cc: [
   { n: 'Fernando de Paul', p: 'G', min: 90, r: 6.3, to: 29, pt: 19, pa: 15, lt: 5, la: 1, cl: 1, re: 8, dl: 1, pl: 4, sv: 1 },
   { n: 'Matías Fernández', p: 'D', min: 66, r: 6.4, to: 56, pt: 38, pa: 32, lt: 2, la: 1, ct: 2, kp: 3, tk: 2, cl: 1, re: 4, dw: 3, dl: 1, fr: 1, pl: 11 },
   { n: 'Jonathan Villagra', p: 'D', min: 90, r: 6.4, to: 66, pt: 60, pa: 56, lt: 4, la: 3, ct: 1, dt: 1, da: 1, tk: 1, cl: 3, re: 3, dw: 3, dl: 3, pl: 5 },
   { n: 'Joaquín Sosa', p: 'D', min: 90, r: 6.0, to: 85, pt: 67, pa: 61, lt: 5, la: 3, tk: 3, it: 1, cl: 2, re: 3, dw: 4, dl: 5, pl: 8, sh: 1 },
   { n: 'Erick Wiemberg', p: 'D', min: 75, r: 6.5, to: 76, pt: 47, pa: 38, lt: 2, la: 2, ct: 1, dt: 2, da: 2, kp: 2, tk: 2, it: 1, cl: 3, re: 5, dw: 7, dl: 2, pl: 14, sh: 2 },
   { n: 'Arturo Vidal', p: 'M', min: 90, r: 7.5, to: 120, pt: 103, pa: 90, lt: 14, la: 10, tk: 3, it: 5, re: 7, dw: 6, dl: 4, fc: 2, pl: 13, sh: 2 },
   { n: 'Tomás Alarcón', p: 'M', min: 90, r: 6.8, to: 94, pt: 75, pa: 62, lt: 8, la: 2, ct: 4, ca: 1, kp: 1, tk: 1, it: 4, cl: 1, bl: 1, re: 3, dw: 3, dl: 9, fc: 1, fr: 1, pl: 19, sh: 1 },
   { n: 'Víctor Felipe Méndez', p: 'M', min: 90, r: 7.4, to: 109, pt: 93, pa: 86, lt: 4, la: 3, ct: 1, dt: 5, da: 4, kp: 3, tk: 3, re: 11, dw: 7, dl: 2, pl: 12, sh: 3 },
   { n: 'Leandro Hernández', p: 'M', min: 45, r: 5.9, to: 37, pt: 26, pa: 24, lt: 1, la: 1, ct: 1, dt: 3, da: 2, kp: 1, tk: 1, re: 2, dw: 3, dl: 3, pl: 8 },
   { n: 'Francisco Marchant', p: 'M', min: 45, r: 6.1, to: 29, pt: 22, pa: 18, ct: 4, ca: 2, tk: 1, dw: 1, pl: 6, sh: 1 },
   { n: 'Maximiliano Romero', p: 'F', min: 90, r: 6.9, to: 26, pt: 17, pa: 12, ct: 1, dt: 1, dw: 1, dl: 2, fc: 1, pl: 9, g: 1, sh: 5 },
   { n: 'Claudio Aquino', p: 'M', min: 45, r: 7.5, to: 56, pt: 49, pa: 39, lt: 4, la: 3, ct: 3, ca: 1, dt: 3, da: 3, kp: 3, re: 2, dw: 3, pl: 12, as: 1 },
   { n: 'Yastin Cuevas', p: 'F', min: 45, r: 6.0, to: 19, pt: 11, pa: 9, dt: 1, tk: 1, re: 1, dw: 1, dl: 2, fc: 1, pl: 6, sh: 3 },
   { n: 'Jeyson Rojas', p: 'D', min: 24, r: 6.8, to: 31, pt: 19, pa: 17, lt: 1, ct: 7, ca: 5, kp: 3, tk: 1, dw: 1, pl: 4 },
   { n: 'Cristian Riquelme', p: 'D', min: 15, r: 6.6, to: 21, pt: 9, pa: 8, lt: 1, la: 1, ct: 4, dt: 1, tk: 2, it: 1, re: 3, dw: 3, dl: 6, fc: 2, pl: 7 }
  ],
  rv: [
   { n: 'Matías Bórquez', p: 'G', min: 90, r: 7.5, to: 45, pt: 35, pa: 15, lt: 34, la: 14, cl: 1, re: 16, dw: 1, pl: 21, sv: 6 },
   { n: 'Augusto Aguirre', p: 'D', min: 90, r: 6.5, to: 18, pt: 10, pa: 7, lt: 2, it: 1, cl: 3, re: 3, pl: 4 },
   { n: 'Alfonso Parot', p: 'D', min: 90, r: 6.9, to: 32, pt: 15, pa: 11, lt: 3, la: 2, tk: 3, it: 1, cl: 9, re: 7, dw: 4, dl: 1, fr: 1, pl: 7 },
   { n: 'Yerko González', p: 'D', min: 90, r: 7.5, to: 49, pt: 23, pa: 19, lt: 3, la: 2, ct: 1, dt: 4, da: 4, kp: 1, tk: 1, it: 1, cl: 6, bl: 2, re: 2, dw: 7, dl: 4, fr: 1, pl: 9, as: 1 },
   { n: 'Marcelo Flores', p: 'M', min: 81, r: 6.3, to: 43, pt: 17, pa: 12, lt: 4, ct: 3, dt: 2, da: 1, it: 3, cl: 3, re: 7, dw: 1, dl: 5, fc: 2, pl: 15 },
   { n: 'Joaquín Montecinos', p: 'M', min: 72, r: 6.7, to: 34, pt: 9, pa: 6, lt: 1, ct: 3, ca: 1, dt: 1, kp: 1, it: 1, cl: 2, bl: 1, dl: 7, pl: 11 },
   { n: 'César Pinares', p: 'M', min: 85, r: 6.6, to: 38, pt: 26, pa: 24, lt: 1, ct: 2, dt: 3, da: 2, kp: 1, it: 1, cl: 1, re: 3, dw: 3, dl: 4, pl: 8 },
   { n: 'Ramón Martínez', p: 'M', min: 90, r: 6.6, to: 44, pt: 26, pa: 22, lt: 5, la: 4, dt: 2, kp: 1, tk: 1, it: 6, cl: 1, re: 3, dw: 3, dl: 6, pl: 7 },
   { n: 'Jean Meneses', p: 'F', min: 85, r: 10, to: 55, pt: 31, pa: 21, lt: 2, la: 1, ct: 2, ca: 1, dt: 4, da: 1, kp: 2, tk: 2, it: 3, cl: 1, re: 11, dw: 6, dl: 5, fr: 2, pl: 17, g: 2, as: 1, sh: 3 },
   { n: 'Gonzalo Sosa', p: 'F', min: 85, r: 6.5, to: 24, pt: 16, pa: 9, lt: 1, it: 1, cl: 1, dw: 8, dl: 4, pl: 10, sh: 1 },
   { n: 'Daniel Castro', p: 'F', min: 90, r: 8.8, to: 49, pt: 31, pa: 23, lt: 3, la: 2, dt: 5, da: 2, kp: 2, tk: 1, it: 1, re: 4, dw: 4, dl: 6, fr: 1, pl: 13, g: 1, as: 1, sh: 4 },
   { n: 'Axel Alfonzo', p: 'D', min: 18, r: 6.2, to: 2, pt: 1, cl: 1, dl: 1, pl: 1 },
   { n: 'Danilo Catalán', p: 'M', min: 9, r: 6.5, to: 5, pt: 2, pa: 2, cl: 1, pl: 1, sh: 1 },
   { n: 'Flavio Moya', p: 'M', min: 12, r: 6.6, to: 4, pt: 3, pa: 1, dw: 1, dl: 1, pl: 3 },
   { n: 'Misael Llantén', p: 'M', min: 13, r: 6.4, to: 4, pt: 1, pa: 1, dt: 2, dl: 2, pl: 2 },
   { n: 'Marcos Arturia', p: 'F', min: 13, r: 6.7, to: 9, pt: 5, pa: 3, tk: 1, dw: 2, fr: 1, pl: 3 }
  ]
 }
};

// API mínima de consulta
(function () {
  window.CC_LINEUPS = {
    de: function (j) { return window.CC_LINEUPS_BUNDLE[String(j)] || null; },
    fechas: function () { return Object.keys(window.CC_LINEUPS_BUNDLE).map(Number).sort(function (a, b) { return a - b; }); },
    jugador: function (j, lado, nombre) {
      var m = this.de(j); if (!m) return null;
      var arr = lado === 'cc' ? m.cc : m.rv;
      for (var i = 0; i < arr.length; i++) if (arr[i].n === nombre) return arr[i];
      return null;
    }
  };
})();
