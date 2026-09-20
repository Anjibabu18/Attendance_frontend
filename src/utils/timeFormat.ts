import dayjs from 'dayjs';

/**
 * Robustly parses and formats shift/time values.
 * Correctly strips epoch dates (like 1970-01-01T09:00:00.000Z) to prevent "1970-" bugs.
 */
export function formatShiftTime(value?: string | null, fallback = '09:00'): string {
  if (!value) return fallback;
  const str = String(value).trim();
  if (str.includes('T')) {
    const afterT = str.split('T')[1];
    if (afterT && afterT.length >= 5) {
      return afterT.slice(0, 5);
    }
  }
  const match = str.match(/\b\d{1,2}:\d{2}\b/);
  if (match) {
    const parts = match[0].split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1]}`;
  }
  if (str.length >= 5 && str.includes(':')) {
    return str.slice(0, 5);
  }
  return fallback;
}

export function formatShiftTime12h(value?: string | null, fallback = '09:00 AM'): string {
  const hhmm = formatShiftTime(value, '');
  if (!hhmm) return fallback;
  const parts = hhmm.split(':');
  const h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  if (isNaN(h)) return fallback;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${m} ${period}`;
}
