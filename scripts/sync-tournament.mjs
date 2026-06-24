#!/usr/bin/env node
/**
 * Sync knockout participants then group-stage match results from the fixture CSV.
 * Same two-step order as GET/POST /api/cron/update-match-results.
 *
 *   node scripts/sync-tournament.mjs --dry-run --env app/.env.local
 *   node scripts/sync-tournament.mjs --write --env app/.env.local
 */

import { createSupabaseAdminClient, loadEnvFiles } from './lib/db-env.mjs';
import { parseSyncCliArgs } from './lib/sync-cli-args.mjs';
import { runTournamentSync } from './lib/tournament-sync.mjs';

const USAGE = `Usage: node scripts/sync-tournament.mjs [options]

Runs in order:
  1. Knockout participants — home_id/away_id from CSV team names
  2. Group match results   — group-stage scores only

Options:
  --env PATH              Env file (default: app/.env.local)
  --fixtures-file PATH    Local fixture CSV
  --fixtures-url URL      Remote fixture CSV (default: {{FIXTURE_CSV_URL}})
  --fixtures-tz TZ        UTC or Europe/Helsinki
  --dry-run | --write     Preview or apply (default: dry-run)
`;

function logSummary(participants, results) {
  console.log(`Fixture CSV: ${participants.fixtureRowCount ?? results.fixtureRowCount} rows.`);

  console.log(
    `\n=== Knockout participants ===\n` +
      `Knockout matches: ${participants.knockoutMatchCount ?? 0}, ` +
      `would update ${participants.updated}, unchanged ${participants.unchanged}.`,
  );
  if (participants.unknownNames?.length) {
    console.log(
      `Unknown names (${participants.unknownNames.length}): ${participants.unknownNames.join(', ')}`,
    );
  }
  if (participants.preview?.length) {
    console.log(`Sample updates:\n  ${participants.preview.join('\n  ')}`);
  } else if (participants.updated === 0) {
    console.log('No participant changes needed.');
  }
  if (participants.skippedNoClient) {
    console.log('Dry-run: no Supabase credentials, skipping DB phase.');
  }

  console.log(
    `\n=== Group match results ===\n` +
      `Fixture rows with results: ${results.sourceResultCount ?? 0}. ` +
      `Would update ${results.updated} match(es).`,
  );
  if (results.preview?.length) {
    console.log(`Sample:\n  ${results.preview.join('\n  ')}`);
  } else if (results.updated === 0) {
    console.log(
      `No changes needed (${results.unchanged} already match source, ` +
        `${results.noSource} DB rows without CSV result, ` +
        `${results.skippedKnockout} knockout skipped).`,
    );
  }
  if (results.skippedNoClient) {
    console.log('Dry-run: no Supabase credentials, skipping DB phase.');
  }
}

async function main() {
  const args = parseSyncCliArgs(process.argv, USAGE);
  await loadEnvFiles(args.env);

  const client = createSupabaseAdminClient();
  const dryRun = args.dryRun;

  const { participants, results } = await runTournamentSync(client, {
    dryRun,
    fixturesFile: args.fixturesFile,
    fixturesUrl: args.fixturesUrl,
    fixturesTz: args.fixturesTz,
    fetchCountryNames: true,
  });

  logSummary(participants, results);

  if (dryRun && !participants.skippedNoClient) {
    console.log('\nDry-run: no database writes.');
  } else if (!dryRun) {
    console.log(
      `\nTournament sync complete. ` +
        `Updated ${participants.updated} knockout + ${results.updated} group match(es).`,
    );
  } else {
    console.log('\nTournament sync preview complete.');
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
