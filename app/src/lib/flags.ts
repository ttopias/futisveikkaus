/** ISO alpha-2 (or flagcdn subdivision code) suitable for flagcdn.com. */
export function shouldShowTeamFlag(countryCode: string | null | undefined): boolean {
  if (!countryCode) return false;
  const code = countryCode.trim().toLowerCase();
  if (!code || code === 'tbd') return false;
  return /^[a-z]{2}(-[a-z0-9]+)?$/.test(code);
}

/** 40px-wide PNG from flagcdn (lazy-loaded in TeamFlag). */
export function flagCdnUrl(countryCode: string | null | undefined): string | null {
  if (!shouldShowTeamFlag(countryCode)) return null;
  return `https://flagcdn.com/w40/${countryCode!.trim().toLowerCase()}.png`;
}
