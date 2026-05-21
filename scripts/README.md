# Scripts

## Database (Postgres DDL)

`init-database.mjs` runs `sql/reset.sql` (wipe app schema) then `tables.sql` -> `functions.sql` -> `triggers.sql` -> `policies.sql`. Preserves `auth.users`. Destructive for existing app data; safe on an empty database.

Connect with **`DATABASE_URL`** or **`SUPABASE_DB_URL`** (full Postgres URI from Supabase Dashboard -> Database -> Connection string -> URI). API keys (`PUBLIC_SUPABASE_*`, `SUPABASE_SECRET_KEY`) are not enough for DDL.

`--dry-run` lists `reset.sql` then schema files; no connection needed.

### Fresh database

```bash
node scripts/init-database.mjs --env app/.env.local
node scripts/init-database.mjs --dry-run --env app/.env.local   # preview
```

Install `pg` once: `npm install` in `app/`.

### SQL trigger tests

`test-sql.mjs` runs guess-points, team-stats, and bracket-resolver checks inside a transaction and rolls back (no lasting changes). Needs the same `DATABASE_URL` / `SUPABASE_DB_URL` as init.

```bash
node scripts/test-sql.mjs --env app/.env.local
```

### `DATABASE_URL` mistakes

| Problem | Fix |
|---------|-----|
| `ENOTFOUND postgres` | Host must be the pooler hostname, not the word `postgres` |
| `https://*.supabase.co` in `DATABASE_URL` | Use the database URI, not `PUBLIC_SUPABASE_URL` |
| Placeholders `[YOUR-PASSWORD]` | Replace with real values from the dashboard |

Scripts validate common mistakes before connecting.

---

## Scraper (`scrape-wikipedia.mjs`)

| Source | Data |
|--------|------|
| [Fixture Download UTC CSV](https://fixturedownload.com/download/fifa-world-cup-2026-UTC.csv) | Schedule, group-stage teams, R32 compact codes (`2A`, `3ABCDF`) |
| [EN Wikipedia](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup) | Groups, knockout bracket (`Winner Match 74`, etc.) |
| [101languages](https://www.101languages.net/finnish/country-names-finnish/) | English -> Finnish team names (fetched at runtime) |

Inline overrides in the script: `CSV_TO_ENGLISH`, `FINNISH_NAME_OVERRIDES`.

Fails if match count is not **104**.

### Data model

- **`teams`**: 48 nations only (`group` = `A`–`L`). No synthetic knockout placeholders.
- **`matches` (group)**: `home_id` / `away_id` set; `home_slot` / `away_slot` null; `stage` = `group`.
- **`matches` (knockout)**: `home_slot` / `away_slot` compact codes; `home_id` / `away_id` null until resolved; `stage` = `r32` … `final`.

Slot codes (`lib/slots.mjs`):

| Code | Meaning |
|------|---------|
| `1A` | Group A winner |
| `2B` | Group B runner-up |
| `3ABCDF` | Best third among groups A, B, C, D, F (points → GD → GF, desc) |
| `winner:73` | Winner of match #73 |
| `loser:101` | Loser of match #101 |

Finnish labels (e.g. `Lohkon A voittaja`) are derived in the app from slot codes, not stored as team rows.

**Best-third tiebreakers** (FIFA WC 2026 Art. 13, among third-placed teams in a slot’s groups, e.g. `3ABCDF`): (1) points, (2) goal difference, (3) goals scored — each descending. Fair-play conduct score and FIFA ranking are not used.

Static bracket wiring when CSV has “To be announced”: `scripts/bracket-slots.mjs`.

```bash
node scripts/scrape-wikipedia.mjs --dry-run
node scripts/scrape-wikipedia.mjs --csv --output-dir ./tmp/scrape
node scripts/scrape-wikipedia.mjs --write --env app/.env.local
```

`--write` needs `PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` (after `init-database`).

---

## Bracket resolver (Postgres + `resolve-bracket.mjs`)

Knockout `home_id` / `away_id` are filled automatically by **`trigger_z_resolve_bracket_slots`** on `matches` (same `WHEN` as guess scoring: `finished` toggled, or goals changed on a finished match). Runs after `trigger_update_team_statistics` so group standings are current.

**`resolve_bracket_slots()`** (in `sql/functions.sql`):

| Slot | When it resolves |
|------|------------------|
| `1A`, `2B` | Every group-stage match in that group is `finished` |
| `winner:N`, `loser:N` | Feeder match `N` is finished and not a draw |
| `3ABCDF` | All groups in the suffix are complete — best third by points → GD → GF (see tiebreakers above) |

Targeted helpers (`resolve_bracket_slots_for_group`, `resolve_bracket_slots_for_feeder`) limit work per trigger row. Full resolver is idempotent (safe to re-run).

Manual backfill / dry-run (needs `DATABASE_URL` or `SUPABASE_DB_URL`, same as `init-database.mjs`):

```bash
node scripts/resolve-bracket.mjs --dry-run --env app/.env.local
node scripts/resolve-bracket.mjs --write --env app/.env.local
```

The script calls `resolve_bracket_slots()` via `pg`; it does not duplicate resolution logic in Node.

---

## Smoke test users (`seed-smoke-users.mjs`)

Creates or resets two Supabase auth users for manual/browser smoke tests:

| Email | Role (`app_metadata.role`) |
|-------|----------------------------|
| `smoke-user@test.futis.local` | `user` |
| `smoke-admin@test.futis.local` | `admin` |

```bash
node scripts/seed-smoke-users.mjs --env app/.env.local
node scripts/seed-smoke-users.mjs --dry-run --env app/.env.local
```

Needs `PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY`. Default passwords: `SmokeTest2026!User` / `SmokeTest2026!Admin` (override with `SMOKE_USER_PASSWORD` / `SMOKE_ADMIN_PASSWORD`).
