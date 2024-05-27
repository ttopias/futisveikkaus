import type { PageServerLoad } from './$types';
import type { Team } from '$lib/index';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
  const { data, error } = await supabase
    .from('teams')
    .select('team_id, country_code, name, group, win, draw, loss, gf, gaa')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching teams', error.message);
    return { data: null };
  }

  const groupedTeams: { [key: string]: Team[] } = data.reduce((acc: any, team: any) => {
    if (!acc[team.group]) {
      acc[team.group] = [];
    }
    acc[team.group].push(team);
    return acc;
  }, {});

  return { teams: groupedTeams };
};
