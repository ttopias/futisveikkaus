import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { User } from '$lib/index';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();

  if (!user) {
    error(401, 'Unauthorized');
  }
  let standings = [] as User[];

  const res = await supabase
    .from('dashboard')
    .select('first_name, total_points')
    .order('total_points', { ascending: false });

  if (res.error) {
    console.error('Error fetching data:', res.error.message);
    return { standings };
  }

  standings = res.data as unknown as User[];
  return { standings };
};
