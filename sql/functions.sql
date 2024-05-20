-- DATABASE FUNCTIONS

-- Function to cleanup user data when a user is deleted
CREATE OR REPLACE FUNCTION cleanup_user_data()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM guesses WHERE user_id = OLD.id;
    DELETE FROM dashboard WHERE user_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup match data from guesses when a match is deleted
CREATE OR REPLACE FUNCTION cleanup_match_data()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM guesses WHERE match_id = OLD.match_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup team data when a team is deleted
CREATE OR REPLACE FUNCTION cleanup_team_data()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM matches WHERE home_id = OLD.team_id OR away_id = OLD.team_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate points for guesses
CREATE OR REPLACE FUNCTION calculate_guess_points()
RETURNS TRIGGER AS $$
DECLARE
    guess RECORD;
BEGIN
    FOR guess IN SELECT * FROM guesses WHERE match_id = NEW.match_id LOOP
        IF NEW.finished = FALSE THEN
            UPDATE guesses 
            SET 
                points = 0,
                points_calculated = FALSE
            WHERE guess_id = guess.guess_id;
        ELSE
            UPDATE guesses 
            SET 
                points = (
                    CASE
                        WHEN guess.home_goals = NEW.home_goals AND guess.away_goals = NEW.away_goals THEN 6
                        WHEN guess.home_goals = guess.away_goals AND NEW.home_goals = NEW.away_goals THEN 4
                        WHEN (guess.home_goals > guess.away_goals AND NEW.home_goals > NEW.away_goals) OR 
                             (guess.home_goals < guess.away_goals AND NEW.home_goals < NEW.away_goals) THEN 3
                        WHEN guess.home_goals = NEW.home_goals OR guess.away_goals = NEW.away_goals THEN 1
                        ELSE 0
                    END
                    +
                    CASE
                        WHEN guess.home_goals = guess.away_goals AND NEW.home_goals != NEW.away_goals THEN -2
                        WHEN guess.home_goals != guess.away_goals AND NEW.home_goals = NEW.away_goals THEN -2
                        WHEN (guess.home_goals > guess.away_goals AND NEW.home_goals < NEW.away_goals) OR 
                             (guess.home_goals < guess.away_goals AND NEW.home_goals > NEW.away_goals) THEN -4
                        ELSE 0
                    END
                ),
                points_calculated = TRUE
            WHERE guess_id = guess.guess_id;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Function to update user points with aggregate data
CREATE OR REPLACE FUNCTION update_user_points_aggregate()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{points}', (SELECT COALESCE(SUM(points), 0)::text FROM guesses WHERE user_id = NEW.user_id)::jsonb)
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update team statistics after a match is finished
CREATE OR REPLACE FUNCTION update_team_statistics()
RETURNS TRIGGER AS $$
BEGIN
    WITH updated_stats AS (
        SELECT 
            home_id AS team_id, 
            SUM(CASE WHEN home_goals > away_goals THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN home_goals = away_goals AND NEW.finished = TRUE THEN 1 ELSE 0 END) AS draws,
            SUM(CASE WHEN home_goals < away_goals THEN 1 ELSE 0 END) AS losses,
            SUM(home_goals) AS goals_for,
            SUM(away_goals) AS goals_against
        FROM matches
        WHERE finished = TRUE AND home_id = NEW.home_id OR away_id = NEW.away_id
        GROUP BY home_id
        UNION ALL
        SELECT 
            away_id AS team_id, 
            SUM(CASE WHEN away_goals > home_goals THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN away_goals = home_goals AND NEW.finished = TRUE THEN 1 ELSE 0 END) AS draws,
            SUM(CASE WHEN away_goals < home_goals THEN 1 ELSE 0 END) AS losses,
            SUM(away_goals) AS goals_for,
            SUM(home_goals) AS goals_against
        FROM matches
        WHERE finished = TRUE AND home_id = NEW.home_id OR away_id = NEW.away_id
        GROUP BY away_id
    )
    UPDATE teams 
    SET 
        win = updated_stats.wins,
        draw = updated_stats.draws,
        loss = updated_stats.losses,
        gf = updated_stats.goals_for,
        gaa = updated_stats.goals_against
    FROM updated_stats
    WHERE teams.team_id = updated_stats.team_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update the dashboard with aggregate data for users
CREATE OR REPLACE FUNCTION update_dashboard()
RETURNS TRIGGER AS $$
DECLARE
    user_first_name text;
BEGIN
    SELECT raw_user_meta_data->>'first_name' INTO user_first_name
    FROM auth.users
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);

    INSERT INTO dashboard (user_id, total_points, first_name)
    VALUES (
        COALESCE(NEW.user_id, OLD.user_id), 
        (SELECT COALESCE(SUM(g.points), 0) FROM guesses g WHERE g.user_id = COALESCE(NEW.user_id, OLD.user_id)),
        user_first_name
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        total_points = EXCLUDED.total_points,
        first_name = EXCLUDED.first_name;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;