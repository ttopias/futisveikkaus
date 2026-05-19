import type { Match, Team } from '$lib/index';
import { slotLabelFi } from '$lib/slots';

const TBD_FLAG = 'tbd';

function slotAsTeam(slot: string): Team {
  return {
    team_id: 0,
    country_code: TBD_FLAG,
    name: slotLabelFi(slot),
    group: '',
    win: 0,
    draw: 0,
    loss: 0,
    gf: 0,
    gaa: 0,
  };
}

/** Fill home/away for UI from resolved teams or unresolved slot codes. */
export function enrichMatchParticipants<T extends Match>(match: T): T {
  const home = match.home ?? (match.home_slot ? slotAsTeam(match.home_slot) : undefined);
  const away = match.away ?? (match.away_slot ? slotAsTeam(match.away_slot) : undefined);
  return { ...match, home, away };
}

const UNKNOWN_TEAM: Team = {
  team_id: 0,
  country_code: TBD_FLAG,
  name: '—',
  group: '',
  win: 0,
  draw: 0,
  loss: 0,
  gf: 0,
  gaa: 0,
};

/** Resolved or slot placeholder participant for display. */
export function matchParticipant(match: Match, side: 'home' | 'away'): Team {
  const enriched = enrichMatchParticipants(match);
  const team = side === 'home' ? enriched.home : enriched.away;
  return team ?? UNKNOWN_TEAM;
}

export function enrichMatchesWithParticipants(matches: Match[]): Match[] {
  if (!matches?.length) return [];
  return matches.map(enrichMatchParticipants);
}

export const MATCH_PARTICIPANT_SELECT = `
  home_slot,
  away_slot,
  home:home_id (team_id, country_code, name, group, win, draw, loss, gf, gaa),
  away:away_id (team_id, country_code, name, group, win, draw, loss, gf, gaa)
`;

export function isPlaceholderFlag(countryCode: string | null | undefined): boolean {
  return countryCode === TBD_FLAG;
}
