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

export function applyStandingsStats(
  standings: User[],
  guesses: CalculatedGuessRow[],
  finishedMatchCount: number,
): void {
  const correctByUser = new Map<string, number>();
  const guessCountByUser = new Map<string, number>();

  for (const g of guesses) {
    guessCountByUser.set(g.user_id, (guessCountByUser.get(g.user_id) ?? 0) + 1);
    if (g.points >= 3) {
      correctByUser.set(g.user_id, (correctByUser.get(g.user_id) ?? 0) + 1);
    }
  }

  for (const row of standings) {
    if (!row.user_id) continue;

    const guessCount = guessCountByUser.get(row.user_id) ?? 0;
    row.avg_points = guessCount ? (row.total_points ?? 0) / guessCount : 0;
    row.correct_pct = finishedMatchCount
      ? ((correctByUser.get(row.user_id) ?? 0) / finishedMatchCount) * 100
      : 0;
  }
}
