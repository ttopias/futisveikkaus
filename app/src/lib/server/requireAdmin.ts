import { error } from '@sveltejs/kit';
import type { User } from '@supabase/supabase-js';
import { roleAdmin } from '$lib/utils';

export function requireAdmin(user: User | null | undefined): void {
  if (!user) {
    error(401, 'Unauthorized');
  }
  if (!roleAdmin(user)) {
    error(403, 'Forbidden');
  }
}
