#!/usr/bin/env node

// Apply a single SQL file to the database WITHOUT resetting anything.
// Unlike init-database.mjs this is non-destructive: it only runs the file you pass.
//
// Usage:
//   node scripts/apply-sql.mjs <path-to-sql> [--env <path>] [--dry-run]
//
// Requires DATABASE_URL or SUPABASE_DB_URL (Postgres URI), same as init-database.mjs.

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  connectPgClient,
  createPgClient,
  fileLabel,
  loadEnvFiles,
  repoRoot,
} from "./lib/db-env.mjs";

function parseArgs(argv) {
  const args = { dryRun: false, envPath: null, sqlPath: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--env") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) throw new Error("Missing value for --env");
      args.envPath = value;
      i += 1;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/apply-sql.mjs <path-to-sql> [--env <path>] [--dry-run]

Applies a single SQL file (non-destructive). Requires DATABASE_URL or SUPABASE_DB_URL.`);
      process.exit(0);
    } else if (!arg.startsWith("--") && !args.sqlPath) {
      args.sqlPath = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }
  if (!args.sqlPath) throw new Error("Missing SQL file path. See --help.");
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sqlPath = path.resolve(process.cwd(), args.sqlPath);
  const sql = await readFile(sqlPath, "utf8");

  if (args.dryRun) {
    console.log(`[dry-run] Would apply ${fileLabel(sqlPath)} (${sql.length} bytes).`);
    return;
  }

  await loadEnvFiles(args.envPath);
  const client = createPgClient();
  await connectPgClient(client);
  try {
    console.log(`Applying ${fileLabel(sqlPath)} ...`);
    await client.query(sql);
    console.log("Done.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
