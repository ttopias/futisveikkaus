import { isAdmin } from '$lib/utils';
import type { LayoutServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession } }) => {
  const { user } = await safeGetSession();

  if (!isAdmin(user?.user_metadata.role)) {
    error(401, 'Unauthorized');
  }

  return {
    user,
  };
};
