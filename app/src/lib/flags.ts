/** ISO alpha-2 (or flagcdn subdivision code) suitable for flagcdn.com. */
export function shouldShowTeamFlag(countryCode: string | null | undefined): boolean {
  if (!countryCode) return false;
  const code = countryCode.trim().toLowerCase();
  if (!code || code === 'tbd') return false;
  return /^[a-z]{2}(-[a-z0-9]+)?$/.test(code);
}

/** Stable flagcdn SVG URL (long CDN cache; lazy-loaded in TeamFlag). */
export function flagCdnUrl(countryCode: string | null | undefined): string | null {
  if (!shouldShowTeamFlag(countryCode)) return null;
  return `https://flagcdn.com/${countryCode!.trim().toLowerCase()}.svg`;
}

/** In-memory set of codes already loaded this session (reduces flicker on re-mount). */
const loadedFlagCodes = new Set<string>();

export function markFlagLoaded(countryCode: string): void {
  loadedFlagCodes.add(countryCode.trim().toLowerCase());
}

/** Whether this code was already loaded this session (browser cache + in-memory). */
export function isFlagLoaded(countryCode: string | null | undefined): boolean {
  if (!countryCode) return false;
  return loadedFlagCodes.has(countryCode.trim().toLowerCase());
}
