import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import Badge from '../components/ui/Badge.jsx';
import MiniTable from '../components/ui/MiniTable.jsx';
import { Card } from '../components/ui/Card.jsx';
import { DetailHeader, InfoGrid, NotFoundRecord, RelatedCard, Timeline, Field } from '../components/ui/Detail.jsx';
import { LeadLink, DealLink, PaymentLink, EmployeeLink } from '../components/ui/Links.jsx';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDay, toDay } from '../lib/dates.js';
import { inr } from '../lib/format.js';
import { effectiveOrderStatus, stagesDone } from '../lib/aggregate.js';
import { activitiesFor, activityToTimeline, orderStages, paidTotal } from '../lib/related.js';
import { ORDER_STATUSES } from '../data/constants.js';

function ProgressControl({ order, onCommit }) {
  const [val, setVal] = useState(order.progress);
  useEffect(() => { setVal(order.progress); }, [order.progress]);
  const commit = () => { if (val !== order.progress) onCommit(val); };
  return (
    <Field label={`Progress: ${val}%`}>
      <input type="range" min="0" max="100" step="5" value={val} aria-label="Order progress" className="w-48 accent-brand-500"
        onChange={(e) => setVal(Number(e.target.value))} onPointerUp={commit} onKeyUp={commit} onBlur={commit} />
    </Field>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const { data, orderById, leadById, updateOrderProgress, updateOrderStatus } = useData();
  const toast = useToast();
  const order = orderById[id];
  if (!order) return <NotFoundRecord kind="Order" backTo="/orders" backLabel="Back to orders" />;

  const lead = leadById[order.leadId];
  const payments = data.payments.filter((p) => p.orderId === id);
  const paid = paidTotal(payments);
  const outstanding = Math.max(0, order.value - paid);
  const done = stagesDone(order);
  const stages = orderStages(order, done);
  const acts = activitiesFor(data, [['Order', id], ...payments.map((p) => ['Payment', p.id])]);
  const eff = effectiveOrderStatus(order);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Orders', to: '/orders' }, { label: order.id }]} />
      <DetailHeader title={order.title} subtitle={`${order.id} · ${order.service}`} badges={<Badge status={eff} />}
        actions={(
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Status">
              <select className="input" value={order.status} aria-label="Order status" onChange={(e) => { updateOrderStatus(id, e.target.value); toast.success(`${order.id} set to ${e.target.value}.`); }}>
                {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <ProgressControl order={order} onCommit={(v) => { updateOrderProgress(id, v); toast.success(`${order.id} progress updated to ${v}%.`); }} />
            {order.status !== 'Completed' && <button className="btn" onClick={() => { updateOrderProgress(id, 100); toast.success(`${order.id} marked complete.`); }}><CheckCircle2 size={15} /> Mark complete</button>}
          </div>
        )} />

      <Card title="Order details">
        <InfoGrid cols={4} items={[
          ['Order ID', order.id], ['Related deal', <DealLink key="d" id={order.dealId} />], ['Related lead', lead ? <LeadLink key="l" id={lead.id}>{lead.name}</LeadLink> : '—'], ['Service', order.service],
          ['Order value', inr(order.value)], ['Paid', inr(paid)], ['Outstanding', inr(outstanding)], ['Status', eff],
          ['Progress', `${order.progress}%`], ['Assigned to', <EmployeeLink key="a" id={order.assignedTo} />], ['Created', formatDay(toDay(order.createdAt))], ['Due date', formatDay(order.dueDate)],
        ]} />
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title={`Stages (${done} of ${order.stageCount} complete)`} subtitle="Derived from the progress percentage">
          <ol className="space-y-2.5">
            {stages.map((s, i) => (
              <li key={s.name} className="flex items-center gap-3 text-sm">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${s.state === 'done' ? 'bg-emerald-500 text-white' : s.state === 'current' ? 'bg-brand-500 text-white' : 'bg-surface text-ink-400'}`}>{i + 1}</span>
                <span className={s.state === 'todo' ? 'text-ink-400' : 'font-medium text-ink-900'}>{s.name}</span>
                {s.state === 'current' && <Badge tone="blue">In progress</Badge>}
              </li>
            ))}
          </ol>
        </Card>
        <RelatedCard title="Payments" count={payments.length}>
          <MiniTable rows={payments} empty="No payments recorded for this order yet." columns={[
            { key: 'id', header: 'Payment', render: (r) => <PaymentLink id={r.id} /> },
            { key: 'installment', header: 'Type' },
            { key: 'amount', header: 'Amount', align: 'right', render: (r) => inr(r.amount) },
            { key: 'date', header: 'Date', render: (r) => formatDay(r.paymentDate) },
            { key: 'method', header: 'Method', render: (r) => r.method },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
          ]} />
        </RelatedCard>
        <Card title="Activity history" className="xl:col-span-2"><Timeline items={activityToTimeline(acts)} /></Card>
      </div>
    </>
  );
}
