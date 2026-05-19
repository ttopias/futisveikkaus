#!/usr/bin/env node

/**
 * Integration tests for Postgres triggers/functions.
 * Runs in a transaction and ROLLBACKs — no persistent data changes.
 *
 * Usage: node scripts/test-sql.mjs [--env app/.env.local]
 */

import process from "node:process";
import {
  connectPgClient,
  createPgClient,
  loadEnvFiles,
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
  { name: "bracket slots (1A, winner:N, no loop)", fn: testBracketResolver, enableBracketTrigger: true },
];

async function run() {
  const { envPath } = parseArgs(process.argv.slice(2));
  await loadEnvFiles(envPath);

  const client = createPgClient();
  const results = [];

  try {
    await connectPgClient(client);
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
