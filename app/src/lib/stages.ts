import type { Match, Prediction } from '$lib/index';
import { enrichMatchParticipants } from '$lib/match-participants';

/** Stable DB enum keys for tournament stages. */
export const MATCH_STAGES = ['group', 'r32', 'r16', 'qf', 'sf', 'third', 'final'] as const;

export type MatchStage = (typeof MATCH_STAGES)[number];

const MATCH_STAGE_SET = new Set<string>(MATCH_STAGES);

export function isMatchStage(stage: string | null | undefined): stage is MatchStage {
  return stage != null && MATCH_STAGE_SET.has(stage);
}

/** Finnish labels for knockout stages (group stage uses the team group letter). */
export const STAGE_LABELS_FI: Record<Exclude<MatchStage, 'group'>, string> = {
  r32: 'R32',
  r16: 'R16',
  qf: 'Välierä',
  sf: 'Semifinaali',
  third: 'Pronssiottelu',
  final: 'Finaali',
};

export function stageLabelFi(stage: MatchStage, teamGroup?: string | null): string {
  if (stage === 'group') {
    return teamGroup?.trim() || 'Lohko';
  }
  return STAGE_LABELS_FI[stage];
}

/** Label for the single tournament stage currently shown in match lists. */
export function visibleStageLabelFi(stage: MatchStage): string {
  if (stage === 'group') return 'Alkusarja';
  return STAGE_LABELS_FI[stage];
}

/** Whether predictions are still open for a match (deadline = kickoff). */
export function isMatchPredictable(match: { starts_at?: string | null }): boolean {
  if (match.starts_at == null) return false;
  const kickoff = new Date(match.starts_at);
  if (Number.isNaN(kickoff.getTime())) return false;
  return kickoff > new Date();
}

export function enrichMatchWithStageDisplay(match: Match): Match {
  const m = enrichMatchParticipants(match);
  const stage = isMatchStage(m.stage) ? m.stage : 'group';
  const teamGroup = m.away?.group ?? m.home?.group ?? '';
  return {
    ...m,
    groupStage: stage === 'group',
    group: stageLabelFi(stage, teamGroup),
  };
}

export function enrichMatchesWithStageDisplay(matches: Match[]): Match[] {
  if (!matches?.length) return [];
  return matches.map(enrichMatchWithStageDisplay);
}

export function enrichPredictionsWithStageDisplay(predictions: Prediction[]): Prediction[] {
  return predictions.map((prediction) => {
    const match = enrichMatchWithStageDisplay(prediction.match);
    return {
      ...prediction,
      groupStage: match.groupStage,
      group: match.group,
      match,
    };
  });
}
