// ============================================================
// ColoColo Football Center — Campograma profesional
// Pizarra táctica: 11 titulares arrastrables (intercambio), banca,
// cambio de esquema propio y del rival, recomendaciones tácticas
// por enfrentamiento de esquemas, y exportación a JPG.
// ============================================================
/* global React, CC_DATA, Icon, Card, PageHeader, Select, CCTeamLogo */

const { useState: cgState, useRef: cgRef } = React;

// --- Esquemas: posiciones en cancha vertical (x 0-100, y 0-100; arco propio abajo) ---
const CG_FORMACIONES = {
  '4-3-3': [
    { p: 'POR', x: 50, y: 92 },
    { p: 'LI', x: 16, y: 70 }, { p: 'DFC', x: 38, y: 74 }, { p: 'DFC', x: 62, y: 74 }, { p: 'LD', x: 84, y: 70 },
    { p: 'MC', x: 30, y: 50 }, { p: 'MC', x: 50, y: 54 }, { p: 'MC', x: 70, y: 50 },
    { p: 'EI', x: 20, y: 26 }, { p: 'DC', x: 50, y: 20 }, { p: 'ED', x: 80, y: 26 }
  ],
  '4-4-2': [
    { p: 'POR', x: 50, y: 92 },
    { p: 'LI', x: 16, y: 70 }, { p: 'DFC', x: 38, y: 74 }, { p: 'DFC', x: 62, y: 74 }, { p: 'LD', x: 84, y: 70 },
    { p: 'MI', x: 18, y: 48 }, { p: 'MC', x: 40, y: 52 }, { p: 'MC', x: 60, y: 52 }, { p: 'MD', x: 82, y: 48 },
    { p: 'DC', x: 38, y: 22 }, { p: 'DC', x: 62, y: 22 }
  ],
  '4-2-3-1': [
    { p: 'POR', x: 50, y: 92 },
    { p: 'LI', x: 16, y: 70 }, { p: 'DFC', x: 38, y: 74 }, { p: 'DFC', x: 62, y: 74 }, { p: 'LD', x: 84, y: 70 },
    { p: 'MCD', x: 38, y: 58 }, { p: 'MCD', x: 62, y: 58 },
    { p: 'MP', x: 20, y: 38 }, { p: 'MCO', x: 50, y: 36 }, { p: 'MP', x: 80, y: 38 },
    { p: 'DC', x: 50, y: 18 }
  ],
  '3-5-2': [
    { p: 'POR', x: 50, y: 92 },
    { p: 'DFC', x: 30, y: 76 }, { p: 'DFC', x: 50, y: 78 }, { p: 'DFC', x: 70, y: 76 },
    { p: 'CI', x: 12, y: 50 }, { p: 'MC', x: 38, y: 54 }, { p: 'MC', x: 50, y: 58 }, { p: 'MC', x: 62, y: 54 }, { p: 'CD', x: 88, y: 50 },
    { p: 'DC', x: 38, y: 22 }, { p: 'DC', x: 62, y: 22 }
  ],
  '3-4-3': [
    { p: 'POR', x: 50, y: 92 },
    { p: 'DFC', x: 30, y: 76 }, { p: 'DFC', x: 50, y: 78 }, { p: 'DFC', x: 70, y: 76 },
    { p: 'CI', x: 14, y: 52 }, { p: 'MC', x: 40, y: 54 }, { p: 'MC', x: 60, y: 54 }, { p: 'CD', x: 86, y: 52 },
    { p: 'EI', x: 22, y: 26 }, { p: 'DC', x: 50, y: 20 }, { p: 'ED', x: 78, y: 26 }
  ],
  '5-3-2': [
    { p: 'POR', x: 50, y: 92 },
    { p: 'CI', x: 12, y: 66 }, { p: 'DFC', x: 32, y: 76 }, { p: 'DFC', x: 50, y: 78 }, { p: 'DFC', x: 68, y: 76 }, { p: 'CD', x: 88, y: 66 },
    { p: 'MC', x: 32, y: 50 }, { p: 'MC', x: 50, y: 54 }, { p: 'MC', x: 68, y: 50 },
    { p: 'DC', x: 38, y: 24 }, { p: 'DC', x: 62, y: 24 }
  ],
  '4-1-4-1': [
    { p: 'POR', x: 50, y: 92 },
    { p: 'LI', x: 16, y: 70 }, { p: 'DFC', x: 38, y: 74 }, { p: 'DFC', x: 62, y: 74 }, { p: 'LD', x: 84, y: 70 },
    { p: 'MCD', x: 50, y: 58 },
    { p: 'MI', x: 18, y: 42 }, { p: 'MC', x: 40, y: 44 }, { p: 'MC', x: 60, y: 44 }, { p: 'MD', x: 82, y: 42 },
    { p: 'DC', x: 50, y: 20 }
  ],
  '4-3-1-2': [
    { p: 'POR', x: 50, y: 92 },
    { p: 'LI', x: 16, y: 70 }, { p: 'DFC', x: 38, y: 74 }, { p: 'DFC', x: 62, y: 74 }, { p: 'LD', x: 84, y: 70 },
    { p: 'MC', x: 28, y: 52 }, { p: 'MC', x: 50, y: 56 }, { p: 'MC', x: 72, y: 52 },
    { p: 'MCO', x: 50, y: 38 },
    { p: 'DC', x: 38, y: 20 }, { p: 'DC', x: 62, y: 20 }
  ]
};

// Perfil táctico de cada esquema (para las recomendaciones)
const CG_PERFIL = {
  '4-3-3': { def: 4, med: 3, del: 3, linea: 4, ancho: 'alto', notas: 'Presión alta y amplitud con extremos abiertos.' },
  '4-4-2': { def: 4, med: 4, del: 2, linea: 4, ancho: 'medio', notas: 'Dos líneas de 4 compactas; fuerte en segundas jugadas.' },
  '4-2-3-1': { def: 4, med: 5, del: 1, linea: 4, ancho: 'medio', notas: 'Doble pivote y un enganche; equilibrio defensa-ataque.' },
  '3-5-2': { def: 3, med: 5, del: 2, linea: 3, ancho: 'carrileros', notas: 'Superioridad en el medio; depende de los carrileros.' },
  '3-4-3': { def: 3, med: 4, del: 3, linea: 3, ancho: 'alto', notas: 'Muy ofensivo; arriesga en defensa con línea de 3.' },
  '5-3-2': { def: 5, med: 3, del: 2, linea: 5, ancho: 'carrileros', notas: 'Bloque bajo replegado; peligroso a la contra.' },
  '4-1-4-1': { def: 4, med: 5, del: 1, linea: 4, ancho: 'medio', notas: 'Mediocentro defensivo protege; bloque medio sólido.' },
  '4-3-1-2': { def: 4, med: 4, del: 2, linea: 4, ancho: 'bajo', notas: 'Juego interior con enganche; débil en amplitud.' }
};

// Recomendaciones tácticas: nuestro esquema vs el del rival
function cgRecomendaciones(nuestro, rival) {
  const a = CG_PERFIL[nuestro], b = CG_PERFIL[rival];
  const op = [], de = [];
  if (!a || !b) return { op, de };

  // Medio campo
  if (a.med > b.med) op.push('Superioridad numérica en el mediocampo (' + a.med + ' vs ' + b.med + '): prioriza la posesión y juega entre líneas para fijar a sus volantes.');
  else if (a.med < b.med) de.push('Inferioridad en el medio (' + a.med + ' vs ' + b.med + '): el rival puede dominar la posesión central. Cubre con un pivote y básculas rápidas.');
  else op.push('Mediocampo parejo (' + a.med + ' vs ' + b.med + '): la transición y la intensidad en la recuperación definirán quién manda en el centro.');

  // Línea defensiva del rival
  if (b.linea === 3) op.push('El rival defiende con línea de 3: deja las bandas con menos cobertura. Ataca con amplitud (extremos abiertos + laterales profundos) para generar 2v1.');
  if (b.linea === 5) { op.push('Rival con línea de 5 replegada: tendrá poca salida. Domina el balón, usa centros laterales y remates de segunda línea.'); de.push('Difícil encontrar espacios entre líneas: paciencia, circulación rápida y evita perder el balón para no exponerte a su contra.'); }

  // Delanteros del rival vs nuestros centrales
  if (b.del >= 2 && a.def <= 4 && (a.linea === 4 || a.linea === 3)) de.push('El rival ataca con ' + b.del + ' puntas: tus centrales quedan en duelo directo. Asegura coberturas y vigila los pases a la espalda.');
  if (b.del === 1) op.push('El rival juega con un solo punta: puedes liberar a un central para salir jugando o sumar un hombre al mediocampo.');

  // Amplitud propia
  if (a.ancho === 'alto') op.push('Tu esquema da amplitud natural: estira al rival con los extremos y ataca los pasillos interiores que se abren.');
  if (a.ancho === 'carrileros') { op.push('Tus carrileros son clave para dar anchura: que ataquen la espalda de los laterales rivales.'); de.push('Si tus carrileros suben, cuidado con las contras por las bandas: exige repliegue de los volantes.'); }
  if (a.ancho === 'bajo') de.push('Tu esquema es estrecho: te puede faltar amplitud. Compénsalo con laterales muy profundos.');

  // Bloque rival a la contra
  if (rival === '5-3-2' || rival === '4-1-4-1') de.push('El rival está armado para defender y salir a la contra: maneja los tiempos, no te desordenes y deja un hombre de equilibrio atrás.');
  if (nuestro === '4-2-3-1' || nuestro === '4-1-4-1') op.push('Tu doble pivote / MCD te da equilibrio para arriesgar con los laterales sin desproteger la zaga.');

  return { op, de };
}

window.CG_FORMACIONES = CG_FORMACIONES;
window.cgRecomendaciones = cgRecomendaciones;
