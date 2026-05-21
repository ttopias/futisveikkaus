import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession } }) => {
  const { user } = await safeGetSession();

  return {
    user,
  };
};
