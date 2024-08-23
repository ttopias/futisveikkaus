import type { Actions, PageServerLoad } from './$types';
import { isAdmin } from '$lib/utils';
import { fail } from '@sveltejs/kit';
import type { Team } from '$lib/index';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
  const { user } = await safeGetSession();

  if (!isAdmin(user.user_metadata.role)) {
    return {
      status: 401,
      error: 'Unauthorized',
    };
  }

  const { data, error } = await supabase.from('teams').select('*');
  if (error) {
    console.error('Error fetching teams:', error.message);
    return { teams: [] };
  }

  const groupedTeams = data.reduce((acc, team: Team) => {
    if (!acc[team.group]) {
      acc[team.group] = [];
    }
    acc[team.group].push(team);
    return acc;
  }, {});

  return { teams: groupedTeams };
};

export const actions: Actions = {
  create: async ({ request, locals: { supabase } }) => {
    const form_data = await request.formData();
    const country_code = form_data.get('country_code')?.toString();
    const name = form_data.get('name')?.toString();
    const group = form_data.get('group')?.toString();

    console.log('country_code: ', country_code);
    console.log('name: ', name);
    console.log('group: ', group);

    if (!country_code || !name || !group) {
      return fail(400, { error: 'Missing required fields: country_code, name, or group.' });
    }

    const res = await supabase.from('teams').insert({
      country_code: country_code,
      name: name,
      group: group,
      win: 0,
      draw: 0,
      loss: 0,
      gf: 0,
      gaa: 0,
    });

    if (res.error) {
      return fail(400, {
        country_code,
        name,
        group,
        error: res.error.message,
      });
    }

    return { success: 'Team created succesfully' };
  },

  update: async ({ request, locals: { supabase } }) => {
    const form_data = await request.formData();
    const team_id = form_data.get('team_id')?.toString();
    const country_code = form_data.get('country_code')?.toString();
    const name = form_data.get('name')?.toString();
    const group = form_data.get('group')?.toString();
    const win = form_data.get('win');
    const draw = form_data.get('draw');
    const loss = form_data.get('loss');
    const gf = form_data.get('gf');
    const gaa = form_data.get('gaa');

    const res = await supabase
      .from('teams')
      .update({
        country_code: country_code,
        name: name,
        group: group,
        win: win,
        draw: draw,
        loss: loss,
        gf: gf,
        gaa: gaa,
      })
      .match({ team_id });

    if (res.error) {
      return fail(400, {
        country_code,
        name,
        group,
        win,
        draw,
        loss,
        gf,
        gaa,
        error: res.error.message,
      });
    }

    return {
      success: 'Team updated succesfully',
    };
  },

  delete: async ({ request, locals: { supabase } }) => {
    const form_data = await request.formData();
    const team_id = form_data.get('team_id')?.toString();

    if (team_id) {
      const res = await supabase.from('teams').delete().match({ team_id });
      if (res.error) {
        return fail(400, {
          team_id,
          error: res.error.message,
        });
      }
    } else {
      return fail(422, {
        team_id,
        error: 'Invalid data',
      });
    }
    return { team_id, success: 'Team deleted succesfully' };
  },
};
