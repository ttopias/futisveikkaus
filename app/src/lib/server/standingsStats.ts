import type { User } from '$lib/index';
import { fetchAllPages } from '$lib/server/fetchAllPages';
import { supabaseAdminClient } from '$lib/server/supabaseAdminClient';

export type CalculatedGuessRow = {
  user_id: string;
  match_id: number;
  points: number;
};

export async function fetchAllCalculatedGuesses(): Promise<CalculatedGuessRow[]> {
  return fetchAllPages((from, to) =>
    supabaseAdminClient
      .from('guesses')
      .select('user_id, match_id, points')
      .eq('points_calculated', true)
      .order('guess_id')
      .range(from, to),
  );
}

function emptyPointCounts() {
  return { 6: 0, 4: 0, [-2]: 0, [-4]: 0 };
}

export function applyStandingsStats(standings: User[], guesses: CalculatedGuessRow[]): void {
  const guessCountByUser = new Map<string, number>();
  const pointCountsByUser = new Map<string, ReturnType<typeof emptyPointCounts>>();

  for (const g of guesses) {
    guessCountByUser.set(g.user_id, (guessCountByUser.get(g.user_id) ?? 0) + 1);

    if (g.points !== 6 && g.points !== 4 && g.points !== -2 && g.points !== -4) continue;

    const userCounts = pointCountsByUser.get(g.user_id) ?? emptyPointCounts();
    userCounts[g.points as 6 | 4 | -2 | -4] += 1;
    pointCountsByUser.set(g.user_id, userCounts);
  }

  for (const row of standings) {
    if (!row.user_id) continue;

    const guessCount = guessCountByUser.get(row.user_id) ?? 0;
    const counts = pointCountsByUser.get(row.user_id);

    row.avg_points = guessCount ? (row.total_points ?? 0) / guessCount : 0;
    row.points_6 = counts?.[6] ?? 0;
    row.points_4 = counts?.[4] ?? 0;
    row.points_neg2 = counts?.[-2] ?? 0;
    row.points_neg4 = counts?.[-4] ?? 0;
  }
}
