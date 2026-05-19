-- Tear down application objects in the public schema (and app triggers on auth.users).
-- Does NOT drop auth.users or other Supabase auth/storage objects.
--
-- Order: auth triggers -> tables (CASCADE) -> functions -> types.
-- Tables first so partial init (e.g. enum only, or enum + some tables) still resets cleanly;
-- dropping policies/triggers by name fails when the parent table does not exist.

-- Triggers on auth.users (app-owned; auth.users always exists)
DROP TRIGGER IF EXISTS trigger_cleanup_user_data ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Tables (CASCADE drops dependent triggers, policies, indexes, and FKs)
DROP TABLE IF EXISTS public.guesses CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.dashboard CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;

-- Functions (after triggers that reference them are gone)
DROP FUNCTION IF EXISTS public.cleanup_user_data() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_match_data() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_team_data() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_guess_points() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_guess_points_for_match(int, boolean, int, int) CASCADE;
DROP FUNCTION IF EXISTS public.update_user_points_aggregate() CASCADE;
DROP FUNCTION IF EXISTS public.update_team_statistics() CASCADE;
DROP FUNCTION IF EXISTS public.update_dashboard() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.group_stage_complete(text) CASCADE;
DROP FUNCTION IF EXISTS public.all_group_stage_complete() CASCADE;
DROP FUNCTION IF EXISTS public.third_place_team_id(text) CASCADE;
DROP FUNCTION IF EXISTS public.third_place_slot_groups(text) CASCADE;
DROP FUNCTION IF EXISTS public.best_third_among_groups(text[]) CASCADE;
DROP FUNCTION IF EXISTS public.third_place_slot_groups_complete(text) CASCADE;
DROP FUNCTION IF EXISTS public.group_qualifier_team_id(text, int) CASCADE;
DROP FUNCTION IF EXISTS public.resolve_feeder_team_id(text) CASCADE;
DROP FUNCTION IF EXISTS public.resolve_slot_team_id(text) CASCADE;
DROP FUNCTION IF EXISTS public.apply_bracket_slot_update(int, text, text, int, int, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.resolve_bracket_slots_for_feeder(int, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.resolve_bracket_slots_for_group(text, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.resolve_bracket_slots(boolean) CASCADE;
DROP FUNCTION IF EXISTS public.resolve_bracket_slots_trigger() CASCADE;

-- Custom types (after tables/columns that used them are gone)
DROP TYPE IF EXISTS public.match_stage CASCADE;
