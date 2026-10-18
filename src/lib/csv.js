function escapeCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// columns: [[header, row => value], ...]
export function toCsv(rows, columns) {
  const head = columns.map(([h]) => escapeCell(h)).join(',');
  const body = rows.map((r) => columns.map(([, fn]) => escapeCell(fn(r))).join(','));
  return [head, ...body].join('\r\n');
}

export function downloadCsv(filename, csvText) {
  // BOM so Excel reads the ₹ symbol correctly
  const blob = new Blob(['﻿', csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Returns { ok, count, filename } or { ok:false, error }
export function exportRows(name, rows, columns) {
  try {
    if (!rows.length) return { ok: false, error: 'There are no records to export for the current filters.' };
    const filename = `pulsemetrics-${name}-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, toCsv(rows, columns));
    return { ok: true, count: rows.length, filename };
  } catch (e) {
    return { ok: false, error: e?.message || 'Export failed.' };
  }
}
