import { useParams } from 'react-router-dom';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import Badge from '../components/ui/Badge.jsx';
import MiniTable from '../components/ui/MiniTable.jsx';
import { Card } from '../components/ui/Card.jsx';
import { DetailHeader, InfoGrid, NotFoundRecord, RelatedCard, Timeline } from '../components/ui/Detail.jsx';
import { QuoteLink, DealLink, OrderLink, EmployeeLink } from '../components/ui/Links.jsx';
import { useData } from '../context/DataContext.jsx';
import { formatDay, toDay } from '../lib/dates.js';
import { inr } from '../lib/format.js';
import { effectiveOrderStatus } from '../lib/aggregate.js';
import { activitiesFor, activityToTimeline, paidTotal } from '../lib/related.js';
import { shortService } from '../data/constants.js';

export default function LeadDetail() {
  const { id } = useParams();
  const { data, leadById } = useData();
  const lead = leadById[id];
  if (!lead) return <NotFoundRecord kind="Lead" backTo="/leads" backLabel="Back to leads" />;

  const quotes = data.quotations.filter((q) => q.leadId === id);
  const deals = data.deals.filter((d) => d.leadId === id);
  const orders = data.orders.filter((o) => o.leadId === id);
  const orderIds = new Set(orders.map((o) => o.id));
  const payments = data.payments.filter((p) => orderIds.has(p.orderId));
  const acts = activitiesFor(data, [['Lead', id], ...quotes.map((q) => ['Quotation', q.id]), ...deals.map((d) => ['Deal', d.id]), ...orders.map((o) => ['Order', o.id])]);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Leads', to: '/leads' }, { label: lead.id }]} />
      <DetailHeader title={lead.name} subtitle={`${lead.company} · ${lead.id}`} badges={<Badge status={lead.status} />} />

      <Card title="Lead details">
        <InfoGrid items={[
          ['Company', lead.company], ['Email', lead.email], ['Phone', lead.phone], ['Source', lead.source], ['Service interest', lead.service],
          ['Assigned to', <EmployeeLink key="a" id={lead.assignedTo} />], ['Created', formatDay(toDay(lead.createdAt))], ['Notes', lead.notes],
        ]} />
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RelatedCard title="Quotation history" count={quotes.length}>
          <MiniTable rows={quotes} empty="No quotations have been sent to this lead." columns={[
            { key: 'id', header: 'Quotation', render: (r) => <QuoteLink id={r.id} /> },
            { key: 'service', header: 'Service', render: (r) => shortService(r.service) },
            { key: 'amount', header: 'Amount', align: 'right', render: (r) => inr(r.amount) },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
            { key: 'deal', header: 'Deal', render: (r) => <DealLink id={r.dealId} /> },
          ]} />
        </RelatedCard>
        <RelatedCard title="Deals" count={deals.length}>
          <MiniTable rows={deals} empty="No deals for this lead yet." columns={[
            { key: 'id', header: 'Deal', render: (r) => <DealLink id={r.id} /> },
            { key: 'service', header: 'Service', render: (r) => shortService(r.service) },
            { key: 'value', header: 'Value', align: 'right', render: (r) => inr(r.value) },
            { key: 'priority', header: 'Priority', render: (r) => <Badge status={r.priority} /> },
            { key: 'stage', header: 'Stage', render: (r) => <Badge status={r.stage} /> },
          ]} />
        </RelatedCard>
        <RelatedCard title="Orders" count={orders.length}>
          <MiniTable rows={orders} empty="No orders yet. Orders are created once a deal is won." columns={[
            { key: 'id', header: 'Order', render: (r) => <OrderLink id={r.id} /> },
            { key: 'title', header: 'Title' },
            { key: 'value', header: 'Value', align: 'right', render: (r) => inr(r.value) },
            { key: 'status', header: 'Status', render: (r) => <Badge status={effectiveOrderStatus(r)} /> },
            { key: 'progress', header: 'Progress', align: 'right', render: (r) => `${r.progress}%` },
          ]} footer={(rows) => (<tr><td className="td font-semibold" colSpan={2}>Paid so far</td><td className="td text-right font-semibold tabular-nums" colSpan={3}>{inr(paidTotal(payments))} of {inr(rows.reduce((a, r) => a + r.value, 0))}</td></tr>)} />
        </RelatedCard>
        <Card title="Activity history">
          <Timeline items={activityToTimeline(acts)} />
        </Card>
      </div>
    </>
  );
}
