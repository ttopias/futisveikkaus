/** @typedef {{ match_id: number, home_slot: string | null, away_slot: string | null, home_id: number | null, away_id: number | null }} DownstreamKnockoutMatch */
/** @typedef {{ match_id: number, home_id?: number, away_id?: number }} KnockoutTieAdvancerPatch */

/**
 * @param {number} feederMatchNumber
 * @param {number} advancerTeamId
 * @param {number} loserTeamId
 * @param {DownstreamKnockoutMatch[]} downstreamMatches
 * @returns {KnockoutTieAdvancerPatch[]}
 */
export function computeKnockoutTieAdvancerPatches(
  feederMatchNumber,
  advancerTeamId,
  loserTeamId,
  downstreamMatches,
) {
  const winnerSlot = `winner:${feederMatchNumber}`;
  const loserSlot = `loser:${feederMatchNumber}`;
  /** @type {KnockoutTieAdvancerPatch[]} */
  const patches = [];

  for (const match of downstreamMatches) {
    /** @type {KnockoutTieAdvancerPatch} */
    const patch = { match_id: match.match_id };

    if (match.home_slot === winnerSlot) {
      patch.home_id = advancerTeamId;
    } else if (match.home_slot === loserSlot) {
      patch.home_id = loserTeamId;
    }

    if (match.away_slot === winnerSlot) {
      patch.away_id = advancerTeamId;
    } else if (match.away_slot === loserSlot) {
      patch.away_id = loserTeamId;
    }

    if (patch.home_id === undefined && patch.away_id === undefined) {
      continue;
    }

    const homeChanged = patch.home_id !== undefined && patch.home_id !== match.home_id;
    const awayChanged = patch.away_id !== undefined && patch.away_id !== match.away_id;
    if (!homeChanged && !awayChanged) {
      continue;
    }

    patches.push(patch);
  }

  return patches;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} client
 * @param {number} feederMatchNumber
 * @param {number} advancerTeamId
 * @param {number} loserTeamId
 * @returns {Promise<number>}
 */
export async function applyKnockoutTieAdvancer(client, feederMatchNumber, advancerTeamId, loserTeamId) {
  const winnerSlot = `winner:${feederMatchNumber}`;
  const loserSlot = `loser:${feederMatchNumber}`;

  const { data: downstream, error } = await client
    .from('matches')
    .select('match_id, home_slot, away_slot, home_id, away_id')
    .neq('stage', 'group')
    .or(
      `home_slot.eq.${winnerSlot},away_slot.eq.${winnerSlot},home_slot.eq.${loserSlot},away_slot.eq.${loserSlot}`,
    );

  if (error) {
    throw new Error(error.message);
  }

  const patches = computeKnockoutTieAdvancerPatches(
    feederMatchNumber,
    advancerTeamId,
    loserTeamId,
    downstream ?? [],
  );

  for (const patch of patches) {
    const { match_id, ...update } = patch;
    const res = await client.from('matches').update(update).eq('match_id', match_id);
    if (res.error) {
      throw new Error(res.error.message);
    }
  }

  return patches.length;
}
