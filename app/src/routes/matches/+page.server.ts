import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Match } from '$lib/index';
import { MATCH_PARTICIPANT_DISPLAY_SELECT } from '$lib/match-participants';
import { enrichMatchesWithStageDisplay } from '$lib/stages';
import { sortByDateTime } from '$lib/utils';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
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
    .order('starts_at', { ascending: true });

  if (res.error) {
    error(500, res.error.message);
  }

  const matches = res.data?.length
    ? sortByDateTime(enrichMatchesWithStageDisplay(res.data as unknown as Match[]))
    : [];

  return { matches };
};
