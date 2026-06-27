import type { Match, Team } from '$lib/index';
import { isThirdPlaceSlot, thirdPlaceSlotGroups } from '$lib/slots';

export type FavouriteTeam = Pick<Team, 'country_code' | 'name'>;

export function sortGroupTeams(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => {
    const ptsA = a.win * 3 + a.draw;
    const ptsB = b.win * 3 + b.draw;
    if (ptsB !== ptsA) return ptsB - ptsA;
    const gdA = a.gf - a.gaa;
    const gdB = b.gf - b.gaa;
    if (gdB !== gdA) return gdB - gdA;
    if (b.gf !== a.gf) return b.gf - a.gf;
    const rankA = a.fifa_rank ?? Number.POSITIVE_INFINITY;
    const rankB = b.fifa_rank ?? Number.POSITIVE_INFINITY;
    return rankA - rankB;
  });
}

export function buildRankedGroups(teams: Team[]): Record<string, Team[]> {
  const byGroup: Record<string, Team[]> = {};
  for (const team of teams) {
    if (!byGroup[team.group]) byGroup[team.group] = [];
    byGroup[team.group].push(team);
  }
  for (const group of Object.keys(byGroup)) {
    byGroup[group] = sortGroupTeams(byGroup[group]);
  }
  return byGroup;
}

function bestThirdAmongGroups(
  groups: string[],
  rankedGroups: Record<string, Team[]>,
  excludeTeamIds: ReadonlySet<number>,
): Team | null {
  const thirds: Team[] = [];
  for (const group of groups) {
    const groupTeams = rankedGroups[group];
    if (groupTeams && groupTeams.length >= 3) {
      const third = groupTeams[2];
      if (!excludeTeamIds.has(third.team_id)) {
        thirds.push(third);
      }
    }
  }
  if (thirds.length === 0) return null;
  return sortGroupTeams(thirds)[0];
}

function toFavourite(team: Team): FavouriteTeam {
  return { country_code: team.country_code, name: team.name };
}

function resolveSlotTeam(
  slot: string,
  rankedGroups: Record<string, Team[]>,
  excludeTeamIds: ReadonlySet<number> = new Set(),
): Team | null {
  const m = slot.match(/^(\d)([A-L])$/);
  if (m) {
    const rank = Number(m[1]) - 1;
    const groupTeams = rankedGroups[m[2]];
    if (!groupTeams || rank >= groupTeams.length) return null;
    return groupTeams[rank];
  }

  if (isThirdPlaceSlot(slot)) {
    return bestThirdAmongGroups(thirdPlaceSlotGroups(slot), rankedGroups, excludeTeamIds);
  }

  return null;
}

/** Current group-table favourite for an unresolved bracket slot (1A, 2B, 3ABC…). */
export function slotFavourite(
  slot: string | null | undefined,
  rankedGroups: Record<string, Team[]>,
  excludeTeamIds: ReadonlySet<number> = new Set(),
): FavouriteTeam | null {
  if (!slot) return null;
  const team = resolveSlotTeam(slot, rankedGroups, excludeTeamIds);
  return team ? toFavourite(team) : null;
}

function r32AssignedTeamIdsExcept(r32Matches: Match[], exceptMatchId: number): Set<number> {
  const ids = new Set<number>();
  for (const match of r32Matches) {
    if (match.match_id === exceptMatchId) continue;
    if (match.home?.team_id) ids.add(match.home.team_id);
    if (match.away?.team_id) ids.add(match.away.team_id);
  }
  return ids;
}

export function enrichR32Favourites(
  matches: Match[],
  rankedGroups: Record<string, Team[]>,
): Match[] {
  const thirdExclude = new Set<number>();
  const favourites = new Map<number, { home: FavouriteTeam | null; away: FavouriteTeam | null }>();

  const r32Matches = matches
    .filter((m) => m.stage === 'r32')
    .sort((a, b) => (a.match_number ?? 0) - (b.match_number ?? 0));

  for (const match of r32Matches) {
    let home: FavouriteTeam | null = null;
    let away: FavouriteTeam | null = null;
    const bracketExclude = r32AssignedTeamIdsExcept(r32Matches, match.match_id);

    for (const [side, slot, participant] of [
      ['home', match.home_slot, match.home] as const,
      ['away', match.away_slot, match.away] as const,
    ]) {
      if (!slot || participant?.team_id) continue;
      const exclude = new Set([...bracketExclude, ...thirdExclude]);
      const team = resolveSlotTeam(slot, rankedGroups, exclude);
      if (!team) continue;
      const favourite = toFavourite(team);
      if (side === 'home') home = favourite;
      else away = favourite;
      if (isThirdPlaceSlot(slot)) thirdExclude.add(team.team_id);
    }

    favourites.set(match.match_id, { home, away });
  }

  return matches.map((match) => {
    if (match.stage !== 'r32') return match;
    const fav = favourites.get(match.match_id)!;
    return {
      ...match,
      home_favourite: fav.home,
      away_favourite: fav.away,
    };
  });
}
