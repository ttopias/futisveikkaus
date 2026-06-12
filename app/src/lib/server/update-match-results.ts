import { supabaseAdminClient } from '$lib/server/supabaseAdminClient';

export const FIXTURE_CSV_URL =
	'https://fixturedownload.com/download/fifa-world-cup-2026-UTC.csv';

const FETCH_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; FutisveikkausScraper/1.0)' };
const EARLY_UPDATE_MS = 180 * 60 * 1000;

type MatchResult = { home_goals: number; away_goals: number; finished: boolean };

type DbMatchRow = {
	match_id: string;
	match_number: number;
	home_goals: number | null;
	away_goals: number | null;
	finished: boolean;
	starts_at: string | null;
};

type MatchUpdate = {
	match_id: string;
	match_number: number;
	before: { home_goals: number | null; away_goals: number | null; finished: boolean };
	after: MatchResult;
};

export type UpdateMatchResultsSummary = {
	updated: number;
	unchanged: number;
	noSource: number;
	skippedEarly: number;
	preview: string[];
};

function parseScore(result: string | undefined): [number | null, number | null, boolean] {
	const m = String(result ?? '').match(/(\d+)\s*[-–]\s*(\d+)/);
	return m ? [+m[1], +m[2], true] : [null, null, false];
}

function parseCsvLine(line: string): string[] {
	const cells: string[] = [];
	let cur = '';
	let quoted = false;
	for (const ch of line) {
		if (ch === '"') {
			quoted = !quoted;
			continue;
		}
		if (ch === ',' && !quoted) {
			cells.push(cur.trim());
			cur = '';
			continue;
		}
		cur += ch;
	}
	cells.push(cur.trim());
	return cells;
}

function parseFixtureResultsCsv(text: string): Map<number, MatchResult> {
	const lines = text.split(/\r?\n/).filter((l) => l.trim());
	if (!lines.length) return new Map();

	const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
	const col = (name: string) => header.findIndex((h) => h.includes(name));

	const matchNumberCol = col('match number');
	const resultCol = col('result');
	if (matchNumberCol < 0) {
		throw new Error(`Fixture CSV missing match number column. Headers: ${header.join(', ')}`);
	}

	const byNumber = new Map<number, MatchResult>();
	for (const line of lines.slice(1)) {
		const c = parseCsvLine(line);
		const matchNumber = Number(c[matchNumberCol]);
		if (!Number.isFinite(matchNumber)) continue;
		const [home_goals, away_goals, finished] = parseScore(resultCol >= 0 ? c[resultCol] : '');
		if (!finished || home_goals === null || away_goals === null) continue;
		byNumber.set(matchNumber, { home_goals, away_goals, finished: true });
	}
	return byNumber;
}

function needsUpdate(dbRow: DbMatchRow, source: MatchResult): boolean {
	return (
		dbRow.home_goals !== source.home_goals ||
		dbRow.away_goals !== source.away_goals ||
		dbRow.finished !== source.finished
	);
}

function canApplyResult(row: DbMatchRow, now = Date.now()): boolean {
	if (row.starts_at == null) return true;
	return new Date(row.starts_at).getTime() + EARLY_UPDATE_MS <= now;
}

function formatPreview(updates: MatchUpdate[], limit = 12): string[] {
	return updates.slice(0, limit).map(
		(u) =>
			`#${u.match_number}: ${u.before.home_goals ?? '?'}-${u.before.away_goals ?? '?'} (${u.before.finished ? 'done' : 'open'}) -> ${u.after.home_goals}-${u.after.away_goals} (finished)`,
	);
}

async function fetchFixtureResults(): Promise<Map<number, MatchResult>> {
	const res = await fetch(FIXTURE_CSV_URL, {
		headers: FETCH_HEADERS,
		signal: AbortSignal.timeout(45_000),
	});
	if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${FIXTURE_CSV_URL}`);
	const text = await res.text();
	if (text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html')) {
		throw new Error('Fixture URL returned HTML instead of CSV.');
	}
	return parseFixtureResultsCsv(text);
}

export async function updateMatchResults({
	dryRun = false,
}: {
	dryRun?: boolean;
} = {}): Promise<UpdateMatchResultsSummary> {
	const sourceResults = await fetchFixtureResults();

	const { data: matches, error } = await supabaseAdminClient
		.from('matches')
		.select('match_id, match_number, home_goals, away_goals, finished, starts_at')
		.order('match_number');
	if (error) throw error;

	let unchanged = 0;
	let noSource = 0;
	let skippedEarly = 0;
	const pending: MatchUpdate[] = [];

	for (const row of (matches ?? []) as DbMatchRow[]) {
		const source = sourceResults.get(row.match_number);
		if (!source) {
			noSource += 1;
			continue;
		}
		if (!needsUpdate(row, source)) {
			unchanged += 1;
			continue;
		}
		if (!canApplyResult(row)) {
			skippedEarly += 1;
			continue;
		}
		pending.push({
			match_id: row.match_id,
			match_number: row.match_number,
			before: {
				home_goals: row.home_goals,
				away_goals: row.away_goals,
				finished: row.finished,
			},
			after: source,
		});
	}

	const preview = formatPreview(pending);

	if (!dryRun && pending.length > 0) {
		for (const u of pending) {
			const { error: updErr } = await supabaseAdminClient
				.from('matches')
				.update({
					home_goals: u.after.home_goals,
					away_goals: u.after.away_goals,
					finished: u.after.finished,
				})
				.eq('match_id', u.match_id);
			if (updErr) throw updErr;
		}
	}

	return {
		updated: pending.length,
		unchanged,
		noSource,
		skippedEarly,
		preview,
	};
}
