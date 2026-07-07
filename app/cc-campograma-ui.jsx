// ============================================================
// ColoColo Football Center — Campograma profesional (UI)
// ============================================================
/* global React, CC_DATA, Icon, Card, PageHeader, Select, CCTeamLogo, CG_FORMACIONES, cgRecomendaciones */

const { useState: cguState, useRef: cguRef } = React;

function cgApellido(n) { const p = (n || '').split(' '); return p.length > 1 ? p[p.length - 1] : n; }
const CG_GRUPO_ORDEN = { 'Arquero': 0, 'Defensa': 1, 'Lateral': 1, 'Mediocampista': 2, 'Volante': 2, 'Pivote': 2, 'Extremo': 3, 'Delantero': 4 };
function cgOrden(j) {
  if (j.grupo != null && CG_GRUPO_ORDEN[j.grupo] != null) return CG_GRUPO_ORDEN[j.grupo];
  const p = (j.posicion || '').toUpperCase();
  if (/GK|POR/.test(p)) return 0;
  if (/CB|DF|LB|RB|LWB|RWB|WB/.test(p)) return 1;
  if (/DMF|CMF|MF|AMF|MC/.test(p)) return 2;
  if (/W|EXT/.test(p)) return 3;
  if (/CF|ST|FW|DC/.test(p)) return 4;
  return 5;
}

// Cancha de fútbol vertical con líneas reglamentarias (viewBox 68x100)
function CgCancha() {
  const L = { fill: 'none', stroke: 'rgba(255,255,255,0.55)', strokeWidth: 0.4 };
  return (
    <svg className="cc-cg-lines" viewBox="0 0 68 100" preserveAspectRatio="none">
      <rect x="1.5" y="1.5" width="65" height="97" {...L}></rect>
      <line x1="1.5" y1="50" x2="66.5" y2="50" {...L}></line>
      <circle cx="34" cy="50" r="9.15" {...L}></circle>
      <circle cx="34" cy="50" r="0.5" fill="rgba(255,255,255,0.55)" stroke="none"></circle>
      {/* arco propio (abajo) */}
      <rect x="13.85" y="81.5" width="40.3" height="16.5" {...L}></rect>
      <rect x="24.84" y="92.5" width="18.32" height="5.5" {...L}></rect>
      <circle cx="34" cy="87" r="0.5" fill="rgba(255,255,255,0.55)" stroke="none"></circle>
      <path d="M 26.7 81.5 A 9.15 9.15 0 0 1 41.3 81.5" {...L}></path>
      <rect x="30" y="98" width="8" height="1.4" {...L}></rect>
      {/* arco rival (arriba) */}
      <rect x="13.85" y="1.5" width="40.3" height="16.5" {...L}></rect>
      <rect x="24.84" y="1.5" width="18.32" height="5.5" {...L}></rect>
      <circle cx="34" cy="13" r="0.5" fill="rgba(255,255,255,0.55)" stroke="none"></circle>
      <path d="M 26.7 18 A 9.15 9.15 0 0 0 41.3 18" {...L}></path>
      <rect x="30" y="-0.4" width="8" height="1.4" {...L}></rect>
    </svg>
  );
}

function PageCampograma() {
  // Base: jugadores de Colo-Colo en los datos Wyscout + cualquiera que el
  // admin haya agregado en Gestión de Jugadores (cc_plantel_v1). Así el
  // plantel del campograma queda sincronizado con Gestión, sin inventar nadie.
  const plantel = (() => {
    const base = CC_DATA.jugadores.filter(j => j.equipo === 'Colo-Colo');
    const byName = {};
    base.forEach(j => { byName[j.nombre] = j; });
    try {
      const ed = JSON.parse(localStorage.getItem('cc_plantel_v1'));
      if (Array.isArray(ed)) ed.forEach(p => {
        if (p && p.nombre && !byName[p.nombre]) {
          byName[p.nombre] = { nombre: p.nombre, equipo: 'Colo-Colo', posicion: p.posicionStat || p.posicion || '', grupo: p.grupo || '', min: 0, pj: 0 };
        }
      });
    } catch (e) {}
    return Object.values(byName).sort((a, b) => (b.min || 0) - (a.min || 0));
  })();
  const onceInicial = () => {
    const arqueros = plantel.filter(j => cgOrden(j) === 0);
    const resto = plantel.filter(j => cgOrden(j) !== 0);
    const gk = arqueros[0] || plantel[0];
    const campo = resto.slice(0, 10);
    return [gk, ...campo].filter(Boolean).map(j => j.nombre);
  };
  // La pizarra arranca VACÍA (11 posiciones sin jugador); se llena arrastrando.
  const onceVacio = () => [null, null, null, null, null, null, null, null, null, null, null];
  const [formacion, setFormacion] = cguState('4-3-3');
  const [rivalForm, setRivalForm] = cguState('4-4-2');
  const [rival, setRival] = cguState('');
  const [rivalTitulares, setRivalTitulares] = cguState({}); // { idx: nombre } desde la banca visitante
  const [titulares, setTitulares] = cguState(onceVacio);
  const [drag, setDrag] = cguState(null);
  const [planTick, setPlanTick] = cguState(0);
  const pitchRef = cguRef(null);
  const [dtTick, setDtTick] = cguState(0);
  React.useEffect(() => {
    const f = () => setDtTick(t => t + 1);
    window.addEventListener('cc-dt-change', f);
    return () => window.removeEventListener('cc-dt-change', f);
  }, []);
  const dtDe = n => { try { return window.CC_DT ? CC_DT.estadoDe(n) : null; } catch (e) { return null; } };

  // --- alineaciones guardadas (presets) ---
  const [presets, setPresets] = cguState(() => { try { return JSON.parse(localStorage.getItem('cc_cg_presets_v1')) || []; } catch (e) { return []; } });
  const [presetSel, setPresetSel] = cguState('');
  const guardarPresets = l => { setPresets(l); try { localStorage.setItem('cc_cg_presets_v1', JSON.stringify(l)); } catch (e) {} };
  const guardarPreset = () => {
    const nombre = window.prompt('Nombre de la alineación (ej. «Titular vs U de Chile»)');
    if (!nombre || !nombre.trim()) return;
    const p = { nombre: nombre.trim(), formacion, titulares, rival, rivalForm, rivalTitulares };
    guardarPresets([p, ...presets.filter(x => x.nombre !== p.nombre)]);
    setPresetSel(p.nombre);
  };
  const cargarPreset = nombre => {
    const p = presets.find(x => x.nombre === nombre);
    if (!p) return;
    if (p.formacion) setFormacion(p.formacion);
    setTitulares(p.titulares || []);
    setRival(p.rival || '');
    if (p.rivalForm) setRivalForm(p.rivalForm);
    setRivalTitulares(p.rivalTitulares || {});
  };
  const borrarPreset = nombre => { if (nombre && window.confirm('¿Eliminar la alineación «' + nombre + '»?')) { guardarPresets(presets.filter(x => x.nombre !== nombre)); setPresetSel(''); } };

  // Ambas formaciones cubren TODO el campo: local ataca hacia arriba
  // (su arco abajo), rival ataca hacia abajo (su arco arriba).
  const yLocal = sy => sy;
  const yRival = sy => 100 - sy;

  const slots = CG_FORMACIONES[formacion] || [];
  const slotsRival = CG_FORMACIONES[rivalForm] || [];
  const enCancha = new Set(titulares);
  const banca = plantel.filter(j => !enCancha.has(j.nombre)).sort((a, b) => { const d = cgOrden(a) - cgOrden(b); return d !== 0 ? d : (b.min || 0) - (a.min || 0); });
  // Estado del plantel (Gestión de Jugadores): lesionados y cedidos marcados en la banca
  const estadoPlantel = (() => {
    const m = {};
    let lista = [];
    try { lista = JSON.parse(localStorage.getItem('cc_plantel_v1')) || []; } catch (e) {}
    if (!lista.length && window.CC_GESTION) lista = CC_GESTION.plantel || [];
    lista.forEach(p => { if (p && p.nombre && p.estado && p.estado !== 'Disponible') m[p.nombre] = p.estado; });
    return m;
  })();
  const reco = cgRecomendaciones(formacion, rivalForm);
  const equipos = (CC_DATA.equipos || []).map(e => e.nombre);
  // Plantel del rival (si lo tenemos en la base), ordenado por posición
  // Nombres del rival: desde la banca visitante (jugadores de nuestra base
  // de datos para el equipo seleccionado), ordenados por posición.
  const slotsRivalCount = slotsRival.length;
  const plantelRival = rival
    ? CC_DATA.jugadores.filter(j => j.equipo === rival).sort((a, b) => { const d = cgOrden(a) - cgOrden(b); return d !== 0 ? d : (b.min || 0) - (a.min || 0); })
    : [];
  const rivalAsignados = new Set(Object.values(rivalTitulares));
  const bancaVisita = plantelRival.filter(j => !rivalAsignados.has(j.nombre));

  const onDropRivalSlot = idx => e => {
    e.preventDefault();
    const d = drag || (e.dataTransfer && e.dataTransfer.getData('text'));
    if (!d) return;
    setRivalTitulares(prev => {
      const next = Object.assign({}, prev);
      if (d.indexOf('rslot:') === 0) {
        const i = +d.slice(6);
        const tmp = next[idx]; next[idx] = next[i]; if (tmp != null) next[i] = tmp; else delete next[i];  // intercambio
      } else if (d.indexOf('vbanca:') === 0) {
        next[idx] = d.slice(7);                                       // entra desde banca visitante
      }
      return next;
    });
    setDrag(null);
  };
  const onDropVisita = e => {
    e.preventDefault();
    const d = drag || (e.dataTransfer && e.dataTransfer.getData('text'));
    if (d && d.indexOf('rslot:') === 0) {
      const i = +d.slice(6);
      setRivalTitulares(prev => { const next = Object.assign({}, prev); delete next[i]; return next; });
    }
    setDrag(null);
  };

  // --- drag & drop (HTML5) ---
  const onDropSlot = idx => e => {
    e.preventDefault();
    const d = drag || (e.dataTransfer && e.dataTransfer.getData('text'));
    if (!d) return;
    setTitulares(prev => {
      const next = prev.slice();
      if (d.indexOf('slot:') === 0) {
        const i = +d.slice(5);
        const tmp = next[idx]; next[idx] = next[i]; next[i] = tmp;   // intercambio
      } else if (d.indexOf('banca:') === 0) {
        next[idx] = d.slice(6);                                      // entra desde la banca
      }
      return next;
    });
    setDrag(null);
  };
  const onDropBanca = e => {
    e.preventDefault();
    const d = drag || (e.dataTransfer && e.dataTransfer.getData('text'));
    // Arrastrar un TITULAR a la banca → libera ese puesto (el jugador vuelve al plantel)
    if (d && d.indexOf('slot:') === 0) {
      const i = +d.slice(5);
      setTitulares(prev => { const next = prev.slice(); next[i] = null; return next; });
    }
    setDrag(null);
  };

  const jugadorDe = nombre => plantel.find(j => j.nombre === nombre) || { nombre, posicion: '' };

  // --- export JPG (replica todo lo que se ve: ambas formaciones, nombres,
  // rival, esquemas y recomendaciones tácticas) ---
  // Trae una imagen como data URL (evita el taint del canvas con CDNs externas)
  const imgDataUrl = async url => {
    if (!url) return null;
    const proxies = [u => u, u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u), u => 'https://corsproxy.io/?url=' + encodeURIComponent(u)];
    for (const mk of proxies) {
      try {
        const r = await fetch(mk(url));
        if (!r.ok) continue;
        const b = await r.blob();
        const d = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(null); fr.readAsDataURL(b); });
        if (d) return d;
      } catch (e) {}
    }
    return null;
  };
  const exportar = async () => {
    const esc = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const logoUrl = n => { try { return window.CC_LOGOS ? window.CC_LOGOS.teamUrl(n) : null; } catch (e) { return null; } };
    const [logoCC, logoRiv] = await Promise.all([imgDataUrl(logoUrl('Colo-Colo')), rival ? imgDataUrl(logoUrl(rival)) : Promise.resolve(null)]);

    const SC = 2;                       // alta resolución (2x)
    const W = 900, HEAD = 150, PAD = 30;
    const PITCH = 1200;
    // ajuste de línea para las recomendaciones (el SVG no envuelve texto)
    const wrap = (t, max) => {
      const words = (t || '').split(' '); const lines = []; let cur = '';
      words.forEach(w => { const tl = cur ? cur + ' ' + w : w; if (tl.length > max && cur) { lines.push(cur); cur = w; } else cur = tl; });
      if (cur) lines.push(cur); return lines.length ? lines : ['—'];
    };
    const opW = (reco.op.length ? reco.op : ['—']).map(t => wrap(t, 48));
    const deW = (reco.de.length ? reco.de : ['—']).map(t => wrap(t, 48));
    const linesOf = arr => arr.reduce((n, ls) => n + ls.length, 0) + arr.length * 0.35;
    const recoLn = Math.max(linesOf(opW), linesOf(deW), 1);
    const FOOT = rival ? 110 + Math.ceil(recoLn * 26) + 40 : 70;
    const H = HEAD + PITCH + FOOT;
    const FONT = "'Helvetica Neue', Arial, sans-serif";
    // marcas de cancha proporcionales (campo 68 x 105)
    const M = 26, fw = W - 2 * M, fh = PITCH - 2 * M, top = HEAD + M;
    const sx = m => M + (m / 68) * fw;          // ancho
    const sd = m => (m / 105) * fh;             // profundidad
    const py = syp => HEAD + syp / 100 * PITCH;

    let d = '<svg xmlns="http://www.w3.org/2000/svg" width="' + (W * SC) + '" height="' + (H * SC) + '" viewBox="0 0 ' + W + ' ' + H + '">';
    d += '<defs>';
    d += '<linearGradient id="cgHead" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15181f"/><stop offset="1" stop-color="#0b0d12"/></linearGradient>';
    d += '<linearGradient id="cgGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f8a4c"/><stop offset="1" stop-color="#136436"/></linearGradient>';
    d += '<radialGradient id="cgGlow" cx="0.5" cy="0.42" r="0.7"><stop offset="0" stop-color="rgba(255,255,255,0.10)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></radialGradient>';
    d += '<filter id="cgSh" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.45"/></filter>';
    d += '</defs>';

    // fondo
    d += '<rect width="' + W + '" height="' + H + '" fill="#0b0d12"/>';

    // ===== encabezado tipo transmisión =====
    d += '<rect width="' + W + '" height="' + HEAD + '" fill="url(#cgHead)"/>';
    d += '<rect x="0" y="' + (HEAD - 4) + '" width="' + W + '" height="4" fill="#be1622"/>';
    d += '<text x="' + (W / 2) + '" y="34" text-anchor="middle" fill="#8b93a3" font-size="13" letter-spacing="4" font-family="' + FONT + '" font-weight="700">PIZARRA TÁCTICA · COLOCOLO FOOTBALL CENTER</text>';
    const badge = (cx, logo, ring) => {
      let s = '<circle cx="' + cx + '" cy="92" r="34" fill="#fff" filter="url(#cgSh)"/>';
      s += '<circle cx="' + cx + '" cy="92" r="34" fill="none" stroke="' + ring + '" stroke-width="2.5"/>';
      if (logo) s += '<image href="' + logo + '" x="' + (cx - 26) + '" y="66" width="52" height="52" preserveAspectRatio="xMidYMid meet"/>';
      return s;
    };
    // local izquierda
    d += badge(M + 34, logoCC, '#111');
    d += '<text x="' + (M + 80) + '" y="86" fill="#fff" font-size="27" font-family="' + FONT + '" font-weight="800">Colo-Colo</text>';
    d += '<rect x="' + (M + 80) + '" y="98" width="' + (12 + formacion.length * 11) + '" height="24" rx="12" fill="#be1622"/>';
    d += '<text x="' + (M + 92) + '" y="115" fill="#fff" font-size="14" font-family="' + FONT + '" font-weight="700">' + esc(formacion) + '</text>';
    // VS centro
    d += '<text x="' + (W / 2) + '" y="100" text-anchor="middle" fill="#5b6373" font-size="22" font-family="' + FONT + '" font-weight="800">VS</text>';
    // rival derecha
    if (rival) {
      d += badge(W - M - 34, logoRiv, '#be1622');
      d += '<text x="' + (W - M - 80) + '" y="86" text-anchor="end" fill="#fff" font-size="23" font-family="' + FONT + '" font-weight="800">' + esc(rival) + '</text>';
      const fwR = 12 + rivalForm.length * 11;
      d += '<rect x="' + (W - M - 80 - fwR) + '" y="98" width="' + fwR + '" height="24" rx="12" fill="#2a2f3a"/>';
      d += '<text x="' + (W - M - 86) + '" y="115" text-anchor="end" fill="#cfd4dd" font-size="14" font-family="' + FONT + '" font-weight="700">' + esc(rivalForm) + '</text>';
    }

    // ===== cancha =====
    d += '<rect x="0" y="' + HEAD + '" width="' + W + '" height="' + PITCH + '" fill="url(#cgGrass)"/>';
    for (let i = 0; i < 12; i++) { if (i % 2) d += '<rect x="0" y="' + (HEAD + i * PITCH / 12) + '" width="' + W + '" height="' + (PITCH / 12) + '" fill="rgba(255,255,255,0.045)"/>'; }
    d += '<rect x="0" y="' + HEAD + '" width="' + W + '" height="' + PITCH + '" fill="url(#cgGlow)"/>';
    const LW = 2.4, LC = 'rgba(255,255,255,0.85)';
    const L = 'stroke="' + LC + '" stroke-width="' + LW + '" fill="none"';
    const cxF = W / 2;
    // borde + medio + círculo central
    d += '<rect x="' + M + '" y="' + top + '" width="' + fw + '" height="' + fh + '" rx="3" ' + L + '/>';
    d += '<line x1="' + M + '" y1="' + (top + fh / 2) + '" x2="' + (W - M) + '" y2="' + (top + fh / 2) + '" ' + L + '/>';
    d += '<circle cx="' + cxF + '" cy="' + (top + fh / 2) + '" r="' + sx(9.15 + M / fw * 68 - M / fw * 68) + '" ' + L + '/>'.replace(/r="[^"]*"/, 'r="' + (sd(9.15) ) + '"');
    d += '<circle cx="' + cxF + '" cy="' + (top + fh / 2) + '" r="3.2" fill="' + LC + '"/>';
    // áreas: abajo (local) y arriba (rival)
    const paW = (40.3 / 68) * fw, paD = sd(16.5), gaW = (18.32 / 68) * fw, gaD = sd(5.5), pSpot = sd(11), arcR = sd(9.15);
    // abajo
    let gy = top + fh;
    d += '<rect x="' + (cxF - paW / 2) + '" y="' + (gy - paD) + '" width="' + paW + '" height="' + paD + '" ' + L + '/>';
    d += '<rect x="' + (cxF - gaW / 2) + '" y="' + (gy - gaD) + '" width="' + gaW + '" height="' + gaD + '" ' + L + '/>';
    d += '<circle cx="' + cxF + '" cy="' + (gy - pSpot) + '" r="3" fill="' + LC + '"/>';
    d += '<path d="M ' + (cxF - arcR * 0.78) + ' ' + (gy - paD) + ' A ' + arcR + ' ' + arcR + ' 0 0 1 ' + (cxF + arcR * 0.78) + ' ' + (gy - paD) + '" ' + L + '/>';
    d += '<rect x="' + (cxF - 28) + '" y="' + gy + '" width="56" height="7" fill="' + LC + '"/>';
    // arriba
    let ty = top;
    d += '<rect x="' + (cxF - paW / 2) + '" y="' + ty + '" width="' + paW + '" height="' + paD + '" ' + L + '/>';
    d += '<rect x="' + (cxF - gaW / 2) + '" y="' + ty + '" width="' + gaW + '" height="' + gaD + '" ' + L + '/>';
    d += '<circle cx="' + cxF + '" cy="' + (ty + pSpot) + '" r="3" fill="' + LC + '"/>';
    d += '<path d="M ' + (cxF - arcR * 0.78) + ' ' + (ty + paD) + ' A ' + arcR + ' ' + arcR + ' 0 0 0 ' + (cxF + arcR * 0.78) + ' ' + (ty + paD) + '" ' + L + '/>';
    d += '<rect x="' + (cxF - 28) + '" y="' + (ty - 7) + '" width="56" height="7" fill="' + LC + '"/>';
    // córners
    const cr = sd(1);
    [[M, top, 0, 1], [W - M, top, 1, 1], [M, top + fh, 0, 0], [W - M, top + fh, 1, 0]].forEach(c => {
      d += '<path d="M ' + (c[0] + (c[2] ? -cr * 4 : cr * 4)) + ' ' + c[1] + ' A ' + cr * 4 + ' ' + cr * 4 + ' 0 0 ' + (c[2] === c[3] ? 1 : 0) + ' ' + c[0] + ' ' + (c[1] + (c[3] ? cr * 4 : -cr * 4)) + '" ' + L + '/>';
    });

    // ===== fichas =====
    const chip = (cx, cy, txt, arriba, rojo) => {
      const w = 16 + txt.length * 7.6, x = cx - w / 2, y = arriba ? cy - 58 : cy + 34;
      let s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="22" rx="11" fill="' + (rojo ? 'rgba(190,22,34,0.92)' : 'rgba(11,13,18,0.82)') + '" filter="url(#cgSh)"/>';
      s += '<text x="' + cx + '" y="' + (y + 15) + '" text-anchor="middle" fill="#fff" font-size="13" font-family="' + FONT + '" font-weight="700">' + esc(txt) + '</text>';
      return s;
    };
    const token = (cx, cy, pos, fill, ring) => {
      let s = '<circle cx="' + cx + '" cy="' + cy + '" r="22" fill="' + fill + '" stroke="' + ring + '" stroke-width="2.5" filter="url(#cgSh)"/>';
      s += '<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" fill="#fff" font-size="11.5" font-family="' + FONT + '" font-weight="800">' + esc(pos) + '</text>';
      return s;
    };
    // rival primero (debajo en z), nombre abajo
    if (rival) slotsRival.forEach((s, i) => {
      const cx = (100 - s.x) / 100 * W, cy = py(yRival(s.y));
      const nom = rivalTitulares[i] ? cgApellido(rivalTitulares[i]) : '';
      d += token(cx, cy, s.p, '#be1622', 'rgba(255,255,255,0.9)');
      if (nom) d += chip(cx, cy, nom, false, true);
    });
    // local, nombre arriba
    slots.forEach((s, i) => {
      const cx = s.x / 100 * W, cy = py(yLocal(s.y));
      const nom = titulares[i] ? cgApellido(titulares[i]) : '';
      d += token(cx, cy, s.p, '#0b0d12', '#fff');
      if (nom) d += chip(cx, cy, nom, true, false);
    });

    // ===== footer: recomendaciones en tarjetas =====
    if (rival) {
      const fy0 = HEAD + PITCH + 24;
      d += '<text x="' + PAD + '" y="' + (fy0 + 6) + '" fill="#fff" font-size="18" font-family="' + FONT + '" font-weight="800">Recomendaciones tácticas</text>';
      d += '<text x="' + (W - PAD) + '" y="' + (fy0 + 6) + '" text-anchor="end" fill="#7a8295" font-size="14" font-family="' + FONT + '" font-weight="600">' + esc(formacion) + ' vs ' + esc(rivalForm) + '</text>';
      const cardY = fy0 + 22, cardW = (W - 2 * PAD - 20) / 2, cardH = Math.ceil(recoLn * 26) + 60;
      const card = (x, titulo, itemsW, accent, bg) => {
        let s = '<rect x="' + x + '" y="' + cardY + '" width="' + cardW + '" height="' + cardH + '" rx="14" fill="' + bg + '"/>';
        s += '<rect x="' + x + '" y="' + cardY + '" width="4" height="' + cardH + '" rx="2" fill="' + accent + '"/>';
        s += '<text x="' + (x + 20) + '" y="' + (cardY + 28) + '" fill="' + accent + '" font-size="13" letter-spacing="1.5" font-family="' + FONT + '" font-weight="800">' + titulo + '</text>';
        let yy = cardY + 54;
        itemsW.forEach(ls => {
          s += '<circle cx="' + (x + 24) + '" cy="' + (yy - 4) + '" r="2.6" fill="' + accent + '"/>';
          ls.forEach((ln, k) => { s += '<text x="' + (x + 34) + '" y="' + yy + '" fill="#dfe3ea" font-size="13.5" font-family="' + FONT + '">' + esc(ln) + '</text>'; yy += 22; });
          yy += 9;
        });
        return s;
      };
      d += card(PAD, 'OPORTUNIDADES', opW, '#3ad07f', 'rgba(58,208,127,0.10)');
      d += card(PAD + cardW + 20, 'DEBILIDADES A CUIDAR', deW, '#ff6b72', 'rgba(255,107,114,0.10)');
    } else {
      d += '<text x="' + PAD + '" y="' + (HEAD + PITCH + 42) + '" fill="#7a8295" font-size="14" font-family="' + FONT + '">Selecciona un rival para ver las recomendaciones tácticas.</text>';
    }

    d += '</svg>';

    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = W * SC; c.height = H * SC;
      const ctx = c.getContext('2d'); ctx.fillStyle = '#0b0d12'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
      const a = document.createElement('a');
      a.href = c.toDataURL('image/jpeg', 0.94);
      a.download = 'campograma-colocolo-' + formacion + (rival ? '-vs-' + rival.replace(/\s+/g, '') : '') + '.jpg';
      a.click();
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(d);
  };

  return (
    <div className="cc-page">
      <PageHeader icon="campograma" title="Campograma" subtitle="Pizarra táctica · arrastra para intercambiar, cambia el esquema y analiza al rival"
        right={<div style={{ display: 'flex', gap: 8 }}>
          <button className="cc-btn-ghost" style={{ width: 'auto' }} onClick={() => { setTitulares(onceVacio()); setRivalTitulares({}); }} title="Vaciar la pizarra"><Icon name="basura" size={14}></Icon> Limpiar alineación</button>
          <button className="cc-btn-primary" style={{ width: 'auto' }} onClick={exportar}><Icon name="subir" size={15}></Icon> Exportar JPG</button>
        </div>}></PageHeader>

      <div className="cc-cg-controls">
        <div className="cc-cg-presets">
          <span className="cc-select-label">Alineaciones guardadas</span>
          <div className="cc-cg-presets-row">
            <Select value={presetSel} onChange={n => { setPresetSel(n); cargarPreset(n); }} options={[{ value: '', label: presets.length ? 'Cargar alineación…' : 'Sin alineaciones guardadas' }, ...presets.map(p => ({ value: p.nombre, label: p.nombre }))]}></Select>
            <button className="cc-btn-mini" onClick={guardarPreset} title="Guardar la pizarra actual con un nombre"><Icon name="check" size={13}></Icon> Guardar</button>
            {presetSel ? <button className="cc-escuela-edit cc-btn-danger" title="Eliminar la alineación seleccionada" onClick={() => borrarPreset(presetSel)}><Icon name="basura" size={13}></Icon></button> : null}
          </div>
        </div>
        <label className="cc-select-wrap"><span className="cc-select-label">Nuestro esquema</span>
          <Select value={formacion} onChange={setFormacion} options={Object.keys(CG_FORMACIONES)}></Select>
        </label>
        <label className="cc-select-wrap"><span className="cc-select-label">Rival</span>
          <Select value={rival} onChange={setRival} options={[{ value: '', label: 'Sin definir' }, ...equipos.map(e => ({ value: e, label: e }))]}></Select>
        </label>
        <label className="cc-select-wrap"><span className="cc-select-label">Esquema rival</span>
          <Select value={rivalForm} onChange={setRivalForm} options={Object.keys(CG_FORMACIONES)}></Select>
        </label>
      </div>

      <div className="cc-cg-layout">
        <Card className="cc-pad cc-cg-pitch-card">
          {(() => {
            const noDisp = titulares.map(n => n && dtDe(n)).filter(s => s && !s.disponible);
            if (!noDisp.length) return null;
            return (
              <div className="cc-cg-warn">
                <Icon name="alerta" size={15}></Icon>
                En el XI hay jugadores no disponibles: {noDisp.map(s => s.nombre + ' (' + s.motivo + ')').join(' · ')}
              </div>
            );
          })()}
          {(() => {
            const p = window.CC_DT ? CC_DT.getPlan() : null;
            if (!p) return null;
            const setP = patch => { CC_DT.setPlan(patch); setPlanTick(t => t + 1); };
            return (
              <div className="cc-cg-planbox">
                <div className="cc-cg-plan-head"><Icon name="dt" size={14}></Icon> Plan de partido <span className="cc-cg-plan-sync">sincronizado con Dirección Técnica</span></div>
                <div className="cc-cg-plan-grid">
                  <label><span>Torneo</span><input className="cc-input" value={p.torneo || ''} placeholder="Campeonato chileno" onChange={e => setP({ torneo: e.target.value })}></input></label>
                  <label><span>Presión</span>
                    <Select value={p.presion || ''} onChange={v => setP({ presion: v })} options={[{ value: '', label: '—' }, 'Alta', 'Media', 'Baja']}></Select></label>
                  <label><span>Línea</span>
                    <Select value={p.linea || ''} onChange={v => setP({ linea: v })} options={[{ value: '', label: '—' }, 'Alta', 'Media', 'Baja']}></Select></label>
                  <label><span>Amplitud</span>
                    <Select value={p.amplitud || ''} onChange={v => setP({ amplitud: v })} options={[{ value: '', label: '—' }, 'Amplia', 'Normal', 'Estrecha']}></Select></label>
                </div>
                <input className="cc-input cc-cg-plan-nota" value={p.nota || ''} placeholder="Nota táctica (opcional)…" onChange={e => setP({ nota: e.target.value })}></input>
              </div>
            );
          })()}
          {rival && (
            <div className="cc-cg-rival-head">
              <span className="cc-cg-rival-label">Defiende: <CCTeamLogo team={rival} size={18}></CCTeamLogo> {rival} · {rivalForm}</span>
            </div>
          )}
          <div className="cc-cg-pitch" ref={pitchRef}>
            <CgCancha></CgCancha>
            {/* posiciones del rival (campo completo, atacando hacia abajo) */}
            {slotsRival.map((s, i) => {
              const rn = rivalTitulares[i];
              return (
                <div key={'r' + i} className="cc-cg-slot cc-cg-rival-slot" style={{ left: (100 - s.x) + '%', top: yRival(s.y) + '%' }}
                  onDragOver={e => e.preventDefault()} onDrop={onDropRivalSlot(i)}>
                  <div className={'cc-cg-token cc-cg-token-rival' + (rn ? ' cc-cg-token-rival-on' : '')} draggable={!!rn}
                    title={(rival || 'Rival') + ' · ' + s.p}
                    onDragStart={e => { if (!rn) return; setDrag('rslot:' + i); e.dataTransfer.setData('text', 'rslot:' + i); }}>
                    <span className="cc-cg-token-pos">{s.p}</span>
                    {rn ? <span className="cc-cg-token-nom cc-cg-token-nom-rival">{cgApellido(rn)}</span> : null}
                  </div>
                </div>
              );
            })}
            {slots.map((s, i) => {
              const nombre = titulares[i];
              const j = nombre ? jugadorDe(nombre) : null;
              return (
                <div key={i} className="cc-cg-slot" style={{ left: s.x + '%', top: yLocal(s.y) + '%' }}
                  onDragOver={e => e.preventDefault()} onDrop={onDropSlot(i)}>
                  <div className="cc-cg-token" draggable="true"
                    onDragStart={e => { setDrag('slot:' + i); e.dataTransfer.setData('text', 'slot:' + i); }}>
                    <span className="cc-cg-token-pos">{s.p}</span>
                    <span className="cc-cg-token-nom">{j ? cgApellido(j.nombre) : '—'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="cc-cg-side">
          <Card className="cc-pad">
            <h3 className="cc-card-title">Banca / plantel — Colo-Colo</h3>
            <p className="cc-card-note">Arrastra un jugador a la cancha para hacerlo titular, o arrastra un titular hasta aquí para sacarlo.</p>
            <div className="cc-cg-banca" onDragOver={e => e.preventDefault()} onDrop={onDropBanca}>
              {banca.map(j => (
                <div key={j.nombre} className="cc-cg-banca-item" draggable="true"
                  onDragStart={e => { setDrag('banca:' + j.nombre); e.dataTransfer.setData('text', 'banca:' + j.nombre); }}>
                  <span className="cc-cg-banca-pos">{j.posicion || '—'}</span>
                  <span className="cc-cg-banca-nom">{j.nombre}</span>
                  {(() => {
                    const s = dtDe(j.nombre);
                    if (!s) return null;
                    return (
                      <span className="cc-cg-dt">
                        <span className="cc-cg-dt-dot" style={{ background: s.condicion >= 88 ? 'var(--exito)' : s.condicion >= 75 ? '#F59E0B' : 'var(--rojo)' }} title={'Condición estimada ' + s.condicion + '%'}></span>
                        {s.suspendido && <span className="cc-cg-banca-flag les" title="Suspendido (Dirección Técnica)">SUS</span>}
                      </span>
                    );
                  })()}
                  {estadoPlantel[j.nombre] && <span className={'cc-cg-banca-flag ' + (estadoPlantel[j.nombre] === 'Lesionado' ? 'les' : 'ces')} title={estadoPlantel[j.nombre]}>{estadoPlantel[j.nombre] === 'Lesionado' ? 'LES' : 'CED'}</span>}
                  <span className="cc-cg-banca-min">{j.min || 0}'</span>
                </div>
              ))}
              {banca.length === 0 && <p className="cc-empty">Todos en cancha.</p>}
            </div>
          </Card>

          {rival && (
            <Card className="cc-pad">
              <h3 className="cc-card-title">Banca / plantel — {rival}</h3>
              {plantelRival.length === 0 ? (
                <p className="cc-card-note">No tenemos el plantel de {rival} en la base de datos. Solo los equipos con datos cargados (Primera División de Chile) tienen jugadores disponibles.</p>
              ) : (
                <React.Fragment>
                  <p className="cc-card-note">Arrastra un jugador del rival a una posición para ubicarlo, o arrástralo hasta aquí para sacarlo.</p>
                  <div className="cc-cg-banca cc-cg-banca-visita" onDragOver={e => e.preventDefault()} onDrop={onDropVisita}>
                    {bancaVisita.map(j => (
                      <div key={j.nombre} className="cc-cg-banca-item" draggable="true"
                        onDragStart={e => { setDrag('vbanca:' + j.nombre); e.dataTransfer.setData('text', 'vbanca:' + j.nombre); }}>
                        <span className="cc-cg-banca-pos cc-cg-banca-pos-rival">{j.posicion || '—'}</span>
                        <span className="cc-cg-banca-nom">{j.nombre}</span>
                        <span className="cc-cg-banca-min">{j.min || 0}'</span>
                      </div>
                    ))}
                    {bancaVisita.length === 0 && <p className="cc-empty">Todos ubicados.</p>}
                  </div>
                </React.Fragment>
              )}
            </Card>
          )}

          <Card className="cc-pad cc-cg-reco">
            <h3 className="cc-card-title">Recomendaciones tácticas</h3>
            <p className="cc-card-note">{formacion} vs {rivalForm}{rival ? ' · ' + rival : ''}</p>
            <div className="cc-cg-reco-block">
              <span className="cc-esc-sub cc-reco-op"><Icon name="flecha" size={13}></Icon> Oportunidades</span>
              <ul>{reco.op.map((t, i) => <li key={i}>{t}</li>)}{reco.op.length === 0 && <li className="cc-falta">—</li>}</ul>
            </div>
            <div className="cc-cg-reco-block">
              <span className="cc-esc-sub cc-reco-de"><Icon name="alerta" size={13}></Icon> Debilidades a cuidar</span>
              <ul>{reco.de.map((t, i) => <li key={i}>{t}</li>)}{reco.de.length === 0 && <li className="cc-falta">—</li>}</ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PageCampograma });
