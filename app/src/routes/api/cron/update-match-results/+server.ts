import { CRON_SECRET } from '$env/static/private';
import { updateMatchResults } from '$lib/server/update-match-results';
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
		const summary = await updateMatchResults({ dryRun: false });
		if (summary.updated === 0) {
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
