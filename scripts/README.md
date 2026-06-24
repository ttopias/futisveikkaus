# Scripts

## `make init`

Fresh database + tournament data + FIFA ranks (uses `app/.env.local`):

1. `init-database.mjs` — schema reset + apply; **removes** any `*@test.futis.local` smoke-test auth users if present
2. `scrape-wikipedia.mjs --write` — teams & matches
3. `scrape-fifa-rankings.mjs --write` — `teams.fifa_rank`

`make init` does **not** create smoke users. For local/browser testing, run `seed-smoke-users.mjs` explicitly afterward.

Dry-run preview (no DB writes): run each script with `--dry-run` in the same order.

## Database (Postgres DDL)

`init-database.mjs` runs `sql/reset.sql` (wipe app schema) then `tables.sql` -> `functions.sql` -> `triggers.sql` -> `policies.sql`, then deletes smoke-test accounts (`smoke-user@test.futis.local`, `smoke-admin@test.futis.local`, `smoke-extra-*@test.futis.local`) from `auth.users`. Other real users in `auth.users` are preserved. Destructive for existing app data; safe on an empty database.

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

Inline overrides in `scripts/lib/team-names.mjs`: `NAME_TO_ENGLISH`, `FINNISH_NAME_OVERRIDES`.

Adapts to whatever the fixture CSV contains (no fixed match count). Logs stage breakdown; warns on skipped rows (bad dates, unresolved names, missing KO slots). Exits only on fatal errors (network, empty fixtures, no teams, no matches after merge).

### Data model

- **`teams`**: 48 nations only (`group` = `A`–`L`). No synthetic knockout placeholders.
- **`matches` (group)**: `home_id` / `away_id` set; `home_slot` / `away_slot` null; `stage` = `group`.
- **`matches` (knockout)**: `home_slot` / `away_slot` compact codes; `home_id` / `away_id` null until resolved; `stage` = `r32` … `final`.

Slot codes (`lib/slots.mjs`):

| Code | Meaning |
|------|---------|
| `1A` | Group A winner |
| `2B` | Group B runner-up |
| `3ABCDF` | Best third among groups A, B, C, D, F (points -> GD -> GF -> FIFA rank) |
| `winner:73` | Winner of match #73 |
| `loser:101` | Loser of match #101 |

Finnish labels (e.g. `Lohkon A voittaja`) are derived in the app from slot codes, not stored as team rows.

**Group / best-third tiebreakers** (among tied teams in a group or in a `3ABCDF` slot): (1) points, (2) goal difference, (3) goals scored — each descending; (4) FIFA rank (`teams.fifa_rank`, lower number = better; `NULL` ranks last).

Static bracket wiring when CSV has “To be announced”: `scripts/bracket-slots.mjs`.

```bash
node scripts/scrape-wikipedia.mjs --dry-run
node scripts/scrape-wikipedia.mjs --csv --output-dir ./tmp/scrape
node scripts/scrape-wikipedia.mjs --write --env app/.env.local
```

`--write` needs `PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY` (after `init-database`).

---

## FIFA rankings (`scrape-fifa-rankings.mjs`)

Fetches the current men's FIFA world ranking from [FIFA API](https://api.fifa.com/api/v3/rankings?gender=1), maps English country names to Finnish `teams.name` via the same 101languages / override pipeline as `scrape-wikipedia.mjs` (`scripts/lib/team-names.mjs`), and writes `teams.fifa_rank`. Run after teams exist in the database; re-run when rankings update.

```bash
node scripts/scrape-fifa-rankings.mjs --dry-run --env app/.env.local
node scripts/scrape-fifa-rankings.mjs --write --env app/.env.local
```

`--write` needs `PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY`. Tournament teams missing a FIFA mapping are logged as warnings (non-tournament countries from the API are not logged).

---

## Tournament sync (`sync-tournament.mjs`)

Single entry point for keeping the live tournament in sync with the [Fixture Download UTC CSV](https://fixturedownload.com/download/fifa-world-cup-2026-UTC.csv). Runs **two steps in order** (same as the cron HTTP route):

1. **Knockout participants** — `home_id` / `away_id` on non-group matches when CSV Home/Away cells have resolved country names.
2. **Group match results** — `home_goals`, `away_goals`, `finished` on group-stage rows only (knockout scores via admin).

Shared orchestration lives in `scripts/lib/tournament-sync.mjs` (`runTournamentSync`). Step logic is in `scripts/lib/knockout-participants.mjs` (`runKnockoutParticipantSync`) and `scripts/lib/update-match-results-core.mjs` (`runMatchResultsSync`). The SvelteKit cron route and CLI scripts call those modules — no subprocess spawning.

### CLI

```bash
node scripts/sync-tournament.mjs --dry-run --env app/.env.local
node scripts/sync-tournament.mjs --write --env app/.env.local
```

`make sync-tournament` runs write mode with `app/.env.local`.

Options (`--env`, `--fixtures-file`, `--fixtures-url`, `--fixtures-tz`, `--dry-run` / `--write`) apply to the full sync. Individual CLIs use the same flags.

Individual scripts remain available: `sync-knockout-participants.mjs`, `update-match-results.mjs`.

### HTTP cron (`/api/cron/update-match-results`)

The app exposes **one** endpoint — `GET` or `POST /api/cron/update-match-results` — that fetches the fixture CSV once and runs both steps above. Use this for Vercel Cron (Pro), a Raspberry Pi `curl`, or any external scheduler.

Requires header:

```http
Authorization: Bearer <CRON_SECRET>
```

Set `CRON_SECRET` in Vercel project env (and `app/.env.local` for local testing). Use a long random string.

Local test (dev server running, `CRON_SECRET` in `.env.local`):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:5173/api/cron/update-match-results
```

#### Vercel Cron (Pro plan)

On **Vercel Pro**, `app/vercel.json` schedules the route once daily at 08:00 GMT+3 (05:00 UTC, `0 5 * * *`). Vercel sends `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is set. Deploy from the `app/` root (SvelteKit + `adapter-vercel`).

#### Raspberry Pi trigger (Hobby Vercel / no Vercel Cron)

Supabase and Vercel require paid plans for built-in cron. Use a Raspberry Pi (or any always-on host) to `curl` **one URL** — the same endpoint above runs both participant sync and group results.

**Prerequisites**

1. App deployed to Vercel with root directory **`app/`**.
2. `CRON_SECRET` set in Vercel env (must match the Pi).
3. `SUPABASE_SECRET_KEY` and other app env vars already on Vercel.
4. Production URL, e.g. `https://your-app.vercel.app/api/cron/update-match-results`.

**1. Copy the example script**

```bash
mkdir -p ~/bin
cp /path/to/futisveikkaus/scripts/raspberry-pi/update-match-results.sh ~/bin/
chmod 700 ~/bin/update-match-results.sh
```

**2. Store secrets**

```bash
mkdir -p ~/.config/futisveikkaus
cat > ~/.config/futisveikkaus/env <<'EOF'
CRON_SECRET=your-long-random-secret
UPDATE_RESULTS_URL=https://your-app.vercel.app/api/cron/update-match-results
EOF
chmod 600 ~/.config/futisveikkaus/env
```

**3. Wrapper for cron** (loads env, logs output)

```bash
cat > ~/bin/futisveikkaus-update-wrapper.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
source ~/.config/futisveikkaus/env
export CRON_SECRET UPDATE_RESULTS_URL
exec ~/bin/update-match-results.sh
EOF
chmod 700 ~/bin/futisveikkaus-update-wrapper.sh
```

**4. Crontab** (every 15 minutes; script skips 07:00–19:00 Europe/Helsinki)

```bash
crontab -e
```

Add:

```cron
*/15 * * * * /home/pi/bin/futisveikkaus-update-wrapper.sh >> /var/log/futisveikkaus-update.log 2>&1
```

Adjust `/home/pi/` if your user differs.

**5. Manual test**

```bash
source ~/.config/futisveikkaus/env
curl -v -H "Authorization: Bearer $CRON_SECRET" "$UPDATE_RESULTS_URL"
```

Expected **200** JSON, e.g. no changes:

```json
{"participants":{"updated":0,"unchanged":32,"unknownNames":[],"preview":[]},"results":{"updated":0,"unchanged":2,"noSource":40,"skippedKnockout":32,"skippedEarly":0,"preview":[]},"message":"No changes needed"}
```

After a new CSV group result (and 180 min past kickoff): `results.updated` ≥ 1. After CSV names a knockout team: `participants.updated` ≥ 1.

**Security**

- Use **HTTPS** only.
- Never commit `CRON_SECRET` to git.
- `chmod 600` on env file; `chmod 700` on scripts.
- The endpoint is not linked in the UI; the secret is the main protection.

**Troubleshooting**

| Symptom | Likely cause |
|---------|----------------|
| `401 Unauthorized` | `CRON_SECRET` mismatch between Pi and Vercel; trailing newline/quotes in `cron.env`; secret only on Preview not Production; redeploy after adding `CRON_SECRET` on Vercel |
| `09: value too great for base` | Old script compared `date +%H` with `[[ -lt ]]` — update to latest `scripts/raspberry-pi/update-match-results.sh` (uses `hour=$((10#$(date +%H)))`) |
| `500` + error message | Missing Supabase env on Vercel, or CSV fetch failed |
| Empty log / exit 0 midday | Script correctly skips 07:00–19:00 Helsinki |
| `curl: (22)` / HTTP 4xx | Wrong URL or auth header |
| No updates though match ended | CSV not updated yet, or within 180 min of `starts_at` |

---

## Match results (`update-match-results.mjs`)

Updates **only** `home_goals`, `away_goals`, and `finished` on existing **group-stage** `matches` rows, keyed by `match_number`. Knockout (`r32` … `final`) scores are **not** auto-synced — enter 90-minute full-time results in admin. Uses the same [Fixture Download UTC CSV](https://fixturedownload.com/download/fifa-world-cup-2026-UTC.csv) as `scrape-wikipedia.mjs`. Does not change teams, slots, kickoff times, or knockout participants.

For the usual cron workflow (participants + group results), use **`sync-tournament.mjs`** or the HTTP cron route instead.

```bash
node scripts/update-match-results.mjs --dry-run --env app/.env.local
node scripts/update-match-results.mjs --write --env app/.env.local
```

`make update-results` runs this script only (group scores). `make sync-tournament` runs the full two-step sync.

### Knockout participants (`sync-knockout-participants.mjs`)

Syncs knockout `home_id` / `away_id` from CSV **Home** / **Away** columns when they contain resolved country names (e.g. `Germany`, `Spain`). Slot codes (`2A`, `Winner Match 74`, `Runner-up Group B`) and TBA cells are ignored — existing IDs are **not** cleared on regression. `home_slot` / `away_slot` are never touched.

```bash
node scripts/sync-knockout-participants.mjs --dry-run --env app/.env.local
node scripts/sync-knockout-participants.mjs --write --env app/.env.local
```

Details:

- CSV team names take precedence over Postgres slot resolution when both are known.
- Hybrid cells (`Germany` vs `3ABCDF`) update only the resolvable side.
- `resolve-bracket.mjs` remains available for manual backfill after all group matches finish.
- Re-running `scrape-wikipedia.mjs --write` clears knockout IDs; the next cron run repopulates from CSV.

Unit tests: `node scripts/test-knockout-participants.mjs` (uses `scripts/fixtures/sample-knockout-sync.csv`).

---

## Bracket resolver (Postgres + `resolve-bracket.mjs`)

Knockout `home_id` / `away_id` are filled automatically by **`trigger_z_resolve_bracket_slots`** on `matches` (same `WHEN` as guess scoring: `finished` toggled, or goals changed on a finished match). Runs after `trigger_update_team_statistics` so group standings are current.

**`resolve_bracket_slots()`** (in `sql/functions.sql`):

| Slot | When it resolves |
|------|------------------|
| `1A`, `2B` | Every group-stage match in that group is `finished` |
| `winner:N`, `loser:N` | Feeder match `N` is finished and not a draw |
| `3ABCDF` | All groups in the suffix are complete — best third by points -> GD -> GF -> FIFA rank |

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

Needs `PUBLIC_SUPABASE_URL` and `SUPABASE_SECRET_KEY`. Set `SMOKE_USER_PASSWORD` and `SMOKE_ADMIN_PASSWORD` before running. For local dev only, you may pass `--allow-default-passwords` (uses built-in test passwords).
