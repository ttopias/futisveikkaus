#!/usr/bin/env node
/**
 * Prepare DB state and verify standings chart visibility for smoke scenarios.
 *
 *   node scripts/smoke-standings-charts.mjs --env app/.env.local --scenario 1|2|3
 *   node scripts/smoke-standings-charts.mjs --env app/.env.local --verify-only
 */

import process from 'node:process';
import {
  connectPgClient,
  createPgClient,
  loadEnvFiles,
} from './lib/db-env.mjs';
import { buildStandingsChartData } from '../app/src/lib/standings-chart.ts';

const SMOKE_EMAILS = [
  'smoke-user@test.futis.local',
  'smoke-admin@test.futis.local',
  'smoke-extra-1@test.futis.local',
  'smoke-extra-2@test.futis.local',
  'smoke-extra-3@test.futis.local',
];

function parseArgs(argv) {
  const args = { envPath: null, scenario: null, verifyOnly: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--env') {
      args.envPath = argv[i + 1];
      if (!args.envPath || args.envPath.startsWith('--')) throw new Error('Missing value for --env');
      i += 1;
    } else if (arg === '--scenario') {
      args.scenario = Number(argv[i + 1]);
      i += 1;
    } else if (arg === '--verify-only') {
      args.verifyOnly = true;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: node scripts/smoke-standings-charts.mjs --env app/.env.local --scenario 1|2|3
       node scripts/smoke-standings-charts.mjs --env app/.env.local --verify-only`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

async function queryAll(client, sql, params = []) {
  const { rows } = await client.query(sql, params);
  return rows;
}

async function resolveSmokeUserIds(client) {
  const rows = await queryAll(
    client,
    `SELECT u.id, u.email
     FROM auth.users u
     WHERE u.email = ANY($1::text[])`,
    [SMOKE_EMAILS],
  );
  const byEmail = Object.fromEntries(rows.map((r) => [r.email, r.id]));
  const missing = SMOKE_EMAILS.filter((e) => !byEmail[e]);
  if (missing.length) {
    throw new Error(
      `Missing smoke users: ${missing.join(', ')}. Run: node scripts/seed-smoke-users.mjs --env app/.env.local --extra 3`,
    );
  }
  return byEmail;
}

async function getMatchIdsByNumber(client, fromNum, toNum) {
  const rows = await queryAll(
    client,
    `SELECT match_id, match_number, finished
     FROM matches
     WHERE match_number BETWEEN $1 AND $2
     ORDER BY match_number`,
    [fromNum, toNum],
  );
  if (rows.length !== toNum - fromNum + 1) {
    throw new Error(`Expected matches #${fromNum}-#${toNum}, found ${rows.length}`);
  }
  return rows;
}

async function clearSmokeGuesses(client, userIds) {
  await client.query(`DELETE FROM guesses WHERE user_id = ANY($1::uuid[])`, [userIds]);
}

async function insertGuess(client, { matchId, userId, home = 1, away = 0 }) {
  await client.query(
    `INSERT INTO guesses (match_id, user_id, home_goals, away_goals)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, match_id) DO UPDATE
     SET home_goals = EXCLUDED.home_goals, away_goals = EXCLUDED.away_goals`,
    [matchId, userId, home, away],
  );
}

async function setMatchResult(client, matchId, homeGoals, awayGoals, finished = true) {
  if (finished) {
    await client.query(`UPDATE matches SET finished = false WHERE match_id = $1`, [matchId]);
  }
  await client.query(
    `UPDATE matches
     SET home_goals = $2, away_goals = $3, finished = $4
     WHERE match_id = $1`,
    [matchId, homeGoals, awayGoals, finished],
  );
}

async function setupScenario(client, scenario, users) {
  const ids = Object.values(users);
  const smokeUser = users['smoke-user@test.futis.local'];
  const smokeAdmin = users['smoke-admin@test.futis.local'];
  const extra1 = users['smoke-extra-1@test.futis.local'];
  const extra2 = users['smoke-extra-2@test.futis.local'];
  const extra3 = users['smoke-extra-3@test.futis.local'];

  await clearSmokeGuesses(client, ids);

  const m1to5 = await getMatchIdsByNumber(client, 1, 5);
  const m1to10 = await getMatchIdsByNumber(client, 1, 10);

  if (scenario === 1) {
    const m1to10 = await getMatchIdsByNumber(client, 1, 10);
    for (const m of m1to10) {
      await setMatchResult(client, m.match_id, 0, 0, false);
    }
    const first = m1to5[0];
    for (const uid of [smokeUser, smokeAdmin, extra1, extra2, extra3]) {
      await insertGuess(client, { matchId: first.match_id, userId: uid });
    }
    await setMatchResult(client, first.match_id, 2, 1, true);
    console.log('Scenario 1: each smoke user has 1 calculated guess (match #1 finished).');
    return;
  }

  if (scenario === 2) {
    const m6to10 = await getMatchIdsByNumber(client, 6, 10);
    for (const m of m6to10) {
      await setMatchResult(client, m.match_id, 0, 0, false);
    }
    /** @type {Record<number, { home: number; away: number }>} */
    const resultsByMatch = {
      1: { home: 2, away: 1 },
      2: { home: 1, away: 0 },
      3: { home: 0, away: 0 },
      4: { home: 3, away: 2 },
      5: { home: 2, away: 2 },
    };
    /** @type {Record<string, Record<number, { home: number; away: number }>>} */
    const guessesByUser = {
      [smokeUser]: {
        1: { home: 2, away: 1 },
        2: { home: 0, away: 0 },
        3: { home: 1, away: 1 },
        4: { home: 3, away: 2 },
        5: { home: 2, away: 1 },
      },
      [smokeAdmin]: {
        1: { home: 1, away: 0 },
        2: { home: 1, away: 0 },
        3: { home: 0, away: 0 },
        4: { home: 2, away: 1 },
        5: { home: 2, away: 2 },
      },
      [extra1]: {
        1: { home: 3, away: 0 },
        2: { home: 2, away: 1 },
        3: { home: 0, away: 0 },
        4: { home: 1, away: 0 },
        5: { home: 1, away: 1 },
      },
      [extra2]: {
        1: { home: 0, away: 0 },
        2: { home: 1, away: 0 },
        3: { home: 1, away: 1 },
        4: { home: 3, away: 2 },
        5: { home: 0, away: 0 },
      },
    };
    for (const m of m1to5) {
      const result = resultsByMatch[m.match_number];
      for (const uid of [smokeUser, smokeAdmin, extra1, extra2]) {
        const guess = guessesByUser[uid][m.match_number];
        await insertGuess(client, { matchId: m.match_id, userId: uid, ...guess });
      }
      if (m.match_number === 1) {
        await insertGuess(client, { matchId: m.match_id, userId: extra3, home: 1, away: 0 });
      }
      await setMatchResult(client, m.match_id, result.home, result.away, true);
    }
    console.log(
      'Scenario 2: matches #1-5 finished with varied results/guesses; all smoke users except smoke-extra-3 have 5 guesses; extra-3 has 1.',
    );
    return;
  }

  if (scenario === 3) {
    /** @type {{ home: number; away: number }[]} */
    const results = [
      { home: 2, away: 1 },
      { home: 1, away: 0 },
      { home: 0, away: 0 },
      { home: 3, away: 2 },
      { home: 2, away: 2 },
      { home: 1, away: 1 },
      { home: 2, away: 0 },
      { home: 4, away: 1 },
      { home: 0, away: 1 },
      { home: 3, away: 3 },
    ];
    /** @type {Record<string, { home: number; away: number }[]>} */
    const guessPatterns = {
      [smokeUser]: [
        { home: 2, away: 1 },
        { home: 1, away: 0 },
        { home: 0, away: 0 },
        { home: 3, away: 2 },
        { home: 2, away: 2 },
        { home: 0, away: 0 },
        { home: 2, away: 0 },
        { home: 3, away: 1 },
        { home: 0, away: 1 },
        { home: 2, away: 1 },
      ],
      [smokeAdmin]: [
        { home: 1, away: 0 },
        { home: 2, away: 1 },
        { home: 0, away: 0 },
        { home: 2, away: 1 },
        { home: 1, away: 1 },
        { home: 2, away: 2 },
        { home: 1, away: 0 },
        { home: 4, away: 1 },
        { home: 1, away: 0 },
        { home: 3, away: 3 },
      ],
      [extra1]: [
        { home: 3, away: 0 },
        { home: 1, away: 0 },
        { home: 1, away: 1 },
        { home: 1, away: 0 },
        { home: 2, away: 2 },
        { home: 1, away: 1 },
        { home: 2, away: 1 },
        { home: 2, away: 0 },
        { home: 0, away: 1 },
        { home: 1, away: 2 },
      ],
      [extra2]: [
        { home: 0, away: 0 },
        { home: 1, away: 0 },
        { home: 0, away: 1 },
        { home: 3, away: 2 },
        { home: 2, away: 1 },
        { home: 1, away: 0 },
        { home: 0, away: 0 },
        { home: 3, away: 0 },
        { home: 0, away: 2 },
        { home: 4, away: 4 },
      ],
      [extra3]: [
        { home: 2, away: 0 },
        { home: 0, away: 0 },
        { home: 0, away: 0 },
        { home: 2, away: 2 },
        { home: 1, away: 1 },
        { home: 2, away: 1 },
        { home: 1, away: 1 },
        { home: 1, away: 0 },
        { home: 0, away: 0 },
        { home: 2, away: 2 },
      ],
    };
    for (const m of m1to10) {
      const idx = m.match_number - 1;
      const result = results[idx];
      for (const uid of [smokeUser, smokeAdmin, extra1, extra2, extra3]) {
        const guess = guessPatterns[uid][idx];
        await insertGuess(client, { matchId: m.match_id, userId: uid, ...guess });
      }
      await setMatchResult(client, m.match_id, result.home, result.away, true);
    }
    console.log(
      'Scenario 3: matches #1-10 finished with varied results/guesses so points and ranks diverge.',
    );
    return;
  }

  throw new Error(`Unknown scenario: ${scenario}`);
}

function countCalculatedGuessesByUser(guesses) {
  const counts = new Map();
  for (const g of guesses) {
    counts.set(g.user_id, (counts.get(g.user_id) ?? 0) + 1);
  }
  return counts;
}

function hasAnyUserWithMultipleCalculatedGuesses(guesses) {
  for (const count of countCalculatedGuessesByUser(guesses).values()) {
    if (count > 1) return true;
  }
  return false;
}

async function verify(client) {
  const dashboard = await queryAll(
    client,
    `SELECT user_id, first_name FROM dashboard ORDER BY total_points DESC`,
  );
  const finishedMatches = await queryAll(
    client,
    `SELECT match_id, match_number FROM matches WHERE finished = true ORDER BY match_number`,
  );
  const guesses = await queryAll(
    client,
    `SELECT user_id, match_id, points FROM guesses WHERE points_calculated = true`,
  );

  const counts = countCalculatedGuessesByUser(guesses);
  const eligible = new Set(
    [...counts.entries()].filter(([, c]) => c > 1).map(([id]) => id),
  );
  const seriesInChart = dashboard.filter((u) => eligible.has(u.user_id));
  const showCharts =
    hasAnyUserWithMultipleCalculatedGuesses(guesses) &&
    finishedMatches.length > 0 &&
    seriesInChart.length > 0;

  const smokeRows = await queryAll(
    client,
    `SELECT id, email FROM auth.users WHERE email = ANY($1::text[])`,
    [SMOKE_EMAILS],
  );
  const smokeIds = new Set(smokeRows.map((r) => r.id));

  console.log('\n--- Verification (app logic) ---');
  console.log(`showCharts: ${showCharts}`);
  console.log(`timeline steps: ${finishedMatches.length}`);
  console.log(`chart-eligible series (all users): ${seriesInChart.length}`);
  console.log('Smoke user calculated guess counts:');
  for (const row of smokeRows) {
    console.log(`  ${row.email}: ${counts.get(row.id) ?? 0}`);
  }
  const inChart = seriesInChart
    .filter((s) => smokeIds.has(s.user_id))
    .map((s) => s.first_name);
  console.log(`Smoke users in chart series: ${inChart.join(', ') || '(none)'}`);
  if (finishedMatches.length) {
    console.log(
      `X-axis match numbers: ${finishedMatches.map((m) => m.match_number).join(', ')}`,
    );
  }

  const chartData = buildStandingsChartData(
    dashboard.map((row) => ({ user_id: row.user_id, first_name: row.first_name })),
    finishedMatches,
    guesses,
  );
  const smokeSeries = chartData.series.filter((s) => smokeIds.has(s.userId));

  return {
    showCharts,
    seriesInChart,
    counts,
    smokeIds,
    smokeRows,
    finishedMatches,
    chartData,
    smokeSeries,
  };
}

function assertChartDynamics(smokeSeries, { minUsers = 2, requireRankSpread = false } = {}) {
  if (smokeSeries.length < minUsers) {
    throw new Error(`Expected at least ${minUsers} smoke chart series, got ${smokeSeries.length}`);
  }
  const finalPoints = smokeSeries.map((s) => s.pointsByMatch.at(-1) ?? 0);
  if (new Set(finalPoints).size < 2) {
    throw new Error(`Expected diverging cumulative points, got: ${finalPoints.join(', ')}`);
  }
  if (requireRankSpread) {
    const ranks = smokeSeries.flatMap((s) => s.rankByMatch);
    const min = Math.min(...ranks);
    const max = Math.max(...ranks);
    if (min === max) {
      throw new Error(`Expected rank spread among smoke users, all at rank ${min}`);
    }
    const maxRank = smokeSeries.length;
    if (max > maxRank) {
      throw new Error(`Rank ${max} exceeds chart-eligible count ${maxRank} (off-scale bug)`);
    }
  }
}

function assertScenario(scenario, result) {
  const extra3Name = 'Smoke Extra 3';
  const inChart = result.seriesInChart.map((s) => s.first_name);
  const extra3InChart = inChart.includes(extra3Name);
  const extra3Count = result.counts.get(result.extra3Id) ?? 0;

  if (scenario === 1) {
    if (result.showCharts) throw new Error('Scenario 1: expected showCharts=false');
    if (result.seriesInChart.length > 0) throw new Error('Scenario 1: expected no chart series');
    console.log('Scenario 1: PASS');
    return;
  }

  if (scenario === 2) {
    if (!result.showCharts) throw new Error('Scenario 2: expected showCharts=true');
    if (extra3InChart) throw new Error('Scenario 2: extra-3 must not appear in chart series');
    if (extra3Count !== 1) {
      throw new Error(`Scenario 2: extra-3 expected 1 calculated guess, got ${extra3Count}`);
    }
    const multi = [...result.counts.entries()].filter(([, c]) => c > 1).length;
    if (multi < 2) throw new Error('Scenario 2: expected multiple users with >1 guesses');
    assertChartDynamics(result.smokeSeries, { minUsers: 3, requireRankSpread: true });
    console.log('Scenario 2: PASS');
    return;
  }

  if (scenario === 3) {
    if (!result.showCharts) throw new Error('Scenario 3: expected showCharts=true');
    if (result.finishedMatches.length < 10) {
      throw new Error(`Scenario 3: expected 10 finished matches, got ${result.finishedMatches.length}`);
    }
    for (const row of result.smokeRows) {
      const c = result.counts.get(row.id) ?? 0;
      if (c < 10) {
        throw new Error(`Scenario 3: ${row.email} expected 10 guesses, got ${c}`);
      }
    }
    assertChartDynamics(result.smokeSeries, { minUsers: 5, requireRankSpread: true });
    console.log('Scenario 3: PASS');
  }
}

async function run() {
  const { envPath, scenario, verifyOnly } = parseArgs(process.argv.slice(2));
  await loadEnvFiles(envPath);
  const client = createPgClient();
  await connectPgClient(client);

  try {
    const users = await resolveSmokeUserIds(client);
    if (!verifyOnly) {
      if (![1, 2, 3].includes(scenario)) throw new Error('--scenario 1, 2, or 3 required');
      await setupScenario(client, scenario, users);
    }
    const result = await verify(client);
    result.extra3Id = users['smoke-extra-3@test.futis.local'];
    if (scenario) assertScenario(scenario, result);
  } finally {
    await client.end().catch(() => {});
  }
}

run().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
