import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase }, cookies }) => {
  const [{ user }, { data: firstMatch }] = await Promise.all([
    safeGetSession(),
    supabase
      .from('matches')
      .select('starts_at')
      .not('starts_at', 'is', null)
      .order('starts_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    user,
    cookies: cookies.getAll(),
    tournamentStartsAt: firstMatch?.starts_at ?? null,
  };
};
