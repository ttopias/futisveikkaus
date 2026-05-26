#!/usr/bin/env node
/**
 * FIFA men's world rankings -> teams.fifa_rank (Finnish team names).
 *
 *   node scripts/scrape-fifa-rankings.mjs --dry-run
 *   node scripts/scrape-fifa-rankings.mjs --write --env app/.env.local
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { loadEnvFiles } from './lib/db-env.mjs';
import {
  HEADERS,
  FIFA_CODE_TO_COUNTRY_CODE,
  NAME_TO_ENGLISH,
  cleanName,
  englishNameFromFifaEntry,
  fetchEnglishToFinnish,
  toFinnish,
} from './lib/team-names.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(REPO_ROOT, 'app');
const require = createRequire(path.join(APP_DIR, 'package.json'));
const { createClient } = require('@supabase/supabase-js');

export const FIFA_RANKINGS_URL = 'https://api.fifa.com/api/v3/rankings?gender=1';

async function fetchRankings(url = FIFA_RANKINGS_URL) {
  console.log(`Fetching FIFA rankings: ${url}`);
  const res = await fetch(url, {
    headers: { ...HEADERS, Accept: 'application/json' },
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const data = await res.json();
  const rows = data?.Results ?? [];
  if (!rows.length) throw new Error('FIFA rankings response had no Results.');
  const pubDate = rows[0]?.PubDate ?? null;
  console.log(`Loaded ${rows.length} ranked teams${pubDate ? ` (published ${pubDate})` : ''}.`);
  return rows;
}

/** Map FIFA API name to Finnish without logging unmapped non-tournament countries. */
function fifaNameToFinnish(english, enToFi) {
  const cleaned = cleanName(english);
  if (!cleaned) return null;
  const canonical = NAME_TO_ENGLISH[cleaned] ?? cleaned;
  return toFinnish(canonical, enToFi);
}

function buildRankLookups(rows, enToFi) {
  const byFinnishName = new Map();
  const byCountryCode = new Map();

  for (const row of rows) {
    const rank = row.Rank;
    const english = englishNameFromFifaEntry(row);
    const fiName = fifaNameToFinnish(english, enToFi);
    if (fiName) byFinnishName.set(fiName, rank);

    const fifaCode = row.IdCountry?.trim();
    const countryCode = fifaCode ? FIFA_CODE_TO_COUNTRY_CODE[fifaCode] : null;
    if (countryCode) byCountryCode.set(countryCode, rank);
  }

  return { byFinnishName, byCountryCode };
}

function matchRankForTeam(team, lookups) {
  if (lookups.byFinnishName.has(team.name)) {
    return { rank: lookups.byFinnishName.get(team.name), via: 'name' };
  }
  if (lookups.byCountryCode.has(team.country_code)) {
    return { rank: lookups.byCountryCode.get(team.country_code), via: 'country_code' };
  }
  return null;
}

async function updateDatabase(teams, lookups, dryRun) {
  const url = String(process.env.PUBLIC_SUPABASE_URL ?? '').trim();
  const key = String(process.env.SUPABASE_SECRET_KEY ?? '').trim();

  if (!url || !key || url.includes('dummy')) {
    if (dryRun) {
      console.log('Dry-run: no Supabase credentials, skipping DB phase.');
      return { updated: 0, unmapped: teams.map((t) => t.name) };
    }
    throw new Error('Set PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in env.');
  }

  const client = createClient(url, key);
  const updates = [];
  const unmapped = [];

  for (const team of teams) {
    const hit = matchRankForTeam(team, lookups);
    if (!hit) {
      unmapped.push(team.name);
      continue;
    }
    updates.push({ team_id: team.team_id, name: team.name, fifa_rank: hit.rank, via: hit.via });
  }

  if (dryRun) {
    console.log(`Dry-run: would set fifa_rank on ${updates.length}/${teams.length} teams.`);
    if (unmapped.length) {
      console.warn(`Dry-run: ${unmapped.length} teams without FIFA rank: ${unmapped.join(', ')}`);
    }
    const preview = updates.slice(0, 8).map((u) => `#${u.fifa_rank} ${u.name}`);
    if (preview.length) console.log(`Sample: ${preview.join('; ')}`);
    return { updated: updates.length, unmapped };
  }

  for (const row of updates) {
    const { error } = await client
      .from('teams')
      .update({ fifa_rank: row.fifa_rank })
      .eq('team_id', row.team_id);
    if (error) throw error;
  }

  console.log(`Updated fifa_rank for ${updates.length}/${teams.length} teams.`);
  if (unmapped.length) {
    console.warn(`Warning: ${unmapped.length} teams without FIFA rank: ${unmapped.join(', ')}`);
  }
  return { updated: updates.length, unmapped };
}

function parseArgs(argv) {
  const args = { dryRun: true, env: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--write') args.dryRun = false;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--env' && argv[i + 1]) args.env = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: node scripts/scrape-fifa-rankings.mjs [options]

  --env PATH            Env file (default: app/.env.local)
  --dry-run | --write   DB mode (default: dry-run)

Source: ${FIFA_RANKINGS_URL}
`);
      process.exit(0);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  await loadEnvFiles(args.env);

  const [rows, enToFi] = await Promise.all([fetchRankings(), fetchEnglishToFinnish()]);
  const lookups = buildRankLookups(rows, enToFi);

  const url = String(process.env.PUBLIC_SUPABASE_URL ?? '').trim();
  const key = String(process.env.SUPABASE_SECRET_KEY ?? '').trim();
  let teams = [];

  if (url && key && !url.includes('dummy')) {
    const client = createClient(url, key);
    const { data, error } = await client
      .from('teams')
      .select('team_id, name, country_code')
      .order('name');
    if (error) throw error;
    teams = data ?? [];
  } else if (args.dryRun) {
    console.log('Dry-run: no Supabase credentials; ranking lookups built only.');
    console.log(`Mapped ${lookups.byFinnishName.size} Finnish names from FIFA list.`);
    return;
  } else {
    throw new Error('Set PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in env.');
  }

  if (!teams.length) {
    console.warn('Warning: no teams in database. Run scrape-wikipedia first.');
    return;
  }

  await updateDatabase(teams, lookups, args.dryRun);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
