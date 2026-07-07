// Fixture oficial con ajustes locales para partidos reprogramados.
(function () {
  var KEY = 'cc_fixture_ajustes_v1';

  function leer() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY));
      if (!data || typeof data !== 'object') return {};
      var cambio = false;
      var base = (window.CC_DATA && window.CC_DATA.fixture) || [];
      Object.keys(data).forEach(function (jornada) {
        var partido = base.find(function (m) { return String(m.j) === String(jornada); });
        var ajuste = data[jornada] || {};
        if (!partido || partido.resultado || (ajuste.fecha === partido.fecha && (ajuste.hora || '') === (partido.hora || ''))) {
          delete data[jornada];
          cambio = true;
        }
      });
      if (cambio) localStorage.setItem(KEY, JSON.stringify(data));
      return data;
    } catch (e) { return {}; }
  }

  function emitir() {
    try { window.dispatchEvent(new Event('cc-fixture-change')); } catch (e) {}
  }

  function fechaISOValida(fecha) {
    return /^\d{4}-\d{2}-\d{2}$/.test(fecha || '') && !isNaN(new Date(fecha + 'T12:00:00').getTime());
  }

  function hoyISO() {
    var hoy = new Date();
    return hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
  }

  function actual() {
    var ajustes = leer();
    return ((window.CC_DATA && window.CC_DATA.fixture) || []).map(function (partido) {
      var ajuste = !partido.resultado ? ajustes[String(partido.j)] : null;
      // Enlace con Sofascore: si el evento de esta jornada ya fue cargado
      // (Configuración → Shotmaps) y terminó, el fixture refleja su resultado
      // y fecha reales aunque aún no se suban los Team Stats de Wyscout.
      var sofa = null;
      try { sofa = window.CC_SHOTMAPS && window.CC_SHOTMAPS.partido ? window.CC_SHOTMAPS.partido(partido.j) : null; } catch (e) {}
      var resultado = partido.resultado || null;
      var fechaSofa = null;
      if (!resultado && sofa && String(sofa.status || '').toLowerCase() === 'finished' && sofa.homeScore != null && sofa.awayScore != null) {
        var gf = sofa.homeEsCC ? sofa.homeScore : sofa.awayScore;
        var gc = sofa.homeEsCC ? sofa.awayScore : sofa.homeScore;
        resultado = gf + '-' + gc;
        if (fechaISOValida(sofa.fecha)) fechaSofa = sofa.fecha;
      }
      var fecha = ajuste && fechaISOValida(ajuste.fecha) ? ajuste.fecha : (fechaSofa || partido.fecha);
      var hora = ajuste && /^\d{2}:\d{2}$/.test(ajuste.hora || '') ? ajuste.hora : (partido.hora || '');
      return Object.assign({}, partido, {
        fechaOriginal: partido.fecha,
        fecha: fecha,
        hora: hora,
        resultado: resultado,
        resultadoSofa: !partido.resultado && !!resultado,
        reprogramado: !resultado && !!(ajuste && (fecha !== partido.fecha || hora !== (partido.hora || '')))
      });
    });
  }

  function pendientesVigentes() {
    var hoy = hoyISO();
    return actual().filter(function (m) {
      return !m.resultado && fechaISOValida(m.fecha) && m.fecha >= hoy;
    }).sort(function (a, b) {
      return (a.fecha + 'T' + (a.hora || '23:59')).localeCompare(b.fecha + 'T' + (b.hora || '23:59')) || Number(a.j) - Number(b.j);
    });
  }

  function pendientesSinFechaVigente() {
    var hoy = hoyISO();
    return actual().filter(function (m) {
      return !m.resultado && (!fechaISOValida(m.fecha) || m.fecha < hoy);
    });
  }

  function guardar(jornada, patch) {
    var partido = ((window.CC_DATA && window.CC_DATA.fixture) || []).find(function (m) { return String(m.j) === String(jornada); });
    if (!partido || partido.resultado) return { ok: false, error: 'Solo se pueden reprogramar partidos no jugados.' };
    if (!fechaISOValida(patch && patch.fecha)) return { ok: false, error: 'Ingresa una fecha válida.' };
    var hora = String((patch && patch.hora) || '').trim();
    if (hora && !/^\d{2}:\d{2}$/.test(hora)) return { ok: false, error: 'Ingresa una hora válida.' };
    var ajustes = leer();
    if (patch.fecha === partido.fecha && hora === (partido.hora || '')) {
      delete ajustes[String(jornada)];
      try { localStorage.setItem(KEY, JSON.stringify(ajustes)); } catch (e) { return { ok: false, error: 'No se pudo guardar el ajuste.' }; }
      emitir();
      return { ok: true };
    }
    ajustes[String(jornada)] = { fecha: patch.fecha, hora: hora, actualizado: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(ajustes)); } catch (e) { return { ok: false, error: 'No se pudo guardar el ajuste.' }; }
    emitir();
    return { ok: true };
  }

  function restaurar(jornada) {
    var ajustes = leer();
    delete ajustes[String(jornada)];
    try { localStorage.setItem(KEY, JSON.stringify(ajustes)); } catch (e) { return false; }
    emitir();
    return true;
  }

  window.CC_FIXTURE = {
    actual: actual,
    guardar: guardar,
    restaurar: restaurar,
    pendientesVigentes: pendientesVigentes,
    pendientesSinFechaVigente: pendientesSinFechaVigente,
    fechaISOValida: fechaISOValida,
    hoyISO: hoyISO
  };
})();
