import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Guess, User } from '$lib/index';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();

  if (!user) {
    error(401, 'Unauthorized');
  }
  let standings = [] as User[];
  let guesses = [] as Guess[];

  const res = await supabase
    .from('dashboard')
    .select('user_id, first_name, total_points')
    .order('total_points', { ascending: false });

  if (res.error) {
    console.error('Error fetching data:', res.error.message);
    return { standings, guesses };
  }
  standings = res.data as unknown as User[];

  const sec_res = await supabase
    .from('guesses')
    .select('user:user_id(first_name), match: match_id(date, finished), points')
    .eq('finished', true)
    .order('date', { ascending: true });

  if (sec_res.error) {
    console.error('Error fetching data:', sec_res.error.message);
    return { standings, guesses };
  }

  guesses = sec_res.data as unknown as Guess[];

  return { standings, guesses };
};
