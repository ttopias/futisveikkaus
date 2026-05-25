import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { supabaseAdminClient } from '$lib/server/supabaseAdminClient';
import { requireAdmin } from '$lib/server/requireAdmin';
import { MATCH_PARTICIPANT_SELECT } from '$lib/match-participants';
import { enrichPredictionsWithStageDisplay, MATCH_STAGES, visibleStageLabelFi } from '$lib/stages';
import type { MatchStage } from '$lib/stages';
import { isMatchStage } from '$lib/stages';
import { sortPredsByDateTime } from '$lib/utils';
import type { Prediction } from '$lib';

/**
 * Admin guess routes use the service role (RLS bypass). These checks prevent
 * accidental edits after kickoff or on finished matches, which would desync scoring.
 * Pass form field `override=1` to allow pre-finish edits after kickoff only.
 */
async function assertAdminMatchGuessAllowed(
  match_id: string,
  override: boolean,
): Promise<ReturnType<typeof fail> | null> {
  const { data: match, error: matchError } = await supabaseAdminClient
    .from('matches')
    .select('match_id, starts_at, finished')
    .eq('match_id', match_id)
    .maybeSingle();

  if (matchError || !match) {
    return fail(400, { error: 'Ottelua ei löydy' });
  }

  if (match.finished) {
    return fail(400, {
      error:
        'Ottelu on päättynyt — arvauksen muokkaus voi rikkoa pisteet. Muokkaa ottelun tulosta.',
    });
  }

  if (!override && match.starts_at && new Date(match.starts_at) <= new Date()) {
    return fail(400, {
      error: 'Ottelu on alkanut. Valitse "Ohita aloitusaika" vain tarkoitukselliseen korjaukseen.',
    });
  }

  return null;
}

function parseGoals(value: FormDataEntryValue | null): number | null {
  const n = parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n) || n < 0 || n > 99) return null;
  return n;
}

export const load: PageServerLoad = async ({ url, locals: { safeGetSession } }) => {
  const { user } = await safeGetSession();
  requireAdmin(user);

  const stageParam = url.searchParams.get('stage') ?? 'all';
  const stageFilter: MatchStage | 'all' =
    stageParam === 'all' ? 'all' : isMatchStage(stageParam) ? stageParam : 'all';

  let query = supabaseAdminClient.from('guesses').select(
    `
    guess_id,
    profile:user_id (id, first_name),
    match:match_id!inner (
      match_id,
      match_number,
      stage,
      starts_at,
      ${MATCH_PARTICIPANT_SELECT},
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

  if (stageFilter !== 'all') {
    query = query.eq('match.stage', stageFilter);
  }

  const res = await query;

  if (res.error) {
    error(500, res.error.message);
  }

  const guesses = sortPredsByDateTime(
    enrichPredictionsWithStageDisplay(res.data as unknown as Prediction[]),
  );

  const stageOptions = [
    { value: 'all', label: 'Kaikki vaiheet' },
    ...MATCH_STAGES.map((stage) => ({
      value: stage,
      label: visibleStageLabelFi(stage),
    })),
  ];

  return { guesses, stageFilter, stageOptions };
};

export const actions: Actions = {
  update: async ({ request, locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    requireAdmin(user);

    const form_data = await request.formData();
    const guess_id = form_data.get('guess_id')?.toString();
    const match_id = form_data.get('match_id')?.toString();
    const home_goals = parseGoals(form_data.get('home_goals'));
    const away_goals = parseGoals(form_data.get('away_goals'));

    if (!guess_id || !match_id || home_goals === null || away_goals === null) {
      return fail(400, { error: 'Puuttuvat tai virheelliset kentät' });
    }

    const override = form_data.get('override') === '1';
    const matchCheck = await assertAdminMatchGuessAllowed(match_id, override);
    if (matchCheck) return matchCheck;

    const res = await supabaseAdminClient
      .from('guesses')
      .update({
        home_goals,
        away_goals,
        points: 0,
        points_calculated: false,
      })
      .match({ guess_id });

    if (res.error) {
      return fail(400, { error: res.error.message });
    }

    return { success: 'Arvaus päivitetty' };
  },

  delete: async ({ request, locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    requireAdmin(user);

    const form_data = await request.formData();
    const guess_id = form_data.get('guess_id')?.toString();

    if (!guess_id) {
      return fail(400, { error: 'Puuttuva arvauksen tunniste' });
    }

    const res = await supabaseAdminClient.from('guesses').delete().match({ guess_id });

    if (res.error) {
      return fail(400, { error: res.error.message });
    }

    return { success: 'Arvaus poistettu' };
  },
};
