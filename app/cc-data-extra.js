// ============================================================
// ColoColo Football Center — Datos de gestión 2026
// Plantel oficial (contratos, lesiones, cesiones, cumpleaños),
// captación (escuelas por región) y mercado (ofrecidos / para ofrecer).
// Editable por el admin desde la plataforma; persiste en localStorage.
// ============================================================
window.CC_GESTION = {
 // Detalle contractual y de estado por jugador del plantel (se cruza con CC_DATA.jugadores por nombre)
 "plantel": [
  { "nombre": "Fernando de Paul",    "dorsal": 1,  "nac": "Chile",     "extranjero": false, "contrato": "2027-12-31", "estado": "Lesionado", "lesion": { "tipo": "Lesión isquiotibial", "retorno": "2026-08-10" }, "cesion": null, "representante": "Fair Play Agency", "nacimiento": "1991-04-29" },
  { "nombre": "Fernando de Paul",    "dorsal": 1,  "alias_gk": true },
  { "nombre": "Marcos Bolados",     "dorsal": 11, "nac": "Chile",     "extranjero": false, "contrato": "2026-12-31", "estado": "Lesionado", "lesion": { "tipo": "Rotura de ligamento cruzado", "retorno": "2026-09-20" }, "cesion": null, "representante": "" },
  { "nombre": "Jonathan Villagra",   "dorsal": 2,  "nac": "Chile",     "extranjero": false, "contrato": "2027-12-31", "estado": "Disponible", "cesion": null, "representante": "Tomás Yáñez Mgmt", "nacimiento": "2000-09-14" },
  { "nombre": "Arturo Vidal",        "dorsal": 8,  "nac": "Chile",     "extranjero": false, "contrato": "2026-12-31", "estado": "Disponible", "cesion": null, "representante": "Fenómeno Sports", "nacimiento": "1987-05-22" },
  { "nombre": "Joaquín Sosa",        "dorsal": 4,  "nac": "Uruguay",   "extranjero": true,  "contrato": "2028-12-31", "estado": "Lesionado", "lesion": { "tipo": "Lesión muscular", "retorno": "2026-07-09" }, "cesion": null, "representante": "Paco Casal", "nacimiento": "2004-01-18" },
  { "nombre": "Javier Méndez",       "dorsal": 6,  "nac": "Chile",     "extranjero": false, "contrato": "2026-12-31", "estado": "Disponible", "lesion": null, "cesion": null, "representante": "Sur Fútbol", "nacimiento": "1994-07-03" },
  { "nombre": "Erick Wiemberg",      "dorsal": 3,  "nac": "Chile",     "extranjero": false, "contrato": "2027-12-31", "estado": "Disponible", "cesion": null, "representante": "GestiFute Chile", "nacimiento": "1998-02-26" },
  { "nombre": "Matías Fernández",    "dorsal": 17, "nac": "Chile",     "extranjero": false, "contrato": "2026-12-31", "estado": "Lesionado", "lesion": { "tipo": "Desgarro isquiotibial", "retorno": "2026-07-15" }, "cesion": null, "representante": "MF Sports", "nacimiento": "2001-11-09" },
  { "nombre": "Jeyson Rojas",        "dorsal": 23, "nac": "Chile",     "extranjero": false, "contrato": "2028-12-31", "estado": "Disponible", "cesion": null, "representante": "Promoesport", "nacimiento": "2002-03-12" },
  { "nombre": "Diego Ulloa",         "dorsal": 21, "nac": "Chile",     "extranjero": false, "contrato": "2027-12-31", "estado": "Disponible", "cesion": null, "representante": "Sur Fútbol", "nacimiento": "2003-06-25" },
  { "nombre": "Cristián Riquelme",   "dorsal": 28, "nac": "Chile",     "extranjero": false, "contrato": "2026-12-31", "estado": "Cedido", "cesion": { "tipo": "Cedido a", "club": "Deportes Limache", "hasta": "2026-12-31", "direccion": "sale" }, "representante": "Pro Agency", "nacimiento": "2004-05-30" },
  { "nombre": "Tomás Alarcón",       "dorsal": 5,  "nac": "Chile",     "extranjero": false, "contrato": "2027-12-31", "estado": "Disponible", "cesion": null, "representante": "You First Sports", "nacimiento": "1999-04-16" },
  { "nombre": "Víctor Méndez",       "dorsal": 20, "nac": "Chile",     "extranjero": false, "contrato": "2027-12-31", "estado": "Disponible", "cesion": null, "representante": "You First Sports", "nacimiento": "1998-07-04" },
  { "nombre": "Á. Madrid",           "dorsal": 14, "nac": "Chile",     "extranjero": false, "contrato": "2026-12-31", "estado": "Disponible", "cesion": null, "representante": "Sur Fútbol", "nacimiento": "1994-08-22" },
  { "nombre": "Claudio Aquino",      "dorsal": 10, "nac": "Argentina", "extranjero": true,  "contrato": "2028-12-31", "estado": "Disponible", "cesion": null, "representante": "Daniel Bolotnicoff", "nacimiento": "1991-09-12" },
  { "nombre": "L. Pastrán",          "dorsal": 26, "nac": "Chile",     "extranjero": false, "contrato": "2027-12-31", "estado": "Disponible", "cesion": null, "representante": "Promoesport", "nacimiento": "2002-10-08" },
  { "nombre": "Leandro Hernández",   "dorsal": 30, "nac": "Chile",     "extranjero": false, "contrato": "2028-12-31", "estado": "Disponible", "cesion": null, "representante": "Sur Fútbol", "nacimiento": "2005-02-19" },
  { "nombre": "Francisco Marchant",  "dorsal": 32, "nac": "Chile",     "extranjero": false, "contrato": "2027-12-31", "estado": "Disponible", "cesion": null, "representante": "You First Sports", "nacimiento": "2006-01-27" },
  { "nombre": "Maximiliano Romero",  "dorsal": 9,  "nac": "Argentina", "extranjero": true,  "contrato": "2027-12-31", "estado": "Disponible", "cesion": null, "representante": "GR Sports", "nacimiento": "1999-01-09" },
  { "nombre": "Javier Correa",       "dorsal": 19, "nac": "Argentina", "extranjero": true,  "contrato": "2026-12-31", "estado": "Disponible", "cesion": null, "representante": "Uno Sports", "nacimiento": "1992-11-09" }
 ],

 // Escuelas de fútbol oficiales de Colo-Colo, agrupadas por región (sigla del mapa)
 "escuelas": {
  "RM": [
   { "ciudad": "Macul (Casa Matriz)", "encargado": "Rodrigo Meléndez",   "ninos": 320, "categorias": "2009–2018" },
   { "ciudad": "Maipú",               "encargado": "Cristián Muñoz",     "ninos": 180, "categorias": "2010–2017" },
   { "ciudad": "Puente Alto",         "encargado": "Daniela Pizarro",    "ninos": 165, "categorias": "2010–2018" },
   { "ciudad": "La Florida",          "encargado": "Marcelo Espinoza",   "ninos": 140, "categorias": "2011–2017" }
  ],
  "VA": [
   { "ciudad": "Valparaíso",          "encargado": "Pedro Reyes",        "ninos": 150, "categorias": "2009–2017" },
   { "ciudad": "Viña del Mar",        "encargado": "Karen Soto",         "ninos": 130, "categorias": "2010–2018" },
   { "ciudad": "Quillota",            "encargado": "Luis Fuentes",       "ninos": 95,  "categorias": "2011–2017" }
  ],
  "BI": [
   { "ciudad": "Concepción",          "encargado": "Jaime Vera",         "ninos": 175, "categorias": "2009–2017" },
   { "ciudad": "Los Ángeles",         "encargado": "Felipe Cáceres",     "ninos": 110, "categorias": "2011–2018" }
  ],
  "AN": [
   { "ciudad": "Antofagasta",         "encargado": "Patricio Galaz",     "ninos": 120, "categorias": "2010–2017" },
   { "ciudad": "Calama",              "encargado": "Sergio Vega",        "ninos": 85,  "categorias": "2011–2018" }
  ],
  "CO": [
   { "ciudad": "La Serena",           "encargado": "Mauricio Donoso",    "ninos": 105, "categorias": "2010–2017" },
   { "ciudad": "Coquimbo",            "encargado": "Andrea Rojas",       "ninos": 90,  "categorias": "2011–2018" }
  ],
  "ML": [
   { "ciudad": "Talca",               "encargado": "Esteban Paredes",    "ninos": 130, "categorias": "2009–2017" },
   { "ciudad": "Curicó",              "encargado": "Nicolás Maturana",   "ninos": 80,  "categorias": "2011–2018" }
  ],
  "AR": [
   { "ciudad": "Temuco",              "encargado": "Moisés Villarroel",  "ninos": 115, "categorias": "2010–2017" }
  ],
  "LL": [
   { "ciudad": "Puerto Montt",        "encargado": "Gonzalo Barría",     "ninos": 75,  "categorias": "2011–2018" },
   { "ciudad": "Osorno",              "encargado": "Camila Ruiz",        "ninos": 70,  "categorias": "2012–2018" }
  ],
  "AP": [
   { "ciudad": "Arica",               "encargado": "Hugo Tabilo",        "ninos": 65,  "categorias": "2011–2018" }
  ],
  "TA": [
   { "ciudad": "Iquique",             "encargado": "Víctor Cáceres",     "ninos": 70,  "categorias": "2011–2018" }
  ],
  "LI": [
   { "ciudad": "Rancagua",            "encargado": "Manuel Iturra",      "ninos": 100, "categorias": "2010–2017" }
  ],
  "NB": [
   { "ciudad": "Chillán",             "encargado": "Rodrigo Tello",      "ninos": 85,  "categorias": "2011–2018" }
  ],
  "LR": [
   { "ciudad": "Valdivia",            "encargado": "Ignacio Saavedra",   "ninos": 60,  "categorias": "2012–2018" }
  ],
  "MA": [
   { "ciudad": "Punta Arenas",        "encargado": "Óscar Wirth",        "ninos": 55,  "categorias": "2012–2018" }
  ]
 },

 // Mercado — jugadores que ofrecen a Colo-Colo (entrantes)
 "ofrecidos": [
  { "jugador": "Bruno Cabrera",   "club": "Defensa y Justicia (ARG)", "posicion": "CB",  "edad": 24, "nac": "Argentina", "tipo": "Transferencia", "valor": 1800000, "agente": "Daniel Bolotnicoff", "estado": "En análisis", "nota": "Zaguero zurdo, buen juego aéreo. Pide 3 años." },
  { "jugador": "Mathías Ferreira","club": "Liverpool (URU)",          "posicion": "RW",  "edad": 21, "nac": "Uruguay",   "tipo": "Cesión",         "valor": 0,       "agente": "Paco Casal",        "estado": "Prioridad",  "nota": "Cesión con opción de compra de US$2.5M." },
  { "jugador": "Tomás Conechny",  "club": "Portland Timbers (USA)",   "posicion": "AMF", "edad": 27, "nac": "Argentina", "tipo": "Transferencia", "valor": 1200000, "agente": "You First",         "estado": "Descartado", "nota": "Salario fuera de presupuesto." },
  { "jugador": "Diego Coelho",    "club": "Coritiba (BRA)",           "posicion": "CF",  "edad": 23, "nac": "Brasil",    "tipo": "Cesión",         "valor": 0,       "agente": "TFM Agency",        "estado": "En análisis", "nota": "9 de área, 11 goles en Serie B." }
 ],

 // Mercado — jugadores propios que Colo-Colo ofrece (salientes)
 "paraOfrecer": [
  { "jugador": "Matías Fernández",   "posicion": "RB", "edad": 24, "tipo": "Cesión",         "motivo": "Falta de minutos", "interesados": "Deportes Iquique, Cobreloa", "estado": "Negociando" },
  { "jugador": "Javier Correa",      "posicion": "CF", "edad": 33, "tipo": "Transferencia", "motivo": "Fin de ciclo",     "interesados": "Estudiantes (ARG)",          "estado": "Ofrecido" },
  { "jugador": "Cristián Riquelme",  "posicion": "LB", "edad": 22, "tipo": "Cesión",         "motivo": "Proyección",       "interesados": "Deportes Limache",           "estado": "Cerrado" }
 ]
};

// Limpieza: quitar la entrada duplicada placeholder del arquero
window.CC_GESTION.plantel = window.CC_GESTION.plantel.filter(function (p) { return !p.alias_gk; });

// ============================================================
// Migración única: refleja el estado REAL (lesiones y castigos
// publicados en los partidos descargados) sobre el plantel ya
// editado en este navegador (cc_plantel_v1) y el registro de
// Dirección Técnica. Corre una sola vez por dispositivo.
// ============================================================
(function () {
  var FLAG = 'cc_real_estado_v2';
  try {
    if (localStorage.getItem(FLAG)) return;
    var raw = localStorage.getItem('cc_plantel_v1');
    if (raw) {
      var ed = JSON.parse(raw);
      if (Array.isArray(ed)) {
        var setp = function (nombre, patch) {
          for (var i = 0; i < ed.length; i++) {
            if (ed[i] && ed[i].nombre === nombre && !ed[i].alias_gk) { Object.assign(ed[i], patch); return true; }
          }
          return false;
        };
        setp('Fernando de Paul', { estado: 'Lesionado', lesion: { tipo: 'Lesión isquiotibial', retorno: '2026-08-10' }, cesion: null });
        setp('Joaquín Sosa', { estado: 'Lesionado', lesion: { tipo: 'Lesión muscular', retorno: '2026-07-09' }, cesion: null });
        setp('Javier Méndez', { estado: 'Disponible', lesion: null, cesion: null });
        var tiene = false;
        for (var k = 0; k < ed.length; k++) { if (ed[k] && ed[k].nombre === 'Marcos Bolados') tiene = true; }
        if (!tiene) ed.push({ nombre: 'Marcos Bolados', dorsal: 11, nac: 'Chile', extranjero: false, contrato: '2026-12-31', estado: 'Lesionado', lesion: { tipo: 'Rotura de ligamento cruzado', retorno: '2026-09-20' }, cesion: null, representante: '' });
        localStorage.setItem('cc_plantel_v1', JSON.stringify(ed));
      }
    }
    var dt = {};
    try { dt = JSON.parse(localStorage.getItem('cc_dt_v1') || '{}') || {}; } catch (e) { dt = {}; }
    dt.jug = dt.jug || {};
    dt.jug['Javier Méndez'] = Object.assign({}, dt.jug['Javier Méndez'] || {}, { susp: true, suspNota: 'Cargo del Tribunal de Disciplina · hasta 26-07-2026' });
    localStorage.setItem('cc_dt_v1', JSON.stringify(dt));
    localStorage.setItem(FLAG, '1');
  } catch (e) {}
})();
