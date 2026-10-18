import { useParams } from 'react-router-dom';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import Badge from '../components/ui/Badge.jsx';
import MiniTable from '../components/ui/MiniTable.jsx';
import { Card } from '../components/ui/Card.jsx';
import { DetailHeader, InfoGrid, NotFoundRecord, RelatedCard, Timeline, Field } from '../components/ui/Detail.jsx';
import { LeadLink, DealLink, OrderLink, PaymentLink, EmployeeLink } from '../components/ui/Links.jsx';
import { useData } from '../context/DataContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDay } from '../lib/dates.js';
import { inr } from '../lib/format.js';
import { activitiesFor, activityToTimeline } from '../lib/related.js';
import { PAYMENT_STATUSES } from '../data/constants.js';

export default function PaymentDetail() {
  const { id } = useParams();
  const { data, paymentById, orderById, leadById, updatePaymentStatus } = useData();
  const toast = useToast();
  const pay = paymentById[id];
  if (!pay) return <NotFoundRecord kind="Payment" backTo="/payments" backLabel="Back to payments" />;

  const order = orderById[pay.orderId];
  const lead = order ? leadById[order.leadId] : null;
  const siblings = data.payments.filter((p) => p.orderId === pay.orderId && p.id !== pay.id);
  const acts = activitiesFor(data, [['Payment', id]]);

  return (
    <>
      <Breadcrumbs items={[{ label: 'Payments', to: '/payments' }, { label: pay.id }]} />
      <DetailHeader title={pay.id} subtitle={`${inr(pay.amount)} via ${pay.method}`} badges={<Badge status={pay.status} />}
        actions={(
          <Field label="Payment status">
            <select className="input" value={pay.status} aria-label="Payment status" onChange={(e) => { updatePaymentStatus(id, e.target.value); toast.success(`${pay.id} marked ${e.target.value}.`); }}>
              {PAYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        )} />

      <Card title="Payment details">
        <InfoGrid cols={4} items={[
          ['Payment ID', pay.id], ['Related order', <OrderLink key="o" id={pay.orderId} />], ['Related deal', <DealLink key="d" id={pay.dealId} />], ['Lead', lead ? <LeadLink key="l" id={lead.id}>{lead.name}</LeadLink> : '—'],
          ['Amount', inr(pay.amount)], ['Payment date', formatDay(pay.paymentDate)], ['Method', pay.method], ['Status', pay.status],
          ['Transaction reference', <span key="r" className="font-mono text-xs">{pay.reference}</span>], ['Installment', pay.installment], ['Received by', <EmployeeLink key="e" id={pay.receivedBy} />], ['Order value', order ? inr(order.value) : '—'],
        ]} />
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RelatedCard title="Other payments on this order" count={siblings.length}>
          <MiniTable rows={siblings} empty="This is the only payment for the order." columns={[
            { key: 'id', header: 'Payment', render: (r) => <PaymentLink id={r.id} /> },
            { key: 'installment', header: 'Type' },
            { key: 'amount', header: 'Amount', align: 'right', render: (r) => inr(r.amount) },
            { key: 'date', header: 'Date', render: (r) => formatDay(r.paymentDate) },
            { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
          ]} />
        </RelatedCard>
        <Card title="Activity history"><Timeline items={activityToTimeline(acts)} /></Card>
      </div>
    </>
  );
}
