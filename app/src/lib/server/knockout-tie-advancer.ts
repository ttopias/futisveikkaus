import { supabaseAdminClient } from '$lib/server/supabaseAdminClient';
import { applyKnockoutTieAdvancer as applyKnockoutTieAdvancerCore } from '../../../../scripts/lib/knockout-tie-advancer.mjs';

export { computeKnockoutTieAdvancerPatches } from '../../../../scripts/lib/knockout-tie-advancer.mjs';

export async function applyKnockoutTieAdvancer(
	feederMatchNumber: number,
	advancerTeamId: number,
	loserTeamId: number,
): Promise<number> {
	return applyKnockoutTieAdvancerCore(
		supabaseAdminClient,
		feederMatchNumber,
		advancerTeamId,
		loserTeamId,
	);
}
