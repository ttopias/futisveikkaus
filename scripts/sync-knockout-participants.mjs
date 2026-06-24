#!/usr/bin/env node
/**
 * Sync knockout match home_id/away_id from fixture CSV team names (slots left unchanged).
 *
 *   node scripts/sync-knockout-participants.mjs --dry-run --env app/.env.local
 *   node scripts/sync-knockout-participants.mjs --write --env app/.env.local
 */

import { createSupabaseAdminClient, loadEnvFiles } from './lib/db-env.mjs';
import { runKnockoutParticipantSync } from './lib/knockout-participants.mjs';
import { parseSyncCliArgs } from './lib/sync-cli-args.mjs';

const USAGE = `Usage: node scripts/sync-knockout-participants.mjs [options]

  --env PATH              Env file (default: app/.env.local)
  --fixtures-file PATH    Local fixture CSV
  --fixtures-url URL      Remote fixture CSV (default: {{FIXTURE_CSV_URL}})
  --fixtures-tz TZ        UTC or Europe/Helsinki
  --dry-run | --write     Preview or apply (default: dry-run)

Updates home_id/away_id on non-group matches when CSV has resolved team names.
`;

async function main() {
  const args = parseSyncCliArgs(process.argv, USAGE);
  await loadEnvFiles(args.env);

  const client = createSupabaseAdminClient();
  const summary = await runKnockoutParticipantSync(client, {
    dryRun: args.dryRun,
    fixturesFile: args.fixturesFile,
    fixturesUrl: args.fixturesUrl,
    fixturesTz: args.fixturesTz,
    fetchCountryNames: true,
  });

  console.log(`Fixture CSV: ${summary.fixtureRowCount} rows.`);
  if (summary.skippedNoClient) {
    console.log('Dry-run: no Supabase credentials, skipping DB phase.');
    return;
  }

  console.log(
    `Knockout matches: ${summary.knockoutMatchCount ?? 0}, ` +
      `would update ${summary.updated}, unchanged ${summary.unchanged}.`,
  );
  if (summary.unknownNames.length) {
    console.log(`Unknown names (${summary.unknownNames.length}): ${summary.unknownNames.join(', ')}`);
  }

  if (!summary.updated) {
    console.log('No participant changes needed.');
    if (args.dryRun) console.log('Dry-run: no database writes.');
    return;
  }

  if (summary.preview.length) {
    console.log(`Sample updates:\n  ${summary.preview.join('\n  ')}`);
  }

  if (args.dryRun) {
    console.log('Dry-run: no database writes.');
    return;
  }

  console.log(`Updated ${summary.updated} knockout match(es).`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
