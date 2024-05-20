import { PUBLIC_SITE_URL } from '$env/static/public';
import { AuthApiError } from '@supabase/supabase-js';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  const { user } = await safeGetSession();
  if (user) {
    redirect(303, '/');
  }
};

export const actions: Actions = {
  signin: async ({ request, locals: { supabase } }) => {
    const form_data = await request.formData();
    const email = form_data.get('email') as string;
    const password = form_data.get('password') as string;
    const to = form_data.get('to') as string;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error instanceof AuthApiError && error.status === 400) {
        return fail(400, {
          error: error.message,
          email,
        });
      }
      return fail(500, {
        error: 'Server error. Try again later.',
        email,
      });
    }

    if (to) {
      redirect(303, to);
    } else {
      redirect(303, '/');
    }
  },

  signup: async ({ request, locals: { supabase } }) => {
    const form_data = await request.formData();
    const email = form_data.get('email') as string;
    const first_name = form_data.get('first_name') as string;
    const password = form_data.get('password') as string;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: first_name,
          role: 'user',
          points: 0,
        },
      },
    });

    if (error) {
      console.error('Error signing up:', error);
      if (error instanceof AuthApiError) {
        return fail(400, {
          error: error.message,
          email,
          first_name,
        });
      }
      return fail(500, {
        error: 'Server error. Try again later.',
        email,
        first_name,
      });
    }

    redirect(303, '/');
  },

  forgot: async ({ request, locals: { supabase } }) => {
    const form_data = await request.formData();
    const email = form_data.get('email') as string;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: PUBLIC_SITE_URL + '/auth?reset',
    });

    if (error) {
      if (error instanceof AuthApiError) {
        return fail(400, {
          error: error.message,
        });
      }
      return fail(500, {
        error: 'Server error. Try again later.',
      });
    }

    redirect(303, '/auth/reset/success');
  },

  reset: async ({ request, locals: { supabase } }) => {
    const form_data = await request.formData();
    const password = form_data.get('password') as string;

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      if (error instanceof AuthApiError) {
        return fail(400, {
          error: error.message,
        });
      }
      return fail(500, {
        error: 'Server error. Try again later.',
      });
    }

    redirect(303, '/auth/reset/success');
  },

  signout: async ({ locals: { supabase } }) => {
    await supabase.auth.signOut();

    redirect(303, '/');
  },
};
