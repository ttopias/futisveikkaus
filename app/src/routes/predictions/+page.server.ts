import { error, fail } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Actions, PageServerLoad } from './$types';
import type { Match, Prediction } from '$lib/index';
import {
  fetchVisibleMatchStage,
  filterMatchesByVisibleStage,
  isMatchInVisibleStage,
} from '$lib/tournament-stage';
import { MATCH_PARTICIPANT_SELECT } from '$lib/match-participants';
import {
  enrichMatchesWithStageDisplay,
  enrichPredictionsWithStageDisplay,
  isMatchPredictable,
} from '$lib/stages';
import type { MatchStage } from '$lib/stages';
import { sortByDateTime, sortPredsByDateTime } from '$lib/utils';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();

  let predictions: Prediction[] = [];
  let predictableMatches: Match[] = [];
  let visibleMatchStage: MatchStage;

  if (!user) {
    error(401, 'Unauthorized');
  }

  try {
    visibleMatchStage = await fetchVisibleMatchStage(supabase);
  } catch (e) {
    error(500, e instanceof Error ? e.message : 'Failed to load tournament stage');
  }

  const res = await supabase.from('guesses').select(
    `
    guess_id,
    user_id,
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

  predictions = res.data as unknown as Prediction[];
  predictions = predictions.filter((p) => p.user_id === user.id);
  predictions = predictions.filter((p) => isMatchInVisibleStage(p.match, visibleMatchStage));

  const predictionsMade = predictions?.map((p: Prediction) => p.match.match_id);

  let query = supabase
    .from('matches')
    .select(
      `
  match_id,
  stage,
  starts_at,
  ${MATCH_PARTICIPANT_SELECT},
  home_goals,
  away_goals,
  finished
`,
    )
    .eq('stage', visibleMatchStage)
    .order('starts_at', { ascending: true });

  if (predictionsMade && predictionsMade.length > 0) {
    query = query.not('match_id', 'in', `(${predictionsMade.join(',')})`);
  }

  const sec_res = await query;

  if (sec_res.error) {
    error(500, sec_res.error.message);
  }

  predictableMatches = sec_res.data as unknown as Match[];
  predictableMatches = filterMatchesByVisibleStage(predictableMatches, visibleMatchStage);
  predictableMatches = predictableMatches
    .filter((m: Match) => isMatchPredictable(m))
    .map((m: Match, i: number) => {
      m.index = i;
      return m;
    });

  predictableMatches = sortByDateTime(enrichMatchesWithStageDisplay(predictableMatches));
  predictions = predictions.filter((p) => p.match.finished === false);
  predictions = sortPredsByDateTime(enrichPredictionsWithStageDisplay(predictions));

  return { user, predictions, predictableMatches, visibleMatchStage };
};

async function assertMatchPredictable(
  supabase: SupabaseClient,
  match_id: FormDataEntryValue | null,
  visibleMatchStage: MatchStage,
) {
  if (!match_id) {
    return fail(400, { message: 'Missing match_id' });
  }

  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('match_id, starts_at, stage')
    .eq('match_id', match_id)
    .maybeSingle();

  if (matchError || !match) {
    return fail(400, { message: 'Match not found' });
  }

  if (!isMatchInVisibleStage(match, visibleMatchStage)) {
    return fail(403, { message: 'This match is not open for predictions yet' });
  }

  if (!isMatchPredictable(match)) {
    return fail(403, { message: 'Predictions are closed for this match' });
  }

  return null;
}

async function assertGuessPredictable(
  supabase: SupabaseClient,
  guess_id: FormDataEntryValue | null,
  user_id: string,
  visibleMatchStage: MatchStage,
) {
  if (!guess_id) {
    return fail(400, { message: 'Missing guess_id' });
  }

  const { data: guess, error: guessError } = await supabase
    .from('guesses')
    .select('guess_id, match:match_id (match_id, starts_at, stage)')
    .eq('guess_id', guess_id)
    .eq('user_id', user_id)
    .maybeSingle();

  if (guessError || !guess) {
    return fail(404, { message: 'Prediction not found' });
  }

  const match = guess.match as unknown as {
    match_id: number;
    starts_at: string;
    stage?: string;
  };

  if (!isMatchInVisibleStage(match, visibleMatchStage)) {
    return fail(403, { message: 'This match is not open for predictions yet' });
  }
  if (!isMatchPredictable(match)) {
    return fail(403, { message: 'Predictions are closed for this match' });
  }

  return null;
}

export const actions: Actions = {
  create: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();

    if (!user) {
      return fail(401, { message: 'Unauthorized' });
    }

    let visibleMatchStage: MatchStage;
    try {
      visibleMatchStage = await fetchVisibleMatchStage(supabase);
    } catch (e) {
      return fail(500, {
        message: e instanceof Error ? e.message : 'Failed to load tournament stage',
      });
    }

    const form_data = await request.formData();
    const match_id = form_data.get('match_id');
    const home_goals = parseInt(form_data.get('home_goals')?.toString() || '0');
    const away_goals = parseInt(form_data.get('away_goals')?.toString() || '0');

    const deadlineCheck = await assertMatchPredictable(supabase, match_id, visibleMatchStage);
    if (deadlineCheck) return deadlineCheck;

    if (!match_id) {
      return fail(400, {
        message: 'Missing required fields',
        match_id,
        home_goals,
        away_goals,
      });
    }

    const { error: insertError } = await supabase.from('guesses').insert({
      user_id: user.id,
      match_id: match_id,
      home_goals: home_goals,
      away_goals: away_goals,
    });

    if (insertError) {
      console.error('Error creating prediction:', insertError);
      return fail(422, {
        message: 'Error creating prediction',
        error: insertError,
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
      return fail(401, { message: 'Unauthorized' });
    }

    let visibleMatchStage: MatchStage;
    try {
      visibleMatchStage = await fetchVisibleMatchStage(supabase);
    } catch (e) {
      return fail(500, {
        message: e instanceof Error ? e.message : 'Failed to load tournament stage',
      });
    }

    const form_data = await request.formData();
    const guess_id = form_data.get('guess_id');
    const home_goals = form_data.get('home_goals');
    const away_goals = form_data.get('away_goals');

    const deadlineCheck = await assertGuessPredictable(
      supabase,
      guess_id,
      user.id,
      visibleMatchStage,
    );
    if (deadlineCheck) return deadlineCheck;

    if (!guess_id || !home_goals || !away_goals) {
      return fail(400, {
        message: 'Missing required fields',
        guess_id,
        home_goals,
        away_goals,
      });
    }

    const { error: updateError } = await supabase
      .from('guesses')
      .update({
        home_goals: home_goals,
        away_goals: away_goals,
      })
      .eq('guess_id', guess_id)
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating prediction:', updateError);
      return fail(422, {
        message: 'Error updating prediction',
        error: updateError,
      });
    }

    return {
      success: true,
      message: 'Prediction updated',
      home_goals,
      away_goals,
    };
  },

  delete: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();

    if (!user) {
      return fail(401, { message: 'Unauthorized' });
    }

    let visibleMatchStage: MatchStage;
    try {
      visibleMatchStage = await fetchVisibleMatchStage(supabase);
    } catch (e) {
      return fail(500, {
        message: e instanceof Error ? e.message : 'Failed to load tournament stage',
      });
    }

    const form_data = await request.formData();
    const guess_id = form_data.get('guess_id');

    const deadlineCheck = await assertGuessPredictable(
      supabase,
      guess_id,
      user.id,
      visibleMatchStage,
    );
    if (deadlineCheck) return deadlineCheck;

    if (!guess_id) {
      return fail(400, {
        message: 'Missing required fields',
        guess_id,
      });
    }

    const { error: deleteError } = await supabase
      .from('guesses')
      .delete()
      .eq('guess_id', guess_id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting prediction:', deleteError);
      return fail(422, {
        message: 'Error deleting prediction',
        error: deleteError,
      });
    }

    return {
      success: true,
      message: 'Prediction deleted',
    };
  },
};
