import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Prediction } from '$lib';
import { MATCH_PARTICIPANT_SELECT } from '$lib/match-participants';
import { enrichPredictionsWithStageDisplay } from '$lib/stages';
import {
  buildStandingsChartData,
  countCalculatedGuessesByUser,
} from '$lib/standings-chart';
import { supabaseAdminClient } from '$lib/server/supabaseAdminClient';
import { sortPredsByDateTime } from '$lib/utils';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();

  if (!user) {
    error(401, 'Unauthorized');
  }

  const userId = params.userId;

  const [profileRes, standingsRes, matchesRes, allGuessesRes, userGuessesRes] =
    await Promise.all([
      supabase.from('profiles').select('first_name').eq('id', userId).maybeSingle(),
      supabase
        .from('dashboard')
        .select('user_id, first_name, total_points')
        .order('total_points', { ascending: false }),
      supabase
        .from('matches')
        .select('match_id, match_number')
        .eq('finished', true)
        .order('match_number', { ascending: true }),
      supabaseAdminClient
        .from('guesses')
        .select('user_id, match_id, points')
        .eq('points_calculated', true),
      supabaseAdminClient
        .from('guesses')
        .select(
          `
        guess_id,
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
        )
        .eq('user_id', userId)
        .eq('match.finished', true),
    ]);

  if (profileRes.error) {
    error(500, profileRes.error.message);
  }

  if (!profileRes.data) {
    error(404, 'Käyttäjää ei löydy');
  }

  if (standingsRes.error) {
    error(500, standingsRes.error.message);
  }

  if (matchesRes.error) {
    error(500, matchesRes.error.message);
  }

  if (allGuessesRes.error) {
    error(500, allGuessesRes.error.message);
  }

  if (userGuessesRes.error) {
    error(500, userGuessesRes.error.message);
  }

  const guesses = sortPredsByDateTime(
    enrichPredictionsWithStageDisplay(userGuessesRes.data as unknown as Prediction[]),
  );

  const fullChartData = buildStandingsChartData(
    standingsRes.data.map((row) => ({
      user_id: row.user_id,
      first_name: row.first_name,
    })),
    matchesRes.data,
    allGuessesRes.data,
  );

  const thisSeries = fullChartData.series.find((s) => s.userId === userId);
  const chartData = {
    timeline: fullChartData.timeline,
    series: thisSeries ? [thisSeries] : [],
  };
  const playerCount = fullChartData.series.length;
  const guessCounts = countCalculatedGuessesByUser(allGuessesRes.data);
  const showCharts =
    (guessCounts.get(userId) ?? 0) > 1 &&
    chartData.timeline.length > 0 &&
    chartData.series.length > 0;

  return {
    profileName: profileRes.data.first_name,
    guesses,
    chartData,
    playerCount,
    showCharts,
  };
};
