import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { compare } from '../../lib/format.js';

const TONES = {
  blue: ['bg-blue-50', 'text-blue-600', '#2f64f0'],
  green: ['bg-emerald-50', 'text-emerald-600', '#10b981'],
  purple: ['bg-violet-50', 'text-violet-600', '#7c3aed'],
  red: ['bg-red-50', 'text-red-600', '#ef4444'],
  orange: ['bg-amber-50', 'text-amber-600', '#f59e0b'],
  sky: ['bg-sky-50', 'text-sky-600', '#0ea5e9'],
};

// invert: lower is better (e.g. unqualified, overdue, outstanding) so a drop is shown green.
export function Delta({ cur, prev, invert = false, prevLabel }) {
  const c = compare(cur, prev);
  const good = c.dir === 'flat' ? null : invert ? c.dir === 'down' : c.dir === 'up';
  const color = good === null ? 'text-ink-400' : good ? 'text-emerald-600' : 'text-red-600';
  const Icon = c.dir === 'up' ? ArrowUpRight : c.dir === 'down' ? ArrowDownRight : Minus;
  return (
    <span className="inline-flex items-center gap-1 text-xs">
      <span className={`inline-flex items-center font-semibold ${color}`}>
        <Icon size={14} />
        {c.label}
      </span>
      <span className="text-ink-400">vs {prevLabel}</span>
    </span>
  );
}

export default function KpiCard({ label, value, sub, subLabel, icon: Icon, tone = 'blue', cur, prev, invert, prevLabel, spark, to, info }) {
  const [bg, fg, stroke] = TONES[tone] || TONES.blue;
  const body = (
    <div className="flex h-full flex-col justify-between gap-2" title={info}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-ink-500">
          {Icon && <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${bg} ${fg}`}><Icon size={15} /></span>}
          <span className="truncate">{label}</span>
        </div>
        {spark && spark.length > 1 && (
          <div className="h-7 w-14 shrink-0" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spark}><Line type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.6} dot={false} isAnimationActive={false} /></LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="whitespace-nowrap text-2xl font-bold tracking-tight text-ink-900">{value}</div>
        {sub && <div className="mt-0.5 text-xs leading-snug text-ink-400">{sub}{subLabel ? ` ${subLabel}` : ''}</div>}
      </div>
      <Delta cur={cur} prev={prev} invert={invert} prevLabel={prevLabel} />
    </div>
  );
  const cls = 'card block p-3.5 transition hover:border-brand-100 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500';
  return to ? <Link to={to} className={cls} aria-label={`${label}: ${value}. Open matching records`}>{body}</Link> : <div className={cls}>{body}</div>;
}
