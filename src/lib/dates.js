// All dates in the app are handled as 'YYYY-MM-DD' day strings (UTC-based, no timezone drift).

export const toDay = (s) => (s ? String(s).slice(0, 10) : '');

export function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

// Number of days from a to b (b - a)
export function diffDays(a, b) {
  const pa = a.split('-').map(Number);
  const pb = b.split('-').map(Number);
  return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 86400000);
}

export const minDay = (a, b) => (a < b ? a : b);
export const maxDay = (a, b) => (a > b ? a : b);

export function eachDay(start, end) {
  const out = [];
  let cur = start;
  let guard = 0;
  while (cur <= end && guard < 800) {
    out.push(cur);
    cur = addDays(cur, 1);
    guard++;
  }
  return out;
}

export const inRange = (day, range) => day >= range.start && day <= range.end;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDay(day) {
  if (!day) return '—';
  const [y, m, d] = day.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatShortDay(day) {
  const [, m, d] = day.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const day = iso.slice(0, 10);
  const time = iso.slice(11, 16);
  return `${formatDay(day)}, ${time}`;
}
