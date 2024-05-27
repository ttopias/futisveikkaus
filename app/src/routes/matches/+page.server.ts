import type { PageServerLoad } from './$types';
import type { Match } from '$lib/index';
import {
  PUBLIC_GROUP_STAGE_ENDS,
  PUBLIC_R16_ENDS,
  PUBLIC_QF_ENDS,
  PUBLIC_SF_ENDS,
} from '$env/static/public';

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

  matches = matches.map((match) => {
    if (new Date(match.date) < new Date(PUBLIC_GROUP_STAGE_ENDS)) {
      return {
        ...match,
        groupStage: true,
        group: match.home.group,
      };
    } else if (new Date(match.date) < new Date(PUBLIC_R16_ENDS)) {
      return {
        ...match,
        groupStage: false,
        group: 'R16',
      };
    } else if (new Date(match.date) < new Date(PUBLIC_QF_ENDS)) {
      return {
        ...match,
        groupStage: false,
        group: 'Välierä',
      };
    }
    if (new Date(match.date) < new Date(PUBLIC_SF_ENDS)) {
      return {
        ...match,
        groupStage: false,
        group: 'Semifinaali',
      };
    }
    return {
      ...match,
      groupStage: false,
      group: 'Finaali',
    };
  });

  return { matches: matches };
};
