-- DATABASE FUNCTIONS

-- First tournament stage that still has unfinished matches (or `final` when all done).
CREATE OR REPLACE FUNCTION visible_match_stage()
RETURNS public.match_stage AS $$
    SELECT COALESCE(
        (
            SELECT s.stage
            FROM unnest(
                ARRAY[
                    'group'::public.match_stage,
                    'r32',
                    'r16',
                    'qf',
                    'sf',
                    'third',
                    'final'
                ]
            ) WITH ORDINALITY AS s(stage, ord)
            WHERE EXISTS (
                SELECT 1
                FROM matches m
                WHERE m.finished = false
                  AND m.stage = s.stage
            )
            ORDER BY s.ord
            LIMIT 1
        ),
        'final'::public.match_stage
    );
$$ LANGUAGE sql STABLE;

GRANT EXECUTE ON FUNCTION visible_match_stage() TO anon, authenticated;

CREATE OR REPLACE FUNCTION cleanup_user_data()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM guesses WHERE user_id = OLD.id;
    DELETE FROM dashboard WHERE user_id = OLD.id;
    DELETE FROM profiles WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION cleanup_match_data()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM guesses WHERE match_id = OLD.match_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION cleanup_team_data()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM matches WHERE home_id = OLD.team_id OR away_id = OLD.team_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recompute all guess points for a match from scratch (no incremental scoring).
CREATE OR REPLACE FUNCTION calculate_guess_points_for_match(p_match_id int, p_finished boolean, p_home_goals int, p_away_goals int)
RETURNS void AS $$
DECLARE
    guess RECORD;
    p int;
BEGIN
    FOR guess IN SELECT * FROM guesses WHERE match_id = p_match_id LOOP
        p := 0;

        IF NOT p_finished THEN
            UPDATE guesses
            SET points = 0, points_calculated = false
            WHERE guess_id = guess.guess_id;
        ELSE
            IF guess.home_goals = p_home_goals AND guess.away_goals = p_away_goals THEN
                p := 6;
            ELSE
                IF guess.home_goals = guess.away_goals AND p_home_goals = p_away_goals THEN
                    p := p + 4;
                END IF;

                IF (guess.home_goals > guess.away_goals AND p_home_goals > p_away_goals)
                   OR (guess.home_goals < guess.away_goals AND p_home_goals < p_away_goals) THEN
                    p := p + 3;
                END IF;

                IF guess.home_goals = p_home_goals THEN
                    p := p + 1;
                END IF;

                IF guess.away_goals = p_away_goals THEN
                    p := p + 1;
                END IF;

                IF guess.home_goals = guess.away_goals AND p_home_goals != p_away_goals THEN
                    p := p - 2;
                END IF;

                IF guess.home_goals != guess.away_goals AND p_home_goals = p_away_goals THEN
                    p := p - 2;
                END IF;

                IF (guess.home_goals > guess.away_goals AND p_home_goals < p_away_goals)
                   OR (guess.home_goals < guess.away_goals AND p_home_goals > p_away_goals) THEN
                    p := p - 4;
                END IF;
            END IF;

            UPDATE guesses
            SET points = p, points_calculated = true
            WHERE guess_id = guess.guess_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_guess_points()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_guess_points_for_match(
        NEW.match_id,
        NEW.finished,
        NEW.home_goals,
        NEW.away_goals
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_team_statistics()
RETURNS TRIGGER AS $$
BEGIN
    WITH affected_teams AS (
        SELECT unnest(ARRAY[NEW.home_id, NEW.away_id]) AS team_id
    ), team_match_stats AS (
        SELECT
            t.team_id,
            SUM(
                CASE
                    WHEN m.home_id = t.team_id AND m.home_goals > m.away_goals THEN 1
                    WHEN m.away_id = t.team_id AND m.away_goals > m.home_goals THEN 1
                    ELSE 0
                END
            ) AS wins,
            SUM(CASE WHEN m.home_goals = m.away_goals THEN 1 ELSE 0 END) AS draws,
            SUM(
                CASE
                    WHEN m.home_id = t.team_id AND m.home_goals < m.away_goals THEN 1
                    WHEN m.away_id = t.team_id AND m.away_goals < m.home_goals THEN 1
                    ELSE 0
                END
            ) AS losses,
            SUM(
                CASE
                    WHEN m.home_id = t.team_id THEN m.home_goals
                    WHEN m.away_id = t.team_id THEN m.away_goals
                    ELSE 0
                END
            ) AS goals_for,
            SUM(
                CASE
                    WHEN m.home_id = t.team_id THEN m.away_goals
                    WHEN m.away_id = t.team_id THEN m.home_goals
                    ELSE 0
                END
            ) AS goals_against
        FROM affected_teams t
        INNER JOIN matches m ON m.stage = 'group'
            AND m.finished = TRUE
            AND (m.home_id = t.team_id OR m.away_id = t.team_id)
        GROUP BY t.team_id
    )
    UPDATE teams
    SET
        win = COALESCE(team_match_stats.wins, 0),
        draw = COALESCE(team_match_stats.draws, 0),
        loss = COALESCE(team_match_stats.losses, 0),
        gf = COALESCE(team_match_stats.goals_for, 0),
        gaa = COALESCE(team_match_stats.goals_against, 0)
    FROM affected_teams t
    LEFT JOIN team_match_stats ON team_match_stats.team_id = t.team_id
    WHERE teams.team_id = t.team_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_dashboard()
RETURNS TRIGGER AS $$
DECLARE
    target_user_id uuid;
    user_first_name text;
BEGIN
    target_user_id := COALESCE(NEW.user_id, OLD.user_id);

    SELECT first_name INTO user_first_name
    FROM profiles
    WHERE id = target_user_id;

    INSERT INTO dashboard (user_id, total_points, first_name)
    VALUES (
        target_user_id,
        (SELECT COALESCE(SUM(g.points), 0) FROM guesses g WHERE g.user_id = target_user_id),
        COALESCE(user_first_name, '')
    )
    ON CONFLICT (user_id) DO UPDATE
    SET
        total_points = EXCLUDED.total_points,
        first_name = EXCLUDED.first_name;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Force default role; admin promotion is service-role only (e.g. seed-smoke-users.mjs).
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'user')
  WHERE id = NEW.id;

  INSERT INTO public.profiles (id, first_name)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'first_name'), ''),
      'user_' || substr(replace(NEW.id::text, '-', ''), 1, 8)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION sync_dashboard_first_name()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE dashboard
    SET first_name = NEW.first_name
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Bracket slot resolution (group qualifiers, KO feeders).
-- Group / best-third tiebreakers: points, goal difference, goals scored (desc),
-- then FIFA rank (asc; lower number = better; NULL ranks last).

CREATE OR REPLACE FUNCTION group_stage_complete(p_group text)
RETURNS boolean AS $$
    SELECT NOT EXISTS (
        SELECT 1
        FROM matches m
        INNER JOIN teams t ON t.team_id = m.home_id
        WHERE m.stage = 'group'
          AND t."group" = p_group
          AND NOT m.finished
    );
$$ LANGUAGE sql STABLE;

-- True when every group-stage match (72) is finished.
CREATE OR REPLACE FUNCTION all_group_stage_complete()
RETURNS boolean AS $$
    SELECT NOT EXISTS (
        SELECT 1
        FROM matches
        WHERE stage = 'group'
          AND NOT finished
    );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION stage_predecessor(p_stage public.match_stage)
RETURNS public.match_stage AS $$
    SELECT CASE p_stage
        WHEN 'group' THEN NULL
        WHEN 'r32' THEN 'group'::public.match_stage
        WHEN 'r16' THEN 'r32'::public.match_stage
        WHEN 'qf' THEN 'r16'::public.match_stage
        WHEN 'sf' THEN 'qf'::public.match_stage
        WHEN 'third' THEN 'sf'::public.match_stage
        WHEN 'final' THEN 'sf'::public.match_stage
    END;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION all_stage_matches_finished(p_stage public.match_stage)
RETURNS boolean AS $$
    SELECT NOT EXISTS (
        SELECT 1
        FROM matches
        WHERE stage = p_stage
          AND NOT finished
    );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION all_stage_matches_have_teams(p_stage public.match_stage)
RETURNS boolean AS $$
    SELECT NOT EXISTS (
        SELECT 1
        FROM matches
        WHERE stage = p_stage
          AND (home_id IS NULL OR away_id IS NULL)
    );
$$ LANGUAGE sql STABLE;

-- Predictions open for a stage when the previous stage is finished, every match
-- in this stage has both teams set, and the stage's first kickoff is still ahead.
CREATE OR REPLACE FUNCTION stage_ready_for_predictions(p_stage public.match_stage)
RETURNS boolean AS $$
DECLARE
    prev_stage public.match_stage;
    kickoff timestamptz;
BEGIN
    kickoff := stage_first_kickoff(p_stage);
    IF kickoff IS NULL OR kickoff <= now() THEN
        RETURN false;
    END IF;

    IF NOT all_stage_matches_have_teams(p_stage) THEN
        RETURN false;
    END IF;

    prev_stage := stage_predecessor(p_stage);
    IF prev_stage IS NOT NULL AND NOT all_stage_matches_finished(prev_stage) THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;

-- Earliest kickoff among matches of a stage. The whole stage shares this single
-- deadline: predictions lock and guesses become visible once it has passed.
CREATE OR REPLACE FUNCTION stage_first_kickoff(p_stage public.match_stage)
RETURNS timestamptz AS $$
    SELECT min(starts_at)
    FROM matches
    WHERE stage = p_stage;
$$ LANGUAGE sql STABLE;

-- Group rank (1 = winner, 2 = runner-up, 3 = third) using the same tiebreakers
-- as best_third_among_groups: points, GD, GF (desc), then fifa_rank (asc, NULLS LAST).
CREATE OR REPLACE FUNCTION group_qualifier_team_id(p_group text, p_rank int)
RETURNS int AS $$
    SELECT team_id
    FROM (
        SELECT
            t.team_id,
            ROW_NUMBER() OVER (
                ORDER BY
                    (t.win * 3 + t.draw) DESC,
                    (t.gf - t.gaa) DESC,
                    t.gf DESC,
                    t.fifa_rank ASC NULLS LAST
            ) AS rn
        FROM teams t
        WHERE t."group" = p_group
    ) ranked
    WHERE rn = p_rank;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION third_place_team_id(p_group text)
RETURNS int AS $$
    SELECT group_qualifier_team_id(p_group, 3);
$$ LANGUAGE sql STABLE;

-- Suffix letters from a 3… slot code, e.g. 3ABCDF -> {A,B,C,D,F}.
CREATE OR REPLACE FUNCTION third_place_slot_groups(p_slot text)
RETURNS text[] AS $$
    SELECT ARRAY(
        SELECT substr(substring(p_slot from 2), i::int, 1)
        FROM generate_series(1, length(substring(p_slot from 2))) AS i
    );
$$ LANGUAGE sql IMMUTABLE;

-- Best third among listed groups (e.g. 3ABCDF slot), excluding teams already
-- assigned to another third-place slot. Tiebreak order: points, goal difference,
-- goals scored (desc), then fifa_rank (asc, NULLS LAST).
DROP FUNCTION IF EXISTS public.best_third_among_groups(text[]);
CREATE OR REPLACE FUNCTION best_third_among_groups(
    p_groups text[],
    p_exclude int[] DEFAULT ARRAY[]::int[]
)
RETURNS int AS $$
    SELECT team_id
    FROM (
        SELECT
            group_qualifier_team_id(g.grp, 3) AS team_id,
            t.win,
            t.draw,
            t.gf,
            t.gaa,
            t.fifa_rank
        FROM unnest(p_groups) AS g(grp)
        INNER JOIN teams t ON t."group" = g.grp
            AND t.team_id = group_qualifier_team_id(g.grp, 3)
    ) ranked
    WHERE team_id IS NOT NULL
      AND NOT (team_id = ANY(p_exclude))
    ORDER BY
        (win * 3 + draw) DESC,
        (gf - gaa) DESC,
        gf DESC,
        fifa_rank ASC NULLS LAST
    LIMIT 1;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION third_place_slot_groups_complete(p_slot text)
RETURNS boolean AS $$
    SELECT CASE
        WHEN p_slot !~ '^3[A-L]+$' THEN false
        ELSE NOT EXISTS (
            SELECT 1
            FROM generate_series(1, length(substring(p_slot from 2))) AS i
            WHERE NOT group_stage_complete(substr(substring(p_slot from 2), i::int, 1))
        )
    END;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION resolve_feeder_team_id(p_slot text)
RETURNS int AS $$
DECLARE
    side text;
    feeder_num int;
    feeder_home_goals int;
    feeder_away_goals int;
    feeder_home_id int;
    feeder_away_id int;
    feeder_finished boolean;
    feeder_winner_id int;
BEGIN
    IF p_slot IS NULL OR p_slot !~ '^(winner|loser):\d+$' THEN
        RETURN NULL;
    END IF;

    side := substring(p_slot from '^(winner|loser)');
    feeder_num := substring(p_slot from ':(\d+)$')::int;

    SELECT home_goals, away_goals, home_id, away_id, finished, winner_id
    INTO feeder_home_goals, feeder_away_goals, feeder_home_id, feeder_away_id, feeder_finished, feeder_winner_id
    FROM matches
    WHERE match_number = feeder_num;

    IF NOT FOUND OR NOT feeder_finished THEN
        RETURN NULL;
    END IF;

    IF feeder_home_goals = feeder_away_goals THEN
        IF feeder_winner_id IS NOT NULL THEN
            IF side = 'winner' THEN
                RETURN feeder_winner_id;
            END IF;
            IF feeder_winner_id = feeder_home_id THEN
                RETURN feeder_away_id;
            END IF;
            RETURN feeder_home_id;
        END IF;
        RETURN NULL;
    END IF;

    IF side = 'winner' THEN
        IF feeder_home_goals > feeder_away_goals THEN
            RETURN feeder_home_id;
        END IF;
        RETURN feeder_away_id;
    END IF;

    IF feeder_home_goals < feeder_away_goals THEN
        RETURN feeder_home_id;
    END IF;
    RETURN feeder_away_id;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION resolve_third_place_slot_team_id(
    p_slot text,
    p_exclude int[] DEFAULT ARRAY[]::int[]
)
RETURNS int AS $$
BEGIN
    IF p_slot IS NULL OR p_slot !~ '^3[A-L]+$' THEN
        RETURN NULL;
    END IF;

    IF NOT third_place_slot_groups_complete(p_slot) THEN
        RETURN NULL;
    END IF;

    RETURN best_third_among_groups(third_place_slot_groups(p_slot), p_exclude);
END;
$$ LANGUAGE plpgsql STABLE;

-- Team ids already placed on any R32 match except the given row (group winners,
-- runners-up, and third-place teams). Used so a third cannot be assigned twice.
CREATE OR REPLACE FUNCTION r32_assigned_team_ids(p_except_match_id int DEFAULT NULL)
RETURNS int[] AS $$
    SELECT COALESCE(array_agg(DISTINCT tid), ARRAY[]::int[])
    FROM (
        SELECT home_id AS tid
        FROM matches
        WHERE stage = 'r32'
          AND home_id IS NOT NULL
          AND (p_except_match_id IS NULL OR match_id <> p_except_match_id)
        UNION
        SELECT away_id
        FROM matches
        WHERE stage = 'r32'
          AND away_id IS NOT NULL
          AND (p_except_match_id IS NULL OR match_id <> p_except_match_id)
    ) assigned
    WHERE tid IS NOT NULL;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION resolve_third_place_slots(p_apply boolean DEFAULT true)
RETURNS int AS $$
DECLARE
    m RECORD;
    n int := 0;
    third_exclude int[] := ARRAY[]::int[];
    slot_exclude int[] := ARRAY[]::int[];
    v_home int;
    v_away int;
    new_home int;
    new_away int;
BEGIN
    FOR m IN
        SELECT match_id, home_slot, away_slot, home_id, away_id
        FROM matches
        WHERE stage = 'r32'
          AND (home_slot ~ '^3[A-L]+$' OR away_slot ~ '^3[A-L]+$')
        ORDER BY match_number
    LOOP
        new_home := m.home_id;
        new_away := m.away_id;
        slot_exclude := third_exclude || r32_assigned_team_ids(m.match_id);

        IF m.home_slot ~ '^3[A-L]+$' THEN
            v_home := resolve_third_place_slot_team_id(m.home_slot, slot_exclude);
            IF v_home IS NOT NULL THEN
                new_home := v_home;
                third_exclude := third_exclude || v_home;
            END IF;
        END IF;

        IF m.away_slot ~ '^3[A-L]+$' THEN
            slot_exclude := third_exclude || r32_assigned_team_ids(m.match_id);
            v_away := resolve_third_place_slot_team_id(m.away_slot, slot_exclude);
            IF v_away IS NOT NULL THEN
                new_away := v_away;
                third_exclude := third_exclude || v_away;
            END IF;
        END IF;

        IF new_home IS DISTINCT FROM m.home_id OR new_away IS DISTINCT FROM m.away_id THEN
            n := n + 1;
            IF p_apply THEN
                UPDATE matches
                SET
                    home_id = COALESCE(new_home, home_id),
                    away_id = COALESCE(new_away, away_id)
                WHERE match_id = m.match_id
                  AND (
                      (new_home IS NOT NULL AND home_id IS DISTINCT FROM new_home)
                      OR (new_away IS NOT NULL AND away_id IS DISTINCT FROM new_away)
                  );
            END IF;
        END IF;
    END LOOP;

    RETURN n;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION resolve_slot_team_id(p_slot text)
RETURNS int AS $$
DECLARE
    grp text;
    rank int;
BEGIN
    IF p_slot IS NULL THEN
        RETURN NULL;
    END IF;

    IF p_slot ~ '^[12][A-L]$' THEN
        rank := substring(p_slot from 1 for 1)::int;
        grp := substring(p_slot from 2 for 1);
        IF NOT group_stage_complete(grp) THEN
            RETURN NULL;
        END IF;
        RETURN group_qualifier_team_id(grp, rank);
    END IF;

    IF p_slot ~ '^3[A-L]+$' THEN
        RETURN resolve_third_place_slot_team_id(p_slot);
    END IF;

    IF p_slot ~ '^(winner|loser):\d+$' THEN
        RETURN resolve_feeder_team_id(p_slot);
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION apply_bracket_slot_update(
    p_match_id int,
    p_home_slot text,
    p_away_slot text,
    p_current_home int,
    p_current_away int,
    p_apply boolean DEFAULT true
)
RETURNS boolean AS $$
DECLARE
    v_home int;
    v_away int;
BEGIN
    IF p_home_slot ~ '^3[A-L]+$' THEN
        v_home := NULL;
    ELSE
        v_home := resolve_slot_team_id(p_home_slot);
    END IF;

    IF p_away_slot ~ '^3[A-L]+$' THEN
        v_away := NULL;
    ELSE
        v_away := resolve_slot_team_id(p_away_slot);
    END IF;

    IF (v_home IS NULL OR v_home IS NOT DISTINCT FROM p_current_home)
       AND (v_away IS NULL OR v_away IS NOT DISTINCT FROM p_current_away) THEN
        RETURN false;
    END IF;

    IF NOT p_apply THEN
        RETURN true;
    END IF;

    UPDATE matches
    SET
        home_id = COALESCE(v_home, home_id),
        away_id = COALESCE(v_away, away_id)
    WHERE match_id = p_match_id
      AND (
          (v_home IS NOT NULL AND home_id IS DISTINCT FROM v_home)
          OR (v_away IS NOT NULL AND away_id IS DISTINCT FROM v_away)
      );

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION resolve_bracket_slots_for_feeder(p_match_number int, p_apply boolean DEFAULT true)
RETURNS int AS $$
DECLARE
    m RECORD;
    n int := 0;
BEGIN
    FOR m IN
        SELECT match_id, home_slot, away_slot, home_id, away_id
        FROM matches
        WHERE stage <> 'group'
          AND (
              home_slot ~ ('^(winner|loser):' || p_match_number::text || '$')
              OR away_slot ~ ('^(winner|loser):' || p_match_number::text || '$')
          )
    LOOP
        IF apply_bracket_slot_update(
            m.match_id, m.home_slot, m.away_slot, m.home_id, m.away_id, p_apply
        ) THEN
            n := n + 1;
        END IF;
    END LOOP;
    RETURN n;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION resolve_bracket_slots_for_group(p_group text, p_apply boolean DEFAULT true)
RETURNS int AS $$
DECLARE
    m RECORD;
    n int := 0;
BEGIN
    FOR m IN
        SELECT match_id, home_slot, away_slot, home_id, away_id
        FROM matches
        WHERE stage <> 'group'
          AND (
              home_slot IN ('1' || p_group, '2' || p_group)
              OR away_slot IN ('1' || p_group, '2' || p_group)
              OR (
                  home_slot ~ '^3[A-L]+$'
                  AND position(p_group in substring(home_slot from 2)) > 0
              )
              OR (
                  away_slot ~ '^3[A-L]+$'
                  AND position(p_group in substring(away_slot from 2)) > 0
              )
          )
        ORDER BY match_number
    LOOP
        IF apply_bracket_slot_update(
            m.match_id, m.home_slot, m.away_slot, m.home_id, m.away_id, p_apply
        ) THEN
            n := n + 1;
        END IF;
    END LOOP;

    RETURN n;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION resolve_bracket_slots(p_apply boolean DEFAULT true)
RETURNS int AS $$
DECLARE
    m RECORD;
    n int := 0;
BEGIN
    FOR m IN
        SELECT match_id, home_slot, away_slot, home_id, away_id
        FROM matches
        WHERE stage <> 'group'
          AND home_slot IS NOT NULL
          AND away_slot IS NOT NULL
        ORDER BY match_number
    LOOP
        IF apply_bracket_slot_update(
            m.match_id, m.home_slot, m.away_slot, m.home_id, m.away_id, p_apply
        ) THEN
            n := n + 1;
        END IF;
    END LOOP;

    n := n + resolve_third_place_slots(p_apply);
    RETURN n;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION resolve_bracket_slots_trigger()
RETURNS TRIGGER AS $$
DECLARE
    home_grp text;
    away_grp text;
BEGIN
    IF NEW.stage = 'group' THEN
        SELECT "group" INTO home_grp FROM teams WHERE team_id = NEW.home_id;
        SELECT "group" INTO away_grp FROM teams WHERE team_id = NEW.away_id;

        IF home_grp IS NOT NULL THEN
            PERFORM resolve_bracket_slots_for_group(home_grp, true);
        END IF;
        IF away_grp IS NOT NULL AND away_grp IS DISTINCT FROM home_grp THEN
            PERFORM resolve_bracket_slots_for_group(away_grp, true);
        END IF;

        PERFORM resolve_third_place_slots(true);
    ELSE
        PERFORM resolve_bracket_slots_for_feeder(NEW.match_number, true);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Restrict EXECUTE: visible_match_stage + all_group_stage_complete for RLS/app;
-- bracket/scoring helpers are trigger-only (service role bypasses RLS for admin writes).

REVOKE ALL ON FUNCTION visible_match_stage() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION visible_match_stage() TO anon, authenticated;

REVOKE ALL ON FUNCTION all_group_stage_complete() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION all_group_stage_complete() TO authenticated;

REVOKE ALL ON FUNCTION stage_predecessor(public.match_stage) FROM PUBLIC;
REVOKE ALL ON FUNCTION all_stage_matches_finished(public.match_stage) FROM PUBLIC;
REVOKE ALL ON FUNCTION all_stage_matches_have_teams(public.match_stage) FROM PUBLIC;
REVOKE ALL ON FUNCTION stage_ready_for_predictions(public.match_stage) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION stage_ready_for_predictions(public.match_stage) TO authenticated;

REVOKE ALL ON FUNCTION stage_first_kickoff(public.match_stage) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION stage_first_kickoff(public.match_stage) TO authenticated;

REVOKE ALL ON FUNCTION group_stage_complete(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION group_qualifier_team_id(text, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION third_place_team_id(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION third_place_slot_groups(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION best_third_among_groups(text[], int[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION resolve_third_place_slot_team_id(text, int[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION r32_assigned_team_ids(int) FROM PUBLIC;
REVOKE ALL ON FUNCTION resolve_third_place_slots(boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION third_place_slot_groups_complete(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION resolve_feeder_team_id(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION resolve_slot_team_id(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION apply_bracket_slot_update(int, text, text, int, int, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION resolve_bracket_slots_for_feeder(int, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION resolve_bracket_slots_for_group(text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION resolve_bracket_slots(boolean) FROM PUBLIC;

REVOKE ALL ON FUNCTION calculate_guess_points_for_match(int, boolean, int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION calculate_guess_points() FROM PUBLIC;
REVOKE ALL ON FUNCTION update_team_statistics() FROM PUBLIC;
REVOKE ALL ON FUNCTION update_dashboard() FROM PUBLIC;
REVOKE ALL ON FUNCTION cleanup_user_data() FROM PUBLIC;
REVOKE ALL ON FUNCTION cleanup_match_data() FROM PUBLIC;
REVOKE ALL ON FUNCTION cleanup_team_data() FROM PUBLIC;
REVOKE ALL ON FUNCTION resolve_bracket_slots_trigger() FROM PUBLIC;
REVOKE ALL ON FUNCTION sync_dashboard_first_name() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
