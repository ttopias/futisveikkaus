import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';
import { fetchVisibleMatchStage } from '$lib/tournament-stage';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return event.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' });
        });
      },
    },
  });

  let sessionPromise: ReturnType<App.Locals['safeGetSession']> | null = null;
  event.locals.safeGetSession = async () => {
    sessionPromise ??= (async () => {
      const {
        data: { session },
      } = await event.locals.supabase.auth.getSession();
      if (!session) {
        return { session: null, user: null };
      }

      const {
        data: { user },
        error,
      } = await event.locals.supabase.auth.getUser();
      if (error) {
        return { session: null, user: null };
      }

      return { session, user };
    })();
    return sessionPromise;
  };

  let visibleStagePromise: ReturnType<App.Locals['getVisibleMatchStage']> | null = null;
  event.locals.getVisibleMatchStage = () => {
    visibleStagePromise ??= fetchVisibleMatchStage(event.locals.supabase);
    return visibleStagePromise;
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    },
  });
};
