import { redirect } from '@sveltejs/kit';
import { safeRedirectPath } from '$lib/server/safeRedirect';

export const GET = async (event) => {
  const {
    url,
    locals: { supabase },
  } = event;
  const code = url.searchParams.get('code') as string;
  const next = safeRedirectPath(url.searchParams.get('next'));

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      throw redirect(303, next);
    }
  }

  throw redirect(303, '/auth/auth-code-error');
};
