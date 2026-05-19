-- Row Level Security (fresh schema)
-- Admin scripts and server actions use SUPABASE_SECRET_KEY (service role), which bypasses RLS.

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard ENABLE ROW LEVEL SECURITY;

-- teams & matches: public read (schedule / standings)
CREATE POLICY teams_select_public ON teams
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY matches_select_public ON matches
  FOR SELECT TO anon, authenticated
  USING (true);

-- profiles: read/update own row (insert via handle_new_user trigger)
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY profiles_select_for_leaderboard ON profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- dashboard: read leaderboard for authenticated users
CREATE POLICY dashboard_select_authenticated ON dashboard
  FOR SELECT TO authenticated
  USING (true);

-- guesses: own rows always; all rows once the match has kicked off
CREATE POLICY guesses_select_own ON guesses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY guesses_select_started_match ON guesses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.match_id = match_id
        AND m.starts_at <= now()
    )
  );

CREATE POLICY guesses_insert_own ON guesses
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.match_id = match_id
        AND m.starts_at > now()
        AND (m.stage = 'group' OR all_group_stage_complete())
    )
  );

CREATE POLICY guesses_update_own ON guesses
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.match_id = match_id
        AND m.starts_at > now()
        AND (m.stage = 'group' OR all_group_stage_complete())
    )
  );

CREATE POLICY guesses_delete_own ON guesses
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM matches m
      WHERE m.match_id = match_id
        AND m.starts_at > now()
        AND (m.stage = 'group' OR all_group_stage_complete())
    )
  );
