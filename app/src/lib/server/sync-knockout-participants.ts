import { supabaseAdminClient } from '$lib/server/supabaseAdminClient';
import { runKnockoutParticipantSync } from '../../../../scripts/lib/knockout-participants.mjs';
import type { parseFixtureCsv } from '../../../../scripts/lib/fixtures.mjs';

export type SyncKnockoutParticipantsSummary = {
	updated: number;
	unchanged: number;
	unknownNames: string[];
	preview: string[];
};

export async function syncKnockoutParticipants({
	dryRun = false,
	fixtureCsvText,
	fixtureRows,
}: {
	dryRun?: boolean;
	fixtureCsvText?: string;
	fixtureRows?: ReturnType<typeof parseFixtureCsv>;
} = {}): Promise<SyncKnockoutParticipantsSummary> {
	const result = await runKnockoutParticipantSync(supabaseAdminClient, {
		dryRun,
		fixtureCsvText,
		fixtureRows,
	});

	return {
		updated: result.updated,
		unchanged: result.unchanged,
		unknownNames: result.unknownNames,
		preview: result.preview,
	};
}
