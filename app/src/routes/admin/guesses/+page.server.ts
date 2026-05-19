import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { supabaseAdminClient } from '$lib/server/supabaseAdminClient';
import { requireAdmin } from '$lib/server/requireAdmin';
import { fetchVisibleMatchStage } from '$lib/tournament-stage';
import { MATCH_PARTICIPANT_SELECT } from '$lib/match-participants';
import { enrichPredictionsWithStageDisplay } from '$lib/stages';
import { sortPredsByDateTime } from '$lib/utils';
import type { Prediction } from '$lib';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  const { user } = await safeGetSession();
  requireAdmin(user);

  let visibleMatchStage;
  try {
    visibleMatchStage = await fetchVisibleMatchStage(supabaseAdminClient);
  } catch (e) {
    error(500, e instanceof Error ? e.message : 'Failed to load tournament stage');
  }

  const res = await supabaseAdminClient.from('guesses').select(
    `
    guess_id,
    profile:user_id (id, first_name),
    match:match_id (
      match_id,
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

  if (res.error) {
    error(500, res.error.message);
  }

  let guesses = sortPredsByDateTime(
    enrichPredictionsWithStageDisplay(res.data as unknown as Prediction[]),
  );
  guesses = guesses.filter((g) => g.match.stage === visibleMatchStage);

  return { guesses, visibleMatchStage };
};

export const actions: Actions = {
  create: async ({ request, locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    requireAdmin(user);

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

    const res = await supabaseAdminClient.from('guesses').insert({
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

  update: async ({ request, locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    requireAdmin(user);

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

    const res = await supabaseAdminClient
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

  delete: async ({ request, locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    requireAdmin(user);

    const form_data = await request.formData();
    const guess_id = form_data.get('guess_id')?.toString();

    if (!guess_id) {
      return fail(400, {
        error: 'Missing required fields',
        missing: true,
        values: { guess_id },
      });
    }

    const res = await supabaseAdminClient.from('guesses').delete().match({ guess_id });

    if (res.error) {
      return fail(400, { error: res.error.message, failure: true, values: { guess_id } });
    }

    return { success: 'Guess deleted succesfully' };
  },
};
