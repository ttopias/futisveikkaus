#!/usr/bin/env node
/**
 * Resolve knockout match participants via Postgres (resolve_bracket_slots).
 *
 *   node scripts/resolve-bracket.mjs --dry-run --env app/.env.local
 *   node scripts/resolve-bracket.mjs --write --env app/.env.local
 *
 * Slot codes: lib/slots.mjs (1A, 2B, 3ABCDF, winner:73, loser:101).
 * Automatic resolution also runs from trigger_z_resolve_bracket_slots on match updates.
 */

import process from "node:process";
import { connectPgClient, createPgClient, loadEnvFiles } from "./lib/db-env.mjs";

function parseArgs(argv) {
  const args = { dryRun: true, env: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--write") args.dryRun = false;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--env" && argv[i + 1]) args.env = argv[++i];
    else if (a === "--help" || a === "-h") {
      console.log(`Usage: node scripts/resolve-bracket.mjs [--dry-run | --write] [--env PATH]`);
      process.exit(0);
    }
  }
  return args;
}

async function previewChanges(client) {
  await client.query("BEGIN");
  try {
    const { rows: before } = await client.query(`
      SELECT match_id, match_number, home_id, away_id
      FROM matches
      WHERE stage <> 'group'
      ORDER BY match_number
    `);
    const beforeById = new Map(before.map((row) => [row.match_id, row]));

    const { rows: countRows } = await client.query("SELECT resolve_bracket_slots(true) AS n");
    const n = Number(countRows[0]?.n ?? 0);

    const { rows: after } = await client.query(`
      SELECT match_id, match_number, home_id, away_id
      FROM matches
      WHERE stage <> 'group'
      ORDER BY match_number
    `);

    const preview = [];
    for (const row of after) {
      const prev = beforeById.get(row.match_id);
      if (!prev) continue;
      if (prev.home_id === row.home_id && prev.away_id === row.away_id) continue;
      preview.push({
        match_number: row.match_number,
        cur_home: prev.home_id,
        cur_away: prev.away_id,
        res_home: row.home_id,
        res_away: row.away_id,
      });
    }

    return { n, preview };
  } finally {
    await client.query("ROLLBACK");
  }
}

async function main() {
  const args = parseArgs(process.argv);
  await loadEnvFiles(args.env);

  const client = createPgClient();
  await connectPgClient(client);

  try {
    if (args.dryRun) {
      const { n, preview } = await previewChanges(client);
      console.log(`Resolvable updates: ${n} match(es).`);
      for (const row of preview.slice(0, 10)) {
        console.log(
          `  #${row.match_number}: home ${row.cur_home ?? "—"} -> ${row.res_home ?? "—"}, ` +
            `away ${row.cur_away ?? "—"} -> ${row.res_away ?? "—"}`,
        );
      }
      if (preview.length > 10) console.log(`  … and ${preview.length - 10} more`);
      return;
    }

    const { rows } = await client.query("SELECT resolve_bracket_slots(true) AS updated");
    console.log(`Updated ${Number(rows[0]?.updated ?? 0)} match(es).`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
