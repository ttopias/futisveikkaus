import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Prediction, User } from '$lib/index';
import { MATCH_PARTICIPANT_SELECT } from '$lib/match-participants';
import { groupByUser, sortPredsByDateTime, transformDataForChart } from '$lib/utils';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();

  if (!user) {
    error(401, 'Unauthorized');
  }
  let standings = [] as User[];
  let predictions = [] as Prediction[];

  const res = await supabase
    .from('dashboard')
    .select('user_id, first_name, total_points')
    .order('total_points', { ascending: false });

  if (res.error) {
    console.error('Error fetching data:', res.error.message);
    return { standings, predictions };
  }
  standings = res.data as unknown as User[];

  const sec_res = await supabase.from('guesses').select(
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

  if (sec_res.error) {
    return { standings, predictions: [], chartData: [] };
  }
  predictions = sortPredsByDateTime(sec_res.data as unknown as Prediction[]).filter(
    (p) => p.points_calculated,
  );

  const groupedPredictions = groupByUser(predictions);
  const chartData = transformDataForChart(groupedPredictions);

  return { standings, chartData };
};
