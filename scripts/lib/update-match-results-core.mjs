import { parseScore } from './fixtures.mjs';

/** @typedef {{ matchNumber: number, result?: string }} FixtureRow */
/** @typedef {{ home_goals: number, away_goals: number, finished: boolean }} MatchResult */
/** @typedef {{ match_id: string, match_number: number, home_goals: number | null, away_goals: number | null, finished: boolean }} DbMatchRow */
/** @typedef {{ match_id: string, match_number: number, before: { home_goals: number | null, away_goals: number | null, finished: boolean }, after: MatchResult }} MatchUpdate */

/**
 * @param {FixtureRow[]} fixtureRows
 * @returns {Map<number, MatchResult>}
 */
export function resultsFromFixtures(fixtureRows) {
  const byNumber = new Map();
  for (const row of fixtureRows) {
    const [home_goals, away_goals, finished] = parseScore(row.result);
    if (!finished || home_goals === null || away_goals === null) continue;
    byNumber.set(row.matchNumber, { home_goals, away_goals, finished: true });
  }
  return byNumber;
}

/**
 * @param {DbMatchRow} dbRow
 * @param {MatchResult} source
 */
export function needsUpdate(dbRow, source) {
  return (
    dbRow.home_goals !== source.home_goals ||
    dbRow.away_goals !== source.away_goals ||
    dbRow.finished !== source.finished
  );
}

/**
 * @param {DbMatchRow[]} matches
 * @param {Map<number, MatchResult>} sourceResults
 * @returns {{ updates: MatchUpdate[], unchanged: number, noSource: number }}
 */
export function computeMatchUpdates(matches, sourceResults) {
  const updates = [];
  let unchanged = 0;
  let noSource = 0;

  for (const row of matches) {
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

  return { updates, unchanged, noSource };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} client
 * @param {MatchUpdate[]} updates
 * @param {{ dryRun?: boolean }} [options]
 */
export async function applyMatchUpdates(client, updates, { dryRun = false } = {}) {
  if (dryRun || updates.length === 0) return;

  for (const u of updates) {
    const { error } = await client
      .from('matches')
      .update({
        home_goals: u.after.home_goals,
        away_goals: u.after.away_goals,
        finished: u.after.finished,
      })
      .eq('match_id', u.match_id);
    if (error) throw error;
  }
}

/**
 * @param {MatchUpdate[]} updates
 * @param {number} [limit]
 */
export function formatUpdatePreview(updates, limit = 12) {
  return updates.slice(0, limit).map(
    (u) =>
      `#${u.match_number}: ${u.before.home_goals ?? '?'}-${u.before.away_goals ?? '?'} (${u.before.finished ? 'done' : 'open'}) -> ${u.after.home_goals}-${u.after.away_goals} (finished)`,
  );
}
