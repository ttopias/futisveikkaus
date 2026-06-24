import { CRON_SECRET } from '$env/static/private';
import { syncKnockoutParticipants } from '$lib/server/sync-knockout-participants';
import { updateMatchResults } from '$lib/server/update-match-results';
import {
	FIXTURE_CSV_URL,
	fetchFixtureCsvText,
	parseFixtureCsv,
} from '../../../../../../scripts/lib/fixtures.mjs';
import { resultsFromFixtures } from '../../../../../../scripts/lib/update-match-results-core.mjs';
import { json, type RequestHandler } from '@sveltejs/kit';

function authorize(request: Request): boolean {
	const auth = request.headers.get('authorization');
	if (!CRON_SECRET || !auth) return false;
	return auth === `Bearer ${CRON_SECRET}`;
}

const run: RequestHandler = async ({ request }) => {
	if (!authorize(request)) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const fixtureCsvText = await fetchFixtureCsvText(FIXTURE_CSV_URL);
		const fixtureRows = parseFixtureCsv(fixtureCsvText, 'UTC');
		const sourceResults = resultsFromFixtures(fixtureRows);

		const participants = await syncKnockoutParticipants({ dryRun: false, fixtureRows });
		const results = await updateMatchResults({ dryRun: false, fixtureRows, sourceResults });

		const summary = { participants, results };
		if (participants.updated === 0 && results.updated === 0) {
			return json({ ...summary, message: 'No changes needed' });
		}
		return json(summary);
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Update failed';
		return json({ error: message }, { status: 500 });
	}
};

export const GET = run;
export const POST = run;
