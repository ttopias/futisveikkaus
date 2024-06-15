import { addGroupStageDetails, myUser } from '$lib/utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Prediction, Match } from '$lib';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
  const match_id = params.id;
  const { user } = await safeGetSession();

  if (!myUser(user)) {
    error(401, 'Unauthorized');
  }

  let guesses: Prediction[] = [];

  const g_res = await supabase
    .from('guesses')
    .select(
      `
        guess_id,
        user:user_id (id, first_name),
        match:match_id (
          match_id,
          predictable_until,
          date,
          time,
          home:home_id (team_id, country_code, name, group, win, draw, loss, gf, gaa),
          away:away_id (team_id, country_code, name, group, win, draw, loss, gf, gaa),
          home_goals,
          away_goals,
          finished
        ),
        home_goals,
        away_goals,
        points,
        points_calculated
      `,
    )
    .eq('match_id', match_id);

  if (g_res.error) {
    console.error('error', g_res.error);
    error(500, g_res.error.message);
  }

  guesses = g_res.data as unknown as Prediction[];
  let match = guesses?.at(0)?.match as unknown as Match;
  match = (addGroupStageDetails([match])[0] as Match) ?? null;

  if (match && match.finished) {
    guesses = guesses.sort((a, b) => {
      if (a.points > b.points) {
        return -1;
      }
      if (a.points < b.points) {
        return 1;
      }
      return 0;
    });
  } else {
    guesses = guesses.sort((a: Prediction, b: Prediction) => {
      if (!a.user?.first_name || !b.user?.first_name) {
        return 0;
      }
      if (a.user?.first_name < b.user?.first_name) {
        return -1;
      }
      if (a.user?.first_name > b.user?.first_name) {
        return 1;
      }
      return 0;
    });
  }

  return { guesses, match, user };
};
