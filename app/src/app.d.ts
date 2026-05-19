import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { MatchStage } from '$lib/stages';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      safeGetSession(): Promise<{ session: Session | null; user: User | null }>;
      /** Cached per request; dedupes parallel page/layout loads. */
      getVisibleMatchStage(): Promise<MatchStage>;
    }
    interface PageData {
      user: User | null;
      /** Earliest match kickoff (min starts_at); null when no matches in DB. */
      tournamentStartsAt?: string | null;
      // session: Session | null;
    }
    // interface Error {}
    // interface Platform {}
  }
}
