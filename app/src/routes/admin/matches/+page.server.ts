import type { Match, Team } from '$lib/index';
import { roleAdmin } from '$lib/utils';
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();

  if (!roleAdmin(user)) {
    return {
      status: 401,
      error: 'Unauthorized',
    };
  }

  let matches: Match[] = [];
  let teams: Team[] = [];

  let { data, error } = await supabase
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

  if (error) {
    console.error('error', error);
    return {
      status: 500,
      error: error.message,
    };
  }

  matches = data as unknown as Match[];

  const res = await supabase.from('teams').select('*');

  if (res.error) {
    console.error('Error fetching teams:', res.error.message);
    return { user, matches, teams };
  }

  teams = res.data as unknown as Team[];

  return { user, matches, teams };
};

export const actions: Actions = {
  create: async ({ request, locals: { supabase } }) => {
    const form_data = await request.formData();
    const predictable_until = form_data.get('predictable_until')?.toString();
    const date = form_data.get('date')?.toString();
    const time = form_data.get('time')?.toString();
    const home_id = form_data.get('home_id');
    const away_id = form_data.get('away_id');

    if (!predictable_until || !date || !time || !home_id || !away_id) {
      return fail(400, { error: 'Missing required fields: date, time, home_id, or away_id.' });
    }

    const res = await supabase.from('matches').insert({
      predictable_until: predictable_until,
      date: date,
      time: time,
      home_id: home_id,
      away_id: away_id,
      home_goals: 0,
      away_goals: 0,
      finished: false,
    });

    if (res.error) {
      return fail(400, {
        predictable_until,
        date,
        time,
        home_id,
        away_id,
        error: res.error.message,
      });
    }

    return {
      predictable_until,
      date,
      time,
      home_id,
      away_id,
      success: 'Match created succesfully',
    };
  },

  update: async ({ request, locals: { supabase } }) => {
    const form_data = await request.formData();
    const match_id = parseInt(form_data.get('match_id')?.toString() || '0');
    const predictable_until = form_data.get('predictable_until')?.toString();
    const date = form_data.get('date')?.toString();
    const time = form_data.get('time')?.toString();
    const home_goals = parseInt(form_data.get('home_goals')?.toString() || '0');
    const away_goals = parseInt(form_data.get('away_goals')?.toString() || '0');
    const finished = form_data.get('finished') === 'true';

    if (!match_id) {
      return fail(400, { error: 'Invalid data' });
    }

    const res = await supabase
      .from('matches')
      .update({
        predictable_until: predictable_until,
        date: date,
        time: time,
        home_goals: home_goals,
        away_goals: away_goals,
        finished: finished,
      })
      .eq('match_id', match_id);

    console.log(res);

    if (res.error) {
      console.error('Update failed:', res.error);
      return fail(422, {
        error: res.error.message,
      });
    }

    console.log('Update result:', res.data);

    return {
      success: 'Match updated successfully',
      match_id,
      date,
      time,
      home_goals,
      away_goals,
      finished,
    };
  },

  delete: async ({ request, locals: { supabase } }) => {
    const form_data = await request.formData();
    const match_id = form_data.get('match_id')?.toString();

    if (match_id) {
      const res = await supabase.from('matches').delete().match({ match_id });

      if (res.error) {
        console.error('Delete failed:', res.error);
        return fail(400, {
          match_id,
          error: res.error.message,
        });
      }
    } else {
      return fail(422, {
        match_id,
        error: 'Invalid data',
      });
    }

    return {
      match_id,
      success: 'Match deleted succesfully',
    };
  },
};
