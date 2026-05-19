import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Match } from '$lib/index';
import { MATCH_PARTICIPANT_DISPLAY_SELECT } from '$lib/match-participants';
import { enrichMatchesWithStageDisplay } from '$lib/stages';
import { sortByDateTime } from '$lib/utils';

export const load: PageServerLoad = async ({ locals: { supabase, getVisibleMatchStage } }) => {
  let visibleMatchStage;

  try {
    visibleMatchStage = await getVisibleMatchStage();
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
    ${MATCH_PARTICIPANT_DISPLAY_SELECT},
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

  const matches = res.data?.length
    ? sortByDateTime(enrichMatchesWithStageDisplay(res.data as unknown as Match[]))
    : [];

  return { matches, visibleMatchStage };
};
