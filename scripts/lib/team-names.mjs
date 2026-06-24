import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, '..', '..', 'app', 'package.json'));
const cheerio = require('cheerio');

export const COUNTRY_NAMES_FI_URL =
  'https://www.101languages.net/finnish/country-names-finnish/';
export const HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; FutisveikkausScraper/1.0)' };

export const NAME_TO_ENGLISH = {
  'Korea Republic': 'South Korea',
  'Republic of Korea': 'South Korea',
  USA: 'United States',
  'Cabo Verde': 'Cape Verde',
  'IR Iran': 'Iran',
  'Iran IR': 'Iran',
  Türkiye: 'Turkey',
  Turkiye: 'Turkey',
  Czechia: 'Czech Republic',
  "Côte d'Ivoire": 'Ivory Coast',
  "Cote d'Ivoire": 'Ivory Coast',
  'Congo DR': 'DR Congo',
  'DR Congo': 'DR Congo',
  'Democratic Republic of Congo': 'DR Congo',
  'Republic of Congo': 'Republic of Congo',
  'China PR': 'China PR',
  'Chinese Taipei': 'Chinese Taipei',
};

export const FINNISH_NAME_OVERRIDES = {
  'United States': 'Yhdysvallat',
  'DR Congo': 'Kongo',
  'Ivory Coast': 'Norsunluurannikko',
  "Cote d'Ivoire": 'Norsunluurannikko',
  Czechia: 'Tšekki',
  'China PR': 'Kiina',
  England: 'Englanti',
  Scotland: 'Skotlanti',
  Wales: 'Wales',
  'Republic of Congo': 'Kongo',
  Curaçao: 'Curaçao',
};

export const ISO_CODE_MAP = {
  Mexico: 'mx',
  'United States': 'us',
  Canada: 'ca',
  'Bosnia and Herzegovina': 'ba',
  Argentina: 'ar',
  Brazil: 'br',
  France: 'fr',
  England: 'gb-eng',
  Germany: 'de',
  Spain: 'es',
  Portugal: 'pt',
  Netherlands: 'nl',
  Belgium: 'be',
  Italy: 'it',
  Uruguay: 'uy',
  Colombia: 'co',
  Ecuador: 'ec',
  Peru: 'pe',
  Chile: 'cl',
  Paraguay: 'py',
  Bolivia: 'bo',
  Venezuela: 've',
  Japan: 'jp',
  'South Korea': 'kr',
  Australia: 'au',
  Iran: 'ir',
  'Saudi Arabia': 'sa',
  Qatar: 'qa',
  Uzbekistan: 'uz',
  Indonesia: 'id',
  'South Africa': 'za',
  Senegal: 'sn',
  Morocco: 'ma',
  Egypt: 'eg',
  Nigeria: 'ng',
  Ghana: 'gh',
  Cameroon: 'cm',
  Tunisia: 'tn',
  Algeria: 'dz',
  Mali: 'ml',
  'Ivory Coast': 'ci',
  "Côte d'Ivoire": 'ci',
  'Congo DR': 'cd',
  'DR Congo': 'cd',
  Switzerland: 'ch',
  Austria: 'at',
  Poland: 'pl',
  Croatia: 'hr',
  Serbia: 'rs',
  Denmark: 'dk',
  Sweden: 'se',
  Norway: 'no',
  'Czech Republic': 'cz',
  Czechia: 'cz',
  Slovakia: 'sk',
  Romania: 'ro',
  Hungary: 'hu',
  Turkey: 'tr',
  Greece: 'gr',
  Ukraine: 'ua',
  Scotland: 'gb-sct',
  Wales: 'gb-wls',
  Ireland: 'ie',
  Albania: 'al',
  Georgia: 'ge',
  Slovenia: 'si',
  Iceland: 'is',
  'New Zealand': 'nz',
  Panama: 'pa',
  'Costa Rica': 'cr',
  Honduras: 'hn',
  Jamaica: 'jm',
  Haiti: 'ht',
  Cuba: 'cu',
  'El Salvador': 'sv',
  Curaçao: 'cw',
  'Cape Verde': 'cv',
  Jordan: 'jo',
  Iraq: 'iq',
  'United Arab Emirates': 'ae',
  'China PR': 'cn',
  China: 'cn',
  Comoros: 'km',
  'New Caledonia': 'nc',
};

/** FIFA IdCountry (alpha-3) -> app country_code where name matching is ambiguous. */
export const FIFA_CODE_TO_COUNTRY_CODE = {
  ENG: 'gb-eng',
  SCO: 'gb-sct',
  WAL: 'gb-wls',
  NIR: 'gb-nir',
  KOR: 'kr',
  IRN: 'ir',
  USA: 'us',
  MEX: 'mx',
  CRC: 'cr',
  CPV: 'cv',
  CIV: 'ci',
  COD: 'cd',
  CGO: 'cg',
  UAE: 'ae',
  KSA: 'sa',
  RSA: 'za',
  CHN: 'cn',
  CUW: 'cw',
  TUR: 'tr',
  CZE: 'cz',
};

export function cleanName(raw) {
  return raw.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
}

async function fetchText(url, timeoutMs = 45000) {
  const res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  return res.text();
}

/**
 * @param {{ country_code?: string, name: string }[]} teams
 * @param {Record<string, string>} [isoMap]
 * @returns {Record<string, string>}
 */
export function buildEnglishToFinnishFromTeams(teams, isoMap = ISO_CODE_MAP) {
  const isoToFi = new Map();
  for (const team of teams) {
    const cc = String(team.country_code ?? '').trim().toLowerCase();
    if (cc) isoToFi.set(cc, team.name);
  }
  const map = { ...FINNISH_NAME_OVERRIDES };
  for (const [en, iso] of Object.entries(isoMap)) {
    const code = String(iso).toLowerCase();
    const fi = isoToFi.get(code) ?? isoToFi.get(code.split('-').pop() ?? '');
    if (fi) map[en] = fi;
  }
  return map;
}

/**
 * @param {{ country_code?: string, name: string }[]} teams
 * @returns {Promise<Record<string, string>>}
 */
export async function resolveEnglishToFinnish(teams) {
  try {
    return await fetchEnglishToFinnish();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Country name fetch failed (${message}); using teams + ISO map fallback.`);
    return buildEnglishToFinnishFromTeams(teams);
  }
}

export async function fetchEnglishToFinnish() {
  console.log(`Fetching country names: ${COUNTRY_NAMES_FI_URL}`);
  const $ = cheerio.load(await fetchText(COUNTRY_NAMES_FI_URL));
  const map = {};
  $('table tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 2) return;
    const en = $(cells[0]).text().trim();
    const fi = $(cells[1]).text().trim();
    if (en && fi) map[en] = fi;
  });
  const count = Object.keys(map).length;
  if (count < 50) {
    console.warn(`Warning: few country names from 101languages (${count}); check page structure.`);
  } else {
    console.log(`Loaded ${count} English→Finnish country names.`);
  }
  return { ...map, ...FINNISH_NAME_OVERRIDES };
}

export function toFinnish(english, enToFi) {
  return enToFi[english] ?? null;
}

export function canonicalize(enToFi, warned = new Set()) {
  return (raw) => {
    const cleaned = cleanName(raw);
    if (!cleaned) return cleaned;
    const english = NAME_TO_ENGLISH[cleaned] ?? cleaned;
    const fi = toFinnish(english, enToFi);
    if (!fi) {
      if (!warned.has(english)) {
        warned.add(english);
        console.warn(
          `Warning: no Finnish name for "${english}" (from "${cleaned}"). Add FINNISH_NAME_OVERRIDES or NAME_TO_ENGLISH.`,
        );
      }
      return null;
    }
    return fi;
  };
}

export function isoByFinnish(enToFi) {
  const byFi = {};
  for (const [en, iso] of Object.entries(ISO_CODE_MAP)) {
    const fi = enToFi[en] ?? en;
    if (!byFi[fi]) byFi[fi] = iso;
  }
  return byFi;
}

export function isoCode(fiName, byFi) {
  return (
    (byFi[fiName.trim()] ?? fiName.trim().slice(0, 2).toLowerCase().replace(/[^a-zäöå]/gi, '')) ||
    'xx'
  );
}

/** Resolve external label (English / FIFA) to Finnish team name used in DB. */
export function resolveTeamName(name, enToFi) {
  const canon = canonicalize(enToFi);
  return canon(cleanName(name));
}

export function englishNameFromFifaEntry(entry) {
  const localized = entry?.TeamName?.find((t) => t.Locale?.startsWith('en')) ?? entry?.TeamName?.[0];
  return localized?.Description?.trim() ?? '';
}
