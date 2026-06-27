import type { SupabaseClient } from '@supabase/supabase-js';
import { MATCH_STAGES, type MatchStage, isMatchStage } from '$lib/stages';

/** Prediction dependency order (not the same as MATCH_STAGES display order). */
const STAGE_PREDECESSOR: Partial<Record<MatchStage, MatchStage>> = {
  r32: 'group',
  r16: 'r32',
  qf: 'r16',
  sf: 'qf',
  third: 'sf',
  final: 'sf',
};

export function stagePredecessor(stage: MatchStage): MatchStage | null {
  return STAGE_PREDECESSOR[stage] ?? null;
}

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

type StageMatchTeams = {
  home?: { team_id?: number } | null;
  away?: { team_id?: number } | null;
};

function isStagePredictableByKickoff(stageFirstKickoff: string | null | undefined): boolean {
  if (stageFirstKickoff == null) return false;
  const kickoff = new Date(stageFirstKickoff);
  if (Number.isNaN(kickoff.getTime())) return false;
  return kickoff > new Date();
}

function allStageMatchesHaveTeams(matches: StageMatchTeams[]): boolean {
  return (
    matches.length > 0 &&
    matches.every((m) => Boolean(m.home?.team_id) && Boolean(m.away?.team_id))
  );
}

function allStageMatchesFinished(matches: { finished?: boolean | null }[]): boolean {
  return matches.length > 0 && matches.every((m) => m.finished);
}

export function isStagePredictable(
  stageFirstKickoff: string | null | undefined,
  stageMatches: StageMatchTeams[],
  previousStageMatches: { finished?: boolean | null }[] = [],
): boolean {
  if (!isStagePredictableByKickoff(stageFirstKickoff)) return false;
  if (!allStageMatchesHaveTeams(stageMatches)) return false;
  if (previousStageMatches.length > 0 && !allStageMatchesFinished(previousStageMatches)) {
    return false;
  }
  return true;
}

export async function fetchStagePredictable(
  supabase: SupabaseClient,
  stage: MatchStage,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('stage_ready_for_predictions', { p_stage: stage });
  if (!error && typeof data === 'boolean') {
    return data;
  }

  const prev = stagePredecessor(stage);
  const [stageFirstKickoff, stageRes, prevRes] = await Promise.all([
    fetchStageFirstKickoff(supabase, stage),
    supabase
      .from('matches')
      .select('home_id, away_id')
      .eq('stage', stage),
    prev
      ? supabase.from('matches').select('finished').eq('stage', prev)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (stageRes.error) {
    throw new Error(`fetchStagePredictable: ${stageRes.error.message}`);
  }
  if (prevRes.error) {
    throw new Error(`fetchStagePredictable: ${prevRes.error.message}`);
  }

  const stageMatches = (stageRes.data ?? []).map((m) => ({
    home: m.home_id ? { team_id: m.home_id } : null,
    away: m.away_id ? { team_id: m.away_id } : null,
  }));

  return isStagePredictable(stageFirstKickoff, stageMatches, prevRes.data ?? []);
}

/** Guesses are revealed for the whole stage once that stage's first match has started. */
export function canViewMatchGuesses(
  match: { stage?: string | null },
  visibleStage: MatchStage,
  stageFirstKickoff: string | null | undefined,
): boolean {
  return isStageAtOrBefore(match.stage, visibleStage) && hasStageStarted(stageFirstKickoff);
}
