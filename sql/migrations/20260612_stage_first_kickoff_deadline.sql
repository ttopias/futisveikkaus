-- Non-destructive migration: move guess edit/visibility deadline from each
-- match's own kickoff to the kickoff of the FIRST match in the same stage.
--
-- Apply with:
--   node scripts/apply-sql.mjs sql/migrations/20260612_stage_first_kickoff_deadline.sql --env app/.env.local
-- or:
--   psql "$DATABASE_URL" -f sql/migrations/20260612_stage_first_kickoff_deadline.sql

BEGIN;

-- Earliest kickoff among matches of a stage. The whole stage shares this single
-- deadline: predictions lock and guesses become visible once it has passed.
CREATE OR REPLACE FUNCTION stage_first_kickoff(p_stage public.match_stage)
RETURNS timestamptz AS $$
    SELECT min(starts_at)
    FROM matches
    WHERE stage = p_stage;
$$ LANGUAGE sql STABLE;

REVOKE ALL ON FUNCTION stage_first_kickoff(public.match_stage) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION stage_first_kickoff(public.match_stage) TO authenticated;

-- guesses SELECT: reveal all rows once the stage's first match has kicked off
DROP POLICY IF EXISTS guesses_select_started_match ON guesses;
CREATE POLICY guesses_select_started_match ON guesses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.match_id = guesses.match_id
        AND stage_first_kickoff(m.stage) <= now()
    )
  );

-- guesses INSERT: open until the stage's first match starts
DROP POLICY IF EXISTS guesses_insert_own ON guesses;
CREATE POLICY guesses_insert_own ON guesses
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.match_id = guesses.match_id
        AND stage_first_kickoff(m.stage) > now()
        AND (
          (m.stage = 'group' AND NOT all_group_stage_complete())
          OR (m.stage <> 'group' AND all_group_stage_complete())
        )
    )
  );

-- guesses UPDATE: open until the stage's first match starts
DROP POLICY IF EXISTS guesses_update_own ON guesses;
CREATE POLICY guesses_update_own ON guesses
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.match_id = guesses.match_id
        AND stage_first_kickoff(m.stage) > now()
        AND (
          (m.stage = 'group' AND NOT all_group_stage_complete())
          OR (m.stage <> 'group' AND all_group_stage_complete())
        )
    )
  );

-- guesses DELETE: open until the stage's first match starts
DROP POLICY IF EXISTS guesses_delete_own ON guesses;
CREATE POLICY guesses_delete_own ON guesses
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.match_id = guesses.match_id
        AND stage_first_kickoff(m.stage) > now()
        AND (
          (m.stage = 'group' AND NOT all_group_stage_complete())
          OR (m.stage <> 'group' AND all_group_stage_complete())
        )
    )
  );

COMMIT;
