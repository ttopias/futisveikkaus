-- Knockout tie-breaker: winner_id for penalty/extra-time advancement.
--
-- Apply with:
--   node scripts/apply-sql.mjs sql/migrations/20260630_knockout_winner_id.sql --env app/.env.local
--   node scripts/apply-sql.mjs sql/functions.sql --env app/.env.local
--   node scripts/apply-sql.mjs sql/triggers.sql --env app/.env.local

BEGIN;

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS winner_id int REFERENCES teams(team_id);

COMMIT;
