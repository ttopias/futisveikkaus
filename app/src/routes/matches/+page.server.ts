import type { PageServerLoad } from './$types';
import type { Match } from '$lib/index';
import { addGroupStageDetails, sortByDateTime } from '$lib/utils';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  let matches: Match[] = [];

  const res = await supabase
    .from('matches')
    .select(
      `
    match_id,
    date,
    time,
    home:home_id (team_id, country_code, name, group, win, draw, loss, gf, gaa),
    away:away_id (team_id, country_code, name, group, win, draw, loss, gf, gaa),
    home_goals,
    away_goals,
    finished
  `,
    )
    .order('date', { ascending: true });

  if (res.error) {
    return {
      status: 500,
      error: res.error.message,
    };
  }

  if (!res.data || (Array.isArray(res.data) && res.data.length === 0)) {
    return { matches: matches };
  }

  matches = res.data as unknown as Match[];
  matches = sortByDateTime(addGroupStageDetails(matches));

  return { matches };
};
