/**
 * FIFA 2026 knockout bracket wiring (match_number -> home/away slot codes).
 * Fallback when fixture CSV has "To be announced" and Wikipedia scrape is unavailable.
 * Source: Wikipedia #Bracket (2026-05), cross-checked with fixturedownload R32 codes.
 */
export const BRACKET_SLOTS = {
  73: { home: '2A', away: '2B' },
  74: { home: '1E', away: '3ABCDF' },
  75: { home: '1F', away: '2C' },
  76: { home: '1C', away: '2F' },
  77: { home: '1I', away: '3CDFGH' },
  78: { home: '2E', away: '2I' },
  79: { home: '1A', away: '3CEFHI' },
  80: { home: '1L', away: '3EHIJK' },
  81: { home: '1D', away: '3BEFIJ' },
  82: { home: '1G', away: '3AEHIJ' },
  83: { home: '2K', away: '2L' },
  84: { home: '1H', away: '2J' },
  85: { home: '1B', away: '3EFGIJ' },
  86: { home: '1J', away: '2H' },
  87: { home: '1K', away: '3DEIJL' },
  88: { home: '2D', away: '2G' },
  89: { home: 'winner:74', away: 'winner:77' },
  90: { home: 'winner:73', away: 'winner:75' },
  91: { home: 'winner:76', away: 'winner:78' },
  92: { home: 'winner:79', away: 'winner:80' },
  93: { home: 'winner:83', away: 'winner:84' },
  94: { home: 'winner:81', away: 'winner:82' },
  95: { home: 'winner:86', away: 'winner:88' },
  96: { home: 'winner:85', away: 'winner:87' },
  97: { home: 'winner:89', away: 'winner:90' },
  98: { home: 'winner:93', away: 'winner:94' },
  99: { home: 'winner:91', away: 'winner:92' },
  100: { home: 'winner:95', away: 'winner:96' },
  101: { home: 'winner:97', away: 'winner:98' },
  102: { home: 'winner:99', away: 'winner:100' },
  103: { home: 'loser:101', away: 'loser:102' },
  104: { home: 'winner:101', away: 'winner:102' },
};
