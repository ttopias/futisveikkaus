-- DATABASE TRIGGERS

-- Trigger to handle user deletion
DROP TRIGGER IF EXISTS trigger_cleanup_user_data ON users;
CREATE TRIGGER trigger_cleanup_user_data
BEFORE DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION cleanup_user_data();

-- Trigger to handle cleanup of match data when a match is deleted
DROP TRIGGER IF EXISTS trigger_cleanup_match_data ON matches;
CREATE TRIGGER trigger_cleanup_match_data
BEFORE DELETE ON matches 
FOR EACH ROW
EXECUTE FUNCTION cleanup_match_data();

-- Trigger to handle cleanup of team data when a team is deleted
DROP TRIGGER IF EXISTS trigger_cleanup_team_data ON teams;
CREATE TRIGGER trigger_cleanup_team_data
BEFORE DELETE ON teams
FOR EACH ROW
EXECUTE FUNCTION cleanup_team_data();

-- Trigger to handle updates to the team statistics
DROP TRIGGER IF EXISTS trigger_update_team_statistics ON matches;
CREATE TRIGGER trigger_update_team_statistics
AFTER UPDATE ON matches
FOR EACH ROW
WHEN (OLD.finished IS DISTINCT FROM NEW.finished)
EXECUTE FUNCTION update_team_statistics();

-- Trigger to handle all updates that might affect user points
DROP TRIGGER IF EXISTS trigger_update_user_points ON guesses;
CREATE TRIGGER trigger_update_user_points
AFTER UPDATE ON guesses
FOR EACH ROW
WHEN (OLD.points IS DISTINCT FROM NEW.points)
EXECUTE FUNCTION update_user_points_aggregate();

-- Trigger to handle updates to the dashboard
DROP TRIGGER IF EXISTS trigger_update_dashboard ON guesses;
CREATE TRIGGER trigger_update_dashboard
AFTER INSERT OR UPDATE OR DELETE ON guesses
FOR EACH ROW
EXECUTE FUNCTION update_dashboard();

-- Trigger to handle updates to the guesses after a match is finished
DROP TRIGGER IF EXISTS after_match_update ON matches;
CREATE TRIGGER after_match_update
AFTER UPDATE ON matches
FOR EACH ROW
WHEN (NEW.finished IS DISTINCT FROM OLD.finished)
EXECUTE FUNCTION calculate_guess_points();

-- Trigger to handle updates to the guesses after a match is deleted
DROP TRIGGER IF EXISTS after_match_delete ON matches;
CREATE TRIGGER after_match_delete
AFTER DELETE ON matches
FOR EACH ROW
WHEN (OLD.finished = TRUE)
EXECUTE FUNCTION calculate_guess_points();

-- Trigger to handle updates to the guesses after a guess is deleted
DROP TRIGGER IF EXISTS after_guess_delete ON guesses;
CREATE TRIGGER after_guess_delete
AFTER DELETE ON guesses
FOR EACH ROW
WHEN (OLD.points_calculated = TRUE)
EXECUTE FUNCTION update_user_points_aggregate();

-- Trigger to update dashboard after a user is created or deleted
DROP TRIGGER IF EXISTS after_user_insert ON users;
CREATE TRIGGER after_user_insert
AFTER INSERT OR DELETE ON users
FOR EACH ROW
EXECUTE FUNCTION update_dashboard();