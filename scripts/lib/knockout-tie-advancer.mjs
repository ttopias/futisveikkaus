export function computeKnockoutTieAdvancerPatches(
  feederMatchNumber,
  advancerTeamId,
  loserTeamId,
  downstreamMatches,
) {
  const winnerSlot = `winner:${feederMatchNumber}`;
  const loserSlot = `loser:${feederMatchNumber}`;
  const patches = [];

  for (const match of downstreamMatches) {
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

  await Promise.all(
    patches.map(({ match_id, ...update }) =>
      client
        .from('matches')
        .update(update)
        .eq('match_id', match_id)
        .then(({ error: updateError }) => {
          if (updateError) throw new Error(updateError.message);
        }),
    ),
  );

  return patches.length;
}
