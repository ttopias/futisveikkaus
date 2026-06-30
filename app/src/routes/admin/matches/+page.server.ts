import type { Match, Team } from '$lib/index';
import { MATCH_PARTICIPANT_SELECT } from '$lib/match-participants';
import { applyKnockoutTieAdvancer } from '$lib/server/knockout-tie-advancer';
import { enrichMatchesWithStageDisplay } from '$lib/stages';
import { sortByDateTime } from '$lib/utils';
import { requireAdmin } from '$lib/server/requireAdmin';
import { supabaseAdminClient } from '$lib/server/supabaseAdminClient';
import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';

function parseOptionalTeamId(value: FormDataEntryValue | null): number | null {
  const raw = value?.toString().trim();
  if (!raw) return null;
  const id = parseInt(raw, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  const { user } = await safeGetSession();
  requireAdmin(user);

  let matches: Match[] = [];
  let teams: Team[] = [];

  const [matchesResult, teamsResult] = await Promise.all([
    supabaseAdminClient.from('matches').select(
      `
    match_id,
    match_number,
    stage,
    starts_at,
    ${MATCH_PARTICIPANT_SELECT},
    home_goals,
    away_goals,
    finished
  `,
    ),
    supabaseAdminClient.from('teams').select('*'),
  ]);

  if (matchesResult.error) {
    console.error('error', matchesResult.error);
    error(500, matchesResult.error.message);
  }

  matches = sortByDateTime(enrichMatchesWithStageDisplay(matchesResult.data as unknown as Match[]));

  if (teamsResult.error) {
    console.error('Error fetching teams:', teamsResult.error.message);
    return { user, matches, teams };
  }

  teams = teamsResult.data as unknown as Team[];

  return { user, matches, teams };
};

function parseStartsAt(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export const actions: Actions = {
  create: async ({ request, locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    requireAdmin(user);

    const form_data = await request.formData();
    const starts_at = parseStartsAt(form_data.get('starts_at')?.toString());
    const home_id = form_data.get('home_id');
    const away_id = form_data.get('away_id');
    const match_number = parseInt(form_data.get('match_number')?.toString() || '0', 10);

    if (!starts_at || !home_id || !away_id || !match_number) {
      return fail(400, {
        error: 'Missing required fields: match_number, starts_at, home_id, or away_id.',
      });
    }

    const res = await supabaseAdminClient.from('matches').insert({
      match_number,
      starts_at,
      home_id: home_id,
      away_id: away_id,
      home_goals: 0,
      away_goals: 0,
      finished: false,
    });

    if (res.error) {
      return fail(400, {
        starts_at,
        home_id,
        away_id,
        error: res.error.message,
      });
    }

    return {
      starts_at,
      home_id,
      away_id,
      success: 'Ottelu lisätty',
    };
  },

  update: async ({ request, locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    requireAdmin(user);

    const form_data = await request.formData();
    const match_id = parseInt(form_data.get('match_id')?.toString() || '0');
    const starts_at = parseStartsAt(form_data.get('starts_at')?.toString());
    const home_goals = parseInt(form_data.get('home_goals')?.toString() || '0');
    const away_goals = parseInt(form_data.get('away_goals')?.toString() || '0');
    const finished = form_data.get('finished') === 'true';
    const advancer_team_id = parseOptionalTeamId(form_data.get('advancer_team_id'));

    if (!match_id) {
      return fail(400, { error: 'Invalid data' });
    }

    const existingRes = await supabaseAdminClient
      .from('matches')
      .select('match_number, stage, home_id, away_id')
      .eq('match_id', match_id)
      .single();

    if (existingRes.error || !existingRes.data) {
      return fail(404, { error: 'Ottelua ei löytynyt' });
    }

    const { match_number, stage, home_id: existingHomeId, away_id: existingAwayId } = existingRes.data;
    const isKnockout = stage !== 'group';
    const isTie = home_goals === away_goals;

    if (isKnockout && finished && isTie) {
      if (!existingHomeId || !existingAwayId) {
        return fail(400, {
          error: 'Tasapelissä molempien joukkueiden täytyy olla tiedossa ennen tuloksen tallennusta.',
          match_id,
          home_goals,
          away_goals,
          finished,
        });
      }
      if (!advancer_team_id) {
        return fail(400, {
          error: 'Valitse jatkoon pääsevä joukkue.',
          needsAdvancer: true,
          match_id,
          home_goals,
          away_goals,
          finished,
        });
      }
      if (advancer_team_id !== existingHomeId && advancer_team_id !== existingAwayId) {
        return fail(400, {
          error: 'Jatkoon valittu joukkue ei ole tässä ottelussa.',
          needsAdvancer: true,
          match_id,
          home_goals,
          away_goals,
          finished,
        });
      }
    }

    const update: Record<string, unknown> = {
      home_goals,
      away_goals,
      finished,
    };
    if (starts_at) {
      update.starts_at = starts_at;
    }

    const res = await supabaseAdminClient.from('matches').update(update).eq('match_id', match_id);

    if (res.error) {
      console.error('Update failed:', res.error);
      return fail(422, {
        error: res.error.message,
        match_id,
        home_goals,
        away_goals,
        finished,
      });
    }

    if (isKnockout && finished && isTie && advancer_team_id && existingHomeId && existingAwayId) {
      const loserTeamId =
        advancer_team_id === existingHomeId ? existingAwayId : existingHomeId;
      try {
        await applyKnockoutTieAdvancer(match_number, advancer_team_id, loserTeamId);
      } catch (err) {
        console.error('Knockout tie advancer failed:', err);
        return fail(422, {
          error:
            'Tulos tallennettiin, mutta seuraavan kierroksen joukkueita ei voitu päivittää. Yritä tallentaa uudelleen.',
          match_id,
          home_goals,
          away_goals,
          finished,
          needsAdvancer: true,
        });
      }
    }

    return {
      success: 'Ottelu päivitetty',
      match_id,
      starts_at,
      home_goals,
      away_goals,
      finished,
    };
  },

  delete: async ({ request, locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    requireAdmin(user);

    const form_data = await request.formData();
    const match_id = form_data.get('match_id')?.toString();

    if (!match_id) {
      return fail(422, {
        match_id,
        error: 'Invalid data',
      });
    }

    const res = await supabaseAdminClient.from('matches').delete().match({ match_id });

    if (res.error) {
      console.error('Delete failed:', res.error);
      return fail(400, {
        match_id,
        error: res.error.message,
      });
    }

    return {
      match_id,
      success: 'Ottelu poistettu',
    };
  },
};
