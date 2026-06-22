import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Match, Team } from '$lib/index';
import { buildRankedGroups, slotFavourite } from '$lib/bracket-favourite';
import { MATCH_PARTICIPANT_DISPLAY_SELECT } from '$lib/match-participants';
import { enrichMatchesWithStageDisplay } from '$lib/stages';

function isUnresolvedParticipant(team: Team | null | undefined): boolean {
  return !team?.team_id;
}

function enrichR32Favourites(
  matches: Match[],
  rankedGroups: Record<string, Team[]>,
): Match[] {
  return matches.map((match) => {
    if (match.stage !== 'r32') return match;
    return {
      ...match,
      home_favourite:
        match.home_slot && isUnresolvedParticipant(match.home)
          ? slotFavourite(match.home_slot, rankedGroups)
          : null,
      away_favourite:
        match.away_slot && isUnresolvedParticipant(match.away)
          ? slotFavourite(match.away_slot, rankedGroups)
          : null,
    };
  });
}

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const [matchesRes, teamsRes, unfinishedGroupRes] = await Promise.all([
    supabase
      .from('matches')
      .select(
        `
    match_id,
    match_number,
    stage,
    starts_at,
    ${MATCH_PARTICIPANT_DISPLAY_SELECT},
    home_goals,
    away_goals,
    finished
  `,
      )
      .neq('stage', 'group')
      .order('match_number', { ascending: true }),
    supabase
      .from('teams')
      .select('team_id, country_code, name, group, win, draw, loss, gf, gaa'),
    supabase
      .from('matches')
      .select('match_id')
      .eq('stage', 'group')
      .eq('finished', false)
      .limit(1),
  ]);

  if (matchesRes.error) {
    error(500, matchesRes.error.message);
  }

  if (teamsRes.error) {
    error(500, teamsRes.error.message);
  }

  if (unfinishedGroupRes.error) {
    error(500, unfinishedGroupRes.error.message);
  }

  const rankedGroups = buildRankedGroups((teamsRes.data ?? []) as Team[]);
  const baseMatches = matchesRes.data?.length
    ? enrichMatchesWithStageDisplay(matchesRes.data as unknown as Match[])
    : [];
  const matches = enrichR32Favourites(baseMatches, rankedGroups);

  return {
    matches,
    showR32Note: (unfinishedGroupRes.data?.length ?? 0) > 0,
  };
};
