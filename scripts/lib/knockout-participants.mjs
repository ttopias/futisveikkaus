import { parseSlot } from '../../lib/slots.mjs';
import { buildEnglishToFinnishFromTeams, canonicalize, cleanName, resolveEnglishToFinnish } from './team-names.mjs';
import { resolveFixtureRows } from './fixtures.mjs';

/** @typedef {{ type: 'slot', slot: string }} SlotResolution */
/** @typedef {{ type: 'team', teamId: number }} TeamResolution */
/** @typedef {{ type: 'unknown', raw: string }} UnknownResolution */
/** @typedef {SlotResolution | TeamResolution | UnknownResolution} ParticipantResolution */

/** @typedef {{ matchNumber: number, stage: string, homeRaw?: string, awayRaw?: string }} FixtureRow */
/** @typedef {{ match_id: string, match_number: number, stage: string, home_id: number | null, away_id: number | null }} DbKnockoutMatch */
/** @typedef {{ match_id: string, match_number: number, before: { home_id: number | null, away_id: number | null }, after: { home_id: number | null, away_id: number | null }, patch: { home_id?: number, away_id?: number } }} ParticipantUpdate */

/**
 * @param {string | undefined} raw
 * @param {(name: string) => string | null} resolveName
 * @param {Map<string, number>} teamsByFinnishName
 * @returns {ParticipantResolution}
 */
export function resolveParticipant(raw, resolveName, teamsByFinnishName) {
  const slot = parseSlot(raw ?? '');
  if (slot) return { type: 'slot', slot };
  const fiName = resolveName(cleanName(raw ?? ''));
  if (!fiName) return { type: 'unknown', raw: String(raw ?? '') };
  const teamId = teamsByFinnishName.get(fiName);
  if (teamId != null) return { type: 'team', teamId };
  return { type: 'unknown', raw: String(raw ?? '') };
}

/**
 * @param {{ team_id: number, name: string }[]} teams
 * @returns {Map<string, number>}
 */
export function buildTeamsByFinnishName(teams) {
  const map = new Map();
  for (const team of teams) {
    map.set(team.name, team.team_id);
  }
  return map;
}

/**
 * @param {DbKnockoutMatch[]} knockoutMatches
 * @param {FixtureRow[]} fixtureRows
 * @param {Record<string, string>} enToFi
 * @param {Map<string, number>} teamsByFinnishName
 * @returns {{ updates: ParticipantUpdate[], unchanged: number, unknownNames: string[] }}
 */
export function computeKnockoutParticipantUpdates(
  knockoutMatches,
  fixtureRows,
  enToFi,
  teamsByFinnishName,
) {
  const fixturesByNumber = new Map(fixtureRows.map((row) => [row.matchNumber, row]));
  const updates = [];
  let unchanged = 0;
  const unknownNames = new Set();
  const resolveName = canonicalize(enToFi);

  for (const match of knockoutMatches) {
    const row = fixturesByNumber.get(match.match_number);
    if (!row) {
      unchanged += 1;
      continue;
    }

    const homeResolved = resolveParticipant(row.homeRaw, resolveName, teamsByFinnishName);
    const awayResolved = resolveParticipant(row.awayRaw, resolveName, teamsByFinnishName);

    if (homeResolved.type === 'unknown' && homeResolved.raw.trim()) {
      unknownNames.add(homeResolved.raw);
    }
    if (awayResolved.type === 'unknown' && awayResolved.raw.trim()) {
      unknownNames.add(awayResolved.raw);
    }

    /** @type {{ home_id?: number, away_id?: number }} */
    const patch = {};
    if (homeResolved.type === 'team' && homeResolved.teamId !== match.home_id) {
      patch.home_id = homeResolved.teamId;
    }
    if (awayResolved.type === 'team' && awayResolved.teamId !== match.away_id) {
      patch.away_id = awayResolved.teamId;
    }

    if (Object.keys(patch).length === 0) {
      unchanged += 1;
      continue;
    }

    updates.push({
      match_id: match.match_id,
      match_number: match.match_number,
      before: { home_id: match.home_id, away_id: match.away_id },
      after: {
        home_id: patch.home_id ?? match.home_id,
        away_id: patch.away_id ?? match.away_id,
      },
      patch,
    });
  }

  return { updates, unchanged, unknownNames: [...unknownNames].sort() };
}

/**
 * @param {ParticipantUpdate[]} updates
 * @param {number} [limit]
 */
export function formatParticipantPreview(updates, limit = 12) {
  return updates.slice(0, limit).map(
    (u) =>
      `#${u.match_number}: home ${u.before.home_id ?? 'null'}->${u.after.home_id ?? 'null'}, away ${u.before.away_id ?? 'null'}->${u.after.away_id ?? 'null'}`,
  );
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} client
 * @param {ParticipantUpdate[]} updates
 * @param {{ dryRun?: boolean }} [options]
 */
export async function applyParticipantUpdates(client, updates, { dryRun = false } = {}) {
  if (dryRun || updates.length === 0) return;

  for (const update of updates) {
    const { error } = await client
      .from('matches')
      .update(update.patch)
      .eq('match_id', update.match_id);
    if (error) throw error;
  }
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
 *   fetchCountryNames?: boolean,
 *   enToFi?: Record<string, string>,
 * }} [options]
 */
export async function runKnockoutParticipantSync(client, options = {}) {
  const { dryRun = false, fetchCountryNames = false, enToFi: providedEnToFi } = options;

  const fixtureRows = await resolveFixtureRows(options);
  if (!fixtureRows.length) {
    throw new Error('No fixture rows parsed. Check fixture CSV source.');
  }

  if (!client) {
    if (dryRun) {
      return {
        updated: 0,
        unchanged: 0,
        unknownNames: [],
        preview: [],
        fixtureRowCount: fixtureRows.length,
        skippedNoClient: true,
      };
    }
    throw new Error('Set PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in env.');
  }

  const teamsResult = await client.from('teams').select('team_id, name, country_code');
  if (teamsResult.error) throw teamsResult.error;

  const teams = teamsResult.data ?? [];
  const enToFi =
    providedEnToFi ??
    (fetchCountryNames
      ? await resolveEnglishToFinnish(teams)
      : buildEnglishToFinnishFromTeams(teams));
  const teamsByFinnishName = buildTeamsByFinnishName(teams);

  const { data: matches, error } = await client
    .from('matches')
    .select('match_id, match_number, stage, home_id, away_id')
    .neq('stage', 'group')
    .order('match_number');
  if (error) throw error;

  const { updates, unchanged, unknownNames } = computeKnockoutParticipantUpdates(
    matches ?? [],
    fixtureRows,
    enToFi,
    teamsByFinnishName,
  );

  const preview = formatParticipantPreview(updates);

  if (!dryRun) {
    await applyParticipantUpdates(client, updates, { dryRun: false });
  }

  return {
    updated: updates.length,
    unchanged,
    unknownNames,
    preview,
    fixtureRowCount: fixtureRows.length,
    knockoutMatchCount: (matches ?? []).length,
  };
}
