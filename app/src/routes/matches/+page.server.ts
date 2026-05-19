import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Match } from '$lib/index';
import { fetchVisibleMatchStage, filterMatchesByVisibleStage } from '$lib/tournament-stage';
import { MATCH_PARTICIPANT_SELECT } from '$lib/match-participants';
import { enrichMatchesWithStageDisplay } from '$lib/stages';
import { sortByDateTime } from '$lib/utils';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  let matches: Match[] = [];
  let visibleMatchStage;

  try {
    visibleMatchStage = await fetchVisibleMatchStage(supabase);
  } catch (e) {
    error(500, e instanceof Error ? e.message : 'Failed to load tournament stage');
  }

  const res = await supabase
    .from('matches')
    .select(
      `
    match_id,
    stage,
    starts_at,
    ${MATCH_PARTICIPANT_SELECT},
    home_goals,
    away_goals,
    finished
  `,
    )
    .eq('stage', visibleMatchStage)
    .order('starts_at', { ascending: true });

  if (res.error) {
    error(500, res.error.message);
  }

  if (!res.data || (Array.isArray(res.data) && res.data.length === 0)) {
    return { matches, visibleMatchStage };
  }

  matches = res.data as unknown as Match[];
  matches = filterMatchesByVisibleStage(matches, visibleMatchStage);
  matches = sortByDateTime(enrichMatchesWithStageDisplay(matches));

  return { matches, visibleMatchStage };
};
