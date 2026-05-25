import type { User } from '@supabase/supabase-js';
import { supabaseAdminClient } from '$lib/server/supabaseAdminClient';

export type AdminUserRow = {
  id: string;
  first_name: string;
  email: string | null;
  role: string;
  total_points: number;
};

async function listAllAuthUsers(): Promise<User[]> {
  const users: User[] = [];
  let page = 1;
  for (;;) {
    const { data, error } = await supabaseAdminClient.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
    page += 1;
  }
  return users;
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const [profilesRes, dashboardRes, authUsers] = await Promise.all([
    supabaseAdminClient.from('profiles').select('id, first_name').order('first_name'),
    supabaseAdminClient.from('dashboard').select('user_id, total_points'),
    listAllAuthUsers(),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (dashboardRes.error) throw dashboardRes.error;

  const pointsById = new Map(
    (dashboardRes.data ?? []).map((row) => [row.user_id, row.total_points ?? 0]),
  );
  const authById = new Map(
    authUsers.map((u) => [
      u.id,
      {
        email: u.email ?? null,
        role: typeof u.app_metadata?.role === 'string' ? u.app_metadata.role : 'user',
      },
    ]),
  );

  return (profilesRes.data ?? []).map((profile) => {
    const auth = authById.get(profile.id);
    return {
      id: profile.id,
      first_name: profile.first_name,
      email: auth?.email ?? null,
      role: auth?.role ?? 'user',
      total_points: pointsById.get(profile.id) ?? 0,
    };
  });
}

export async function updateAdminUserName(
  userId: string,
  firstName: string,
): Promise<string | null> {
  const trimmed = firstName.trim();
  if (!trimmed || trimmed.length > 64) {
    return 'Nimi on pakollinen (max 64 merkkiä).';
  }

  const { data: taken } = await supabaseAdminClient
    .from('profiles')
    .select('id')
    .eq('first_name', trimmed)
    .neq('id', userId)
    .maybeSingle();

  if (taken) return 'Käyttäjänimi on jo käytössä.';

  const profileRes = await supabaseAdminClient
    .from('profiles')
    .update({ first_name: trimmed })
    .eq('id', userId);

  if (profileRes.error) return profileRes.error.message;

  const dashboardRes = await supabaseAdminClient
    .from('dashboard')
    .update({ first_name: trimmed })
    .eq('user_id', userId);

  if (dashboardRes.error) return dashboardRes.error.message;

  const { error: authError } = await supabaseAdminClient.auth.admin.updateUserById(userId, {
    user_metadata: { first_name: trimmed },
  });

  if (authError) return authError.message;
  return null;
}

export async function updateAdminUserRole(
  userId: string,
  role: string,
  actorId: string,
): Promise<string | null> {
  if (role !== 'admin' && role !== 'user') {
    return 'Virheellinen rooli.';
  }
  if (userId === actorId && role !== 'admin') {
    return 'Et voi poistaa omaa ylläpitäjärooliasi.';
  }

  const { error } = await supabaseAdminClient.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });

  if (error) return error.message;
  return null;
}
