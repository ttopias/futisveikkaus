CREATE TABLE IF NOT EXISTS matches (
    match_id serial PRIMARY KEY,
    date text NOT NULL,
    time text NOT NULL,
    home_id int NOT NULL,
    away_id int NOT NULL,
    home_goals int DEFAULT 0,
    away_goals int DEFAULT 0,
    finished boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS teams (
    team_id serial PRIMARY KEY,
    country_code text NOT NULL,
    name text NOT NULL,
    "group" text NOT NULL,
    win int DEFAULT 0,
    draw int DEFAULT 0,
    loss int DEFAULT 0,
    gf int DEFAULT 0,
    gaa int DEFAULT 0
);

CREATE TABLE IF NOT EXISTS guesses (
	guess_id serial UNIQUE,
	match_id int NOT NULL,
	user_id uuid NOT NULL,
	home_goals int NOT NULL,
	away_goals int NOT NULL,
	points int DEFAULT 0,
	points_calculated boolean DEFAULT false,
	PRIMARY KEY ("guess_id")
);

CREATE TABLE IF NOT EXISTS dashboard (
    user_id uuid PRIMARY KEY,
    total_points int,
    first_name text
);

create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  first_name text unique,
);

-- DATABASE CONSTRAINTS AND INDEXES
ALTER TABLE matches ADD CONSTRAINT matches_home_fk FOREIGN KEY (home_id) REFERENCES teams(team_id);
ALTER TABLE matches ADD CONSTRAINT matches_away_fk FOREIGN KEY (away_id) REFERENCES teams(team_id);
ALTER TABLE guesses ADD CONSTRAINT guesses_fk1 FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE;
ALTER TABLE guesses ADD CONSTRAINT guesses_fk2 FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_teams_team_id ON teams(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_match_id ON matches(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_id ON matches(home_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_id ON matches(away_id);
CREATE INDEX IF NOT EXISTS idx_matches_finished ON matches(finished);

CREATE INDEX IF NOT EXISTS idx_guesses_match_id ON guesses(match_id);
CREATE INDEX IF NOT EXISTS idx_guesses_user_id ON guesses(user_id);
CREATE INDEX IF NOT EXISTS idx_guesses_points ON guesses(points);
CREATE INDEX IF NOT EXISTS idx_guesses_points_calculated ON guesses(points_calculated);