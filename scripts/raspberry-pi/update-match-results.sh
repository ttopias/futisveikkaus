#!/usr/bin/env bash
set -euo pipefail

# Trigger production match-result sync from a Raspberry Pi (or any cron host).
# Full setup: scripts/README.md — "Raspberry Pi trigger (Hobby Vercel)"
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
hour=$(date +%H)

# Active window: 19:00–07:00 local (19:00 inclusive, 07:00 exclusive)
if [[ "$hour" -ge 19 || "$hour" -lt 7 ]]; then
	curl -sf \
		-H "Authorization: Bearer ${CRON_SECRET}" \
		"${UPDATE_RESULTS_URL}"
fi
