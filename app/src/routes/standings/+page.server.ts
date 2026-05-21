import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Prediction, User } from '$lib/index';
import { groupByUser, sortPredsByDateTime, transformDataForChart } from '$lib/utils';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();

  if (!user) {
    error(401, 'Unauthorized');
  }
  let standings = [] as User[];
  let predictions = [] as Prediction[];

  const [res, sec_res] = await Promise.all([
    supabase
      .from('dashboard')
      .select('user_id, first_name, total_points')
      .order('total_points', { ascending: false }),
    supabase
      .from('guesses')
      .select(
        `
    guess_id,
    profile:user_id (id, first_name),
    match:match_id (match_id, starts_at),
    points,
    points_calculated
  `,
      )
      .eq('points_calculated', true),
  ]);

  if (res.error) {
    console.error('Error fetching standings:', res.error.message);
    error(500, res.error.message);
  }
  standings = res.data as unknown as User[];

  if (sec_res.error) {
    console.error('Error fetching predictions for chart:', sec_res.error.message);
    error(500, sec_res.error.message);
  }
  predictions = sortPredsByDateTime(sec_res.data as unknown as Prediction[]);

  const groupedPredictions = groupByUser(predictions);
  const chartData = transformDataForChart(groupedPredictions);

  return { standings, chartData };
};
