import { PUBLIC_MODE, PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { LayoutLoad } from './$types';
import { createBrowserClient, isBrowser, parse } from '@supabase/ssr';
import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
import { inject } from '@vercel/analytics';

injectSpeedInsights();
inject({ mode: PUBLIC_MODE as 'production' | 'development' });

export const load: LayoutLoad = async ({ fetch, data, depends }) => {
  depends('supabase:auth');

  const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    global: {
      fetch,
    },
    cookies: {
      get(key) {
        if (!isBrowser()) {
          return JSON.stringify(data.user);
        }

        const cookie = parse(document.cookie);
        return cookie[key];
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    supabase,
    // session,
    user,
  };
};
