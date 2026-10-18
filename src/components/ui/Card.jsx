import { Info } from 'lucide-react';

export function Card({ title, subtitle, action, info, children, className = '', bodyClassName = '' }) {
  return (
    <section className={`card flex min-w-0 flex-col ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-4 pb-1 pt-4">
          <div className="min-w-0">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
              {title}
              {info && (
                <span title={info} className="cursor-help text-ink-300 hover:text-ink-500" aria-label={info} role="img">
                  <Info size={13} />
                </span>
              )}
            </h3>
            {subtitle && <p className="mt-0.5 text-xs text-ink-400">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={`min-h-0 flex-1 p-4 ${title || action ? 'pt-2' : ''} ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export function SectionTitle({ icon: Icon, children, extra }) {
  return (
    <div className="mb-3 mt-8 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
        {Icon && <Icon size={18} className="text-brand-500" />}
        {children}
      </h2>
      {extra}
    </div>
  );
}

export function EmptyState({ title = 'Nothing to show', hint = 'Try widening the date range or clearing a filter.' }) {
  return (
    <div className="flex h-full min-h-[8rem] flex-col items-center justify-center gap-1 py-6 text-center">
      <p className="text-sm font-medium text-ink-500">{title}</p>
      <p className="max-w-xs text-xs text-ink-400">{hint}</p>
    </div>
  );
}
