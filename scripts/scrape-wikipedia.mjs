#!/usr/bin/env node
/**
 * 2026 World Cup scraper: Fixture Download CSV + EN Wikipedia (teams, bracket) -> Finnish names.
 *
 *   node scripts/scrape-wikipedia.mjs --dry-run
 *   node scripts/scrape-wikipedia.mjs --write --env app/.env.local
 *   node scripts/scrape-wikipedia.mjs --csv --output-dir ./tmp/scrape
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { loadEnvFiles } from './lib/db-env.mjs';
import {
  HEADERS,
  canonicalize,
  fetchEnglishToFinnish,
  isoByFinnish,
  isoCode,
  toFinnish,
} from './lib/team-names.mjs';
import { parseSlot } from '../lib/slots.mjs';
import { BRACKET_SLOTS } from './bracket-slots.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(REPO_ROOT, 'app');
const require = createRequire(path.join(APP_DIR, 'package.json'));
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

const WIKI_URL = 'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup';
const FIXTURE_CSV_URL = 'https://fixturedownload.com/download/fifa-world-cup-2026-UTC.csv';
const GROUPS = 'ABCDEFGHIJKL'.split('');
const STAGE_ORDER = ['group', 'r32', 'r16', 'qf', 'sf', 'third', 'final'];

// --- helpers ---

function cleanName(raw) {
  return raw.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
}

function stageForMatch(n) {
  if (n >= 73 && n <= 88) return 'r32';
  if (n >= 89 && n <= 96) return 'r16';
  if (n >= 97 && n <= 100) return 'qf';
  if (n === 101 || n === 102) return 'sf';
  if (n === 103) return 'third';
  if (n === 104) return 'final';
  return 'group';
}

function countByStage(matches) {
  const counts = {};
  for (const m of matches) {
    counts[m.stage] = (counts[m.stage] ?? 0) + 1;
  }
  return counts;
}

function formatStageCounts(counts) {
  const stages = [...new Set([...STAGE_ORDER, ...Object.keys(counts)])];
  return stages.map((stage) => `${stage}: ${counts[stage] ?? 0}`).join(', ');
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

function getHelsinkiOffsetMs(year, month, day) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Helsinki',
    timeZoneName: 'shortOffset',
  }).formatToParts(new Date(Date.UTC(year, month, day, 12, 0)));
  const tz = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+2';
  const m = tz.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!m) return 2 * 3600000;
  const sign = m[1] === '+' ? 1 : -1;
  return sign * (Number(m[2]) + (Number(m[3] ?? 0) || 0) / 60) * 3600000;
}

function parseKickoff(dateRaw, sourceTz, matchNumber) {
  const m = dateRaw.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (!m) throw new Error(`Bad kickoff for match #${matchNumber}: "${dateRaw}"`);
  const [, d, mo, y, h, min] = m;
  const wall = { y: +y, mo: +mo, d: +d, h: +h, min: +min };
  let utcMs;
  if (sourceTz === 'UTC') {
    utcMs = Date.UTC(wall.y, wall.mo - 1, wall.d, wall.h, wall.min);
  } else {
    utcMs =
      Date.UTC(wall.y, wall.mo - 1, wall.d, wall.h, wall.min) -
      getHelsinkiOffsetMs(wall.y, wall.mo - 1, wall.d);
  }
  return new Date(utcMs).toISOString();
}

function parseScore(result) {
  const m = result.match(/(\d+)\s*[-–]\s*(\d+)/);
  return m ? [+m[1], +m[2], true] : [null, null, false];
}

async function fetchText(url, timeoutMs = 45000) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

function resolveName(name, canon) {
  const fi = canon(cleanName(name));
  return fi || null;
}

function resolveKoSlots(matchNumber, row, bracketRow) {
  const fromBracket = bracketRow
    ? { home: parseSlot(bracketRow.home_team), away: parseSlot(bracketRow.away_team) }
    : { home: null, away: null };
  const fromCsv = { home: parseSlot(row.homeRaw), away: parseSlot(row.awayRaw) };
  const fallback = BRACKET_SLOTS[matchNumber] ?? {};
  return {
    home_slot: fromBracket.home ?? fromCsv.home ?? fallback.home ?? null,
    away_slot: fromBracket.away ?? fromCsv.away ?? fallback.away ?? null,
  };
}

// --- fixtures CSV ---

function parseFixtureCsv(text, sourceTz) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const col = (name) => header.findIndex((h) => h.includes(name));

  const rows = [];
  for (const line of lines.slice(1)) {
    const c = parseCsvLine(line);
    if (c.length < 6) continue;
    const matchNumber = Number(c[col('match number')]);
    const group = c[col('group')] || null;
    const round = String(c[col('round')] ?? '').toLowerCase();
    let stage = stageForMatch(matchNumber);
    if (group?.startsWith('Group ')) stage = 'group';
    else if (round.includes('round of 32') || round === '4') stage = 'r32';
    else if (round.includes('round of 16') || round === '5') stage = 'r16';
    else if (round.includes('quarter')) stage = 'qf';
    else if (round.includes('semi')) stage = 'sf';
    // Fixture CSV labels both bronze (#103) and final (#104) as "Finals"; match number wins.
    if (matchNumber === 103) stage = 'third';
    else if (matchNumber === 104) stage = 'final';

    rows.push({
      matchNumber,
      dateRaw: c[col('date')],
      homeRaw: c[col('home')],
      awayRaw: c[col('away')],
      group,
      stage,
      sourceTz,
      result: col('result') >= 0 ? c[col('result')] : '',
    });
  }
  return rows;
}

async function loadFixtures({ fixturesFile, fixturesUrl, fixturesTz }) {
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

// --- Wikipedia ---

async function fetchWiki() {
  console.log(`Fetching Wikipedia: ${WIKI_URL}`);
  return cheerio.load(await fetchText(WIKI_URL, 30000));
}

function extractTeams($) {
  const teams = [];
  const seen = new Set();
  const $content = $('#mw-content-text');
  if (!$content.length) return teams;

  let currentGroup = null;
  $content.find('h3, table').each((_, el) => {
    const tag = el.tagName?.toLowerCase() ?? el.name;
    const $el = $(el);

    if (tag === 'h3') {
      const h = $el.text().replace(/\[edit\]/g, '').trim();
      currentGroup =
        h.startsWith('Group ') && GROUPS.includes(h.slice(6)) ? h.slice(6) : null;
      return;
    }
    if (tag !== 'table' || !currentGroup) return;
    if (!($el.attr('class') ?? '').split(/\s+/).includes('wikitable')) return;

    const headers = $el
      .find('th')
      .slice(0, 6)
      .map((__, th) => $(th).text().trim().toLowerCase())
      .get()
      .join(' ');
    if (!headers.includes('team') && !headers.includes('pos')) return;

    $el.find('tr')
      .slice(1)
      .each((__, row) => {
        let teamCell = null;
        $(row)
          .find('td, th')
          .each((___, cell) => {
            const $cell = $(cell);
            const t = $cell.text().trim();
            if ($cell.find('a').length && t.length > 2 && !/^\d+$/.test(t)) {
              teamCell = $cell;
              return false;
            }
          });
        if (!teamCell) return;

        const name = cleanName(teamCell.text().replace(/\s+/g, ' '));
        if (!name || seen.has(name) || name.length < 2) return;
        const skip = ['winner', 'runner', 'qualifier', 'tbd', 'placeholder', 'kolmas', 'voittaja'];
        if (skip.some((p) => name.toLowerCase().includes(p))) return;

        seen.add(name);
        teams.push({ name, group_name: currentGroup });
      });
  });
  return teams;
}

function extractBracket($) {
  const byMatch = new Map();
  const $bracket = $('#Bracket');
  if (!$bracket.length) return byMatch;

  let pastTable = false;
  let stop = false;

  $bracket
    .closest('.mw-heading')
    .nextAll()
    .each((_, el) => {
      if (stop) return false;
      const tag = el.tagName?.toLowerCase() ?? el.name;
      if (tag === 'h2' || (tag === 'div' && $(el).hasClass('mw-heading') && $(el).find('h2').length)) {
        stop = true;
        return false;
      }

      const $el = $(el);
      if (tag === 'table' && !pastTable) {
        pastTable = true;
        return;
      }

      const $boxes = $el.hasClass('footballbox') ? $el : $el.find('.footballbox');
      $boxes.each((__, box) => {
        const $box = $(box);
        const home = cleanName(
          $box.find('.fhome span[itemprop=name], .fhome').first().text().replace(/\s+/g, ' '),
        );
        const away = cleanName(
          $box.find('.faway span[itemprop=name], .faway').first().text().replace(/\s+/g, ' '),
        );
        const matchM = $box.find('.fscore').first().text().match(/Match\s+(\d+)/i);
        if (!home || !away || !matchM) return;
        const n = Number(matchM[1]);
        byMatch.set(n, { home_team: home, away_team: away, stage: stageForMatch(n) });
      });
    });

  return byMatch;
}

function mergeSchedule(fixtureRows, bracket, canon) {
  const matches = [];
  let skipped = 0;

  for (const row of fixtureRows) {
    let starts_at;
    try {
      starts_at = parseKickoff(row.dateRaw, row.sourceTz, row.matchNumber);
    } catch (err) {
      console.error(`Skipping match #${row.matchNumber}: ${err.message}`);
      skipped++;
      continue;
    }

    const bracketRow = bracket.get(row.matchNumber);
    const stage = row.stage === 'group' ? 'group' : (bracketRow?.stage ?? row.stage);
    const [home_goals, away_goals, finished] = parseScore(row.result);

    if (stage === 'group') {
      const home_team = resolveName(row.homeRaw, canon);
      const away_team = resolveName(row.awayRaw, canon);
      if (!home_team || !away_team) {
        console.warn(
          `Skipping group match #${row.matchNumber}: unresolved team (${row.homeRaw} vs ${row.awayRaw}).`,
        );
        skipped++;
        continue;
      }
      matches.push({
        match_number: row.matchNumber,
        stage,
        starts_at,
        home_team,
        away_team,
        home_slot: null,
        away_slot: null,
        home_goals,
        away_goals,
        finished,
      });
      continue;
    }

    const { home_slot, away_slot } = resolveKoSlots(row.matchNumber, row, bracketRow);
    if (!home_slot || !away_slot) {
      console.warn(`Skipping knockout match #${row.matchNumber}: missing slot codes.`);
      skipped++;
      continue;
    }

    matches.push({
      match_number: row.matchNumber,
      stage,
      starts_at,
      home_team: null,
      away_team: null,
      home_slot,
      away_slot,
      home_goals,
      away_goals,
      finished,
    });
  }

  if (skipped) console.warn(`Skipped ${skipped} fixture row(s) due to parse/validation issues.`);
  return matches;
}

// --- output ---

function csvEscape(v) {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function writeTable(filePath, header, rows) {
  const lines = [header.join(','), ...rows.map((r) => r.map(csvEscape).join(','))];
  fs.writeFileSync(filePath, lines.join('\n') + '\n', 'utf8');
  console.log(`Wrote ${rows.length} rows -> ${filePath}`);
}

function writeCsv(teams, matches, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  writeTable(
    path.join(outputDir, 'teams.csv'),
    ['name', 'country_code', 'group_name'],
    teams.map((t) => [t.name, t.country_code, t.group_name]),
  );
  writeTable(
    path.join(outputDir, 'matches.csv'),
    [
      'match_number',
      'stage',
      'starts_at',
      'home_team',
      'away_team',
      'home_slot',
      'away_slot',
      'home_goals',
      'away_goals',
      'finished',
    ],
    matches.map((m) => [
      m.match_number,
      m.stage,
      m.starts_at,
      m.home_team ?? '',
      m.away_team ?? '',
      m.home_slot ?? '',
      m.away_slot ?? '',
      m.home_goals ?? '',
      m.away_goals ?? '',
      m.finished,
    ]),
  );
}

async function upsertDb(teams, matches, dryRun) {
  const url = String(process.env.PUBLIC_SUPABASE_URL ?? '').trim();
  const key = String(process.env.SUPABASE_SECRET_KEY ?? '').trim();

  if (!url || !key || url.includes('dummy')) {
    if (dryRun) {
      console.log('Dry-run: no Supabase credentials, skipping DB phase.');
      return;
    }
    throw new Error('Set PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in env.');
  }

  const client = createClient(url, key);
  const teamRows = teams.map((t) => ({
    name: t.name,
    country_code: t.country_code,
    group: t.group_name,
    win: 0,
    draw: 0,
    loss: 0,
    gf: 0,
    gaa: 0,
  }));

  const teamNames = new Set(teams.map((t) => t.name));
  const dbMatches = matches.filter((m) => {
    if (m.stage === 'group') {
      if (!teamNames.has(m.home_team) || !teamNames.has(m.away_team)) {
        console.warn(
          `Skipping group match #${m.match_number} for DB: unknown team (${m.home_team} vs ${m.away_team}).`,
        );
        return false;
      }
    }
    return true;
  });

  if (dryRun) {
    const ko = dbMatches.filter((m) => m.stage !== 'group').length;
    console.log(
      `Dry-run: would upsert ${teamRows.length} teams, ${dbMatches.length} matches (${ko} knockout with slot codes).`,
    );
    console.log(`Dry-run stages: ${formatStageCounts(countByStage(dbMatches))}`);
    return;
  }

  const { error: teamsErr } = await client.from('teams').upsert(teamRows, { onConflict: 'name' });
  if (teamsErr) throw teamsErr;

  const { data: teamData, error: selErr } = await client.from('teams').select('team_id, name');
  if (selErr) throw selErr;
  const teamIds = Object.fromEntries(teamData.map((t) => [t.name, t.team_id]));

  const matchRows = [];
  for (const m of dbMatches) {
    const row = {
      match_number: m.match_number,
      stage: m.stage,
      starts_at: m.starts_at,
      finished: m.finished,
    };
    if (m.stage === 'group') {
      const home_id = teamIds[m.home_team];
      const away_id = teamIds[m.away_team];
      if (!home_id || !away_id) {
        throw new Error(`Group match #${m.match_number}: unknown team.`);
      }
      row.home_id = home_id;
      row.away_id = away_id;
    } else {
      row.home_id = null;
      row.away_id = null;
      row.home_slot = m.home_slot;
      row.away_slot = m.away_slot;
    }
    if (m.home_goals != null) row.home_goals = m.home_goals;
    if (m.away_goals != null) row.away_goals = m.away_goals;
    matchRows.push(row);
  }
  const { error: matchErr } = await client.from('matches').upsert(matchRows, { onConflict: 'match_number' });
  if (matchErr) throw matchErr;
  console.log(`Upserted ${teamRows.length} teams and ${matchRows.length} matches.`);
}

function parseArgs(argv) {
  const args = {
    csv: false,
    dryRun: true,
    outputDir: './data',
    env: null,
    fixturesFile: null,
    fixturesUrl: null,
    fixturesTz: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--csv') args.csv = true;
    else if (a === '--write') args.dryRun = false;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--output-dir' && argv[i + 1]) args.outputDir = argv[++i];
    else if (a === '--env' && argv[i + 1]) args.env = argv[++i];
    else if (a === '--fixtures-file' && argv[i + 1]) args.fixturesFile = argv[++i];
    else if (a === '--fixtures-url' && argv[i + 1]) args.fixturesUrl = argv[++i];
    else if (a === '--fixtures-tz' && argv[i + 1]) args.fixturesTz = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: node scripts/scrape-wikipedia.mjs [options]

  --csv                 Write teams.csv and matches.csv
  --output-dir DIR      CSV output (default: ./data)
  --env PATH            Env file (default: app/.env.local)
  --fixtures-file PATH  Local fixture CSV
  --fixtures-url URL    Remote fixture CSV
  --fixtures-tz TZ      UTC or Europe/Helsinki
  --dry-run | --write   DB mode (default: dry-run)
`);
      process.exit(0);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);

  const [fixtureRows, enToFi, $wiki] = await Promise.all([
    loadFixtures(args),
    fetchEnglishToFinnish(),
    fetchWiki(),
  ]);

  const byFi = isoByFinnish(enToFi);
  const canon = canonicalize(enToFi);

  let teams = [];
  for (const t of extractTeams($wiki)) {
    const name = toFinnish(t.name, enToFi);
    if (!name) {
      console.warn(`Warning: skipping Wikipedia team "${t.name}" (no Finnish name).`);
      continue;
    }
    teams.push({ name, country_code: isoCode(name, byFi), group_name: t.group_name });
  }

  if (!fixtureRows.length) {
    throw new Error('No fixture rows parsed from CSV. Check --fixtures-file / --fixtures-url.');
  }
  if (!teams.length) {
    throw new Error('No teams extracted from Wikipedia. Check WIKI_URL and page structure.');
  }

  const bracket = extractBracket($wiki);
  const matches = mergeSchedule(fixtureRows, bracket, canon);

  if (!matches.length) {
    throw new Error('No matches after merge. All fixture rows may have been skipped.');
  }

  const koMatches = matches.filter((m) => m.stage !== 'group').length;
  const stageCounts = countByStage(matches);
  console.log(
    `Done: ${matches.length} matches (${koMatches} knockout with slots), ${teams.length} nations, ${bracket.size} Wikipedia bracket pairings (${fixtureRows.length} CSV rows).`,
  );
  console.log(`Stages: ${formatStageCounts(stageCounts)}`);
  if (matches.length < fixtureRows.length) {
    console.warn(
      `Warning: merged ${matches.length} matches from ${fixtureRows.length} CSV rows (some rows skipped).`,
    );
  }

  if (args.csv) {
    writeCsv(teams, matches, path.resolve(process.cwd(), args.outputDir));
  } else {
    await loadEnvFiles(args.env);
    await upsertDb(teams, matches, args.dryRun);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
