/**
 * Compact bracket slot codes for knockout fixtures.
 *
 * Group qualifiers: 1A (winner), 2B (runner-up), 3ABCDF (best third from listed groups)
 * Knockout feeders: winner:73, loser:101
 */

/** @param {string} raw @returns {string} */
export function cleanName(raw) {
  return raw.replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').trim();
}

/** @param {string} raw @returns {string | null} */
export function parseSlot(raw) {
  const c = cleanName(raw);
  if (!c || /to be announced/i.test(c)) return null;

  let m = c.match(/^Winner Match (\d+)$/i);
  if (m) return `winner:${m[1]}`;
  m = c.match(/^Loser Match (\d+)$/i);
  if (m) return `loser:${m[1]}`;
  m = c.match(/^Winner Group ([A-L])$/i);
  if (m) return `1${m[1]}`;
  m = c.match(/^Runner-up Group ([A-L])$/i);
  if (m) return `2${m[1]}`;
  m = c.match(/^3rd Group ([A-L/]+)$/i);
  if (m) return `3${m[1].replace(/\//g, '').toUpperCase()}`;
  m = c.match(/^(\d)([A-L]+)$/i);
  if (m) return `${m[1]}${m[2].toUpperCase()}`;

  return null;
}

/** @param {string | null | undefined} slot @returns {string} */
export function slotLabelFi(slot) {
  if (!slot) return '';
  let m = slot.match(/^(\d)([A-L])$/);
  if (m) {
    const rank = m[1];
    const group = m[2];
    if (rank === '1') return `Lohkon ${group} voittaja`;
    if (rank === '2') return `Lohkon ${group} toinen`;
  }
  m = slot.match(/^3([A-L]+)$/);
  if (m) {
    const groups = m[1].split('').join('/');
    return `Lohkon ${groups} kolmas`;
  }
  m = slot.match(/^winner:(\d+)$/);
  if (m) return `Ottelun ${m[1]} voittaja`;
  m = slot.match(/^loser:(\d+)$/);
  if (m) return `Ottelun ${m[1]} häviäjä`;
  return slot;
}

/** @param {string | null | undefined} slot @returns {boolean} */
export function isThirdPlaceSlot(slot) {
  return slot != null && /^3[A-L]+$/.test(slot);
}

/** Group letters from a third-place slot code, e.g. 3ABCDF -> ['A','B','C','D','F']. */
/** @param {string} slot @returns {string[]} */
export function thirdPlaceSlotGroups(slot) {
  const m = slot.match(/^3([A-L]+)$/);
  return m ? m[1].split('') : [];
}
