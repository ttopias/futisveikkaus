export type SortDir = 'asc' | 'desc';

export function compareValues(a: string | number, b: string | number): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'fi');
}

export function toggleSortKey(
  currentKey: string | null,
  currentDir: SortDir,
  key: string,
): { sortKey: string; sortDir: SortDir } {
  if (currentKey === key) {
    return { sortKey: key, sortDir: currentDir === 'asc' ? 'desc' : 'asc' };
  }
  return { sortKey: key, sortDir: 'asc' };
}

export function sortRows<TRow>(
  rows: TRow[],
  sortKey: string | null,
  sortDir: SortDir,
  getValue: (row: TRow, key: string) => string | number,
): TRow[] {
  if (!sortKey) return rows;
  const dir = sortDir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => compareValues(getValue(a, sortKey), getValue(b, sortKey)) * dir);
}
