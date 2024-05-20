import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Match, Prediction } from '$lib/index';
import { myUser } from '$lib/utils';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();

  let predictions: Prediction[] = [];
  let predictableMatches: Match[] = [];

  if (!myUser(user)) {
    error(401, 'Unauthorized');
  }

  let res = await supabase
    .from('guesses')
    .select(
      `
    guess_id,
    user_id,
    match:match_id (
      match_id,
      date,
      time,
      home:home_id (
        team_id,
        country_code,
        name
      ),
      away:away_id (
        team_id,
        country_code,
        name
      ),
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
    .eq('user_id', user.id);

  predictions = res.data as unknown as Prediction[];

  const predictionsMade = predictions?.map((p: Prediction) => p.match.match_id);

  let query = supabase
    .from('matches')
    .select(
      `
  match_id,
  predictable_until,
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

  if (predictionsMade && predictionsMade.length > 0) {
    query = query.not('match_id', 'in', `(${predictionsMade.join(',')})`);
  }

  const sec_res = await query;

  if (sec_res.error) {
    console.error('Error fetching predictable matches:', error);
    return { user, predictions, predictableMatches };
  }

  predictableMatches = sec_res.data as unknown as Match[];
  predictableMatches = predictableMatches
    .filter((m: Match) => new Date(m.predictable_until) > new Date())
    .map((m: Match, i: number) => {
      m.index = i;
      return m;
    });

  return { user, predictions, predictableMatches };
};

export const actions: Actions = {
  create: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();

    if (!user) {
      return {
        status: 401,
        message: 'Unauthorized',
      };
    }

    const form_data = await request.formData();
    const match_id = form_data.get('match_id');
    const home_goals = form_data.get('home_goals');
    const away_goals = form_data.get('away_goals');

    if (!match_id || !home_goals || !away_goals) {
      return fail(400, {
        message: 'Missing required fields',
        match_id,
        home_goals,
        away_goals,
      });
    }

    const { error } = await supabase.from('guesses').insert({
      user_id: user.id,
      match_id: match_id,
      home_goals: home_goals,
      away_goals: away_goals,
    });

    if (error) {
      console.error('Error creating prediction:', error);
      return fail(422, {
        message: 'Error creating prediction',
        error: error,
      });
    }

    return {
      success: true,
      message: 'Prediction created',
    };
  },

  update: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();

    if (!user) {
      return {
        status: 401,
        message: 'Unauthorized',
      };
    }

    const form_data = await request.formData();
    const guess_id = form_data.get('guess_id');
    const home_goals = form_data.get('home_goals');
    const away_goals = form_data.get('away_goals');

    if (!guess_id || !home_goals || !away_goals) {
      return fail(400, {
        message: 'Missing required fields',
        guess_id,
        home_goals,
        away_goals,
      });
    }

    const { error } = await supabase
      .from('guesses')
      .update({
        home_goals: home_goals,
        away_goals: away_goals,
      })
      .eq('guess_id', guess_id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating prediction:', error);
      return fail(422, {
        message: 'Error updating prediction',
        error: error,
      });
    }

    return {
      success: true,
      message: 'Prediction updated',
    };
  },

  delete: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();

    if (!user) {
      return {
        status: 401,
        message: 'Unauthorized',
      };
    }

    const form_data = await request.formData();
    const guess_id = form_data.get('guess_id');

    if (!guess_id) {
      return fail(400, {
        message: 'Missing required fields',
        guess_id,
      });
    }

    const { error } = await supabase
      .from('guesses')
      .delete()
      .eq('guess_id', guess_id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting prediction:', error);
      return fail(422, {
        message: 'Error deleting prediction',
        error: error,
      });
    }

    return {
      success: true,
      message: 'Prediction deleted',
    };
  },
};
