import { useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Package, Loader, CheckCircle2, Clock, AlertTriangle, Wallet, Percent } from 'lucide-react';
import KpiCard from '../ui/KpiCard.jsx';
import { Card, EmptyState } from '../ui/Card.jsx';
import { ColumnBars, Donut } from '../charts/Charts.jsx';
import { OrderLink } from '../ui/Links.jsx';
import { useScope } from '../../hooks/useScope.js';
import {
  orderStatusDistribution, orderProgressByService, dailyPayments, paymentMethodDistribution, outstandingOrders, stageProgressByService, sparkSeries,
} from '../../lib/aggregate.js';
import { toDay } from '../../lib/dates.js';
import { inr, inrCompact, num, pct } from '../../lib/format.js';
import { STATUS_COLORS, METHOD_COLORS, ORDER_EFFECTIVE_STATUSES } from '../../data/constants.js';

const q = (obj) => `?${new URLSearchParams(obj).toString()}`;

export function OrderKpis() {
  const { cur, summary: s, prevSummary: p, range, filters } = useScope();
  const pl = filters.prevLabel;
  const spark = (items, fn) => sparkSeries(items, (r) => toDay(r.createdAt), range, fn);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
      <KpiCard label="Total Orders" icon={Package} tone="blue" value={num(s.orders.total)} cur={s.orders.total} prev={p.orders.total} prevLabel={pl} spark={spark(cur.orders)} to="/orders" />
      <KpiCard label="Orders in Progress" icon={Loader} tone="blue" value={num(s.orders.inProgress)} cur={s.orders.inProgress} prev={p.orders.inProgress} prevLabel={pl} to={`/orders${q({ status: 'In Progress' })}`} />
      <KpiCard label="Completed Orders" icon={CheckCircle2} tone="green" value={num(s.orders.completed)} cur={s.orders.completed} prev={p.orders.completed} prevLabel={pl} to={`/orders${q({ status: 'Completed' })}`} />
      <KpiCard label="Pending Orders" icon={Clock} tone="orange" value={num(s.orders.pending)} cur={s.orders.pending} prev={p.orders.pending} prevLabel={pl} invert to={`/orders${q({ status: 'Pending' })}`} />
      <KpiCard label="Overdue Orders" icon={AlertTriangle} tone="red" value={num(s.orders.overdue)} cur={s.orders.overdue} prev={p.orders.overdue} prevLabel={pl} invert to={`/orders${q({ status: 'Overdue' })}`} info="Past the due date and not completed or on hold" />
      <KpiCard label="Total Payments" icon={Wallet} tone="green" value={inrCompact(s.payments.paidAmount)} sub={inr(s.payments.paidAmount)} cur={s.payments.paidAmount} prev={p.payments.paidAmount} prevLabel={pl} spark={sparkSeries(cur.payments.filter((x) => x.status === 'Paid'), (r) => r.paymentDate, range, (r) => r.amount)} to={`/payments${q({ status: 'Paid' })}`} info="Payments marked Paid in the period" />
      <KpiCard label="Collection Rate" icon={Percent} tone="purple" value={pct(s.payments.collectionRate)} cur={s.payments.collectionRate} prev={p.payments.collectionRate} prevLabel={pl} to="/payments" info="Paid ÷ (paid + pending + failed) payment amounts in the period" />
    </div>
  );
}

// Orders grouped by service, split by status, as horizontal stacked bars (used on the dashboard)
export function StageProgressCard() {
  const nav = useNavigate();
  const { cur } = useScope();
  const rows = stageProgressByService(cur.orders);
  const max = Math.max(1, ...rows.map((r) => r.total));
  const legend = ['Pending', 'In Progress', 'Completed', 'On Hold', 'Overdue'];
  return (
    <Card title="Orders & Stage Progress" subtitle="Orders per service by status · click a row to open them">
      {rows.length === 0 ? <EmptyState /> : (
        <>
          <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-500">
            {legend.map((l) => <span key={l} className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[l] }} />{l}</span>)}
          </div>
          <div className="space-y-2.5">
            {rows.map((r) => (
              <button key={r.service} onClick={() => nav(`/orders${q({ service: r.service })}`)} className="block w-full rounded text-left hover:bg-surface">
                <div className="mb-1 flex justify-between text-xs"><span className="text-ink-700">{r.short}</span><span className="font-semibold tabular-nums">{r.total}</span></div>
                <div className="flex h-4 overflow-hidden rounded bg-surface" style={{ width: `${(r.total / max) * 100}%`, minWidth: '2.5rem' }}>
                  {legend.map((l) => r[l] > 0 && (
                    <div key={l} title={`${l}: ${r[l]}`} className="grid place-items-center text-[10px] font-semibold text-white" style={{ width: `${(r[l] / r.total) * 100}%`, background: STATUS_COLORS[l] }}>{r[l]}</div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

export function OrderCharts() {
  const nav = useNavigate();
  const { cur, data, people, range } = useScope();
  const status = orderStatusDistribution(cur.orders).map((d) => ({ ...d, color: STATUS_COLORS[d.name] }));
  const byService = orderProgressByService(cur.orders);
  const daily = dailyPayments(cur);
  const methods = paymentMethodDistribution(cur.payments).map((d) => ({ ...d, color: METHOD_COLORS[d.name] }));
  const outstanding = useMemo(() => outstandingOrders(data, people, range), [data, people, range]);
  const outTotal = outstanding.reduce((a, r) => a + r.outstanding, 0);

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card className="lg:col-span-4" title="Order Status Distribution" subtitle="Click a status to open orders" info="Overdue = past due date and not completed or on hold. Each order is counted once.">
        <Donut data={status} onSliceClick={(name) => nav(`/orders${q({ status: name })}`)} center={{ value: num(cur.orders.length), label: 'Orders' }} size={150} />
      </Card>
      <Card className="lg:col-span-8" title="Order Progress by Service" subtitle="Orders per service, stacked by status · click a bar to open them">
        <ColumnBars data={byService} stacked height={250} angle={-28} series={ORDER_EFFECTIVE_STATUSES.map((st) => ({ key: st, name: st, color: STATUS_COLORS[st] }))} onBarClick={(row) => nav(`/orders${q({ service: row.service })}`)} />
      </Card>
      <Card className="lg:col-span-6" title="Daily Payment Collection Trend" subtitle="Payment amounts by status and payment date">
        <ColumnBars data={daily} xKey="label" kind="inr" stacked height={240} series={[{ key: 'paid', name: 'Paid', color: '#10b981' }, { key: 'pending', name: 'Pending', color: '#f59e0b' }, { key: 'failed', name: 'Failed', color: '#ef4444' }]} />
      </Card>
      <Card className="lg:col-span-6" title="Payment Method Distribution" subtitle="Paid amounts · click a method to open payments">
        <Donut data={methods} kind="inr" size={150} onSliceClick={(name) => nav(`/payments${q({ method: name })}`)} center={{ value: inrCompact(methods.reduce((a, m) => a + m.value, 0)), label: 'Collected' }} />
      </Card>
      <Card className="lg:col-span-6" title="Completed vs Pending Orders" subtitle="By service · click a bar to open them">
        <ColumnBars data={byService} height={230} angle={-28} series={[{ key: 'completedCount', name: 'Completed', color: '#10b981' }, { key: 'pendingCount', name: 'Not completed', color: '#f59e0b' }]} onBarClick={(row) => nav(`/orders${q({ service: row.service })}`)} />
      </Card>
      <Card className="lg:col-span-6" title="Outstanding Payments" subtitle="Largest unpaid order balances at period end">
        <div className="mb-2 flex items-baseline justify-between"><p className="text-2xl font-bold tracking-tight text-ink-900">{inr(outTotal)}</p><span className="text-xs text-ink-400">{outstanding.length} order{outstanding.length === 1 ? '' : 's'}</span></div>
        {outstanding.length === 0 ? <p className="py-4 text-sm text-ink-400">Nothing outstanding.</p> : (
          <ul className="divide-y divide-surface-line">
            {outstanding.slice(0, 6).map(({ order, paid, outstanding: amt }) => (
              <li key={order.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0"><OrderLink id={order.id} /> <span className="text-xs text-ink-400">· {order.title}</span></span>
                <span className="shrink-0 text-right"><span className="block font-semibold tabular-nums text-ink-900">{inr(amt)}</span><span className="block text-[11px] text-ink-400">paid {inr(paid)} of {inr(order.value)}</span></span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/payments" className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline">Open payments →</Link>
      </Card>
    </div>
  );
}
