#!/usr/bin/env node
/**
 * Update finished match scores from the fixture CSV (same source as scrape-wikipedia).
 * Only touches home_goals, away_goals, and finished on existing rows (keyed by match_number).
 *
 *   node scripts/update-match-results.mjs --dry-run --env app/.env.local
 *   node scripts/update-match-results.mjs --write --env app/.env.local
 */

import { createSupabaseAdminClient, loadEnvFiles } from './lib/db-env.mjs';
import { parseSyncCliArgs } from './lib/sync-cli-args.mjs';
import { runMatchResultsSync } from './lib/update-match-results-core.mjs';

const USAGE = `Usage: node scripts/update-match-results.mjs [options]

  --env PATH              Env file (default: app/.env.local)
  --fixtures-file PATH    Local fixture CSV (same as scrape-wikipedia)
  --fixtures-url URL      Remote fixture CSV (default: {{FIXTURE_CSV_URL}})
  --fixtures-tz TZ        UTC or Europe/Helsinki
  --dry-run | --write     Preview or apply (default: dry-run)

Updates only group-stage home_goals, away_goals, finished on existing matches (by match_number).
Knockout scores must be entered via admin.
`;

async function main() {
  const args = parseSyncCliArgs(process.argv, USAGE);
  await loadEnvFiles(args.env);

  const client = createSupabaseAdminClient();
  const summary = await runMatchResultsSync(client, {
    dryRun: args.dryRun,
    fixturesFile: args.fixturesFile,
    fixturesUrl: args.fixturesUrl,
    fixturesTz: args.fixturesTz,
  });

  console.log(
    `Fixture CSV: ${summary.fixtureRowCount} rows, ${summary.sourceResultCount} with known results.`,
  );

  if (summary.skippedNoClient) {
    console.log('Dry-run: no Supabase credentials, skipping DB phase.');
    return;
  }

  if (!summary.updated) {
    console.log(
      `No changes needed (${summary.unchanged} already match source, ` +
        `${summary.noSource} DB rows without CSV result, ` +
        `${summary.skippedKnockout} knockout skipped).`,
    );
    return;
  }

  console.log(`Would update ${summary.updated} match(es). Sample:\n  ${summary.preview.join('\n  ')}`);

  if (args.dryRun) {
    console.log('Dry-run: no database writes.');
    return;
  }

  console.log(`Updated ${summary.updated} match(es).`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
