import { useNavigate } from 'react-router-dom';
import { Wallet, Clock, XCircle, Percent } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import ExportMenu from '../components/layout/ExportMenu.jsx';
import DataTable from '../components/ui/DataTable.jsx';
import Badge from '../components/ui/Badge.jsx';
import KpiCard from '../components/ui/KpiCard.jsx';
import { Card } from '../components/ui/Card.jsx';
import { ColumnBars, Donut } from '../components/charts/Charts.jsx';
import { DealLink, OrderLink, PaymentLink } from '../components/ui/Links.jsx';
import { useScope } from '../hooks/useScope.js';
import { useData } from '../context/DataContext.jsx';
import { useListParams } from '../hooks/useListParams.js';
import { PAYMENT_STATUSES, PAYMENT_METHODS, METHOD_COLORS, shortService } from '../data/constants.js';
import { formatDay } from '../lib/dates.js';
import { inr, inrCompact, num, pct } from '../lib/format.js';
import { paymentColumns } from '../lib/exportDefs.js';
import { dailyPayments, paymentMethodDistribution, sum } from '../lib/aggregate.js';

export default function Payments() {
  const nav = useNavigate();
  const { cur, summary: s, prevSummary: p, filters } = useScope();
  const { orderById } = useData();
  const { initial, tableKey } = useListParams(['status', 'method']);
  const pl = filters.prevLabel;
  const methods = paymentMethodDistribution(cur.payments).map((d) => ({ ...d, color: METHOD_COLORS[d.name] }));

  const columns = [
    { key: 'id', header: 'Payment ID', render: (r) => <PaymentLink id={r.id} /> },
    { key: 'orderId', header: 'Order', render: (r) => <OrderLink id={r.orderId} /> },
    { key: 'dealId', header: 'Deal', render: (r) => <DealLink id={r.dealId} /> },
    { key: 'service', header: 'Service', sortValue: (r) => orderById[r.orderId]?.service || '', render: (r) => shortService(orderById[r.orderId]?.service) },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => inr(r.amount) },
    { key: 'paymentDate', header: 'Payment Date', render: (r) => formatDay(r.paymentDate) },
    { key: 'method', header: 'Method' },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
    { key: 'reference', header: 'Transaction Ref', render: (r) => <span className="font-mono text-xs">{r.reference}</span> },
  ];

  return (
    <>
      <PageHeader title="Payments" subtitle="Payment records dated within the selected period. Open one to update its status." actions={<ExportMenu />} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Collected (Paid)" icon={Wallet} tone="green" value={inrCompact(s.payments.paidAmount)} sub={inr(s.payments.paidAmount)} cur={s.payments.paidAmount} prev={p.payments.paidAmount} prevLabel={pl} to="/payments?status=Paid" />
        <KpiCard label="Pending" icon={Clock} tone="orange" value={inrCompact(s.payments.pendingAmount)} sub={inr(s.payments.pendingAmount)} cur={s.payments.pendingAmount} prev={p.payments.pendingAmount} prevLabel={pl} invert to="/payments?status=Pending" />
        <KpiCard label="Failed" icon={XCircle} tone="red" value={inrCompact(s.payments.failedAmount)} sub={inr(s.payments.failedAmount)} cur={s.payments.failedAmount} prev={p.payments.failedAmount} prevLabel={pl} invert to="/payments?status=Failed" />
        <KpiCard label="Collection Rate" icon={Percent} tone="purple" value={pct(s.payments.collectionRate)} cur={s.payments.collectionRate} prev={p.payments.collectionRate} prevLabel={pl} info="Paid ÷ (paid + pending + failed) amounts" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-8" title="Daily Payment Collection Trend" subtitle="By payment date and status">
          <ColumnBars data={dailyPayments(cur)} xKey="label" kind="inr" stacked series={[{ key: 'paid', name: 'Paid', color: '#10b981' }, { key: 'pending', name: 'Pending', color: '#f59e0b' }, { key: 'failed', name: 'Failed', color: '#ef4444' }]} />
        </Card>
        <Card className="lg:col-span-4" title="Payment Methods" subtitle="Paid amounts · click to filter the list">
          <Donut data={methods} kind="inr" size={140} onSliceClick={(name) => nav(`/payments?method=${encodeURIComponent(name)}`)} center={{ value: num(cur.payments.filter((x) => x.status === 'Paid').length), label: 'Paid' }} />
        </Card>
      </div>
      <Card className="mt-4" title={`Payment list (${cur.payments.length})`}>
        <DataTable key={tableKey} columns={columns} rows={cur.payments} initialFilters={initial} onRowClick={(r) => nav(`/payments/${r.id}`)}
          searchText={(r) => `${r.id} ${r.orderId} ${r.dealId} ${r.reference} ${r.method}`} searchPlaceholder="Search ID, order, reference…" defaultSort={{ key: 'paymentDate', dir: 'desc' }}
          filters={[
            { key: 'status', label: 'Statuses', options: PAYMENT_STATUSES, get: (r) => r.status },
            { key: 'method', label: 'Methods', options: PAYMENT_METHODS, get: (r) => r.method },
          ]}
          footer={(rows) => (<tr><td className="td font-semibold" colSpan={4}>Total ({rows.length})</td><td className="td text-right font-semibold tabular-nums">{inr(sum(rows, (r) => r.amount))}</td><td className="td" colSpan={4} /></tr>)}
          exportName="payments" exportColumns={paymentColumns({ orderById })} />
      </Card>
    </>
  );
}
