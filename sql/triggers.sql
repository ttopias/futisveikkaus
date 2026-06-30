-- DATABASE TRIGGERS

CREATE TRIGGER trigger_cleanup_user_data
BEFORE DELETE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION cleanup_user_data();

CREATE TRIGGER trigger_cleanup_match_data
BEFORE DELETE ON matches
FOR EACH ROW
EXECUTE FUNCTION cleanup_match_data();

CREATE TRIGGER trigger_cleanup_team_data
BEFORE DELETE ON teams
FOR EACH ROW
EXECUTE FUNCTION cleanup_team_data();

CREATE TRIGGER trigger_update_team_statistics
AFTER UPDATE ON matches
FOR EACH ROW
WHEN (
  NEW.stage = 'group'
  AND (
    OLD.finished IS DISTINCT FROM NEW.finished
    OR (
      NEW.finished
      AND (
        OLD.home_goals IS DISTINCT FROM NEW.home_goals
        OR OLD.away_goals IS DISTINCT FROM NEW.away_goals
      )
    )
  )
)
EXECUTE FUNCTION update_team_statistics();

CREATE TRIGGER trigger_update_dashboard
AFTER INSERT OR UPDATE OR DELETE ON guesses
FOR EACH ROW
EXECUTE FUNCTION update_dashboard();

CREATE TRIGGER after_match_update
AFTER UPDATE ON matches
FOR EACH ROW
WHEN (
  OLD.finished IS DISTINCT FROM NEW.finished
  OR (
    NEW.finished
    AND (
      OLD.home_goals IS DISTINCT FROM NEW.home_goals
      OR OLD.away_goals IS DISTINCT FROM NEW.away_goals
    )
  )
)
EXECUTE FUNCTION calculate_guess_points();

CREATE TRIGGER trigger_z_resolve_bracket_slots
AFTER UPDATE ON matches
FOR EACH ROW
WHEN (
  OLD.finished IS DISTINCT FROM NEW.finished
  OR (
    NEW.finished
    AND (
      OLD.home_goals IS DISTINCT FROM NEW.home_goals
      OR OLD.away_goals IS DISTINCT FROM NEW.away_goals
      OR OLD.winner_id IS DISTINCT FROM NEW.winner_id
    )
  )
)
EXECUTE FUNCTION resolve_bracket_slots_trigger();

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER trigger_sync_dashboard_first_name
AFTER UPDATE OF first_name ON profiles
FOR EACH ROW
WHEN (OLD.first_name IS DISTINCT FROM NEW.first_name)
EXECUTE FUNCTION sync_dashboard_first_name();
