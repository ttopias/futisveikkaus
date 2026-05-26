import { error } from '@sveltejs/kit';
import { requireAdmin } from '$lib/server/requireAdmin';
import { supabaseAdminClient } from '$lib/server/supabaseAdminClient';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  const { user } = await safeGetSession();
  requireAdmin(user);

  const [userCountRes, matchesRes, guessCountRes, recentGuessesRes] = await Promise.all([
    supabaseAdminClient.from('profiles').select('id', { count: 'exact', head: true }),
    supabaseAdminClient.from('matches').select('match_id, finished, starts_at'),
    supabaseAdminClient.from('guesses').select('guess_id', { count: 'exact', head: true }),
    supabaseAdminClient
      .from('guesses')
      .select('guess_id, points, profile:user_id (first_name)')
      .order('guess_id', { ascending: false })
      .limit(8),
  ]);

  if (userCountRes.error) error(500, userCountRes.error.message);
  if (matchesRes.error) error(500, matchesRes.error.message);
  if (guessCountRes.error) error(500, guessCountRes.error.message);
  if (recentGuessesRes.error) error(500, recentGuessesRes.error.message);

  const matches = matchesRes.data ?? [];
  const finishedCount = matches.filter((m) => m.finished).length;
  const upcomingCount = matches.filter((m) => !m.finished).length;

  return {
    stats: {
      userCount: userCountRes.count ?? 0,
      matchCount: matches.length,
      finishedCount,
      upcomingCount,
      guessCount: guessCountRes.count ?? 0,
    },
    recentGuesses: (recentGuessesRes.data ?? []).map((row) => {
      const profile = row.profile as { first_name?: string } | { first_name?: string }[] | null;
      const first_name = Array.isArray(profile) ? profile[0]?.first_name : profile?.first_name;
      return { guess_id: row.guess_id, points: row.points, first_name: first_name ?? null };
    }),
  };
};
