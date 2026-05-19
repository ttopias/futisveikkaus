-- DATABASE FUNCTIONS

CREATE OR REPLACE FUNCTION cleanup_user_data()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM guesses WHERE user_id = OLD.id;
    DELETE FROM dashboard WHERE user_id = OLD.id;
    DELETE FROM profiles WHERE id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_match_data()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM guesses WHERE match_id = OLD.match_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_team_data()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM matches WHERE home_id = OLD.team_id OR away_id = OLD.team_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

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
        INNER JOIN matches m ON m.finished = TRUE
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
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'user')
  WHERE id = NEW.id;

  INSERT INTO public.profiles (id, first_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'first_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Bracket slot resolution (group qualifiers, KO feeders).
-- Group / best-third tiebreakers: points, goal difference, goals scored (desc only).

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

-- Group rank (1 = winner, 2 = runner-up, 3 = third) using the same three tiebreakers
-- as best_third_among_groups: points, goal difference, goals scored — all descending.
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
                    t.gf DESC
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

-- Best third among listed groups (e.g. 3ABCDF slot).
-- Tiebreak order (only): points, goal difference, goals scored — all descending.
-- Fair play, FIFA ranking, and team name are not used.
CREATE OR REPLACE FUNCTION best_third_among_groups(p_groups text[])
RETURNS int AS $$
    SELECT team_id
    FROM (
        SELECT
            group_qualifier_team_id(g.grp, 3) AS team_id,
            t.win,
            t.draw,
            t.gf,
            t.gaa
        FROM unnest(p_groups) AS g(grp)
        INNER JOIN teams t ON t."group" = g.grp
            AND t.team_id = group_qualifier_team_id(g.grp, 3)
    ) ranked
    WHERE team_id IS NOT NULL
    ORDER BY
        (win * 3 + draw) DESC,
        (gf - gaa) DESC,
        gf DESC
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
BEGIN
    IF p_slot IS NULL OR p_slot !~ '^(winner|loser):\d+$' THEN
        RETURN NULL;
    END IF;

    side := substring(p_slot from '^(winner|loser)');
    feeder_num := substring(p_slot from ':(\d+)$')::int;

    SELECT home_goals, away_goals, home_id, away_id, finished
    INTO feeder_home_goals, feeder_away_goals, feeder_home_id, feeder_away_id, feeder_finished
    FROM matches
    WHERE match_number = feeder_num;

    IF NOT FOUND OR NOT feeder_finished THEN
        RETURN NULL;
    END IF;

    IF feeder_home_goals = feeder_away_goals THEN
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
        IF NOT third_place_slot_groups_complete(p_slot) THEN
            RETURN NULL;
        END IF;
        RETURN best_third_among_groups(third_place_slot_groups(p_slot));
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
    v_home := resolve_slot_team_id(p_home_slot);
    v_away := resolve_slot_team_id(p_away_slot);

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
    ELSE
        PERFORM resolve_bracket_slots_for_feeder(NEW.match_number, true);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
