import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import XLSX from 'xlsx';

const root = process.cwd();
const uploadsDir = path.join(root, 'uploads');
const dataPath = path.join(root, 'app', 'cc-data-2026.js');

const METRIC_COLUMNS = {
  'Goles': 6,
  'xG': 7,
  'Tiros': 8,
  'Tiros al arco %': 10,
  'Pases precisos %': 13,
  'Posesión %': 14,
  'Centros': 47,
  'Córners': 38,
  'Goles en contra': 60,
  'Duelos def. ganados %': 66,
  'Faltas': 75,
  'PPDA': 108
};

const NAME_MAP = new Map([
  ['colo colo', 'Colo-Colo'],
  ['concepcion', 'D. Concepción'],
  ['univ concepcion', 'U. de Concepción'],
  ['la serena', 'Deportes La Serena']
]);

function norm(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalTeamName(rawName) {
  const normalized = norm(rawName);
  return NAME_MAP.get(normalized) || String(rawName || '').trim();
}

function toNumber(value) {
  if (typeof value === 'number') return value;
  const n = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function teamAbbrev(name) {
  return String(name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

function readCurrentData(source) {
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: dataPath });
  if (!sandbox.window.CC_DATA) {
    throw new Error('No se encontró window.CC_DATA en app/cc-data-2026.js');
  }
  return sandbox.window.CC_DATA;
}

function countTeamRows(rows, rawName) {
  const target = norm(rawName);
  return rows.slice(3).filter((row) => norm(row[4]) === target).length;
}

function metricsFromAverageRow(row, pj) {
  const metrics = {};
  for (const [metric, column] of Object.entries(METRIC_COLUMNS)) {
    const value = toNumber(row[column]);
    if (value !== null) metrics[metric] = round2(value);
  }
  metrics._pj = pj;
  metrics._fuente = `Wyscout · promedio ${pj} partidos`;
  return metrics;
}

function weightedAverageMetric(teamMetrics, metric) {
  let numerator = 0;
  let denominator = 0;
  for (const metrics of Object.values(teamMetrics)) {
    if (typeof metrics[metric] !== 'number' || !metrics._pj) continue;
    numerator += metrics[metric] * metrics._pj;
    denominator += metrics._pj;
  }
  return denominator ? round2(numerator / denominator) : 0;
}

const source = await readFile(dataPath, 'utf8');
const data = readCurrentData(source);
const uploadEntries = await readdir(uploadsDir).catch((error) => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
const files = uploadEntries
  .filter((file) => /^Team Stats.*\.xlsx$/i.test(file))
  .sort((a, b) => a.localeCompare(b, 'es'));

if (!files.length) {
  console.warn('Sin archivos Team Stats *.xlsx en uploads/; se conserva app/cc-data-2026.js sin cambios.');
  process.exit(0);
}

const currentTeamCount = Object.keys(data.metricasEquipo || {})
  .filter((name) => name !== 'Promedio adversarios').length;

if (currentTeamCount >= 8 && files.length < currentTeamCount) {
  console.warn(
    `Team Stats incompletos: ${files.length} archivo(s) en uploads/ para una base actual de ${currentTeamCount} equipos. ` +
    'Se conserva app/cc-data-2026.js sin sobrescribir.'
  );
  process.exit(0);
}

const teamMetrics = {};
const teamStatsFiles = {};

for (const file of files) {
  const workbook = XLSX.readFile(path.join(uploadsDir, file), { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
  const rawName = rows[1]?.[0];
  const teamName = canonicalTeamName(rawName);
  const pj = countTeamRows(rows, rawName);

  if (!teamName || !rows[1]) {
    throw new Error(`No se pudo leer la fila de promedios de ${file}`);
  }

  teamMetrics[teamName] = metricsFromAverageRow(rows[1], pj);
  teamStatsFiles[teamName] = file;
}

const orderedMetrics = {};
for (const team of data.equipos || []) {
  if (teamMetrics[team.nombre]) orderedMetrics[team.nombre] = teamMetrics[team.nombre];
}
for (const [teamName, metrics] of Object.entries(teamMetrics)) {
  if (!orderedMetrics[teamName]) orderedMetrics[teamName] = metrics;
}

const promedioLiga = {};
for (const metric of Object.keys(METRIC_COLUMNS)) {
  promedioLiga[metric] = weightedAverageMetric(teamMetrics, metric);
}
promedioLiga._pj = Object.values(teamMetrics).reduce((sum, metrics) => sum + (metrics._pj || 0), 0);
promedioLiga._fuente = `Wyscout · promedio liga (${Object.keys(teamMetrics).length} equipos)`;
orderedMetrics['Promedio adversarios'] = promedioLiga;

const activeTeamNames = Object.keys(orderedMetrics).filter((name) => name !== 'Promedio adversarios');
const previousTeams = new Map((data.equipos || []).map((team) => [team.nombre, team]));

data.equipos = activeTeamNames.map((name) => {
  const existing = previousTeams.get(name);
  return existing || { nombre: name, abrev: teamAbbrev(name) };
});

const activeTeamSet = new Set(activeTeamNames);
if (Array.isArray(data.jugadores)) {
  data.jugadores = data.jugadores.filter((player) => activeTeamSet.has(player.equipo));
}

data.metricasEquipo = orderedMetrics;
data.teamStatsFiles = teamStatsFiles;

const dataset = (data.datasets || []).find((entry) => entry.id === 'team-stats');
if (dataset) {
  dataset.archivo = 'Team Stats *.xlsx';
  dataset.detalle = `${Object.keys(teamMetrics).length} de ${Object.keys(teamMetrics).length} equipos · temporada completa · 109 métricas`;
  dataset.cargado = true;
}

const playersDataset = (data.datasets || []).find((entry) => entry.id === 'jugadores');
if (playersDataset && Array.isArray(data.jugadores)) {
  playersDataset.detalle = `${data.jugadores.length} jugadores · ${activeTeamNames.length} equipos · 115 métricas`;
}

const header = `// ============================================================\n// ColoColo Football Center — DATOS REALES Temporada 2026\n// Generado desde: Team Stats Wyscout (${Object.keys(teamMetrics).length} equipos)\n//                 20206-chile-jugadores.xlsx (${data.jugadores.length} jugadores, liga completa)\n// ============================================================\n`;

await writeFile(dataPath, `${header}window.CC_DATA = ${JSON.stringify(data, null, 1)};\n`);

console.log(`Team Stats actualizados: ${Object.keys(teamMetrics).length} equipos desde uploads/`);
