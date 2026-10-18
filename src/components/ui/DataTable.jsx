import { useMemo, useState } from 'react';
import { Search, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Download, ChevronsUpDown, X } from 'lucide-react';
import { exportRows } from '../../lib/csv.js';
import { useToast } from '../../context/ToastContext.jsx';
import { EmptyState } from './Card.jsx';

/**
 * columns: [{ key, header, render?(row), sortValue?(row), align?, sortable? }]
 * filters: [{ key, label, options: string[], get(row) }]
 */
export default function DataTable({
  columns, rows, rowKey = (r) => r.id, searchText, searchPlaceholder = 'Search…',
  filters = [], initialFilters = {}, initialSearch = '', defaultSort, pageSize = 10,
  onRowClick, exportName, exportColumns, footer, toolbarExtra, emptyTitle, emptyHint, compact = false, hideToolbar = false,
}) {
  const toast = useToast();
  const [search, setSearch] = useState(initialSearch);
  const [filterVals, setFilterVals] = useState(initialFilters);
  const [sort, setSort] = useState(defaultSort || null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = rows;
    if (q && searchText) out = out.filter((r) => searchText(r).toLowerCase().includes(q));
    for (const f of filters) {
      const v = filterVals[f.key];
      if (v && v !== 'all') out = out.filter((r) => String(f.get(r)) === v);
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col) {
        const val = (r) => (col.sortValue ? col.sortValue(r) : r[col.key]);
        out = [...out].sort((a, b) => {
          const x = val(a);
          const y = val(b);
          const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true });
          return sort.dir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [rows, search, filterVals, sort, columns, filters, searchText]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const hasActive = !!search || filters.some((f) => filterVals[f.key] && filterVals[f.key] !== 'all');

  const toggleSort = (col) => {
    if (col.sortable === false) return;
    setPage(1);
    setSort((s) => (s?.key === col.key ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: col.key, dir: 'asc' }));
  };

  const doExport = () => {
    const res = exportRows(exportName, filtered, exportColumns);
    if (res.ok) toast.success(`Exported ${res.count} record${res.count === 1 ? '' : 's'} to ${res.filename}`);
    else toast.error(res.error);
  };

  const clearAll = () => { setSearch(''); setFilterVals({}); setPage(1); };

  return (
    <div className="min-w-0">
      {!hideToolbar && (
        <div className="flex flex-wrap items-center gap-2 pb-3">
          {searchText && (
            <label className="relative min-w-[12rem] flex-1 sm:max-w-xs">
              <span className="sr-only">Search table</span>
              <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder={searchPlaceholder} className="input w-full pl-8" />
            </label>
          )}
          {filters.map((f) => (
            <label key={f.key} className="flex items-center gap-1.5 text-xs text-ink-500">
              <span className="sr-only">{f.label}</span>
              <select aria-label={f.label} value={filterVals[f.key] || 'all'} onChange={(e) => { setFilterVals((s) => ({ ...s, [f.key]: e.target.value })); setPage(1); }} className="input !py-2">
                <option value="all">All {f.label.toLowerCase()}</option>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
          ))}
          {hasActive && <button onClick={clearAll} className="btn !px-2.5"><X size={14} /> Clear</button>}
          <div className="ml-auto flex items-center gap-2">
            {toolbarExtra}
            {exportName && <button onClick={doExport} className="btn"><Download size={15} /> Export CSV</button>}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-surface-line">
        <table className="w-full min-w-max border-collapse">
          <thead className="bg-surface/70">
            <tr>
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th key={c.key} scope="col" className={`th ${c.align === 'right' ? 'text-right' : ''}`} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                    {c.sortable === false ? c.header : (
                      <button onClick={() => toggleSort(c)} className={`inline-flex items-center gap-1 uppercase tracking-wide hover:text-ink-700 ${active ? 'text-ink-700' : ''}`}>
                        {c.header}
                        {active ? (sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ChevronsUpDown size={12} className="opacity-40" />}
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-line">
            {visible.map((r) => (
              <tr key={rowKey(r)} onClick={onRowClick ? () => onRowClick(r) : undefined} className={`${onRowClick ? 'cursor-pointer' : ''} hover:bg-brand-50/40`}>
                {columns.map((c) => (
                  <td key={c.key} className={`td ${compact ? '!py-1.5' : ''} ${c.align === 'right' ? 'text-right tabular-nums' : ''}`}>{c.render ? c.render(r) : r[c.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && filtered.length > 0 && <tfoot className="border-t border-surface-line bg-surface/70">{footer(filtered)}</tfoot>}
        </table>
        {filtered.length === 0 && <EmptyState title={emptyTitle || 'No matching records'} hint={emptyHint || (hasActive ? 'Nothing matches your search or filters. Clear them to see everything in this period.' : 'There are no records for the selected period and filters.')} />}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-xs text-ink-500">
        <span>
          {filtered.length === 0 ? '0 records' : `Showing ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length}`}
          {rows.length !== filtered.length && ` (filtered from ${rows.length})`}
        </span>
        <div className="flex items-center gap-1.5">
          <button className="btn !px-2 !py-1.5" onClick={() => setPage(safePage - 1)} disabled={safePage <= 1} aria-label="Previous page"><ChevronLeft size={14} /></button>
          <span className="px-1 tabular-nums">Page {safePage} of {pageCount}</span>
          <button className="btn !px-2 !py-1.5" onClick={() => setPage(safePage + 1)} disabled={safePage >= pageCount} aria-label="Next page"><ChevronRight size={14} /></button>
        </div>
      </div>
    </div>
  );
}
