import type { Actions, PageServerLoad } from './$types';
import { supabaseAdminClient } from '$lib/server/supabaseAdminClient';
import { isAdmin } from '$lib/utils';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  const { user } = await safeGetSession();

  if (!isAdmin(user?.user_metadata.role)) {
    return {
      status: 401,
      error: 'Unauthorized',
    };
  }
  const {
    data: { users },
  } = await supabaseAdminClient.auth.admin.listUsers();

  return { user, users };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const form_data = await request.formData();
    const email = form_data.get('email')?.toString();
    const first_name = form_data.get('first_name')?.toString();
    const role = form_data.get('role')?.toString();
    const password = form_data.get('password')?.toString();

    const res = await supabaseAdminClient.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name: first_name,
        role: role,
        points: 0,
      },
      email_confirm: true,
    });
    // console.log(res)

    if (res.error) {
      return fail(400, {
        email,
        first_name,
        role,
        error: res.error.message,
      });
    }

    return { email, first_name, role, success: 'User created succesfully' };
  },

  delete: async ({ request }) => {
    const form_data = await request.formData();
    const id = form_data.get('id')?.toString();

    if (id) {
      const res = await supabaseAdminClient.auth.admin.deleteUser(id);
      if (res.error) {
        return fail(400, { id, error: res.error.message });
      }
    } else {
      return fail(422, { id, error: 'Invalid data' });
    }
    return { id, success: 'User deleted succesfully' };
  },
};
