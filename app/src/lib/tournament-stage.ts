import type { SupabaseClient } from '@supabase/supabase-js';
import { MATCH_STAGES, type MatchStage } from '$lib/stages';

/**
 * First stage (in tournament order) that still has unfinished matches.
 * When every match is finished, returns `final`.
 */
export async function fetchVisibleMatchStage(supabase: SupabaseClient): Promise<MatchStage> {
  for (const stage of MATCH_STAGES) {
    const { count, error } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('stage', stage)
      .eq('finished', false);

    if (error) {
      throw new Error(`fetchVisibleMatchStage(${stage}): ${error.message}`);
    }

    if ((count ?? 0) > 0) {
      return stage;
    }
  }

  return 'final';
}

export function filterMatchesByVisibleStage<T extends { stage?: string | null }>(
  matches: T[],
  visibleStage: MatchStage,
): T[] {
  return matches.filter((m) => m.stage === visibleStage);
}

export function isMatchInVisibleStage(
  match: { stage?: string | null },
  visibleStage: MatchStage,
): boolean {
  return match.stage === visibleStage;
}

export function stageIndex(stage: MatchStage): number {
  return MATCH_STAGES.indexOf(stage);
}

/** True when `stage` is the visible stage or an earlier one in tournament order. */
export function isStageAtOrBefore(stage: string | null | undefined, visibleStage: MatchStage): boolean {
  if (!stage || !MATCH_STAGES.includes(stage as MatchStage)) return false;
  return stageIndex(stage as MatchStage) <= stageIndex(visibleStage);
}

export function isMatchStarted(match: { starts_at?: string | null }): boolean {
  if (match.starts_at == null) return false;
  const kickoff = new Date(match.starts_at);
  if (Number.isNaN(kickoff.getTime())) return false;
  return kickoff <= new Date();
}

/** Finished or in-progress matches in visible or past stages may show all users' guesses. */
export function canViewMatchGuesses(
  match: { stage?: string | null; starts_at?: string | null },
  visibleStage: MatchStage,
): boolean {
  return isStageAtOrBefore(match.stage, visibleStage) && isMatchStarted(match);
}
