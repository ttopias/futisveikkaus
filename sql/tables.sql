CREATE TABLE IF NOT EXISTS matches (
    match_id SERIAL UNIQUE PRIMARY KEY,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    stage TEXT NOT NULL,
    home_id INT NOT NULL,
    away_id INT NOT NULL,
    home_goals INT DEFAULT 0,
    away_goals INT DEFAULT 0,
    finished BOOLEAN DEFAULT false,
    created_at TIMESTAMP default current_timestamp,
    updated_at TIMESTAMP default current_timestamp
);

CREATE TABLE IF NOT EXISTS teams (
    team_id SERIAL UNIQUE PRIMARY KEY,
    country_code TEXT NOT NULL,
    name TEXT NOT NULL,
    "group" TEXT NOT NULL,
    win INT DEFAULT 0,
    draw INT DEFAULT 0,
    loss INT DEFAULT 0,
    gf INT DEFAULT 0,
    gaa INT DEFAULT 0,
    created_at TIMESTAMP default current_timestamp,
    updated_at TIMESTAMP default current_timestamp
);

CREATE TABLE IF NOT EXISTS guesses (
	guess_id SERIAL UNIQUE PRIMARY KEY,
	match_id INT NOT NULL,
	user_id INT NOT NULL,
	home_goals INT NOT NULL,
	away_goals INT NOT NULL,
	points INT DEFAULT 0,
	points_calculated BOOLEAN DEFAULT false,
    created_at TIMESTAMP default current_timestamp,
    updated_at TIMESTAMP default current_timestamp
);

CREATE TABLE IF NOT EXISTS dashboard (
    group_id INT,
    user_id INT,
    total_points INT,
    first_name TEXT,
    last_name TEXT
);

CREATE TABLE IF NOT EXISTS groups (
    group_id SERIAL UNIQUE PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP default current_timestamp,
    updated_at TIMESTAMP default current_timestamp
);

CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL UNIQUE PRIMARY KEY,
  group_id INT,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  first_name TEXT,
  last_name TEXT,
  points INT default 0,
  email_verified BOOLEAN default false,
  created_at TIMESTAMP default current_timestamp,
  updated_at TIMESTAMP default current_timestamp,
  last_login TIMESTAMP default current_timestamp,
  role TEXT default 'user'
);

-- DATABASE CONSTRAINTS AND INDEXES
ALTER TABLE matches ADD CONSTRAINT matches_home_fk FOREIGN KEY (home_id) REFERENCES teams(team_id);
ALTER TABLE matches ADD CONSTRAINT matches_away_fk FOREIGN KEY (away_id) REFERENCES teams(team_id);
ALTER TABLE guesses ADD CONSTRAINT guesses_fk1 FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE;
ALTER TABLE guesses ADD CONSTRAINT guesses_fk2 FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
ALTER TABLE dashboard ADD CONSTRAINT dashboard_fk1 FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE;
ALTER TABLE dashboard ADD CONSTRAINT dashboard_fk2 FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
ALTER TABLE users ADD CONSTRAINT users_fk1 FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_teams_team_id ON teams(team_id);
CREATE INDEX IF NOT EXISTS idx_matches_match_id ON matches(match_id);
CREATE INDEX IF NOT EXISTS idx_matches_home_id ON matches(home_id);
CREATE INDEX IF NOT EXISTS idx_matches_away_id ON matches(away_id);
CREATE INDEX IF NOT EXISTS idx_matches_finished ON matches(finished);
CREATE INDEX IF NOT EXISTS idx_guesses_match_id ON guesses(match_id);
CREATE INDEX IF NOT EXISTS idx_guesses_user_id ON guesses(user_id);
CREATE INDEX IF NOT EXISTS idx_guesses_points ON guesses(points);
CREATE INDEX IF NOT EXISTS idx_guesses_points_calculated ON guesses(points_calculated);