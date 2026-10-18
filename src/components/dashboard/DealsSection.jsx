import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Handshake, Trophy, XOctagon, IndianRupee, Wallet, Hourglass, CheckCircle2, DollarSign } from 'lucide-react';
import KpiCard from '../ui/KpiCard.jsx';
import { Card, EmptyState } from '../ui/Card.jsx';

import { ColumnBars, ProgressRow } from '../charts/Charts.jsx';
import { OrderLink } from '../ui/Links.jsx';
import { useScope } from '../../hooks/useScope.js';
import {
  dealsByService, revenueByService, priorityBreakdown, dailyRevenue, dealsByStage, outstandingOrders, sparkSeries,
} from '../../lib/aggregate.js';
import { toDay } from '../../lib/dates.js';
import { inr, inrCompact, num, pct } from '../../lib/format.js';
import { SERVICE_COLORS, STATUS_COLORS } from '../../data/constants.js';

const q = (obj) => `?${new URLSearchParams(obj).toString()}`;

export function DealKpis() {
  const { cur, summary: s, prevSummary: p, range, filters } = useScope();
  const pl = filters.prevLabel;
  const spark = (items, fn) => sparkSeries(items, (r) => toDay(r.createdAt), range, fn);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <KpiCard label="Total Deals" icon={Handshake} tone="blue" value={num(s.deals.total)} cur={s.deals.total} prev={p.deals.total} prevLabel={pl} spark={spark(cur.deals)} to="/deals" />
      <KpiCard label="Won Deals" icon={Trophy} tone="green" value={num(s.deals.won)} cur={s.deals.won} prev={p.deals.won} prevLabel={pl} to={`/deals${q({ stage: 'Won' })}`} />
      <KpiCard label="Lost Deals" icon={XOctagon} tone="red" value={num(s.deals.lost)} cur={s.deals.lost} prev={p.deals.lost} prevLabel={pl} invert to={`/deals${q({ stage: 'Lost' })}`} />
      <KpiCard label="Total Deal Value" icon={IndianRupee} tone="purple" value={inrCompact(s.deals.value)} sub={inr(s.deals.value)} cur={s.deals.value} prev={p.deals.value} prevLabel={pl} spark={spark(cur.deals, (d) => d.value)} to="/deals" />
      <KpiCard label="Revenue Collected" icon={Wallet} tone="green" value={inrCompact(s.revenue.collected)} sub={inr(s.revenue.collected)} cur={s.revenue.collected} prev={p.revenue.collected} prevLabel={pl} spark={sparkSeries(cur.payments.filter((x) => x.status === 'Paid'), (r) => r.paymentDate, range, (r) => r.amount)} to={`/payments${q({ status: 'Paid' })}`} info="Payments marked Paid with a payment date in the period" />
      <KpiCard label="Outstanding Revenue" icon={Hourglass} tone="orange" value={inrCompact(s.revenue.outstanding)} sub={inr(s.revenue.outstanding)} cur={s.revenue.outstanding} prev={p.revenue.outstanding} prevLabel={pl} invert to="/payments" info="Order value still unpaid at the end of the period" />
    </div>
  );
}

export function DealCharts() {
  const nav = useNavigate();
  const { cur, summary: s, data, people, range } = useScope();
  const byService = dealsByService(cur.deals).filter((d) => d.created > 0);
  const revByService = revenueByService(cur.orders).filter((d) => d.value > 0);
  const priority = priorityBreakdown(cur.deals);
  const daily = dailyRevenue(cur);
  const stages = dealsByStage(cur.deals);
  const outstanding = useMemo(() => outstandingOrders(data, people, range), [data, people, range]);
  const outTotal = outstanding.reduce((a, r) => a + r.outstanding, 0);
  const maxRev = Math.max(1, ...revByService.map((r) => r.value));

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card className="lg:col-span-6" title="Deals Created vs Deal Value (by Service)" subtitle="Count on the left axis, value on the right · click a bar to open deals">
        <ColumnBars data={byService} height={250} rightAxis angle={-28}
          series={[{ key: 'created', name: 'Deals Created', color: '#2f64f0' }, { key: 'value', name: 'Deal Value', color: '#f59e0b', axis: 'right' }]}
          onBarClick={(row) => nav(`/deals${q({ service: row.service })}`)} />
      </Card>
      <Card className="lg:col-span-6" title="Revenue by Order / Service Category" subtitle="Order value billed in the period · click a row to open orders">
        {revByService.length === 0 ? <EmptyState /> : (
          <div className="space-y-3 pt-1">
            {revByService.map((r, i) => (
              <ProgressRow key={r.service} label={r.short} value={r.value} max={maxRev} color={SERVICE_COLORS[i % SERVICE_COLORS.length]} right={`${inr(r.value)} · ${pct(r.pct)}`} onClick={() => nav(`/orders${q({ service: r.service })}`)} />
            ))}
          </div>
        )}
      </Card>

      <Card className="lg:col-span-4" title="Priority Breakdown" subtitle="Deals created in the period">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead><tr><th className="th">Priority</th><th className="th text-right">Deals</th><th className="th text-right">Value</th><th className="th text-right">%</th></tr></thead>
            <tbody className="divide-y divide-surface-line">
              {priority.map((r) => (
                <tr key={r.priority} className="cursor-pointer hover:bg-brand-50/40" onClick={() => nav(`/deals${q({ priority: r.priority })}`)}>
                  <td className="td"><span className="inline-flex items-center gap-2"><i className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[r.priority] }} />{r.priority}</span></td>
                  <td className="td text-right tabular-nums">{r.deals}</td>
                  <td className="td text-right tabular-nums">{inr(r.value)}</td>
                  <td className="td text-right font-semibold tabular-nums">{pct(r.pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="lg:col-span-5" title="Deal Progress by Stage" subtitle="Click a bar to open deals in that stage">
        <ColumnBars data={stages} xKey="stage" height={210} series={[{ key: 'count', name: 'Deals', color: '#7c3aed' }]} onBarClick={(row) => nav(`/deals${q({ stage: row.stage })}`)} />
      </Card>
      <Card className="lg:col-span-3" title="Total vs Collected Revenue" info="Billed = order value created in the period. Collected = payments received in the period, so it can exceed billed when older orders are paid.">
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3"><span className="grid h-9 w-9 place-items-center rounded-md bg-blue-100 text-brand-600"><DollarSign size={18} /></span><div><p className="text-xs text-ink-500">Total Billed</p><p className="text-lg font-bold text-ink-900">{inr(s.revenue.billed)}</p></div></div>
          <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-3"><span className="grid h-9 w-9 place-items-center rounded-md bg-emerald-100 text-emerald-600"><CheckCircle2 size={18} /></span><div><p className="text-xs text-ink-500">Net Collected</p><p className="text-lg font-bold text-ink-900">{inr(s.revenue.collected)}</p></div></div>
          <p className="text-xs text-ink-400">Collected is {s.revenue.billed ? pct(s.revenue.collectedPct) : '—'} of billed.</p>
        </div>
      </Card>

      <Card className="lg:col-span-8" title="Daily Revenue Trend" subtitle="Order value created vs payments collected, per day">
        <ColumnBars data={daily} xKey="label" kind="inr" height={240} series={[{ key: 'revenue', name: 'Revenue (billed)', color: '#2f64f0' }, { key: 'collected', name: 'Collected', color: '#10b981' }]} />
      </Card>
      <Card className="lg:col-span-4" title="Outstanding Revenue" subtitle="Largest unpaid balances at period end" info="Order value minus Paid payments up to the end of the period.">
        <p className="text-2xl font-bold tracking-tight text-ink-900">{inr(outTotal)}</p>
        <p className="mb-3 text-xs text-ink-400">across {outstanding.length} order{outstanding.length === 1 ? '' : 's'}</p>
        {outstanding.length === 0 ? <p className="py-4 text-sm text-ink-400">Nothing outstanding. 🎉</p> : (
          <ul className="divide-y divide-surface-line">
            {outstanding.slice(0, 5).map(({ order, outstanding: amt }) => (
              <li key={order.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0"><OrderLink id={order.id} /><span className="block truncate text-xs text-ink-400">{order.title}</span></span>
                <span className="shrink-0 font-semibold tabular-nums text-ink-900">{inr(amt)}</span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/payments" className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline">View all payments →</Link>
      </Card>
    </div>
  );
}
