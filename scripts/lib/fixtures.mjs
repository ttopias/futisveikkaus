import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HEADERS } from './team-names.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..', '..');

export const FIXTURE_CSV_URL =
  'https://fixturedownload.com/download/fifa-world-cup-2026-UTC.csv';

const STAGE_ORDER = ['group', 'r32', 'r16', 'qf', 'sf', 'third', 'final'];

export function stageForMatch(n) {
  if (n >= 73 && n <= 88) return 'r32';
  if (n >= 89 && n <= 96) return 'r16';
  if (n >= 97 && n <= 100) return 'qf';
  if (n === 101 || n === 102) return 'sf';
  if (n === 103) return 'third';
  if (n === 104) return 'final';
  return 'group';
}

export function parseScore(result) {
  const m = String(result ?? '').match(/(\d+)\s*[-–]\s*(\d+)/);
  return m ? [+m[1], +m[2], true] : [null, null, false];
}

function parseCsvLine(line) {
  const cells = [];
  let cur = '';
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') {
      quoted = !quoted;
      continue;
    }
    if (ch === ',' && !quoted) {
      cells.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

async function fetchText(url, timeoutMs = 45000) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

export function parseFixtureCsv(text, sourceTz) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const col = (name) => header.findIndex((h) => h.includes(name));

  const requiredColumns = ['match number', 'group', 'round'];
  const missing = requiredColumns.filter((name) => col(name) < 0);
  if (missing.length) {
    throw new Error(
      `Fixture CSV missing required column(s): ${missing.join(', ')}. Headers: ${header.join(', ')}`,
    );
  }

  const matchNumberCol = col('match number');
  const groupCol = col('group');
  const roundCol = col('round');

  const rows = [];
  for (const line of lines.slice(1)) {
    const c = parseCsvLine(line);
    if (c.length < 6) continue;
    const matchNumber = Number(c[matchNumberCol]);
    if (!Number.isFinite(matchNumber)) continue;
    const group = c[groupCol] || null;
    const round = String(c[roundCol] ?? '').toLowerCase();
    let stage = stageForMatch(matchNumber);
    if (group?.startsWith('Group ')) stage = 'group';
    else if (round.includes('round of 32') || round === '4') stage = 'r32';
    else if (round.includes('round of 16') || round === '5') stage = 'r16';
    else if (round.includes('quarter')) stage = 'qf';
    else if (round.includes('semi')) stage = 'sf';
    if (matchNumber === 103) stage = 'third';
    else if (matchNumber === 104) stage = 'final';

    rows.push({
      matchNumber,
      stage,
      sourceTz,
      result: col('result') >= 0 ? c[col('result')] : '',
    });
  }
  return rows;
}

export async function loadFixtures({ fixturesFile, fixturesUrl, fixturesTz } = {}) {
  let text;
  let sourceTz = fixturesTz;

  if (fixturesFile) {
    const resolved = path.isAbsolute(fixturesFile)
      ? fixturesFile
      : path.resolve(REPO_ROOT, fixturesFile);
    console.log(`Loading fixtures: ${resolved}`);
    text = fs.readFileSync(resolved, 'utf8');
    if (!sourceTz) sourceTz = resolved.toLowerCase().includes('fle') ? 'Europe/Helsinki' : 'UTC';
  } else {
    const url = fixturesUrl || FIXTURE_CSV_URL;
    console.log(`Fetching fixtures: ${url}`);
    text = await fetchText(url);
    if (!sourceTz) sourceTz = 'UTC';
  }

  if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
    throw new Error('Fixture URL returned HTML. Use --fixtures-file or the direct UTC CSV URL.');
  }
  return parseFixtureCsv(text, sourceTz);
}

export function formatStageCounts(counts) {
  const stages = [...new Set([...STAGE_ORDER, ...Object.keys(counts)])];
  return stages.map((stage) => `${stage}: ${counts[stage] ?? 0}`).join(', ');
}
