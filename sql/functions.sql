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
    p INT;
BEGIN
    FOR guess IN SELECT * FROM guesses WHERE match_id = NEW.match_id LOOP
        p := 0;
        
        IF NEW.finished = FALSE THEN
            UPDATE guesses 
            SET 
                points = p,
                points_calculated = FALSE
            WHERE guess_id = guess.guess_id;
        ELSE
            IF (guess.home_goals = NEW.home_goals AND guess.away_goals = NEW.away_goals) THEN
                p := p + 6;
            ELSE
                -- Correct draw prediction
                IF (guess.home_goals = guess.away_goals AND NEW.home_goals = NEW.away_goals) THEN
                    p := p + 4;
                END IF;

                -- Correct winner
                IF (guess.home_goals > guess.away_goals AND NEW.home_goals > NEW.away_goals) OR 
                   (guess.home_goals < guess.away_goals AND NEW.home_goals < NEW.away_goals) THEN
                    p := p + 3;
                END IF;

                -- Correct number of goals for home team
                IF (guess.home_goals = NEW.home_goals) THEN
                    p := p + 1;
                END IF;

                -- Correct number of goals for away team
                IF (guess.away_goals = NEW.away_goals) THEN
                    p := p + 1;
                END IF;

                -- Draw guessed, but not a draw
                IF (guess.home_goals = guess.away_goals AND NEW.home_goals != NEW.away_goals) THEN
                    p := p - 2;
                END IF;

                -- Not a draw guessed, but match is a draw
                IF (guess.home_goals != guess.away_goals AND NEW.home_goals = NEW.away_goals) THEN
                    p := p - 2;
                END IF;

                -- Incorrect winner
                IF (guess.home_goals > guess.away_goals AND NEW.home_goals < NEW.away_goals) OR 
                   (guess.home_goals < guess.away_goals AND NEW.home_goals > NEW.away_goals) THEN
                    p := p - 4;
                END IF;
            END IF;

            UPDATE guesses 
            SET 
                points = p,
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
    WITH updated_home_stats AS (
        SELECT 
            home_id AS team_id, 
            SUM(CASE WHEN home_goals > away_goals THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN home_goals = away_goals THEN 1 ELSE 0 END) AS draws,
            SUM(CASE WHEN home_goals < away_goals THEN 1 ELSE 0 END) AS losses,
            SUM(home_goals) AS goals_for,
            SUM(away_goals) AS goals_against
        FROM matches
        WHERE finished = TRUE AND home_id = NEW.home_id
        GROUP BY home_id
    ), updated_away_stats AS (
        SELECT 
            away_id AS team_id, 
            SUM(CASE WHEN away_goals > home_goals THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN away_goals = home_goals THEN 1 ELSE 0 END) AS draws,
            SUM(CASE WHEN away_goals < home_goals THEN 1 ELSE 0 END) AS losses,
            SUM(away_goals) AS goals_for,
            SUM(home_goals) AS goals_against
        FROM matches
        WHERE finished = TRUE AND away_id = NEW.away_id
        GROUP BY away_id
    ), combined_stats AS (
        SELECT 
            team_id,
            SUM(wins) AS wins,
            SUM(draws) AS draws,
            SUM(losses) AS losses,
            SUM(goals_for) AS goals_for,
            SUM(goals_against) AS goals_against
        FROM (
            SELECT * FROM updated_home_stats
            UNION ALL
            SELECT * FROM updated_away_stats
        ) AS all_stats
        GROUP BY team_id
    )
    UPDATE teams
    SET 
        win = combined_stats.wins,
        draw = combined_stats.draws,
        loss = combined_stats.losses,
        gf = combined_stats.goals_for,
        gaa = combined_stats.goals_against
    FROM combined_stats
    WHERE teams.team_id = combined_stats.team_id;

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

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name)
  values (new.id, new.raw_user_meta_data->>'first_name');
  return new;
end;
$$ language plpgsql security definer;

alter table profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check ((select auth.uid()) = id);

create policy "Users can update own profile." on profiles
  for update using ((select auth.uid()) = id);