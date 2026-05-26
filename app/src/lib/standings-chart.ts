export type TimelineMatch = {
  matchNumber: number;
  matchId: number;
};

export type StandingsChartSeries = {
  userId: string;
  name: string;
  /** Unique Chart.js dataset label (disambiguates duplicate first names). */
  chartLabel: string;
  /** Stable palette index; same user keeps this color across both charts. */
  colorIndex: number;
  pointsByMatch: number[];
  rankByMatch: number[];
};

export type StandingsChartData = {
  timeline: TimelineMatch[];
  series: StandingsChartSeries[];
};

type DashboardRow = {
  user_id: string;
  first_name: string;
};

type FinishedMatchRow = {
  match_id: number;
  match_number: number;
};

type GuessRow = {
  user_id: string;
  match_id: number;
  points: number;
};

/** Count of calculated guesses (`points_calculated`) per user. */
export function countCalculatedGuessesByUser(guesses: GuessRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const g of guesses) {
    counts.set(g.user_id, (counts.get(g.user_id) ?? 0) + 1);
  }
  return counts;
}

/** Users with more than one calculated guess — eligible for chart series. */
export function userIdsWithMultipleCalculatedGuesses(guesses: GuessRow[]): Set<string> {
  const eligible = new Set<string>();
  for (const [userId, count] of countCalculatedGuessesByUser(guesses)) {
    if (count > 1) eligible.add(userId);
  }
  return eligible;
}

export function hasAnyUserWithMultipleCalculatedGuesses(guesses: GuessRow[]): boolean {
  return userIdsWithMultipleCalculatedGuesses(guesses).size > 0;
}

function assignRanksAtStep(totals: { userId: string; points: number }[]): Map<string, number> {
  const sorted = [...totals].sort((a, b) => b.points - a.points);
  const ranks = new Map<string, number>();
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].points < sorted[i - 1].points) {
      rank = i + 1;
    }
    ranks.set(sorted[i].userId, rank);
  }
  return ranks;
}

/** Distinct legend labels when multiple users share the same first name. */
export function chartLabelsForSeries(
  series: Pick<StandingsChartSeries, 'userId' | 'name'>[],
): Map<string, string> {
  const nameCounts = new Map<string, number>();
  for (const { name } of series) {
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
  }
  const labels = new Map<string, string>();
  const suffixByName = new Map<string, number>();
  for (const { userId, name } of series) {
    if ((nameCounts.get(name) ?? 0) <= 1) {
      labels.set(userId, name);
      continue;
    }
    const n = (suffixByName.get(name) ?? 0) + 1;
    suffixByName.set(name, n);
    labels.set(userId, `${name} (${n})`);
  }
  return labels;
}

export function buildStandingsChartData(
  users: DashboardRow[],
  finishedMatches: FinishedMatchRow[],
  guesses: GuessRow[],
): StandingsChartData {
  const timeline: TimelineMatch[] = finishedMatches.map((m) => ({
    matchNumber: m.match_number,
    matchId: m.match_id,
  }));

  const pointsByUserMatch = new Map<string, Map<number, number>>();
  for (const g of guesses) {
    if (!pointsByUserMatch.has(g.user_id)) {
      pointsByUserMatch.set(g.user_id, new Map());
    }
    const byMatch = pointsByUserMatch.get(g.user_id)!;
    byMatch.set(g.match_id, (byMatch.get(g.match_id) ?? 0) + g.points);
  }

  const chartEligible = userIdsWithMultipleCalculatedGuesses(guesses);
  const userById = new Map(users.map((user) => [user.user_id, user]));

  const series: StandingsChartSeries[] = [...chartEligible].map((userId) => {
    const user = userById.get(userId);
    const name = user?.first_name?.trim() || 'Tuntematon';
    const byMatch = pointsByUserMatch.get(userId);
    const pointsByMatch: number[] = [];
    let cumulative = 0;
    for (const step of timeline) {
      cumulative += byMatch?.get(step.matchId) ?? 0;
      pointsByMatch.push(cumulative);
    }
    return {
      userId,
      name,
      chartLabel: name,
      colorIndex: 0,
      pointsByMatch,
      rankByMatch: [],
    };
  });

  const matchCount = timeline.length;
  for (let i = 0; i < matchCount; i++) {
    const totals = series.map((s) => ({
      userId: s.userId,
      points: s.pointsByMatch[i],
    }));
    const ranks = assignRanksAtStep(totals);
    for (const s of series) {
      s.rankByMatch.push(ranks.get(s.userId) ?? series.length);
    }
  }

  series.sort((a, b) => a.name.localeCompare(b.name, 'fi'));

  const labelByUserId = chartLabelsForSeries(series);
  for (let i = 0; i < series.length; i++) {
    series[i].chartLabel = labelByUserId.get(series[i].userId) ?? series[i].name;
    series[i].colorIndex = i;
  }

  return {
    timeline,
    series,
  };
}

/** Page-level: charts when timeline exists and any user has >1 calculated guess. */
export function shouldShowStandingsCharts(
  guesses: GuessRow[],
  chartData: StandingsChartData | null | undefined,
): boolean {
  return (
    hasAnyUserWithMultipleCalculatedGuesses(guesses) &&
    (chartData?.timeline.length ?? 0) > 0 &&
    (chartData?.series.length ?? 0) > 0
  );
}

/**
 * Categorical palette for up to 20 users: distinct hues (Okabe–Ito / Tableau–style),
 * sufficient contrast on light card backgrounds. Index 0 keeps brand emerald.
 */
export const STANDINGS_CHART_COLORS = [
  'hsl(158 62% 32%)',
  'hsl(205 70% 42%)',
  'hsl(28 85% 48%)',
  'hsl(2 65% 48%)',
  'hsl(168 55% 36%)',
  'hsl(278 48% 46%)',
  'hsl(192 75% 40%)',
  'hsl(48 75% 42%)',
  'hsl(320 55% 48%)',
  'hsl(88 45% 38%)',
  'hsl(235 55% 52%)',
  'hsl(15 70% 52%)',
  'hsl(140 50% 38%)',
  'hsl(350 55% 50%)',
  'hsl(218 45% 58%)',
  'hsl(38 60% 38%)',
  'hsl(300 40% 50%)',
  'hsl(175 40% 48%)',
  'hsl(0 50% 55%)',
  'hsl(260 35% 55%)',
] as const;

export function colorForSeriesIndex(index: number): string {
  return STANDINGS_CHART_COLORS[index % STANDINGS_CHART_COLORS.length];
}

/** Shared Chart.js dataset styling for standings line charts. */
export function datasetStyleForSeriesIndex(index: number) {
  const color = colorForSeriesIndex(index);
  return {
    borderColor: color,
    backgroundColor: color,
    pointBackgroundColor: color,
    pointBorderColor: 'hsl(0 0% 100%)',
    pointBorderWidth: 2,
    pointHoverBackgroundColor: color,
    pointHoverBorderColor: 'hsl(0 0% 100%)',
    pointHoverBorderWidth: 2,
    borderWidth: 2.5,
  };
}
