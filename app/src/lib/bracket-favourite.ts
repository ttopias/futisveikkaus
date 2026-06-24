import type { Team } from '$lib/index';

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

/** Current group-table favourite for an unresolved bracket slot (1A, 2B, 3ABC…). */
export function slotFavourite(
  slot: string | null | undefined,
  rankedGroups: Record<string, Team[]>,
): FavouriteTeam | null {
  if (!slot) return null;

  let m = slot.match(/^(\d)([A-L])$/);
  if (m) {
    const rank = Number(m[1]) - 1;
    const groupTeams = rankedGroups[m[2]];
    if (!groupTeams || rank >= groupTeams.length) return null;
    const team = groupTeams[rank];
    return { country_code: team.country_code, name: team.name };
  }

  m = slot.match(/^3([A-L]+)$/);
  if (m) {
    const thirds: Team[] = [];
    for (const group of m[1].split('')) {
      const groupTeams = rankedGroups[group];
      if (groupTeams && groupTeams.length >= 3) {
        thirds.push(groupTeams[2]);
      }
    }
    if (thirds.length === 0) return null;
    const best = sortGroupTeams(thirds)[0];
    return { country_code: best.country_code, name: best.name };
  }

  return null;
}
