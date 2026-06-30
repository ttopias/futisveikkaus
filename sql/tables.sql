-- Types
CREATE TYPE public.match_stage AS ENUM (
  'group',
  'r32',
  'r16',
  'qf',
  'sf',
  'third',
  'final'
);

-- Tables
CREATE TABLE teams (
    team_id serial PRIMARY KEY,
    country_code text NOT NULL,
    name text NOT NULL,
    fifa_rank int,
    "group" text NOT NULL,
    win int DEFAULT 0 NOT NULL,
    draw int DEFAULT 0 NOT NULL,
    loss int DEFAULT 0 NOT NULL,
    gf int DEFAULT 0 NOT NULL,
    gaa int DEFAULT 0 NOT NULL,
    CONSTRAINT teams_group_check CHECK ("group" ~ '^[A-L]$')
);

CREATE TABLE matches (
    match_id serial PRIMARY KEY,
    match_number int UNIQUE NOT NULL,
    stage public.match_stage NOT NULL DEFAULT 'group',
    starts_at timestamptz NOT NULL,
    home_id int REFERENCES teams(team_id),
    away_id int REFERENCES teams(team_id),
    home_slot text,
    away_slot text,
    home_goals int DEFAULT 0 NOT NULL,
    away_goals int DEFAULT 0 NOT NULL,
    finished boolean DEFAULT false NOT NULL,
    winner_id int REFERENCES teams(team_id),
    CONSTRAINT matches_home_slot_format CHECK (
        home_slot IS NULL OR home_slot ~ '^(winner|loser):\d+$|^[123][A-L]+$'
    ),
    CONSTRAINT matches_away_slot_format CHECK (
        away_slot IS NULL OR away_slot ~ '^(winner|loser):\d+$|^[123][A-L]+$'
    ),
    CONSTRAINT matches_participants_check CHECK (
        (stage = 'group' AND home_id IS NOT NULL AND away_id IS NOT NULL
            AND home_slot IS NULL AND away_slot IS NULL)
        OR (stage <> 'group' AND home_slot IS NOT NULL AND away_slot IS NOT NULL)
    )
);

CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name text NOT NULL UNIQUE
);

CREATE TABLE guesses (
    guess_id serial PRIMARY KEY,
    match_id int NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    home_goals int NOT NULL,
    away_goals int NOT NULL,
    points int DEFAULT 0 NOT NULL,
    points_calculated boolean DEFAULT false NOT NULL,
    CONSTRAINT guesses_user_match_unique UNIQUE (user_id, match_id)
);

CREATE TABLE dashboard (
    user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    total_points int DEFAULT 0 NOT NULL,
    first_name text NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_fifa_rank ON teams(fifa_rank) WHERE fifa_rank IS NOT NULL;
CREATE INDEX idx_teams_team_id ON teams(team_id);
CREATE INDEX idx_matches_match_id ON matches(match_id);
CREATE INDEX idx_matches_match_number ON matches(match_number);
CREATE INDEX idx_matches_starts_at ON matches(starts_at);
CREATE INDEX idx_matches_home_id ON matches(home_id);
CREATE INDEX idx_matches_away_id ON matches(away_id);
CREATE INDEX idx_matches_finished ON matches(finished);
-- Partial index for visible-stage lookup (unfinished matches per stage).
CREATE INDEX idx_matches_unfinished_stage ON matches(stage) WHERE finished = false;
CREATE INDEX idx_profiles_first_name ON profiles(first_name);

CREATE INDEX idx_guesses_match_id ON guesses(match_id);
CREATE INDEX idx_guesses_user_id ON guesses(user_id);
CREATE INDEX idx_guesses_points ON guesses(points);
CREATE INDEX idx_guesses_points_calculated ON guesses(points_calculated);
