#!/usr/bin/env bash
set -euo pipefail

# Trigger production tournament sync from a Raspberry Pi (or any cron host).
# One HTTP call runs knockout participant sync then group match results (same as sync-tournament.mjs).
# Full setup: scripts/README.md — "Raspberry Pi trigger"
#
# Required env vars:
#   CRON_SECRET          — same value as on Vercel (Authorization: Bearer …)
#   UPDATE_RESULTS_URL   — e.g. https://your-app.vercel.app/api/cron/update-match-results
#
# Optional: source /etc/futisveikkaus/cron.env before running (see README).

if [[ -f /etc/futisveikkaus/cron.env ]]; then
	# shellcheck source=/dev/null
	source /etc/futisveikkaus/cron.env
fi

: "${CRON_SECRET:?CRON_SECRET is required}"
: "${UPDATE_RESULTS_URL:?UPDATE_RESULTS_URL is required}"

export TZ=Europe/Helsinki
# Force base-10: date +%H returns "09" etc., which bash treats as invalid octal in [[ -lt ]].
hour=$((10#$(date +%H)))

# Active window: 19:00–07:00 local (19:00 inclusive, 07:00 exclusive)
if (( hour >= 19 || hour < 7 )); then
	curl -sf \
		-H "Authorization: Bearer ${CRON_SECRET}" \
		"${UPDATE_RESULTS_URL}"
fi
