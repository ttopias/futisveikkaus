import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SECRET_KEY } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';

export const supabaseAdminClient = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY);
