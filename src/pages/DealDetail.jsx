import { useParams } from 'react-router-dom';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import Badge from '../components/ui/Badge.jsx';
import MiniTable from '../components/ui/MiniTable.jsx';
import { Card } from '../components/ui/Card.jsx';
import { DetailHeader, InfoGrid, NotFoundRecord, RelatedCard, Timeline, Field } from '../components/ui/Detail.jsx';
import { LeadLink, QuoteLink, OrderLink, PaymentLink, EmployeeLink } from '../components/ui/Links.jsx';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDay, formatDateTime, toDay } from '../lib/dates.js';
import { inr } from '../lib/format.js';
import { effectiveOrderStatus } from '../lib/aggregate.js';
import { activitiesFor, activityToTimeline } from '../lib/related.js';
import { DEAL_STAGES, PRIORITIES, shortService } from '../data/constants.js';

export default function DealDetail() {
  const { id } = useParams();
  const { data, dealById, leadById, updateDealStage, updateDealPriority } = useData();
  const toast = useToast();
  const deal = dealById[id];
  if (!deal) return <NotFoundRecord kind="Deal" backTo="/deals" backLabel="Back to deals" />;

  const lead = leadById[deal.leadId];
  const quotes = data.quotations.filter((q) => q.id === deal.quotationId || q.dealId === deal.id || (q.leadId === deal.leadId && q.service === deal.service));
  const uniqueQuotes = [...new Map(quotes.map((q) => [q.id, q])).values()];
  const orders = data.orders.filter((o) => o.dealId === id);
  const orderIds = new Set(orders.map((o) => o.id));
  const payments = data.payments.filter((p) => orderIds.has(p.orderId));
  const acts = activitiesFor(data, [['Deal', id], ...orders.map((o) => ['Order', o.id]), ...payments.map((p) => ['Payment', p.id]), ...uniqueQuotes.map((q) => ['Quotation', q.id])]);
  const paid = payments.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);

  const onStage = (e) => {
    updateDealStage(id, e.target.value);
    toast.success(`${deal.id} moved to ${e.target.value}.`);
  };
  const onPriority = (e) => {
    updateDealPriority(id, e.target.value);
    toast.success(`${deal.id} priority set to ${e.target.value}.`);
  };

  return (
    <>
      <Breadcrumbs items={[{ label: 'Deals', to: '/deals' }, { label: deal.id }]} />
      <DetailHeader title={deal.title} subtitle={deal.id} badges={<><Badge status={deal.stage} /><Badge status={deal.priority}>{deal.priority} priority</Badge></>}
        actions={(
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Stage"><select className="input" value={deal.stage} onChange={onStage} aria-label="Deal stage">{DEAL_STAGES.map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Priority"><select className="input" value={deal.priority} onChange={onPriority} aria-label="Deal priority">{PRIORITIES.map((s) => <option key={s}>{s}</option>)}</select></Field>
          </div>
        )} />

      <Card title="Deal details">
        <InfoGrid cols={4} items={[
          ['Deal ID', deal.id], ['Related lead', lead ? <LeadLink key="l" id={lead.id}>{lead.name}</LeadLink> : '—'], ['Service', deal.service], ['Deal value', inr(deal.value)],
          ['Priority', deal.priority], ['Current stage', deal.stage], ['Owner', <EmployeeLink key="o" id={deal.ownerId} />], ['Created', formatDay(toDay(deal.createdAt))],
          ['Expected closing', formatDay(deal.expectedCloseDate)], ['Closed on', deal.closedAt ? formatDay(deal.closedAt) : 'Still open'], ['Collected so far', inr(paid)], ['Linked quotation', <QuoteLink key="q" id={deal.quotationId} />],
        ]} />
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RelatedCard title="Related quotations" count={uniqueQuotes.length}>
          <MiniTable rows={uniqueQuotes} columns={[
            { key: 'id', header: 'Quotation', render: (r) => <QuoteLink id={r.id} /> },
            { key: 'service', header: 'Service', render: (r) => shortService(r.service) },
            { key: 'amount', header: 'Amount', align: 'right', render: (r) => inr(r.amount) },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
          ]} />
        </RelatedCard>
        <RelatedCard title="Related orders" count={orders.length}>
          <MiniTable rows={orders} empty="No orders yet. Orders appear once a deal is won." columns={[
            { key: 'id', header: 'Order', render: (r) => <OrderLink id={r.id} /> },
            { key: 'title', header: 'Title' },
            { key: 'value', header: 'Value', align: 'right', render: (r) => inr(r.value) },
            { key: 'status', header: 'Status', render: (r) => <Badge status={effectiveOrderStatus(r)} /> },
            { key: 'progress', header: 'Progress', align: 'right', render: (r) => `${r.progress}%` },
          ]} />
        </RelatedCard>
        <RelatedCard title="Related payments" count={payments.length}>
          <MiniTable rows={payments} empty="No payments recorded for this deal." columns={[
            { key: 'id', header: 'Payment', render: (r) => <PaymentLink id={r.id} /> },
            { key: 'orderId', header: 'Order', render: (r) => <OrderLink id={r.orderId} /> },
            { key: 'amount', header: 'Amount', align: 'right', render: (r) => inr(r.amount) },
            { key: 'date', header: 'Date', render: (r) => formatDay(r.paymentDate) },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
          ]} />
        </RelatedCard>
        <Card title="Stage history">
          <Timeline items={[...deal.stageHistory].reverse().map((h, i) => ({ key: i, title: h.stage, meta: formatDateTime(h.at) }))} />
        </Card>
        <Card title="Activity history" className="xl:col-span-2"><Timeline items={activityToTimeline(acts)} /></Card>
      </div>
    </>
  );
}
