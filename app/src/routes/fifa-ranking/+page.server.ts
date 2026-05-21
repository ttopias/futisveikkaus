import type { PageServerLoad } from './$types';
import type { Team } from '$lib/index';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const { data, error } = await supabase
    .from('teams')
    .select('team_id, country_code, name, fifa_rank, group')
    .not('fifa_rank', 'is', null)
    .order('fifa_rank', { ascending: true });

  if (error) {
    console.error('Error fetching FIFA rankings', error.message);
    return { teams: [] as Team[] };
  }

  return { teams: (data ?? []) as Team[] };
};
