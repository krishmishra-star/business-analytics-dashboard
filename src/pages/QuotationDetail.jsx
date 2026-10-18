import { useParams } from 'react-router-dom';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import Badge from '../components/ui/Badge.jsx';
import MiniTable from '../components/ui/MiniTable.jsx';
import { Card } from '../components/ui/Card.jsx';
import { DetailHeader, InfoGrid, NotFoundRecord, RelatedCard, Timeline } from '../components/ui/Detail.jsx';
import { LeadLink, QuoteLink, DealLink, EmployeeLink } from '../components/ui/Links.jsx';
import { useData } from '../context/DataContext.jsx';
import { formatDay, formatDateTime, toDay } from '../lib/dates.js';
import { inr } from '../lib/format.js';
import { activitiesFor, activityToTimeline } from '../lib/related.js';
import { shortService } from '../data/constants.js';

export default function QuotationDetail() {
  const { id } = useParams();
  const { data, quoteById, leadById, dealById } = useData();
  const quote = quoteById[id];
  if (!quote) return <NotFoundRecord kind="Quotation" backTo="/quotations" backLabel="Back to quotations" />;

  const lead = leadById[quote.leadId];
  const deal = quote.dealId ? dealById[quote.dealId] : null;
  const siblings = data.quotations.filter((q) => q.leadId === quote.leadId && q.id !== quote.id);
  const acts = activitiesFor(data, [['Quotation', id]]);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Quotations', to: '/quotations' }, { label: quote.id }]} />
      <DetailHeader title={quote.id} subtitle={quote.service} badges={<Badge status={quote.status} />} />

      <Card title="Quotation details">
        <InfoGrid items={[
          ['Lead', lead ? <span key="l"><LeadLink id={lead.id}>{lead.name}</LeadLink><span className="block text-xs font-normal text-ink-400">{lead.company}</span></span> : '—'],
          ['Amount', inr(quote.amount)], ['Service', quote.service], ['Created', formatDay(toDay(quote.createdAt))],
          ['Created by', <EmployeeLink key="e" id={quote.createdBy} />],
          ['Linked deal', deal ? <span key="d"><DealLink id={deal.id} /> <Badge status={deal.stage} /></span> : 'No deal linked'],
        ]} />
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Status history">
          <Timeline items={quote.statusHistory.map((h, i) => ({ key: i, title: h.status, body: h.note, meta: formatDateTime(h.at) })).reverse()} />
        </Card>
        <RelatedCard title="Other quotations for this lead" count={siblings.length}>
          <MiniTable rows={siblings} empty="This is the only quotation for the lead." columns={[
            { key: 'id', header: 'Quotation', render: (r) => <QuoteLink id={r.id} /> },
            { key: 'service', header: 'Service', render: (r) => shortService(r.service) },
            { key: 'amount', header: 'Amount', align: 'right', render: (r) => inr(r.amount) },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
          ]} />
        </RelatedCard>
        <Card title="Activity" className="xl:col-span-2"><Timeline items={activityToTimeline(acts)} /></Card>
      </div>
    </>
  );
}
