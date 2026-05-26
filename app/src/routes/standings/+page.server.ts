import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { User } from '$lib/index';
import { buildStandingsChartData, shouldShowStandingsCharts } from '$lib/standings-chart';
import { supabaseAdminClient } from '$lib/server/supabaseAdminClient';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();

  if (!user) {
    error(401, 'Unauthorized');
  }

  const [standingsRes, matchesRes, guessesRes] = await Promise.all([
    supabase
      .from('dashboard')
      .select('user_id, first_name, total_points')
      .order('total_points', { ascending: false }),
    supabase
      .from('matches')
      .select('match_id, match_number')
      .eq('finished', true)
      .order('match_number', { ascending: true }),
    // All users' calculated guesses: RLS only exposes others after kickoff.
    supabaseAdminClient
      .from('guesses')
      .select('user_id, match_id, points')
      .eq('points_calculated', true),
  ]);

  if (standingsRes.error) {
    console.error('Error fetching standings:', standingsRes.error.message);
    error(500, standingsRes.error.message);
  }

  if (matchesRes.error) {
    console.error('Error fetching finished matches:', matchesRes.error.message);
    error(500, matchesRes.error.message);
  }

  if (guessesRes.error) {
    console.error('Error fetching guesses for chart:', guessesRes.error.message);
    error(500, guessesRes.error.message);
  }

  const standings = standingsRes.data as unknown as User[];
  const chartData = buildStandingsChartData(
    standingsRes.data.map((row) => ({
      user_id: row.user_id,
      first_name: row.first_name,
    })),
    matchesRes.data,
    guessesRes.data,
  );
  const showCharts = shouldShowStandingsCharts(guessesRes.data, chartData);

  return { standings, chartData, showCharts };
};
