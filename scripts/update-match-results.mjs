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
import { FIXTURE_CSV_URL, loadFixtures } from './lib/fixtures.mjs';
import {
  applyMatchUpdates,
  computeMatchUpdates,
  formatUpdatePreview,
  resultsFromFixtures,
} from './lib/update-match-results-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.join(path.resolve(__dirname, '..'), 'app');
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

  const { updates, unchanged, noSource } = computeMatchUpdates(matches ?? [], sourceResults);

  if (!updates.length) {
    console.log(
      `No changes needed (${unchanged} already match source, ${noSource} DB rows without CSV result).`,
    );
    return;
  }

  const preview = formatUpdatePreview(updates);
  console.log(`Would update ${updates.length} match(es). Sample:\n  ${preview.join('\n  ')}`);

  if (args.dryRun) {
    console.log('Dry-run: no database writes.');
    return;
  }

  await applyMatchUpdates(client, updates, { dryRun: false });
  console.log(`Updated ${updates.length} match(es).`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
