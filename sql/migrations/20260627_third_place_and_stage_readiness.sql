-- Third-place deduplication + stage readiness for predictions.
--
-- Apply with:
--   node scripts/apply-sql.mjs sql/functions.sql --env app/.env.local
--   node scripts/apply-sql.mjs sql/migrations/20260627_third_place_and_stage_readiness.sql --env app/.env.local
-- or:
--   psql "$DATABASE_URL" -f sql/functions.sql
--   psql "$DATABASE_URL" -f sql/migrations/20260627_third_place_and_stage_readiness.sql

BEGIN;

REVOKE ALL ON FUNCTION stage_predecessor(public.match_stage) FROM PUBLIC;
REVOKE ALL ON FUNCTION all_stage_matches_finished(public.match_stage) FROM PUBLIC;
REVOKE ALL ON FUNCTION all_stage_matches_have_teams(public.match_stage) FROM PUBLIC;
REVOKE ALL ON FUNCTION stage_ready_for_predictions(public.match_stage) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION stage_ready_for_predictions(public.match_stage) TO authenticated;

REVOKE ALL ON FUNCTION best_third_among_groups(text[], int[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION resolve_third_place_slot_team_id(text, int[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION resolve_third_place_slots(boolean) FROM PUBLIC;

DROP POLICY IF EXISTS guesses_insert_own ON guesses;
CREATE POLICY guesses_insert_own ON guesses
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.match_id = guesses.match_id
        AND stage_ready_for_predictions(m.stage)
    )
  );

DROP POLICY IF EXISTS guesses_update_own ON guesses;
CREATE POLICY guesses_update_own ON guesses
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.match_id = guesses.match_id
        AND stage_ready_for_predictions(m.stage)
    )
  );

DROP POLICY IF EXISTS guesses_delete_own ON guesses;
CREATE POLICY guesses_delete_own ON guesses
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.match_id = guesses.match_id
        AND stage_ready_for_predictions(m.stage)
    )
  );

COMMIT;
