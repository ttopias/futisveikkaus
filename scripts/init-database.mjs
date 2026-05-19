#!/usr/bin/env node

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

const RESET_SQL = path.join(repoRoot, "sql", "reset.sql");
const SCHEMA_SQL_FILES = [
  path.join(repoRoot, "sql", "tables.sql"),
  path.join(repoRoot, "sql", "functions.sql"),
  path.join(repoRoot, "sql", "triggers.sql"),
  path.join(repoRoot, "sql", "policies.sql"),
];
const SQL_FILES = [RESET_SQL, ...SCHEMA_SQL_FILES];

function parseArgs(argv) {
  const args = { dryRun: false, envPath: null };
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
      console.log(`Usage: node scripts/init-database.mjs [--dry-run] [--env <path>]

Wipes app schema (sql/reset.sql) then applies tables -> functions -> triggers -> policies.
Preserves auth.users. Destructive for existing app data; idempotent on empty DB.
Requires DATABASE_URL or SUPABASE_DB_URL (Postgres URI). --dry-run does not connect.
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

async function run() {
  const { dryRun, envPath } = parseArgs(process.argv.slice(2));
  const loadedEnvPaths = await loadEnvFiles(envPath);

  console.log(dryRun ? "Init (dry run):" : "Init (reset + schema):");
  if (loadedEnvPaths.length) {
    for (const p of loadedEnvPaths) console.log(`  env: ${fileLabel(p)}`);
  }
  for (const filePath of SQL_FILES) {
    console.log(`  sql: ${fileLabel(filePath)}`);
  }

  if (dryRun) {
    console.log("Dry run complete. No SQL executed.");
    return;
  }

  const client = createPgClient();
  try {
    await connectPgClient(client);
    for (const filePath of SQL_FILES) {
      const label = fileLabel(filePath);
      console.log(`Executing ${label}...`);
      await client.query(await readFile(filePath, "utf8"));
      console.log(`Done ${label}.`);
    }
    console.log("Database initialization completed.");
  } finally {
    await client.end().catch(() => {});
  }
}

run().catch((error) => {
  console.error(`Database initialization failed: ${error.message}`);
  process.exit(1);
});
