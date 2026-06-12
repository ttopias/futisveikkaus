import type { SupabaseClient } from '@supabase/supabase-js';
import { MATCH_STAGES, type MatchStage, isMatchStage } from '$lib/stages';

/**
 * First stage (in tournament order) that still has unfinished matches.
 * When every match is finished, returns `final`.
 */
export async function fetchVisibleMatchStage(supabase: SupabaseClient): Promise<MatchStage> {
  const { data, error } = await supabase.rpc('visible_match_stage');

  if (!error && isMatchStage(data)) {
    return data;
  }

  // Fallback when RPC is not deployed yet (local / older DB).
  const { data: rows, error: selectError } = await supabase
    .from('matches')
    .select('stage')
    .eq('finished', false);

  if (selectError) {
    throw new Error(`fetchVisibleMatchStage: ${selectError.message}`);
  }

  if (!rows?.length) {
    return 'final';
  }

  const unfinishedStages = new Set(rows.map((row) => row.stage));
  for (const stage of MATCH_STAGES) {
    if (unfinishedStages.has(stage)) {
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
export function isStageAtOrBefore(
  stage: string | null | undefined,
  visibleStage: MatchStage,
): boolean {
  if (!stage || !MATCH_STAGES.includes(stage as MatchStage)) return false;
  return stageIndex(stage as MatchStage) <= stageIndex(visibleStage);
}

/**
 * Earliest kickoff (ISO) among matches of a stage, or null when none.
 * The whole stage shares this single deadline for editing and revealing guesses.
 */
export async function fetchStageFirstKickoff(
  supabase: SupabaseClient,
  stage: MatchStage,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('matches')
    .select('starts_at')
    .eq('stage', stage)
    .not('starts_at', 'is', null)
    .order('starts_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`fetchStageFirstKickoff: ${error.message}`);
  }

  return data?.starts_at ?? null;
}

/** True once the first match of the stage has kicked off (stage deadline passed). */
export function hasStageStarted(stageFirstKickoff: string | null | undefined): boolean {
  if (stageFirstKickoff == null) return false;
  const kickoff = new Date(stageFirstKickoff);
  if (Number.isNaN(kickoff.getTime())) return false;
  return kickoff <= new Date();
}

/** Predictions stay open for every match of a stage until its first match starts. */
export function isStagePredictable(stageFirstKickoff: string | null | undefined): boolean {
  if (stageFirstKickoff == null) return false;
  const kickoff = new Date(stageFirstKickoff);
  if (Number.isNaN(kickoff.getTime())) return false;
  return kickoff > new Date();
}

/** Guesses are revealed for the whole stage once that stage's first match has started. */
export function canViewMatchGuesses(
  match: { stage?: string | null },
  visibleStage: MatchStage,
  stageFirstKickoff: string | null | undefined,
): boolean {
  return isStageAtOrBefore(match.stage, visibleStage) && hasStageStarted(stageFirstKickoff);
}
