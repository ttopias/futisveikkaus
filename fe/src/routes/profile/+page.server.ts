import { error } from '@sveltejs/kit';
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
    const form_data = await request.formData();
    const email = form_data.get('email')?.toString();
    const first_name = form_data.get('first_name')?.toString();

    const res = await supabase.auth.updateUser({
      data: {
        first_name: first_name,
      },
    });

    if (res.error) {
      console.log(res.error);
      return {
        error: res.error.message,
        email,
        first_name,
      };
    }

    return { email, first_name, success: 'Profile updated' };
  },
};
