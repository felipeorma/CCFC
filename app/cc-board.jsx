// ============================================================
// ColoColo Football Center — Tablero de Inicio
// Notas compartidas (todos publican; el autor edita/borra),
// ToDo del administrador y próximos cumpleaños del plantel.
// ============================================================
/* global React, CC_GESTION, CC_DATA, Icon, Card, CCTeamLogo */

const { useState: bState, useEffect: bEffect } = React;

function bLoad(key, def) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? def : v; }
  catch (e) { return def; }
}
function bSave(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
function bAudit(accion, entidad, detalle, usuario) {
  try { if (window.ccAudit) window.ccAudit(accion, entidad, detalle, usuario); } catch (e) {}
}

function bFechaCorta(iso) {
  try { return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  catch (e) { return ''; }
}

// ---------------- Notas compartidas ----------------
function NotasBoard({ usuario }) {
  const [notas, setNotas] = bState(() => bLoad('cc_notas_v1', [
    { id: 'n-seed-1', autor: 'datos@colocolofc.cl', texto: 'Bienvenidos a la plataforma 2026. Usen este muro para avisos del cuerpo técnico y scouting.', fecha: '2026-06-10T09:00:00', tipo: 'Aviso' }
  ]));
  const [texto, setTexto] = bState('');
  const [tipo, setTipo] = bState('Aviso');
  const [editId, setEditId] = bState(null);
  const [editTexto, setEditTexto] = bState('');

  bEffect(() => { bSave('cc_notas_v1', notas); }, [notas]);

  const publicar = () => {
    const t = texto.trim();
    if (!t) return;
    setNotas([{ id: 'n-' + Date.now(), autor: usuario, texto: t, fecha: new Date().toISOString(), tipo }, ...notas]);
    bAudit('crear', 'Muro de avisos', tipo + ' · ' + t.slice(0, 60), usuario);
    setTexto('');
  };
  const borrar = id => {
    const nota = notas.find(n => n.id === id);
    setNotas(notas.filter(n => n.id !== id));
    bAudit('eliminar', 'Muro de avisos', nota ? (nota.tipo + ' · ' + nota.texto.slice(0, 60)) : id, usuario);
  };
  const guardarEdit = id => {
    setNotas(notas.map(n => n.id === id ? { ...n, texto: editTexto.trim() || n.texto, editado: new Date().toISOString() } : n));
    bAudit('editar', 'Muro de avisos', editTexto.trim().slice(0, 60) || id, usuario);
    setEditId(null);
  };
  const toggleLike = id => setNotas(notas.map(n => {
    if (n.id !== id) return n;
    const likes = n.likes || [];
    return likes.includes(usuario)
      ? { ...n, likes: likes.filter(u => u !== usuario) }
      : { ...n, likes: [...likes, usuario] };
  }));
  const nombreCorto = e => (e || '').split('@')[0].replace(/[._]/g, ' ');

  const TIPOS = { 'Aviso': 'aviso', 'Urgente': 'urgente', 'Táctico': 'tactico', 'Reunión': 'reunion' };

  return (
    <Card className="cc-pad cc-notas">
      <div className="cc-chart-head">
        <h3 className="cc-card-title">Muro de avisos</h3>
        <span className="cc-notas-count">{notas.length} nota{notas.length === 1 ? '' : 's'}</span>
      </div>

      <div className="cc-notas-form">
        <div className="cc-notas-tipos">
          {Object.keys(TIPOS).map(k => (
            <button key={k} className={'cc-tipo-chip cc-tipo-' + TIPOS[k] + (tipo === k ? ' on' : '')} onClick={() => setTipo(k)}>{k}</button>
          ))}
        </div>
        <textarea
          className="cc-notas-input"
          placeholder="Escribe un aviso para todo el equipo…"
          value={texto}
          onChange={e => setTexto(e.target.value)}
          rows={2}
        ></textarea>
        <button className="cc-btn-primario" onClick={publicar} disabled={!texto.trim()}>
          <Icon name="mas" size={16}></Icon> Publicar
        </button>
      </div>

      <div className="cc-notas-lista cc-notas-wall">
        {notas.length === 0 && <p className="cc-empty">Sin avisos publicados.</p>}
        {notas.map((n, i) => {
          const mio = n.autor === usuario;
          const likes = n.likes || [];
          const yaLike = likes.includes(usuario);
          return (
            <div key={n.id} className={'cc-nota cc-sticky cc-sticky-' + (TIPOS[n.tipo] || 'aviso') + (i % 2 ? ' tilt-b' : ' tilt-a')}>
              <div className="cc-sticky-pin"></div>
              <div className="cc-nota-head">
                <span className={'cc-tipo-tag cc-tipo-' + (TIPOS[n.tipo] || 'aviso')}>{n.tipo || 'Aviso'}</span>
                {mio && editId !== n.id && (
                  <span className="cc-nota-acciones">
                    <button title="Editar" onClick={() => { setEditId(n.id); setEditTexto(n.texto); }}><Icon name="reporte" size={14}></Icon></button>
                    <button title="Eliminar" onClick={() => borrar(n.id)}><Icon name="basura" size={14}></Icon></button>
                  </span>
                )}
              </div>
              {editId === n.id ? (
                <div className="cc-nota-edit">
                  <textarea className="cc-notas-input" value={editTexto} onChange={e => setEditTexto(e.target.value)} rows={3}></textarea>
                  <div className="cc-nota-edit-btns">
                    <button className="cc-btn-mini" onClick={() => guardarEdit(n.id)}>Guardar</button>
                    <button className="cc-btn-mini cc-btn-ghost" onClick={() => setEditId(null)}>Cancelar</button>
                  </div>
                </div>
              ) : (
                <p className="cc-nota-texto">{n.texto}</p>
              )}
              <div className="cc-sticky-foot">
                <span className="cc-sticky-firma">{nombreCorto(n.autor)} · {bFechaCorta(n.fecha)}{n.editado ? ' · editado' : ''}</span>
                <button className={'cc-like-btn' + (yaLike ? ' on' : '')} onClick={() => toggleLike(n.id)}
                  title={likes.length ? likes.map(nombreCorto).join(', ') : 'Sé el primero en dar like'}>
                  <Icon name="estrella" size={13}></Icon>
                  <span>{likes.length || ''}</span>
                </button>
              </div>
              {likes.length > 0 && (
                <div className="cc-like-quien">⭐ {likes.map(nombreCorto).join(', ')}</div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ---------------- ToDo del administrador ----------------
function AdminTodo({ usuario }) {
  const [tareas, setTareas] = bState(() => bLoad('cc_todos_v1', [
    { id: 't1', texto: 'Renovar contrato de Arturo Vidal (vence dic-2026)', hecho: false },
    { id: 't2', texto: 'Confirmar retorno de Javier Méndez (LCA)', hecho: false },
    { id: 't3', texto: 'Revisar informe de B. Cabrera (CB ofrecido)', hecho: true }
  ]));
  const [texto, setTexto] = bState('');
  const [editId, setEditId] = bState(null);
  const [editTexto, setEditTexto] = bState('');
  bEffect(() => { bSave('cc_todos_v1', tareas); }, [tareas]);

  const agregar = () => {
    const t = texto.trim();
    if (!t) return;
    setTareas([...tareas, { id: 'tt-' + Date.now(), texto: t, hecho: false }]);
    bAudit('crear', 'Tarea administrativa', t.slice(0, 60), usuario);
    setTexto('');
  };
  const toggle = id => {
    const tarea = tareas.find(t => t.id === id);
    setTareas(tareas.map(t => t.id === id ? { ...t, hecho: !t.hecho } : t));
    if (tarea) bAudit('editar', 'Tarea administrativa', (tarea.hecho ? 'Reabierta · ' : 'Completada · ') + tarea.texto.slice(0, 60), usuario);
  };
  const borrar = id => {
    const tarea = tareas.find(t => t.id === id);
    setTareas(tareas.filter(t => t.id !== id));
    bAudit('eliminar', 'Tarea administrativa', tarea ? tarea.texto.slice(0, 60) : id, usuario);
  };
  const guardarEdit = id => {
    setTareas(tareas.map(t => t.id === id ? { ...t, texto: editTexto.trim() || t.texto } : t));
    bAudit('editar', 'Tarea administrativa', editTexto.trim().slice(0, 60) || id, usuario);
    setEditId(null);
  };
  const pend = tareas.filter(t => !t.hecho).length;

  return (
    <Card className="cc-pad cc-todo">
      <div className="cc-chart-head">
        <h3 className="cc-card-title">Tareas pendientes</h3>
        <span className="cc-notas-count">{pend} por hacer</span>
      </div>
      <div className="cc-todo-form">
        <input
          className="cc-input"
          placeholder="Nueva tarea de gestión…"
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') agregar(); }}
        ></input>
        <button className="cc-btn-primario" onClick={agregar} disabled={!texto.trim()}><Icon name="mas" size={16}></Icon></button>
      </div>
      <ul className="cc-todo-lista">
        {tareas.map(t => (
          <li key={t.id} className={'cc-todo-item' + (t.hecho ? ' hecho' : '')}>
            <button className="cc-todo-check" onClick={() => toggle(t.id)} aria-label="Completar">
              {t.hecho && <Icon name="check" size={14}></Icon>}
            </button>
            {editId === t.id ? (
              <input className="cc-input cc-todo-editinp" autoFocus value={editTexto}
                onChange={e => setEditTexto(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') guardarEdit(t.id); if (e.key === 'Escape') setEditId(null); }}
                onBlur={() => guardarEdit(t.id)}></input>
            ) : (
              <span className="cc-todo-texto" onDoubleClick={() => { setEditId(t.id); setEditTexto(t.texto); }}>{t.texto}</span>
            )}
            <button className="cc-todo-del" onClick={() => { setEditId(t.id); setEditTexto(t.texto); }} aria-label="Editar"><Icon name="reporte" size={13}></Icon></button>
            <button className="cc-todo-del" onClick={() => borrar(t.id)} aria-label="Eliminar"><Icon name="basura" size={14}></Icon></button>
          </li>
        ))}
        {tareas.length === 0 && <p className="cc-empty">Sin tareas. ¡Todo al día!</p>}
      </ul>
    </Card>
  );
}

// ---------------- Próximos cumpleaños ----------------
function ccProximosCumple(n) {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const base = new Date(y, hoy.getMonth(), hoy.getDate());
  const lista = (CC_GESTION.plantel || [])
    .filter(p => p.nacimiento)
    .map(p => {
      const [, mm, dd] = p.nacimiento.split('-').map(Number);
      let prox = new Date(y, mm - 1, dd);
      if (prox < base) prox = new Date(y + 1, mm - 1, dd);
      const dias = Math.round((prox - base) / 86400000);
      const cumpleAnios = prox.getFullYear() - Number(p.nacimiento.split('-')[0]);
      return { nombre: p.nombre, dorsal: p.dorsal, fecha: prox, dias, edad: cumpleAnios };
    })
    .sort((a, b) => a.dias - b.dias);
  return n ? lista.slice(0, n) : lista;
}

function CumpleBoard() {
  const prox = ccProximosCumple(5);
  const dest = prox[0];
  return (
    <Card className="cc-pad cc-cumple">
      <div className="cc-chart-head">
        <h3 className="cc-card-title">🎂 Próximos cumpleaños</h3>
        <CCTeamLogo team="Colo-Colo" size={22}></CCTeamLogo>
      </div>

      {dest && (
        <div className={'cc-cumple-hero' + (dest.dias === 0 ? ' hoy' : '')}>
          <div className="cc-cumple-globos" aria-hidden="true">
            <span className="cc-globo g1">🎈</span>
            <span className="cc-globo g2">🎈</span>
            <span className="cc-globo g3">🎈</span>
          </div>
          <div className="cc-cumple-hero-torta">{dest.dias === 0 ? '🎉' : '🎂'}</div>
          <div className="cc-cumple-hero-info">
            <span className="cc-cumple-hero-quien">{dest.nombre}</span>
            <span className="cc-cumple-hero-cuando">
              {dest.dias === 0 ? '¡Cumple HOY!' : dest.dias === 1 ? '¡Mañana!' : 'En ' + dest.dias + ' días'} · cumple {dest.edad}
            </span>
          </div>
          {dest.dias === 0 && <div className="cc-confeti" aria-hidden="true">{'🎊✨🎈🎉⭐'.split('').map((e, k) => <span key={k} style={{ left: (12 + k * 19) + '%', animationDelay: (k * 0.3) + 's' }}>{e}</span>)}</div>}
        </div>
      )}

      <ul className="cc-cumple-lista">
        {prox.slice(1).map((c, i) => (
          <li key={i} className={'cc-cumple-item' + (c.dias <= 7 ? ' pronto' : '')}>
            <span className="cc-cumple-dorsal">{c.dorsal || '–'}</span>
            <span className="cc-cumple-nombre">{c.nombre}</span>
            <span className="cc-cumple-fecha">{c.fecha.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}</span>
            <span className="cc-cumple-dias">{c.dias === 0 ? '¡Hoy! 🎂' : c.dias === 1 ? 'Mañana 🎈' : 'en ' + c.dias + ' d'}</span>
            <span className="cc-cumple-edad">{c.edad} años</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

Object.assign(window, { NotasBoard, AdminTodo, CumpleBoard, ccProximosCumple });
