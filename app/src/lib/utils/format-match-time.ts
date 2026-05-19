const pad2 = (n: number) => String(n).padStart(2, '0');

/** Format match kickoff timestamps for tables and cards. */
export function formatMatchTime(
  timestamp: string | undefined | null,
  format: 'DD.MM.YYYY' | 'DD-MM-YYYY' | 'HH:mm',
): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());

  switch (format) {
    case 'DD.MM.YYYY':
      return `${day}.${month}.${year}`;
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'HH:mm':
      return `${hours}:${minutes}`;
    default:
      return '';
  }
}
