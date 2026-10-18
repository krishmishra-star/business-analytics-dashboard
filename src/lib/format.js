export const num = (n) => Math.round(Number(n) || 0).toLocaleString('en-IN');

export const inr = (n) => {
  const v = Math.round(Number(n) || 0);
  return `${v < 0 ? '-' : ''}₹${Math.abs(v).toLocaleString('en-IN')}`;
};

export function inrCompact(n) {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(2)} L`;
  if (a >= 1e3) return `${sign}₹${(a / 1e3).toFixed(1)}K`;
  return `${sign}₹${Math.round(a)}`;
}

export const pct = (n, digits = 1) => `${(Number(n) || 0).toFixed(digits)}%`;

export const safeDiv = (a, b) => (b ? a / b : 0);
export const safePct = (a, b) => (b ? (a / b) * 100 : 0);

// Returns { pct, dir, label } comparing current to previous. pct is null when previous was 0 and current > 0.
export function compare(cur, prev) {
  if (!prev) {
    if (!cur) return { pct: 0, dir: 'flat', label: '0%' };
    return { pct: null, dir: 'up', label: 'New' };
  }
  const p = ((cur - prev) / Math.abs(prev)) * 100;
  const dir = p > 0.05 ? 'up' : p < -0.05 ? 'down' : 'flat';
  return { pct: p, dir, label: `${Math.abs(p).toFixed(1)}%` };
}
