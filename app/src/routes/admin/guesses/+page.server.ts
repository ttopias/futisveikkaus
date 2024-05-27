import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { supabaseAdminClient } from '$lib/server/supabaseAdminClient';
import type { User } from '@supabase/supabase-js';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  let userQuery = await supabaseAdminClient.auth.admin.listUsers();

  if (userQuery.error) {
    error(500, userQuery.error.message);
  }

  const users = userQuery.data.users;

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
    .order('guess_id', { ascending: true });

  if (res.error) {
    error(500, res.error.message);
  }

  let guesses = res.data.map((guess) => {
    const u = users.find((user: User) => user.id === guess.user_id);
    return {
      ...guess,
      user: u?.user_metadata?.first_name || u?.email || 'Unknown',
    };
  });

  return { guesses, users };
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
