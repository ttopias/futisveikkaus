/** Shared bracket layout constants — keep card height and connector math in sync. */
export const MATCH_BOX_HEIGHT = 132;
export const BASE_GAP = 8;
export const CONNECTOR_WIDTH = 24;

export function columnGap(roundIndex: number): number {
  if (roundIndex <= 0) return BASE_GAP;
  return (Math.pow(2, roundIndex) - 1) * (MATCH_BOX_HEIGHT + BASE_GAP) + BASE_GAP;
}
