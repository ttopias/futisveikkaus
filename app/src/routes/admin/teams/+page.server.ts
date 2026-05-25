import type { Actions, PageServerLoad } from './$types';
import { requireAdmin } from '$lib/server/requireAdmin';
import { supabaseAdminClient } from '$lib/server/supabaseAdminClient';
import { fail } from '@sveltejs/kit';
import type { Team } from '$lib/index';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  const { user } = await safeGetSession();
  requireAdmin(user);

  const { data, error } = await supabaseAdminClient.from('teams').select('*');
  if (error) {
    console.error('Error fetching teams:', error.message);
    return { teams: [] };
  }

  const groupedTeams = data.reduce((acc: Record<string, Team[]>, team: Team) => {
    if (!acc[team.group]) {
      acc[team.group] = [];
    }
    acc[team.group].push(team);
    return acc;
  }, {});

  return { teams: groupedTeams };
};

export const actions: Actions = {
  create: async ({ request, locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    requireAdmin(user);

    const form_data = await request.formData();
    const country_code = form_data.get('country_code')?.toString();
    const name = form_data.get('name')?.toString();
    const group = form_data.get('group')?.toString();

    if (!country_code || !name || !group) {
      return fail(400, { error: 'Missing required fields: country_code, name, or group.' });
    }

    const res = await supabaseAdminClient.from('teams').insert({
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

  update: async ({ request, locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    requireAdmin(user);

    const form_data = await request.formData();
    const team_id = form_data.get('team_id')?.toString();
    const country_code = form_data.get('country_code')?.toString();
    const name = form_data.get('name')?.toString();
    const group = form_data.get('group')?.toString();
    const fifaRaw = form_data.get('fifa_rank')?.toString();
    const fifa_rank = fifaRaw === '' || fifaRaw == null ? null : parseInt(fifaRaw, 10);
    if (fifa_rank !== null && (!Number.isFinite(fifa_rank) || fifa_rank < 1)) {
      return fail(400, { error: 'Virheellinen FIFA-sijoitus' });
    }
    const res = await supabaseAdminClient
      .from('teams')
      .update({
        country_code: country_code,
        name: name,
        group: group,
        fifa_rank,
      })
      .match({ team_id });

    if (res.error) {
      return fail(400, {
        country_code,
        name,
        group,
        error: res.error.message,
      });
    }

    return {
      success: 'Team updated succesfully',
    };
  },

  delete: async ({ request, locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    requireAdmin(user);

    const form_data = await request.formData();
    const team_id = form_data.get('team_id')?.toString();

    if (!team_id) {
      return fail(422, {
        team_id,
        error: 'Invalid data',
      });
    }

    const res = await supabaseAdminClient.from('teams').delete().match({ team_id });
    if (res.error) {
      return fail(400, {
        team_id,
        error: res.error.message,
      });
    }

    return { team_id, success: 'Team deleted succesfully' };
  },
};
