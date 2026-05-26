#!/usr/bin/env node
/**
 * Update finished match scores from the fixture CSV (same source as scrape-wikipedia).
 * Only touches home_goals, away_goals, and finished on existing rows (keyed by match_number).
 *
 *   node scripts/update-match-results.mjs --dry-run --env app/.env.local
 *   node scripts/update-match-results.mjs --write --env app/.env.local
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { loadEnvFiles } from './lib/db-env.mjs';
import { FIXTURE_CSV_URL, loadFixtures, parseScore } from './lib/fixtures.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const APP_DIR = path.join(REPO_ROOT, 'app');
const require = createRequire(path.join(APP_DIR, 'package.json'));
const { createClient } = require('@supabase/supabase-js');

function parseArgs(argv) {
  const args = {
    dryRun: true,
    env: null,
    fixturesFile: null,
    fixturesUrl: null,
    fixturesTz: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--write') args.dryRun = false;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--env' && argv[i + 1]) args.env = argv[++i];
    else if (a === '--fixtures-file' && argv[i + 1]) args.fixturesFile = argv[++i];
    else if (a === '--fixtures-url' && argv[i + 1]) args.fixturesUrl = argv[++i];
    else if (a === '--fixtures-tz' && argv[i + 1]) args.fixturesTz = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log(`Usage: node scripts/update-match-results.mjs [options]

  --env PATH              Env file (default: app/.env.local)
  --fixtures-file PATH    Local fixture CSV (same as scrape-wikipedia)
  --fixtures-url URL      Remote fixture CSV (default: ${FIXTURE_CSV_URL})
  --fixtures-tz TZ        UTC or Europe/Helsinki
  --dry-run | --write     Preview or apply (default: dry-run)

Updates only home_goals, away_goals, finished on existing matches (by match_number).
`);
      process.exit(0);
    }
  }
  return args;
}

function resultsFromFixtures(fixtureRows) {
  const byNumber = new Map();
  for (const row of fixtureRows) {
    const [home_goals, away_goals, finished] = parseScore(row.result);
    if (!finished) continue;
    byNumber.set(row.matchNumber, { home_goals, away_goals, finished });
  }
  return byNumber;
}

function needsUpdate(dbRow, source) {
  return (
    dbRow.home_goals !== source.home_goals ||
    dbRow.away_goals !== source.away_goals ||
    dbRow.finished !== source.finished
  );
}

async function main() {
  const args = parseArgs(process.argv);
  await loadEnvFiles(args.env);

  const fixtureRows = await loadFixtures({
    fixturesFile: args.fixturesFile,
    fixturesUrl: args.fixturesUrl,
    fixturesTz: args.fixturesTz,
  });
  if (!fixtureRows.length) {
    throw new Error('No fixture rows parsed. Check --fixtures-file / --fixtures-url.');
  }

  const sourceResults = resultsFromFixtures(fixtureRows);
  console.log(`Fixture CSV: ${fixtureRows.length} rows, ${sourceResults.size} with known results.`);

  const url = String(process.env.PUBLIC_SUPABASE_URL ?? '').trim();
  const key = String(process.env.SUPABASE_SECRET_KEY ?? '').trim();
  if (!url || !key || url.includes('dummy')) {
    if (args.dryRun) {
      console.log('Dry-run: no Supabase credentials, skipping DB phase.');
      return;
    }
    throw new Error('Set PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in env.');
  }

  const client = createClient(url, key);
  const { data: matches, error } = await client
    .from('matches')
    .select('match_id, match_number, home_goals, away_goals, finished')
    .order('match_number');
  if (error) throw error;

  const updates = [];
  let unchanged = 0;
  let noSource = 0;

  for (const row of matches ?? []) {
    const source = sourceResults.get(row.match_number);
    if (!source) {
      noSource += 1;
      continue;
    }
    if (!needsUpdate(row, source)) {
      unchanged += 1;
      continue;
    }
    updates.push({
      match_id: row.match_id,
      match_number: row.match_number,
      before: {
        home_goals: row.home_goals,
        away_goals: row.away_goals,
        finished: row.finished,
      },
      after: source,
    });
  }

  if (!updates.length) {
    console.log(
      `No changes needed (${unchanged} already match source, ${noSource} DB rows without CSV result).`,
    );
    return;
  }

  const preview = updates
    .slice(0, 12)
    .map(
      (u) =>
        `#${u.match_number}: ${u.before.home_goals ?? '?'}-${u.before.away_goals ?? '?'} (${u.before.finished ? 'done' : 'open'}) -> ${u.after.home_goals}-${u.after.away_goals} (finished)`,
    );
  console.log(`Would update ${updates.length} match(es). Sample:\n  ${preview.join('\n  ')}`);

  if (args.dryRun) {
    console.log('Dry-run: no database writes.');
    return;
  }

  for (const u of updates) {
    const { error: updErr } = await client
      .from('matches')
      .update({
        home_goals: u.after.home_goals,
        away_goals: u.after.away_goals,
        finished: u.after.finished,
      })
      .eq('match_id', u.match_id);
    if (updErr) throw updErr;
  }

  console.log(`Updated ${updates.length} match(es).`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
