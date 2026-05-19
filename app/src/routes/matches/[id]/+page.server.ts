import { MATCH_PARTICIPANT_SELECT } from '$lib/match-participants';
import { enrichMatchWithStageDisplay } from '$lib/stages';
import {
  canViewMatchGuesses,
  fetchVisibleMatchStage,
  isStageAtOrBefore,
} from '$lib/tournament-stage';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Prediction, Match } from '$lib';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
  const match_id = params.id;
  const { user } = await safeGetSession();

  if (!user) {
    error(401, 'Unauthorized');
  }

  let visibleMatchStage;
  try {
    visibleMatchStage = await fetchVisibleMatchStage(supabase);
  } catch (e) {
    error(500, e instanceof Error ? e.message : 'Failed to load tournament stage');
  }

  const m_res = await supabase
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
    .eq('match_id', match_id)
    .maybeSingle();

  if (m_res.error) {
    console.error('error', m_res.error);
    error(500, m_res.error.message);
  }

  if (!m_res.data) {
    error(404, 'Match not found');
  }

  const match = enrichMatchWithStageDisplay(m_res.data as Match);

  if (!isStageAtOrBefore(match.stage, visibleMatchStage)) {
    error(404, 'This match is not available yet');
  }

  const g_res = await supabase
    .from('guesses')
    .select(
      `
        guess_id,
        profile:user_id (id, first_name),
        home_goals,
        away_goals,
        points,
        points_calculated
      `,
    )
    .eq('match_id', match_id);

  if (g_res.error) {
    console.error('error', g_res.error);
    error(500, g_res.error.message);
  }

  let guesses = (g_res.data ?? []) as unknown as Prediction[];

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('id', user.id)
    .maybeSingle();

  const canViewGuesses = canViewMatchGuesses(match, visibleMatchStage);

  if (canViewGuesses && match.finished) {
    guesses = guesses.sort((a, b) => b.points - a.points);
  } else if (canViewGuesses) {
    guesses = guesses.sort((a: Prediction, b: Prediction) => {
      const aName = a.profile?.first_name ?? '';
      const bName = b.profile?.first_name ?? '';
      return aName.localeCompare(bName);
    });
  }

  return {
    guesses,
    match,
    user,
    myProfile,
    visibleMatchStage,
    canViewGuesses,
  };
};
