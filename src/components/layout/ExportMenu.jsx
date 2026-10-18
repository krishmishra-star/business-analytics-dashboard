import { useEffect, useRef, useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { useScope } from '../../hooks/useScope.js';
import { useData } from '../../context/DataContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { exportRows } from '../../lib/csv.js';
import {
  leadColumns, quotationColumns, dealColumns, orderColumns, paymentColumns, reportRows, reportColumns,
} from '../../lib/exportDefs.js';

export default function ExportMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { cur, summary, prevSummary, filters } = useScope();
  const { leadById, orderById } = useData();
  const toast = useToast();

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const maps = { leadById, orderById };
  const items = [
    { label: 'Filtered dashboard report', name: 'dashboard-report', rows: () => reportRows({ summary, prevSummary, filters }), cols: reportColumns() },
    { label: `Leads (${cur.leads.length})`, name: 'leads', rows: () => cur.leads, cols: leadColumns() },
    { label: `Quotations (${cur.quotations.length})`, name: 'quotations', rows: () => cur.quotations, cols: quotationColumns(maps) },
    { label: `Deals (${cur.deals.length})`, name: 'deals', rows: () => cur.deals, cols: dealColumns(maps) },
    { label: `Orders (${cur.orders.length})`, name: 'orders', rows: () => cur.orders, cols: orderColumns(maps) },
    { label: `Payments (${cur.payments.length})`, name: 'payments', rows: () => cur.payments, cols: paymentColumns(maps) },
  ];

  const run = (it) => {
    setOpen(false);
    const res = exportRows(it.name, it.rows(), it.cols);
    if (res.ok) toast.success(`Exported ${res.count} row${res.count === 1 ? '' : 's'} to ${res.filename}`);
    else toast.error(res.error);
  };

  return (
    <div className="relative" ref={ref}>
      <button className="btn-primary" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        <Download size={15} /> Export Report <ChevronDown size={14} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-1.5 w-64 overflow-hidden rounded-lg border border-surface-line bg-white py-1 shadow-lg">
          <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Exports use the current filters</p>
          {items.map((it) => (
            <button key={it.name} role="menuitem" onClick={() => run(it)} className="block w-full px-3 py-2 text-left text-sm text-ink-700 hover:bg-brand-50">{it.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
