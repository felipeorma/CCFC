import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const lineupsOnly = process.argv.includes('--lineups-only');
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const port = 9237;
const profile = await mkdtemp(path.join(tmpdir(), 'cc-sofa-actions-'));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const shotmapSource = await readFile(path.join(root, 'app/cc-shotmaps-data.js'), 'utf8');
const context = { window: {} };
vm.runInNewContext(shotmapSource, context);
const matches = Object.entries(context.window.CC_SHOTMAPS_BUNDLE || {})
  .map(([j, match]) => ({ j: Number(j), eventId: match.eventId, homeEsCC: !!match.homeEsCC }))
  .sort((a, b) => a.j - b.j);

if (!matches.length) throw new Error('No hay partidos en CC_SHOTMAPS_BUNDLE.');

const child = spawn(chrome, [
  '--headless=new', '--no-sandbox', '--disable-gpu', `--remote-debugging-port=${port}`,
  `--user-data-dir=${profile}`, `https://www.sofascore.com/api/v1/event/${matches[0].eventId}/lineups`
], { stdio: ['ignore', 'ignore', 'pipe'] });

let stderr = '';
child.stderr.on('data', chunk => { stderr += chunk.toString(); });

async function waitForPage() {
  for (let i = 0; i < 60; i++) {
    try {
      const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const page = tabs.find(tab => tab.type === 'page');
      if (page && page.webSocketDebuggerUrl) return page;
    } catch (e) {}
    await wait(500);
  }
  throw new Error('Chrome no abrió la sesión de SofaScore.\n' + stderr.slice(-1000));
}

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.id = 0;
    this.pending = new Map();
  }
  async open() {
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    this.ws.onmessage = event => {
      const message = JSON.parse(event.data);
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
    };
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Error al evaluar en Chrome.');
    return result.result.value;
  }
  close() { this.ws.close(); }
}

function compactPlayer(item, side) {
  const player = item.player || {};
  const stats = item.statistics || {};
  const played = !item.substitute || Object.keys(stats).length > 0;
  if (!played || !player.id || !player.name) return null;
  return {
    id: player.id, nombre: player.name, posicion: item.position || player.position || '',
    dorsal: item.jerseyNumber || item.shirtNumber || '',
    minutos: stats.minutesPlayed != null ? stats.minutesPlayed : null,
    titular: !item.substitute, lado: side
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
        c: category, a: raw.eventActionType || raw.actionType || '', o: raw.outcome,
        l: raw.isLongBall, i: raw.isAssist, x, y,
        ex: Number.isFinite(ex) ? ex : null, ey: Number.isFinite(ey) ? ey : null,
        t: raw.time != null ? raw.time : (raw.minute != null ? raw.minute : null)
      });
    });
  });
  return events;
}

async function fetchApi(cdp, apiPath) {
  const expression = `(async()=>{const r=await fetch(${JSON.stringify(apiPath)});return {status:r.status,data:r.ok?await r.json():null};})()`;
  let response = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    response = await cdp.evaluate(expression);
    if (response && response.status === 200 && response.data) return response.data;
    await wait(attempt * 1200);
  }
  throw new Error(`SofaScore respondió ${response ? response.status : 'sin datos'} en ${apiPath}`);
}

let cdp;
try {
  const page = await waitForPage();
  cdp = new CDP(page.webSocketDebuggerUrl);
  await cdp.open();

  let apiReady = false;
  for (let i = 0; i < 80; i++) {
    apiReady = await cdp.evaluate("document.body && document.body.innerText.includes('\\\"confirmed\\\":true')");
    if (apiReady) break;
    await wait(500);
  }
  if (!apiReady) throw new Error('SofaScore no habilitó la sesión de datos en Chrome.');

  const bundle = {};
  for (const match of matches) {
    const lineups = await fetchApi(cdp, `/api/v1/event/${match.eventId}/lineups`);
    const homeSide = match.homeEsCC ? 'cc' : 'rv';
    const awaySide = match.homeEsCC ? 'rv' : 'cc';
    const players = [
      ...(((lineups.home || {}).players) || []).map(item => compactPlayer(item, homeSide)),
      ...(((lineups.away || {}).players) || []).map(item => compactPlayer(item, awaySide))
    ].filter(Boolean);
    const item = { j: match.j, homeEsCC: match.homeEsCC, cc: players.filter(p => p.lado === 'cc'), rv: players.filter(p => p.lado === 'rv'), actions: {} };

    if (!lineupsOnly) {
      for (const player of players) {
        try {
          const data = await fetchApi(cdp, `/api/v1/event/${match.eventId}/player/${player.id}/rating-breakdown`);
          item.actions[String(player.id)] = compactEvents(data);
        } catch (error) {
          item.actions[String(player.id)] = [];
        }
        await wait(220);
      }
    }
    bundle[String(match.eventId)] = item;
    console.log(`J${match.j}: ${players.length} jugadores reales`);
  }

  const output = '// Datos reales de acciones por jugador, obtenidos desde SofaScore.\n' +
    '// Regenerar con: npm run data:player-actions\n' +
    `window.CC_ACTIONS_BUNDLE = ${JSON.stringify(bundle)};\n`;
  await writeFile(path.join(root, 'app/cc-actions-data.js'), output);
  console.log(`${lineupsOnly ? 'Alineaciones' : 'Acciones'} reales actualizadas: ${matches.length} partidos.`);
} finally {
  if (cdp) cdp.close();
  child.kill('SIGTERM');
  await Promise.race([
    new Promise(resolve => child.once('exit', resolve)),
    wait(3000)
  ]);
  await rm(profile, { recursive: true, force: true }).catch(() => {});
}
