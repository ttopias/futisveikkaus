import { supabaseAdminClient } from '$lib/server/supabaseAdminClient';
import type { parseFixtureCsv } from '../../../../scripts/lib/fixtures.mjs';
import {
	runMatchResultsSync,
	resultsFromFixtures,
} from '../../../../scripts/lib/update-match-results-core.mjs';

const EARLY_UPDATE_MS = 180 * 60 * 1000;

export type UpdateMatchResultsSummary = {
	updated: number;
	unchanged: number;
	noSource: number;
	skippedKnockout: number;
	skippedEarly: number;
	preview: string[];
};

export async function updateMatchResults({
	dryRun = false,
	fixtureCsvText,
	fixtureRows,
	sourceResults,
}: {
	dryRun?: boolean;
	fixtureCsvText?: string;
	fixtureRows?: ReturnType<typeof parseFixtureCsv>;
	sourceResults?: ReturnType<typeof resultsFromFixtures>;
} = {}): Promise<UpdateMatchResultsSummary> {
	const result = await runMatchResultsSync(supabaseAdminClient, {
		dryRun,
		fixtureCsvText,
		fixtureRows,
		sourceResults,
		earlyUpdateMs: EARLY_UPDATE_MS,
	});

	return {
		updated: result.updated,
		unchanged: result.unchanged,
		noSource: result.noSource,
		skippedKnockout: result.skippedKnockout,
		skippedEarly: result.skippedEarly,
		preview: result.preview,
	};
}
