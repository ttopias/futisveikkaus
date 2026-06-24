import { parseScore, resolveFixtureRows } from './fixtures.mjs';

/** @typedef {{ matchNumber: number, result?: string }} FixtureRow */
/** @typedef {{ home_goals: number, away_goals: number, finished: boolean }} MatchResult */
/** @typedef {{ match_id: string, match_number: number, stage?: string, home_goals: number | null, away_goals: number | null, finished: boolean }} DbMatchRow */
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
 * @returns {{ updates: MatchUpdate[], unchanged: number, noSource: number, skippedKnockout: number }}
 */
export function computeMatchUpdates(matches, sourceResults) {
  const updates = [];
  let unchanged = 0;
  let noSource = 0;
  let skippedKnockout = 0;

  for (const row of matches) {
    if (row.stage !== 'group') {
      skippedKnockout += 1;
      continue;
    }
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

  return { updates, unchanged, noSource, skippedKnockout };
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

/**
 * @param {{ starts_at?: string | null }} row
 * @param {number} [now]
 * @param {number} [earlyUpdateMs]
 */
export function canApplyResult(row, now = Date.now(), earlyUpdateMs) {
  if (earlyUpdateMs == null) return true;
  if (row.starts_at == null) return true;
  return new Date(row.starts_at).getTime() + earlyUpdateMs <= now;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient | null} client
 * @param {{
 *   dryRun?: boolean,
 *   fixtureRows?: import('./fixtures.mjs').parseFixtureCsv extends (...args: any) => infer R ? R : never,
 *   fixtureCsvText?: string,
 *   fixturesFile?: string | null,
 *   fixturesUrl?: string | null,
 *   fixturesTz?: string | null,
 *   sourceResults?: Map<number, MatchResult>,
 *   earlyUpdateMs?: number,
 * }} [options]
 */
export async function runMatchResultsSync(client, options = {}) {
  const { dryRun = false, earlyUpdateMs, sourceResults: providedSourceResults } = options;

  const fixtureRows = await resolveFixtureRows(options);
  if (!fixtureRows.length) {
    throw new Error('No fixture rows parsed. Check fixture CSV source.');
  }

  const sourceResults = providedSourceResults ?? resultsFromFixtures(fixtureRows);

  if (!client) {
    if (dryRun) {
      return {
        updated: 0,
        unchanged: 0,
        noSource: 0,
        skippedKnockout: 0,
        skippedEarly: 0,
        preview: [],
        fixtureRowCount: fixtureRows.length,
        sourceResultCount: sourceResults.size,
        skippedNoClient: true,
      };
    }
    throw new Error('Set PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in env.');
  }

  const selectFields =
    earlyUpdateMs != null
      ? 'match_id, match_number, stage, home_goals, away_goals, finished, starts_at'
      : 'match_id, match_number, stage, home_goals, away_goals, finished';

  const { data: matches, error } = await client
    .from('matches')
    .select(selectFields)
    .eq('stage', 'group')
    .order('match_number');
  if (error) throw error;

  const matchRows = matches ?? [];
  const rowById = new Map(matchRows.map((row) => [row.match_id, row]));

  const { updates, unchanged, noSource, skippedKnockout } = computeMatchUpdates(
    matchRows,
    sourceResults,
  );

  const pending = [];
  let skippedEarly = 0;
  for (const update of updates) {
    const row = rowById.get(update.match_id);
    if (!row || !canApplyResult(row, Date.now(), earlyUpdateMs)) {
      skippedEarly += 1;
      continue;
    }
    pending.push(update);
  }

  const preview = formatUpdatePreview(pending);

  if (!dryRun && pending.length > 0) {
    await applyMatchUpdates(client, pending, { dryRun: false });
  }

  return {
    updated: pending.length,
    unchanged,
    noSource,
    skippedKnockout,
    skippedEarly,
    preview,
    fixtureRowCount: fixtureRows.length,
    sourceResultCount: sourceResults.size,
  };
}
