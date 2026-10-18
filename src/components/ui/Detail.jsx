import { Link } from 'react-router-dom';
import { Card } from './Card.jsx';

export function NotFoundRecord({ kind, backTo, backLabel }) {
  return (
    <div className="card mx-auto mt-8 max-w-md p-8 text-center">
      <h1 className="text-lg font-bold text-ink-900">{kind} not found</h1>
      <p className="mt-2 text-sm text-ink-500">This record doesn’t exist in the current dataset. It may have been removed when the demo data was reset.</p>
      <Link to={backTo} className="btn-primary mt-4">{backLabel}</Link>
    </div>
  );
}

export function DetailHeader({ title, subtitle, badges, actions }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
          {badges}
        </div>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function InfoGrid({ items, cols = 3 }) {
  const colCls = cols === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : cols === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3';
  return (
    <dl className={`grid grid-cols-1 gap-x-6 gap-y-4 ${colCls}`}>
      {items.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</dt>
          <dd className="mt-0.5 break-words text-sm font-medium text-ink-900">{value ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function RelatedCard({ title, count, children, action }) {
  return <Card title={`${title}${count !== undefined ? ` (${count})` : ''}`} action={action}>{children}</Card>;
}

export function Timeline({ items, empty = 'No activity recorded yet.' }) {
  if (!items.length) return <p className="py-4 text-sm text-ink-400">{empty}</p>;
  return (
    <ol className="relative space-y-4 border-l border-surface-line pl-5">
      {items.map((it, i) => (
        <li key={it.key || i} className="relative">
          <span className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-500 ring-1 ring-brand-100" />
          <div className="text-sm font-medium text-ink-900">{it.title}</div>
          {it.body && <div className="text-xs text-ink-500">{it.body}</div>}
          <div className="text-[11px] text-ink-400">{it.meta}</div>
        </li>
      ))}
    </ol>
  );
}

export function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-ink-500">
      {label}
      {children}
    </label>
  );
}
