import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { supabaseAdminClient } from '$lib/server/supabaseAdminClient';
import type { User } from '@supabase/supabase-js';
import { sortPredsByDateTime } from '$lib/utils';
import type { Prediction } from '$lib';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  let res = await supabase.from('guesses').select(
    `
    guess_id,
    user:user_id (id, first_name),
    match:match_id (
      match_id,
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
  );

  if (res.error) {
    error(500, res.error.message);
  }

  let guesses = sortPredsByDateTime(res.data as unknown as Prediction[]);

  return { guesses };
};

export const actions: Actions = {
  create: async ({ request, locals: { supabase } }) => {
    const form_data = await request.formData();
    const match_id = form_data.get('match_id')?.toString();
    const user_id = form_data.get('user_id')?.toString();
    const home_goals = form_data.get('home_goals');
    const away_goals = form_data.get('away_goals');
    const points = form_data.get('points');
    const points_calculated = form_data.get('points_calculated');

    if (!match_id || !user_id || !home_goals || !away_goals || !points || !points_calculated) {
      return fail(400, {
        error: 'Missing required fields',
        missing: true,
        values: {
          match_id,
          user_id,
          home_goals,
          away_goals,
          points,
          points_calculated,
        },
      });
    }

    const res = await supabase.from('guesses').insert({
      match_id,
      user_id,
      home_goals,
      away_goals,
      points,
      points_calculated,
    });

    if (res.error) {
      return fail(400, {
        error: res.error.message,
        failure: true,
        values: {
          match_id,
          user_id,
          home_goals,
          away_goals,
          points,
          points_calculated,
        },
      });
    }

    return {
      success: 'Guess created succesfully',
    };
  },

  update: async ({ request, locals: { supabase } }) => {
    const form_data = await request.formData();
    const guess_id = form_data.get('guess_id')?.toString();
    const match_id = form_data.get('match_id')?.toString();
    const user_id = form_data.get('user_id')?.toString();
    const home_goals = form_data.get('home_goals');
    const away_goals = form_data.get('away_goals');
    const points = form_data.get('points');
    const points_calculated = form_data.get('points_calculated');

    if (
      !guess_id ||
      !match_id ||
      !user_id ||
      !home_goals ||
      !away_goals ||
      !points ||
      !points_calculated
    ) {
      return fail(400, {
        error: 'Missing required fields',
        missing: true,
        values: {
          guess_id,
          match_id,
          user_id,
          home_goals,
          away_goals,
          points,
          points_calculated,
        },
      });
    }

    const res = await supabase
      .from('guesses')
      .update({
        match_id,
        user_id,
        home_goals,
        away_goals,
        points,
        points_calculated,
      })
      .match({ guess_id });

    if (res.error) {
      return fail(400, {
        error: res.error.message,
        failure: true,
        values: {
          guess_id,
          match_id,
          user_id,
          home_goals,
          away_goals,
          points,
          points_calculated,
        },
      });
    }

    return {
      success: 'Guess updated succesfully',
    };
  },

  delete: async ({ request, locals: { supabase } }) => {
    const form_data = await request.formData();
    const guess_id = form_data.get('guess_id')?.toString();

    if (!guess_id) {
      return fail(400, {
        error: 'Missing required fields',
        missing: true,
        values: { guess_id },
      });
    }

    const res = await supabase.from('guesses').delete().match({ guess_id });

    if (res.error) {
      return fail(400, { error: res.error.message, failure: true, values: { guess_id } });
    }

    return { success: 'Guess deleted succesfully' };
  },
};
