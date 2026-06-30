#!/usr/bin/env node

/**
 * Integration tests for Postgres triggers/functions.
 * Runs in a transaction and ROLLBACKs — no persistent data changes.
 *
 * Usage: node scripts/test-sql.mjs [--env app/.env.local]
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  connectPgClient,
  createPgClient,
  loadEnvFiles,
  repoRoot,
} from "./lib/db-env.mjs";

function parseArgs(argv) {
  const args = { envPath: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--env") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --env");
      args.envPath = value;
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/test-sql.mjs [--env <path>]

Requires DATABASE_URL or SUPABASE_DB_URL (same as init-database.mjs).
Applies trigger tests inside a transaction and rolls back.
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function queryOne(client, sql, params = []) {
  const { rows } = await client.query(sql, params);
  return rows[0];
}

async function queryAll(client, sql, params = []) {
  const { rows } = await client.query(sql, params);
  return rows;
}

async function seedTestUser(client) {
  const userId = "00000000-0000-4000-8000-000000000001";
  await client.query(
    `INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
     VALUES ($1, 'authenticated', 'authenticated', 'sql-test@example.com', '', now(), now(), now())
     ON CONFLICT (id) DO NOTHING`,
    [userId],
  );
  await client.query(
    `INSERT INTO profiles (id, first_name) VALUES ($1, 'Test')
     ON CONFLICT (id) DO NOTHING`,
    [userId],
  );
  return userId;
}

async function seedTeams(client) {
  const { rows } = await client.query(
    `INSERT INTO teams (country_code, name, "group")
     VALUES
       ('fi', 'Test A1', 'A'),
       ('se', 'Test A2', 'A'),
       ('no', 'Test B1', 'B'),
       ('dk', 'Test B2', 'B')
     RETURNING team_id, "group", name`,
  );
  const byName = Object.fromEntries(rows.map((r) => [r.name, r.team_id]));
  return { rows, byName };
}

async function testGuessPoints(client, userId, teamIds) {
  const homeId = teamIds["Test A1"];
  const awayId = teamIds["Test A2"];

  const match = await queryOne(
    client,
    `INSERT INTO matches (match_number, stage, starts_at, home_id, away_id, home_goals, away_goals, finished)
     VALUES (90001, 'group', now() + interval '1 day', $1, $2, 0, 0, false)
     RETURNING match_id`,
    [homeId, awayId],
  );

  await client.query(
    `INSERT INTO guesses (match_id, user_id, home_goals, away_goals)
     VALUES ($1, $2, 2, 1)`,
    [match.match_id, userId],
  );

  let guess = await queryOne(
    client,
    `SELECT points, points_calculated FROM guesses WHERE match_id = $1`,
    [match.match_id],
  );
  assert(guess.points === 0 && !guess.points_calculated, "unfinished match: points should be 0");

  await client.query(
    `UPDATE matches SET home_goals = 2, away_goals = 1, finished = true WHERE match_id = $1`,
    [match.match_id],
  );

  guess = await queryOne(
    client,
    `SELECT points, points_calculated FROM guesses WHERE match_id = $1`,
    [match.match_id],
  );
  assert(guess.points === 6 && guess.points_calculated, "exact score: 6 points");

  await client.query(
    `UPDATE matches SET home_goals = 2, away_goals = 1, finished = true WHERE match_id = $1`,
    [match.match_id],
  );

  guess = await queryOne(
    client,
    `SELECT points FROM guesses WHERE match_id = $1`,
    [match.match_id],
  );
  assert(guess.points === 6, "idempotent finish: points stay 6");

  await client.query(
    `UPDATE matches SET home_goals = 3, away_goals = 1, finished = true WHERE match_id = $1`,
    [match.match_id],
  );

  guess = await queryOne(
    client,
    `SELECT points FROM guesses WHERE match_id = $1`,
    [match.match_id],
  );
  assert(guess.points === 4, "goal correction recalculates to 4 points (not stacked)");
  assert(guess.points < 12, "points were not doubled");

  return match.match_id;
}

async function testTeamStatisticsHomeAndAway(client, teamIds) {
  const teamA = teamIds["Test A1"];
  const teamB = teamIds["Test A2"];
  const teamC = teamIds["Test B1"];

  const baseline = await queryOne(
    client,
    `SELECT win, draw, loss, gf, gaa FROM teams WHERE team_id = $1`,
    [teamA],
  );

  const { rows: seeded } = await client.query(
    `INSERT INTO matches (match_number, stage, starts_at, home_id, away_id, home_goals, away_goals, finished)
     VALUES
       (90020, 'group', now() - interval '2 days', $1, $2, 2, 0, false),
       (90021, 'group', now() - interval '1 day', $3, $1, 1, 1, false)
     RETURNING match_id, match_number`,
    [teamA, teamB, teamC],
  );
  for (const row of seeded) {
    const goals =
      row.match_number === 90020
        ? { home_goals: 2, away_goals: 0 }
        : { home_goals: 1, away_goals: 1 };
    await client.query(
      `UPDATE matches SET home_goals = $2, away_goals = $3, finished = true WHERE match_id = $1`,
      [row.match_id, goals.home_goals, goals.away_goals],
    );
  }

  const stats = await queryOne(
    client,
    `SELECT win, draw, loss, gf, gaa FROM teams WHERE team_id = $1`,
    [teamA],
  );

  assert(
    stats.win === baseline.win + 1 &&
      stats.draw === baseline.draw + 1 &&
      stats.loss === baseline.loss &&
      stats.gf === baseline.gf + 3 &&
      stats.gaa === baseline.gaa + 1,
    "team with home win and away draw aggregates both fixtures",
  );
}

async function testTeamStatistics(client, teamIds) {
  const homeId = teamIds["Test B1"];
  const awayId = teamIds["Test B2"];

  const baselineHome = await queryOne(
    client,
    `SELECT win, draw, loss, gf, gaa FROM teams WHERE team_id = $1`,
    [homeId],
  );
  const baselineAway = await queryOne(
    client,
    `SELECT win, draw, loss, gf, gaa FROM teams WHERE team_id = $1`,
    [awayId],
  );

  const { match_id: matchId } = await queryOne(
    client,
    `INSERT INTO matches (match_number, stage, starts_at, home_id, away_id, home_goals, away_goals, finished)
     VALUES (90002, 'group', now() + interval '1 day', $1, $2, 1, 1, false)
     RETURNING match_id`,
    [homeId, awayId],
  );

  await client.query(
    `UPDATE matches SET home_goals = 1, away_goals = 1, finished = true WHERE match_id = $1`,
    [matchId],
  );

  let home = await queryOne(client, `SELECT win, draw, loss, gf, gaa FROM teams WHERE team_id = $1`, [
    homeId,
  ]);
  assert(
    home.win === baselineHome.win &&
      home.draw === baselineHome.draw + 1 &&
      home.loss === baselineHome.loss &&
      home.gf === baselineHome.gf + 1 &&
      home.gaa === baselineHome.gaa + 1,
    "home team gains one draw",
  );

  let away = await queryOne(client, `SELECT win, draw, loss, gf, gaa FROM teams WHERE team_id = $1`, [
    awayId,
  ]);
  assert(
    away.draw === baselineAway.draw + 1 && away.gf === baselineAway.gf + 1 && away.gaa === baselineAway.gaa + 1,
    "away team gains one draw",
  );

  await client.query(
    `UPDATE matches SET home_goals = 2, away_goals = 0, finished = true WHERE match_id = $1`,
    [matchId],
  );

  home = await queryOne(client, `SELECT win, draw, loss, gf, gaa FROM teams WHERE team_id = $1`, [homeId]);
  away = await queryOne(client, `SELECT win, draw, loss, gf, gaa FROM teams WHERE team_id = $1`, [awayId]);
  assert(
    home.win === baselineHome.win + 1 &&
      home.draw === baselineHome.draw &&
      home.gf === baselineHome.gf + 2 &&
      home.gaa === baselineHome.gaa,
    "correction: home win replaces draw",
  );
  assert(
    away.loss === baselineAway.loss + 1 &&
      away.draw === baselineAway.draw &&
      away.gf === baselineAway.gf &&
      away.gaa === baselineAway.gaa + 2,
    "correction: away loss replaces draw",
  );
}

async function testFifaRankTiebreaker(client) {
  await client.query(
    `DELETE FROM guesses WHERE match_id IN (
       SELECT match_id FROM matches
       WHERE home_id IN (SELECT team_id FROM teams WHERE "group" IN ('C', 'D', 'E', 'F'))
          OR away_id IN (SELECT team_id FROM teams WHERE "group" IN ('C', 'D', 'E', 'F'))
     );
     DELETE FROM matches
     WHERE stage = 'group'
       AND (
         home_id IN (SELECT team_id FROM teams WHERE "group" IN ('C', 'D', 'E', 'F'))
         OR away_id IN (SELECT team_id FROM teams WHERE "group" IN ('C', 'D', 'E', 'F'))
       );
     DELETE FROM matches
     WHERE home_id IN (SELECT team_id FROM teams WHERE "group" IN ('C', 'D', 'E', 'F'))
        OR away_id IN (SELECT team_id FROM teams WHERE "group" IN ('C', 'D', 'E', 'F'));
     DELETE FROM teams WHERE "group" IN ('C', 'D', 'E', 'F')`,
  );

  const { rows } = await client.query(
    `INSERT INTO teams (country_code, name, "group", win, draw, loss, gf, gaa, fifa_rank)
     VALUES
       ('t1', 'Test Tie High', 'C', 2, 0, 0, 4, 2, 50),
       ('t2', 'Test Tie Low', 'C', 2, 0, 0, 4, 2, 10),
       ('t3', 'Test Tie Null', 'C', 2, 0, 0, 4, 2, NULL),
       ('d1', 'Test D1', 'D', 3, 0, 0, 6, 0, 1),
       ('d2', 'Test D2', 'D', 2, 0, 1, 4, 2, 2),
       ('d3', 'Test Third A', 'D', 1, 0, 2, 2, 4, 30),
       ('e1', 'Test E1', 'E', 3, 0, 0, 6, 0, 1),
       ('e2', 'Test E2', 'E', 2, 0, 1, 4, 2, 2),
       ('e3', 'Test Third B', 'E', 1, 0, 2, 2, 4, 80)
     RETURNING team_id, name`,
  );
  const byName = Object.fromEntries(rows.map((r) => [r.name, r.team_id]));

  const winner = await queryOne(
    client,
    `SELECT group_qualifier_team_id('C', 1) AS team_id`,
  );
  assert(
    winner.team_id === byName["Test Tie Low"],
    "group rank tie: lower fifa_rank wins (10 beats 50)",
  );

  const nullLoses = await queryOne(
    client,
    `SELECT group_qualifier_team_id('C', 2) AS team_id`,
  );
  assert(
    nullLoses.team_id === byName["Test Tie High"],
    "group rank tie: NULL fifa_rank ranks last",
  );

  const bestThird = await queryOne(
    client,
    `SELECT best_third_among_groups(ARRAY['D', 'E']) AS team_id`,
  );
  assert(
    bestThird.team_id === byName["Test Third A"],
    "best third tie: lower fifa_rank among tied thirds",
  );
}

async function testThirdPlaceDedup(client) {
  await client.query(
    `DELETE FROM guesses WHERE match_id IN (
       SELECT match_id FROM matches WHERE match_number >= 90020 AND match_number <= 90029
     );
     DELETE FROM matches WHERE match_number >= 90020 AND match_number <= 90029;
     DELETE FROM matches
     WHERE stage = 'group'
       AND (
         home_id IN (SELECT team_id FROM teams WHERE "group" IN ('D', 'E', 'F'))
         OR away_id IN (SELECT team_id FROM teams WHERE "group" IN ('D', 'E', 'F'))
       );
     DELETE FROM teams WHERE "group" IN ('D', 'E', 'F')`,
  );

  const { rows } = await client.query(
    `INSERT INTO teams (country_code, name, "group", win, draw, loss, gf, gaa, fifa_rank)
     VALUES
       ('d1', 'Test D1', 'D', 3, 0, 0, 6, 0, 1),
       ('d2', 'Test D2', 'D', 2, 0, 1, 4, 2, 2),
       ('d3', 'Test Best Third', 'D', 1, 0, 2, 2, 4, 5),
       ('e1', 'Test E1', 'E', 3, 0, 0, 6, 0, 1),
       ('e2', 'Test E2', 'E', 2, 0, 1, 4, 2, 2),
       ('e3', 'Test Other Third', 'E', 1, 0, 2, 2, 4, 80),
       ('f1', 'Test F1', 'F', 3, 0, 0, 6, 0, 1),
       ('f2', 'Test F2', 'F', 2, 0, 1, 4, 2, 2),
       ('f3', 'Test F Third', 'F', 1, 0, 2, 1, 3, 90)
     RETURNING team_id, name`,
  );
  const byName = Object.fromEntries(rows.map((r) => [r.name, r.team_id]));

  await client.query(
    `INSERT INTO matches (match_number, stage, starts_at, home_id, away_id, home_goals, away_goals, finished)
     VALUES
       (90020, 'group', now() - interval '2 days', $1, $2, 2, 0, true),
       (90021, 'group', now() - interval '2 days', $3, $4, 2, 0, true),
       (90022, 'group', now() - interval '2 days', $5, $6, 2, 0, true)`,
    [byName["Test D1"], byName["Test D2"], byName["Test E1"], byName["Test E2"], byName["Test F1"], byName["Test F2"]],
  );

  const { rows: koRows } = await client.query(
    `INSERT INTO matches (
       match_number, stage, starts_at,
       home_slot, away_slot,
       home_goals, away_goals, finished
     )
     VALUES
       (90023, 'r32', now() + interval '3 days', '1E', '3DE', 0, 0, false),
       (90024, 'r32', now() + interval '3 days', '1F', '3DEF', 0, 0, false)
     RETURNING match_id, match_number`,
  );

  const resolved = await queryOne(client, `SELECT resolve_third_place_slots(true) AS n`);
  assert(resolved.n >= 2, "third-place resolve assigns both slots");

  const first = await queryOne(
    client,
    `SELECT away_id FROM matches WHERE match_number = 90023`,
  );
  const second = await queryOne(
    client,
    `SELECT away_id FROM matches WHERE match_number = 90024`,
  );

  assert(
    first.away_id === byName["Test Best Third"],
    "first third-place slot gets the best third",
  );
  assert(
    second.away_id === byName["Test Other Third"],
    "second third-place slot excludes the already-assigned best third",
  );
  assert(first.away_id !== second.away_id, "each third-place slot gets a distinct team");
}

async function testThirdPlaceExcludesGroupQualifier(client) {
  await client.query(
    `DELETE FROM guesses WHERE match_id IN (
       SELECT match_id FROM matches WHERE match_number >= 90040 AND match_number <= 90049
     );
     DELETE FROM matches WHERE match_number >= 90040 AND match_number <= 90049;
     DELETE FROM matches
     WHERE stage = 'group'
       AND (
         home_id IN (SELECT team_id FROM teams WHERE "group" IN ('G', 'H'))
         OR away_id IN (SELECT team_id FROM teams WHERE "group" IN ('G', 'H'))
       );
     DELETE FROM matches
     WHERE home_id IN (SELECT team_id FROM teams WHERE "group" IN ('G', 'H'))
        OR away_id IN (SELECT team_id FROM teams WHERE "group" IN ('G', 'H'));
     DELETE FROM teams WHERE "group" IN ('G', 'H')`,
  );

  const { rows } = await client.query(
    `INSERT INTO teams (country_code, name, "group", win, draw, loss, gf, gaa, fifa_rank)
     VALUES
       ('g1', 'Test G1', 'G', 3, 0, 0, 6, 0, 1),
       ('g2', 'Test G2', 'G', 2, 0, 1, 4, 2, 2),
       ('g3', 'Test Top Third', 'G', 2, 0, 1, 5, 3, 5),
       ('h1', 'Test H1', 'H', 3, 0, 0, 6, 0, 1),
       ('h2', 'Test H2', 'H', 2, 0, 1, 4, 2, 2),
       ('h3', 'Test Alt Third', 'H', 1, 0, 2, 2, 4, 80)
     RETURNING team_id, name`,
  );
  const byName = Object.fromEntries(rows.map((r) => [r.name, r.team_id]));

  await client.query(
    `INSERT INTO matches (match_number, stage, starts_at, home_id, away_id, home_goals, away_goals, finished)
     VALUES
       (90040, 'group', now() - interval '2 days', $1, $2, 2, 0, true),
       (90041, 'group', now() - interval '2 days', $3, $4, 2, 0, true)`,
    [byName["Test G1"], byName["Test G2"], byName["Test H1"], byName["Test H2"]],
  );

  await client.query(
    `INSERT INTO matches (
       match_number, stage, starts_at,
       home_slot, away_slot,
       home_id, away_id,
       home_goals, away_goals, finished
     )
     VALUES
       (90042, 'r32', now() + interval '3 days', '2G', '2H', $1, $2, 0, 0, false),
       (90043, 'r32', now() + interval '3 days', '1G', '3GH', $3, NULL, 0, 0, false)`,
    [byName["Test Top Third"], byName["Test H2"], byName["Test G1"]],
  );

  await queryOne(client, `SELECT resolve_third_place_slots(true) AS n`);

  const thirdSlot = await queryOne(
    client,
    `SELECT away_id FROM matches WHERE match_number = 90043`,
  );
  assert(
    thirdSlot.away_id === byName["Test Alt Third"],
    "third-place slot skips team already playing elsewhere in R32 as group qualifier",
  );
  assert(
    thirdSlot.away_id !== byName["Test Top Third"],
    "best third is not reused when already on another R32 match",
  );
}

async function testStageReadyForPredictions(client) {
  await client.query(`DELETE FROM matches WHERE match_number >= 90030 AND match_number <= 90039`);

  const notReady = await queryOne(
    client,
    `SELECT stage_ready_for_predictions('r32'::public.match_stage) AS ready`,
  );
  assert(notReady.ready === false, "r32 not ready while group stage still open");

  const { rows: teams } = await client.query(
    `SELECT team_id FROM teams WHERE "group" = 'A' ORDER BY team_id LIMIT 2`,
  );
  if (teams.length < 2) {
    throw new Error("need at least two group A teams for stage readiness test");
  }

  await client.query(
    `INSERT INTO matches (
       match_number, stage, starts_at,
       home_slot, away_slot,
       home_id, away_id, home_goals, away_goals, finished
     )
     VALUES (90030, 'r32', now() + interval '5 days', '1A', '2B', $1, $2, 0, 0, false)`,
    [teams[0].team_id, teams[1].team_id],
  );

  const stillNotReady = await queryOne(
    client,
    `SELECT stage_ready_for_predictions('r32'::public.match_stage) AS ready`,
  );
  assert(
    stillNotReady.ready === false,
    "r32 not ready until every r32 match has both teams",
  );
}

async function testTiedKnockoutWinner(client, teamIds) {
  const a1 = teamIds["Test A1"];
  const a2 = teamIds["Test A2"];

  await client.query(
    `ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner_id int REFERENCES teams(team_id)`,
  );

  const feeder = await queryOne(
    client,
    `INSERT INTO matches (
       match_number, stage, starts_at,
       home_slot, away_slot,
       home_id, away_id,
       home_goals, away_goals, finished
     )
     VALUES (90012, 'r16', now() - interval '1 day', '1A', '2A', $1, $2, 1, 1, true)
     RETURNING match_id`,
    [a1, a2],
  );

  let unresolved = await queryOne(
    client,
    `SELECT resolve_feeder_team_id('winner:90012') AS team_id`,
  );
  assert(unresolved.team_id === null, "tied knockout without winner_id does not advance");

  const ko = await queryOne(
    client,
    `INSERT INTO matches (
       match_number, stage, starts_at,
       home_slot, away_slot,
       home_goals, away_goals, finished
     )
     VALUES (90013, 'qf', now() + interval '2 days', 'winner:90012', 'loser:90012', 0, 0, false)
     RETURNING match_id, home_id, away_id`,
  );
  assert(ko.home_id === null && ko.away_id === null, "downstream slots empty before winner_id");

  await client.query(`UPDATE matches SET winner_id = $2 WHERE match_id = $1`, [feeder.match_id, a2]);

  const winnerSide = await queryOne(
    client,
    `SELECT resolve_feeder_team_id('winner:90012') AS team_id`,
  );
  const loserSide = await queryOne(
    client,
    `SELECT resolve_feeder_team_id('loser:90012') AS team_id`,
  );
  assert(winnerSide.team_id === a2, "winner_id sets winner slot on tied knockout");
  assert(loserSide.team_id === a1, "winner_id sets loser slot on tied knockout");

  const applied = await queryOne(
    client,
    `SELECT resolve_bracket_slots_for_feeder(90012, true) AS n`,
  );
  assert(applied.n >= 1, "feeder resolve applies winner_id to downstream match");

  const after = await queryOne(
    client,
    `SELECT home_id, away_id FROM matches WHERE match_id = $1`,
    [ko.match_id],
  );
  assert(after.home_id === a2 && after.away_id === a1, "downstream match filled from winner_id");
}

async function testBracketResolver(client, teamIds) {
  const a1 = teamIds["Test A1"];
  const a2 = teamIds["Test A2"];

  await client.query(
    `INSERT INTO matches (match_number, stage, starts_at, home_id, away_id, home_goals, away_goals, finished)
     VALUES (90010, 'group', now() - interval '1 day', $1, $2, 2, 0, true)`,
    [a1, a2],
  );

  const feederTeam = await queryOne(
    client,
    `SELECT resolve_feeder_team_id('winner:90010') AS team_id`,
  );
  assert(feederTeam.team_id === a1, "resolve_feeder_team_id returns winner");

  const ko = await queryOne(
    client,
    `INSERT INTO matches (
       match_number, stage, starts_at,
       home_slot, away_slot,
       home_goals, away_goals, finished
     )
     VALUES (90011, 'r16', now() + interval '2 days', 'winner:90010', 'loser:90010', 0, 0, false)
     RETURNING match_id, home_id`,
  );
  assert(ko.home_id === null, "KO match starts with null participants");

  const firstPass = await queryOne(
    client,
    `SELECT resolve_bracket_slots_for_feeder(90010, true) AS n`,
  );
  assert(firstPass.n >= 1, "feeder resolve applies at least one slot");

  const afterFeeder = await queryOne(
    client,
    `SELECT home_id, away_id FROM matches WHERE match_id = $1`,
    [ko.match_id],
  );
  assert(afterFeeder.home_id === a1 && afterFeeder.away_id === a2, "winner/loser slots filled");

  const secondPass = await queryOne(
    client,
    `SELECT resolve_bracket_slots_for_feeder(90010, true) AS n`,
  );
  assert(secondPass.n === 0, "second feeder resolve is idempotent (no loop)");

  const slotFn = await queryOne(
    client,
    `SELECT resolve_slot_team_id('1A') AS team_id`,
  );
  assert(slotFn.team_id === null || typeof slotFn.team_id === "number", "1A slot returns null or team when group open");
}

const tests = [
  { name: "guess points (finish, idempotent, correction)", fn: testGuessPoints },
  { name: "team statistics (draw then correction)", fn: testTeamStatistics },
  { name: "team statistics (home + away aggregation)", fn: testTeamStatisticsHomeAndAway },
  { name: "FIFA rank tiebreaker (group + best third)", fn: testFifaRankTiebreaker },
  { name: "third-place dedup (ordered slots)", fn: testThirdPlaceDedup },
  { name: "third-place excludes group qualifiers", fn: testThirdPlaceExcludesGroupQualifier },
  { name: "stage readiness for predictions", fn: testStageReadyForPredictions },
  { name: "bracket slots (1A, winner:N, no loop)", fn: testBracketResolver, enableBracketTrigger: true },
  { name: "tied knockout winner_id advances bracket", fn: testTiedKnockoutWinner },
];

async function run() {
  const { envPath } = parseArgs(process.argv.slice(2));
  await loadEnvFiles(envPath);

  const client = createPgClient();
  const results = [];

  try {
    await connectPgClient(client);
    const functionsSql = await readFile(path.join(repoRoot, "sql", "functions.sql"), "utf8");
    await client.query(functionsSql);
    // Remove leftover rows from prior runs (team serials are not rolled back).
    await client.query(`DELETE FROM matches WHERE match_number >= 90000`);
    await client.query(`DELETE FROM teams WHERE name LIKE 'Test %'`);
    await client.query("BEGIN");
    // Avoid filling real knockout slots when test group matches are finished.
    await client.query("ALTER TABLE matches DISABLE TRIGGER trigger_z_resolve_bracket_slots");

    const userId = await seedTestUser(client);
    const { byName: teamIds } = await seedTeams(client);

    for (const { name, fn, enableBracketTrigger } of tests) {
      try {
        if (enableBracketTrigger) {
          await client.query("ALTER TABLE matches ENABLE TRIGGER trigger_z_resolve_bracket_slots");
        } else {
          await client.query("ALTER TABLE matches DISABLE TRIGGER trigger_z_resolve_bracket_slots");
        }
        if (fn === testGuessPoints) {
          await fn(client, userId, teamIds);
        } else if (
          fn === testFifaRankTiebreaker ||
          fn === testThirdPlaceDedup ||
          fn === testThirdPlaceExcludesGroupQualifier ||
          fn === testStageReadyForPredictions
        ) {
          await fn(client);
        } else {
          await fn(client, teamIds);
        }
        results.push({ name, ok: true });
        console.log(`  ✓ ${name}`);
      } catch (err) {
        results.push({ name, ok: false, error: err.message });
        console.error(`  ✗ ${name}: ${err.message}`);
      }
    }

    await client.query("ROLLBACK");
  } finally {
    await client.end().catch(() => {});
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
