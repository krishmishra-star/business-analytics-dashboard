import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';

// items: [{label, to}] — last item has no `to`.
export default function Breadcrumbs({ items }) {
  const navigate = useNavigate();
  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-1.5 text-sm">
      <button onClick={() => navigate(-1)} className="btn !px-2 !py-1" aria-label="Go back"><ArrowLeft size={14} /> Back</button>
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={14} className="text-ink-300" />}
          {it.to ? <Link to={it.to} className="text-ink-500 hover:text-brand-600">{it.label}</Link> : <span className="font-semibold text-ink-900">{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}
