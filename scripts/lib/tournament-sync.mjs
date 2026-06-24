import {
  FIXTURE_CSV_URL,
  fetchFixtureCsvText,
  resolveFixtureRows,
} from './fixtures.mjs';
import { runKnockoutParticipantSync } from './knockout-participants.mjs';
import { runMatchResultsSync, resultsFromFixtures } from './update-match-results-core.mjs';

export { FIXTURE_CSV_URL, fetchFixtureCsvText, resolveFixtureRows, resultsFromFixtures };

/**
 * @param {import('@supabase/supabase-js').SupabaseClient | null} client
 * @param {{
 *   dryRun?: boolean,
 *   fixtureRows?: Awaited<ReturnType<typeof resolveFixtureRows>>,
 *   fixtureCsvText?: string,
 *   fixturesFile?: string | null,
 *   fixturesUrl?: string | null,
 *   fixturesTz?: string | null,
 *   fetchCountryNames?: boolean,
 *   earlyUpdateMs?: number,
 * }} [options]
 */
export async function runTournamentSync(client, options = {}) {
  const fixtureRows = await resolveFixtureRows(options);
  if (!fixtureRows.length) {
    throw new Error('No fixture rows parsed. Check fixture CSV source.');
  }

  const sourceResults = resultsFromFixtures(fixtureRows);
  const shared = { ...options, fixtureRows, sourceResults };

  const participants = await runKnockoutParticipantSync(client, shared);
  const results = await runMatchResultsSync(client, shared);

  return { participants, results, fixtureRowCount: fixtureRows.length };
}
