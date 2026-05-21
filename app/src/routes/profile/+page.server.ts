import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
  const { user } = await safeGetSession();

  if (!user) {
    error(401, 'Unauthorized');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, first_name')
    .eq('id', user.id)
    .maybeSingle();

  return { user, profile };
};

export const actions: Actions = {
  update: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();
    if (!user) {
      return fail(401, { error: 'Unauthorized' });
    }

    const form_data = await request.formData();
    const email = form_data.get('email')?.toString();
    const first_name = form_data.get('first_name')?.toString()?.trim();

    if (!first_name) {
      return fail(400, { error: 'Username is required', email, first_name });
    }

    const { data: taken } = await supabase
      .from('profiles')
      .select('id')
      .eq('first_name', first_name)
      .neq('id', user.id)
      .maybeSingle();

    if (taken) {
      return fail(400, {
        error: 'This username is already taken',
        email,
        first_name,
      });
    }

    const profileRes = await supabase.from('profiles').update({ first_name }).eq('id', user.id);

    if (profileRes.error) {
      return fail(400, {
        error: profileRes.error.message,
        email,
        first_name,
      });
    }

    const authRes = await supabase.auth.updateUser({
      email: email || undefined,
      data: { first_name },
    });

    if (authRes.error) {
      return fail(400, {
        error: authRes.error.message,
        email,
        first_name,
      });
    }

    return { email, first_name, success: 'Profile updated' };
  },
};
