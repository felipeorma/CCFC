import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const args = parseArgs(process.argv.slice(2));
const lineupsOnly = !!args['lineups-only'];
const batchSize = numberArg(args['batch-size'] || args.batch, 3);
const sleepMs = numberArg(args['sleep-ms'] || args.sleep, 5000);
const playerDelayMs = numberArg(args['player-delay-ms'], 300);
const requestTimeoutMs = numberArg(args['timeout-ms'], 15000);
const onlyMissing = !args.all;
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = numberArg(args.port, 9237);
const profile = await mkdtemp(path.join(tmpdir(), 'cc-sofa-actions-'));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function parseArgs(argv) {
  const out = {};
  for (const raw of argv) {
    if (!raw.startsWith('--')) continue;
    const [key, ...rest] = raw.slice(2).split('=');
    out[key] = rest.length ? rest.join('=') : true;
  }
  return out;
}

function numberArg(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

async function loadJs(file, context) {
  try {
    vm.runInNewContext(await readFile(path.join(root, file), 'utf8'), context, { filename: file });
  } catch (error) {
    if (error && error.code === 'ENOENT') return;
    throw error;
  }
}

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
  }
  async open() {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout abriendo Chrome DevTools')), 10000);
      this.ws.onopen = () => { clearTimeout(timer); resolve(); };
      this.ws.onerror = error => { clearTimeout(timer); reject(error); };
    });
    this.ws.onmessage = event => {
      const message = JSON.parse(event.data);
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    };
  }
  send(method, params = {}, timeoutMs = requestTimeoutMs) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('Timeout CDP en ' + method));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression, timeoutMs = requestTimeoutMs) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true
    }, timeoutMs);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Error al evaluar en Chrome.');
    return result.result.value;
  }
  close() { this.ws.close(); }
}

const context = { window: {} };
await loadJs('app/cc-sofa-snapshot.js', context);
await loadJs('app/cc-shotmaps-data.js', context);
await loadJs('app/cc-lineups-data.js', context);
await loadJs('app/cc-actions-data.js', context);

const existingBundle = context.window.CC_ACTIONS_BUNDLE || {};
const matches = knownMatches(context.window).filter(matchFilter(args));
if (!matches.length) throw new Error('No hay partidos con eventId conocido para procesar.');

const pendingMatches = matches.filter(match => {
  if (!onlyMissing) return true;
  const item = existingBundle[String(match.eventId)];
  return !isComplete(item, lineupsOnly);
}).slice(0, batchSize);

if (!pendingMatches.length) {
  console.log('Sin pendientes: la base de acciones ya tiene los partidos solicitados.');
  process.exit(0);
}

const child = spawn(chrome, [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`,
  'https://www.sofascore.com/'
], { stdio: ['ignore', 'ignore', 'pipe'] });

let stderr = '';
child.stderr.on('data', chunk => { stderr += chunk.toString(); });

let cdp;
try {
  const page = await waitForPage();
  cdp = new CDP(page.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send('Runtime.enable').catch(() => {});
  await cdp.send('Network.enable').catch(() => {});
  await cdp.send('Network.setExtraHTTPHeaders', {
    headers: {
      accept: 'application/json, text/plain, */*',
      'accept-language': 'es-CL,es;q=0.9,en;q=0.8',
      referer: 'https://www.sofascore.com/'
    }
  }).catch(() => {});

  const bundle = structuredClone(existingBundle);
  const startedAt = new Date().toISOString();
  console.log(`Procesando ${pendingMatches.length}/${matches.length} partido(s) · lote ${batchSize} · inicio ${startedAt}`);

  for (let i = 0; i < pendingMatches.length; i++) {
    const match = pendingMatches[i];
    const key = String(match.eventId);
    const previous = bundle[key] || {};
    const item = {
      j: match.j,
      eventId: match.eventId,
      homeEsCC: !!match.homeEsCC,
      cc: Array.isArray(previous.cc) ? previous.cc : [],
      rv: Array.isArray(previous.rv) ? previous.rv : [],
      actions: previous.actions && typeof previous.actions === 'object' ? { ...previous.actions } : {},
      errors: previous.errors && typeof previous.errors === 'object' ? { ...previous.errors } : {},
      updatedAt: previous.updatedAt || null
    };

    try {
      let players = [];
      try {
        const lineups = await fetchApi(cdp, `/event/${match.eventId}/lineups`);
        const homeSide = match.homeEsCC ? 'cc' : 'rv';
        const awaySide = match.homeEsCC ? 'rv' : 'cc';
        players = [
          ...(((lineups.home || {}).players) || []).map(raw => compactPlayer(raw, homeSide)),
          ...(((lineups.away || {}).players) || []).map(raw => compactPlayer(raw, awaySide))
        ].filter(Boolean);

        item.cc = players.filter(p => p.lado === 'cc');
        item.rv = players.filter(p => p.lado === 'rv');
        delete item.errors._lineups;
      } catch (lineupError) {
        players = item.cc.concat(item.rv).filter(p => p && p.id != null);
        item.errors._lineups = String(lineupError && lineupError.message || lineupError);
        if (!players.length) throw lineupError;
      }

      if (!lineupsOnly) {
        for (const player of players) {
          const playerKey = String(player.id);
          if (onlyMissing && Array.isArray(item.actions[playerKey])) continue;
          try {
            const data = await fetchApi(cdp, `/event/${match.eventId}/player/${player.id}/rating-breakdown`);
            item.actions[playerKey] = compactEvents(data);
            delete item.errors[playerKey];
          } catch (error) {
            item.errors[playerKey] = String(error && error.message || error);
          }
          await wait(playerDelayMs);
        }
      }

      item.updatedAt = new Date().toISOString();
      bundle[key] = item;
      await writeBundle(bundle);
      const actionPlayers = Object.values(item.actions || {}).filter(arr => Array.isArray(arr) && arr.length).length;
      console.log(`F${match.j} (${match.eventId}): ${item.cc.length + item.rv.length} jugadores · ${actionPlayers} con eventos espaciales`);
    } catch (error) {
      const hasPreviousData = (item.cc && item.cc.length) || (item.rv && item.rv.length) ||
        (item.actions && Object.values(item.actions).some(arr => Array.isArray(arr) && arr.length));
      if (hasPreviousData) {
        item.errors._match = String(error && error.message || error);
        item.updatedAt = new Date().toISOString();
        bundle[key] = item;
        await writeBundle(bundle);
      }
      console.log(`F${match.j} (${match.eventId}): pendiente · ${String(error && error.message || error)}`);
    }

    if (i < pendingMatches.length - 1) await wait(sleepMs);
  }

  console.log(`${lineupsOnly ? 'Alineaciones' : 'Acciones'} procesadas sin borrar datos previos.`);
} finally {
  if (cdp) cdp.close();
  child.kill('SIGTERM');
  await Promise.race([
    new Promise(resolve => child.once('exit', resolve)),
    wait(3000)
  ]);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}

function knownMatches(win) {
  const byJ = new Map();
  function ensure(j) {
    const key = String(j);
    if (!byJ.has(key)) byJ.set(key, { j: Number(j), eventId: null, homeEsCC: null });
    return byJ.get(key);
  }

  Object.entries((win.CC_SOFA_SNAPSHOT || {}).eventIds || {}).forEach(([j, eventId]) => {
    const match = ensure(j);
    match.eventId = Number(eventId);
  });

  Object.entries(win.CC_SHOTMAPS_BUNDLE || {}).forEach(([j, data]) => {
    const match = ensure(j);
    match.eventId = Number(data.eventId || match.eventId);
    if (typeof data.homeEsCC === 'boolean') match.homeEsCC = data.homeEsCC;
  });

  Object.entries(win.CC_LINEUPS_BUNDLE || {}).forEach(([j, data]) => {
    const match = ensure(j);
    match.eventId = Number(data.eventId || match.eventId);
    if (data.ccEs) match.homeEsCC = data.ccEs === 'home';
  });

  Object.entries(existingBundle || {}).forEach(([eventId, data]) => {
    if (!data || data.j == null) return;
    const match = ensure(data.j);
    match.eventId = Number(data.eventId || eventId || match.eventId);
    if (typeof data.homeEsCC === 'boolean') match.homeEsCC = data.homeEsCC;
  });

  return [...byJ.values()]
    .filter(match => Number.isFinite(match.j) && Number.isFinite(match.eventId))
    .map(match => ({ ...match, homeEsCC: match.homeEsCC !== false }))
    .sort((a, b) => a.j - b.j);
}

function matchFilter(parsedArgs) {
  const jornadas = new Set(String(parsedArgs.match || parsedArgs.j || '')
    .split(',').map(x => x.trim()).filter(Boolean));
  const eventIds = new Set(String(parsedArgs['event-id'] || '')
    .split(',').map(x => x.trim()).filter(Boolean));
  return match => {
    if (jornadas.size && !jornadas.has(String(match.j))) return false;
    if (eventIds.size && !eventIds.has(String(match.eventId))) return false;
    return true;
  };
}

function isComplete(item, wantLineupsOnly) {
  if (!item || !Array.isArray(item.cc) || !Array.isArray(item.rv) || !(item.cc.length || item.rv.length)) return false;
  if (wantLineupsOnly) return true;
  const players = item.cc.concat(item.rv).filter(p => p && p.id != null);
  if (!players.length || !item.actions) return false;
  if (Object.values(item.actions).some(arr => Array.isArray(arr) && arr.length)) return true;
  return players.every(player => Array.isArray(item.actions[String(player.id)]));
}

function compactPlayer(item, side) {
  const player = item.player || {};
  const stats = item.statistics || {};
  const played = !item.substitute || Object.keys(stats).length > 0;
  if (!played || !player.id || !player.name) return null;
  return {
    id: player.id,
    nombre: player.name,
    posicion: item.position || player.position || '',
    dorsal: item.jerseyNumber || item.shirtNumber || '',
    minutos: stats.minutesPlayed != null ? stats.minutesPlayed : null,
    titular: !item.substitute,
    lado: side
  };
}

function compactEvents(data) {
  const events = [];
  Object.entries(data || {}).forEach(([category, list]) => {
    if (!Array.isArray(list) || /shot/i.test(category)) return;
    list.forEach(raw => {
      const start = raw.playerCoordinates || {};
      const end = raw.passEndCoordinates || {};
      const x = Number(start.x != null ? start.x : raw.x);
      const y = Number(start.y != null ? start.y : raw.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      const ex = Number(end.x != null ? end.x : raw.end_x);
      const ey = Number(end.y != null ? end.y : raw.end_y);
      events.push({
        c: category,
        a: raw.eventActionType || raw.actionType || '',
        o: raw.outcome,
        l: raw.isLongBall,
        i: raw.isAssist,
        x,
        y,
        ex: Number.isFinite(ex) ? ex : null,
        ey: Number.isFinite(ey) ? ey : null,
        t: raw.time != null ? raw.time : (raw.minute != null ? raw.minute : null)
      });
    });
  });
  return events;
}

async function writeBundle(bundle) {
  const output = '// Datos reales de acciones por jugador, obtenidos desde SofaScore.\n' +
    '// Regenerar con: npm run data:player-actions -- --batch-size=3\n' +
    '// El script conserva datos existentes si SofaScore bloquea una consulta.\n' +
    `window.CC_ACTIONS_BUNDLE = ${JSON.stringify(bundle)};\n`;
  await writeFile(path.join(root, 'app/cc-actions-data.js'), output);
}

async function waitForPage() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = tabs.find(tab => tab.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page;
    } catch (e) {}
    await wait(500);
  }
  throw new Error('Chrome no abrió la sesión de SofaScore.\n' + stderr.slice(-1000));
}

async function fetchApi(cdp, apiPath) {
  const pathApi = apiPath.startsWith('/api/v1') ? apiPath : '/api/v1' + apiPath;
  const expression = `(async()=>{` +
    `const ctrl=new AbortController();` +
    `const t=setTimeout(()=>ctrl.abort(),${requestTimeoutMs});` +
    `try{` +
    `const r=await fetch(${JSON.stringify(pathApi)},{credentials:'include',signal:ctrl.signal,headers:{accept:'application/json, text/plain, */*'}});` +
    `const text=await r.text();let data=null;try{data=JSON.parse(text)}catch(e){}` +
    `return {status:r.status,ok:r.ok,data,error:r.ok?null:text.slice(0,240)};` +
    `}catch(e){return {status:0,ok:false,error:String(e&&e.message||e)}}finally{clearTimeout(t)}})()`;

  let response = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    response = await cdp.evaluate(expression, requestTimeoutMs + 5000);
    if (response && response.ok && response.data) return response.data;
    await wait(attempt * 1200);
  }
  throw new Error(`SofaScore respondió ${response ? response.status : 'sin datos'} en ${apiPath}${response && response.error ? ' · ' + response.error : ''}`);
}
