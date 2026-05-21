#!/usr/bin/env node
/**
 * Create or reset smoke-test Supabase auth users (see scripts/README.md).
 *
 *   node scripts/seed-smoke-users.mjs --env app/.env.local
 *   node scripts/seed-smoke-users.mjs --dry-run --env app/.env.local
 */

import path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { loadEnvFiles, repoRoot } from './lib/db-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const requireFromApp = createRequire(path.join(repoRoot, 'app', 'package.json'));
const { createClient } = requireFromApp('@supabase/supabase-js');

const SMOKE_USERS = [
  {
    email: 'smoke-user@test.futis.local',
    password: process.env.SMOKE_USER_PASSWORD ?? 'SmokeTest2026!User',
    role: 'user',
    firstName: 'Smoke User',
  },
  {
    email: 'smoke-admin@test.futis.local',
    password: process.env.SMOKE_ADMIN_PASSWORD ?? 'SmokeTest2026!Admin',
    role: 'admin',
    firstName: 'Smoke Admin',
  },
];

function parseArgs(argv) {
  const args = { dryRun: false, envPath: null, extra: 0 };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--env') {
      args.envPath = argv[i + 1];
      if (!args.envPath || args.envPath.startsWith('--')) throw new Error('Missing value for --env');
      i += 1;
    } else if (arg === '--extra') {
      const n = Number(argv[i + 1]);
      if (!Number.isFinite(n) || n < 0) throw new Error('Missing value for --extra');
      args.extra = n;
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: node scripts/seed-smoke-users.mjs [--dry-run] [--env <path>] [--extra N]

Creates smoke-user@test.futis.local and smoke-admin@test.futis.local.
--extra N adds smoke-extra-1@... through smoke-extra-N@... (user role).
`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return args;
}

function getAdminClient() {
  const url = String(process.env.PUBLIC_SUPABASE_URL ?? '').trim();
  const key = String(process.env.SUPABASE_SECRET_KEY ?? '').trim();
  if (!url || !key) {
    throw new Error('Set PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in env.');
  }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function findUserByEmail(admin, email) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function upsertSmokeUser(admin, { email, password, role, firstName }, dryRun) {
  const existing = await findUserByEmail(admin, email);
  if (dryRun) {
    console.log(`${existing ? 'Would reset' : 'Would create'} ${email} (role=${role})`);
    return existing?.id ?? null;
  }

  let userId = existing?.id ?? null;

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      app_metadata: { role },
      user_metadata: { first_name: firstName },
    });
    if (error) throw error;
    console.log(`Reset ${email}`);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role },
      user_metadata: { first_name: firstName },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Created ${email}`);
  }

  const { error: profileError } = await admin.from('profiles').upsert(
    { id: userId, first_name: firstName },
    { onConflict: 'id' },
  );
  if (profileError) throw profileError;

  return userId;
}

async function run() {
  const { dryRun, envPath, extra } = parseArgs(process.argv.slice(2));
  await loadEnvFiles(envPath);
  const admin = getAdminClient();

  const users = [...SMOKE_USERS];
  for (let i = 1; i <= extra; i += 1) {
    users.push({
      email: `smoke-extra-${i}@test.futis.local`,
      password: process.env.SMOKE_USER_PASSWORD ?? 'SmokeTest2026!User',
      role: 'user',
      firstName: `Smoke Extra ${i}`,
    });
  }

  const ids = [];
  for (const spec of users) {
    ids.push(await upsertSmokeUser(admin, spec, dryRun));
  }
  if (!dryRun) console.log(`Smoke users ready (${ids.filter(Boolean).length}).`);
}

run().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
