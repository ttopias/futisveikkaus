import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  const { user } = await safeGetSession();

  if (!user) {
    error(401, 'Unauthorized');
  }

  return { user };
};

export const actions: Actions = {
  update: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;

    const res = await await supabase.auth.updateUser({
      data: {
        first_name: name,
        updated_at: new Date(),
      },
    });

    if (res.error) {
      return fail(500, {
        name,
      });
    }

    return {
      success: true,
      values: {
        name,
      },
    };
  },

  signout: async ({ locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();

    if (user) {
      await supabase.auth.signOut();

      redirect(303, '/');
    }

    error(401, 'Unauthorized');
  },
};
