import { error, fail } from '@sveltejs/kit';
import { listAdminUsers, updateAdminUserName, updateAdminUserRole } from '$lib/server/adminUsers';
import { requireAdmin } from '$lib/server/requireAdmin';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  const { user } = await safeGetSession();
  requireAdmin(user);

  try {
    const users = await listAdminUsers();
    return { users, currentUserId: user?.id ?? null };
  } catch (e) {
    error(500, e instanceof Error ? e.message : 'Käyttäjien lataus epäonnistui');
  }
};

export const actions: Actions = {
  updateName: async ({ request, locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    requireAdmin(user);

    const form = await request.formData();
    const userId = form.get('user_id')?.toString();
    const first_name = form.get('first_name')?.toString();

    if (!userId || !first_name) {
      return fail(400, { error: 'Puuttuvat kentät.', user_id: userId });
    }

    const message = await updateAdminUserName(userId, first_name);
    if (message) return fail(400, { error: message, user_id: userId, first_name });

    return { success: 'Nimi päivitetty.', user_id: userId, first_name: first_name.trim() };
  },

  updateRole: async ({ request, locals: { safeGetSession } }) => {
    const { user } = await safeGetSession();
    requireAdmin(user);

    const form = await request.formData();
    const userId = form.get('user_id')?.toString();
    const role = form.get('role')?.toString();

    if (!userId || !role) {
      return fail(400, { error: 'Puuttuvat kentät.', user_id: userId });
    }

    const message = await updateAdminUserRole(userId, role, user?.id ?? '');
    if (message) return fail(400, { error: message, user_id: userId, role });

    return { success: 'Rooli päivitetty.', user_id: userId, role };
  },
};
