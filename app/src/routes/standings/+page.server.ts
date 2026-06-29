import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { User } from '$lib/index';
import { buildStandingsChartData, shouldShowStandingsCharts } from '$lib/standings-chart';
import {
  applyStandingsStats,
  fetchAllCalculatedGuesses,
} from '$lib/server/standingsStats';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();

  if (!user) {
    error(401, 'Unauthorized');
  }

  const [standingsRes, matchesRes, guesses] = await Promise.all([
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
    fetchAllCalculatedGuesses(),
  ]);

  if (standingsRes.error) {
    console.error('Error fetching standings:', standingsRes.error.message);
    error(500, standingsRes.error.message);
  }

  if (matchesRes.error) {
    console.error('Error fetching finished matches:', matchesRes.error.message);
    error(500, matchesRes.error.message);
  }

  const standings = standingsRes.data as unknown as User[];
  applyStandingsStats(standings, guesses);

  const chartData = buildStandingsChartData(
    standingsRes.data.map((row) => ({
      user_id: row.user_id,
      first_name: row.first_name,
    })),
    matchesRes.data,
    guesses,
  );
  const showCharts = shouldShowStandingsCharts(guesses, chartData);

  return { standings, chartData, showCharts };
};
