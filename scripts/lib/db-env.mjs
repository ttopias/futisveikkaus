import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, "..", "..");
const requireFromApp = createRequire(path.join(repoRoot, "app", "package.json"));

function parseEnvText(text) {
  const entries = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const stripped = line.startsWith("export ") ? line.slice(7) : line;
    const eq = stripped.indexOf("=");
    if (eq <= 0) continue;
    let value = stripped.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    entries.push([stripped.slice(0, eq).trim(), value]);
  }
  return entries;
}

export async function loadEnvFiles(envPathArg) {
  const candidates = envPathArg
    ? [path.resolve(process.cwd(), envPathArg)]
    : [path.join(repoRoot, "app", ".env.local"), path.join(repoRoot, "app", ".env")];

  const loadedPaths = [];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const content = await readFile(candidate, "utf8");
    for (const [key, value] of parseEnvText(content)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
    loadedPaths.push(candidate);
  }
  return loadedPaths;
}

const PLACEHOLDER_PATTERN = /\[(YOUR-PASSWORD|project-ref|region)\]/i;

export function parseDatabaseUrl(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    return {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === "postgresql:" ? "5432" : ""),
      database: parsed.pathname.replace(/^\//, "") || "postgres",
      username: decodeURIComponent(parsed.username || ""),
    };
  } catch {
    return null;
  }
}

export function redactDatabaseUrl(databaseUrl) {
  try {
    const parsed = new URL(databaseUrl);
    if (parsed.password) parsed.password = "****";
    return parsed.toString();
  } catch {
    return databaseUrl.replace(/:([^:/@]+)@/, ":****@");
  }
}

function validateDatabaseUrl(databaseUrl) {
  const issues = [];

  if (PLACEHOLDER_PATTERN.test(databaseUrl)) {
    issues.push(
      "URI still contains placeholder text from .env.example (e.g. [YOUR-PASSWORD] or [project-ref]). " +
        "Replace with your real database password and project ref from Supabase Dashboard."
    );
  }

  if (/^https?:\/\//i.test(databaseUrl) || databaseUrl.includes("https://")) {
    issues.push(
      "DATABASE_URL must be a postgres:// or postgresql:// URI, not an https:// URL. " +
        "Do not use PUBLIC_SUPABASE_URL here."
    );
  }

  const parsed = parseDatabaseUrl(databaseUrl);
  if (!parsed) {
    issues.push(
      "Could not parse DATABASE_URL as a URL. Check for unescaped special characters in the password (@, #, :, /) - URL-encode them."
    );
  } else {
    const { hostname, username } = parsed;
    if (hostname === "postgres") {
      issues.push(
        'Hostname is literally "postgres" (causes getaddrinfo ENOTFOUND). ' +
          "Use the full URI from Dashboard -> Project Settings -> Database -> Connection string -> URI."
      );
    }
    if (hostname.endsWith(".supabase.co") && !hostname.startsWith("db.")) {
      issues.push(
        `Hostname "${hostname}" looks like the Supabase API host (*.supabase.co), not Postgres. ` +
          "Use the Database connection URI (pooler.supabase.com or db.[project-ref].supabase.co)."
      );
    }
    if (username === "postgres" && hostname.includes("pooler.supabase.com")) {
      issues.push(
        "Username is postgres without a project ref. Supabase pooler URIs use postgres.[project-ref] as the user."
      );
    }
  }

  if (issues.length > 0) throw new Error(issues.join("\n\n"));
}

export function formatPgConnectionError(error, databaseUrl) {
  const parsed = parseDatabaseUrl(databaseUrl);
  const lines = [error.message];
  if (parsed) {
    const portSuffix = parsed.port ? `:${parsed.port}` : "";
    lines.push(`Resolved host: ${parsed.hostname}${portSuffix} (from DATABASE_URL)`);
  }
  lines.push(`Redacted URI: ${redactDatabaseUrl(databaseUrl)}`);
  if (error.code === "ENOTFOUND" && parsed?.hostname === "postgres") {
    lines.push("");
    lines.push("Typical fix: use the full pooler URI from the dashboard, e.g.:");
    lines.push(
      "  postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
    );
  } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
    lines.push("");
    lines.push("Check DATABASE_URL in app/.env.local - see scripts/README.md.");
  }
  return lines.join("\n");
}

export function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!databaseUrl) {
    throw new Error(
      "Missing DATABASE_URL or SUPABASE_DB_URL. " +
        "Init needs a Postgres URI (not PUBLIC_SUPABASE_* or SUPABASE_SECRET_KEY). " +
        "Supabase Dashboard -> Project Settings -> Database -> Connection string -> URI. " +
        "Add to app/.env.local - see app/.env.example."
    );
  }
  if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
    throw new Error("DATABASE_URL/SUPABASE_DB_URL must be a postgres:// or postgresql:// URI.");
  }
  validateDatabaseUrl(databaseUrl);
  return databaseUrl;
}

export function createPgClient() {
  const { Client } = requireFromApp("pg");
  return new Client({ connectionString: getDatabaseUrl() });
}

export async function connectPgClient(client) {
  const databaseUrl = getDatabaseUrl();
  try {
    await client.connect();
  } catch (error) {
    const wrapped = new Error(formatPgConnectionError(error, databaseUrl));
    wrapped.cause = error;
    throw wrapped;
  }
}

export function fileLabel(filePath) {
  return path.relative(repoRoot, filePath);
}
