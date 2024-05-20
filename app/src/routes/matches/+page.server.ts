import type { PageServerLoad } from './$types';
import type { Match } from '$lib/index';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  let matches: Match[] = [];

  const { data, error } = await supabase
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

  if (error) {
    return {
      status: 500,
      error: error.message,
    };
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return { matches: matches };
  }

  matches = data as unknown as Match[];

  return { matches: matches };
};
