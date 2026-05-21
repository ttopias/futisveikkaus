import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const { data: firstMatch } = await supabase
    .from('matches')
    .select('starts_at')
    .not('starts_at', 'is', null)
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    tournamentStartsAt: firstMatch?.starts_at ?? null,
  };
};
