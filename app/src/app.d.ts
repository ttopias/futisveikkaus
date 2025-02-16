import { SupabaseClient, Session } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      safeGetSession(): Promise<{ session: Session | null; user: User | null }>;
    }
    interface PageData {
      user: User | null;
      // session: Session | null;
    }
    // interface Error {}
    // interface Platform {}
  }
}
