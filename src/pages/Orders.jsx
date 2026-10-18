import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader.jsx';
import ExportMenu from '../components/layout/ExportMenu.jsx';
import DataTable from '../components/ui/DataTable.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { OrderKpis, OrderCharts } from '../components/dashboard/OrdersSection.jsx';
import { LeadLink, DealLink, OrderLink, EmployeeLink } from '../components/ui/Links.jsx';
import { useScope } from '../hooks/useScope.js';
import { useData } from '../context/DataContext.jsx';
import { useListParams } from '../hooks/useListParams.js';
import { ORDER_EFFECTIVE_STATUSES, SERVICE_NAMES, shortService } from '../data/constants.js';
import { formatDay, toDay } from '../lib/dates.js';
import { inr } from '../lib/format.js';
import { orderColumns } from '../lib/exportDefs.js';
import { employeeName, effectiveOrderStatus, sum } from '../lib/aggregate.js';

export function ProgressBar({ value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-brand-500" style={{ width: `${value}%` }} /></div>
      <span className="text-xs tabular-nums text-ink-500">{value}%</span>
    </div>
  );
}

export default function Orders() {
  const nav = useNavigate();
  const { cur } = useScope();
  const { leadById } = useData();
  const { initial, tableKey } = useListParams(['status', 'service']);

  const columns = [
    { key: 'id', header: 'Order ID', render: (r) => <OrderLink id={r.id} /> },
    { key: 'title', header: 'Order', render: (r) => <span className="font-medium text-ink-900">{r.title}</span> },
    { key: 'dealId', header: 'Deal', render: (r) => <DealLink id={r.dealId} /> },
    { key: 'lead', header: 'Lead', sortValue: (r) => leadById[r.leadId]?.name || '', render: (r) => <LeadLink id={r.leadId}>{leadById[r.leadId]?.name || r.leadId}</LeadLink> },
    { key: 'service', header: 'Service', render: (r) => shortService(r.service) },
    { key: 'value', header: 'Value', align: 'right', render: (r) => inr(r.value) },
    { key: 'status', header: 'Status', sortValue: (r) => effectiveOrderStatus(r), render: (r) => <Badge status={effectiveOrderStatus(r)} /> },
    { key: 'progress', header: 'Progress', render: (r) => <ProgressBar value={r.progress} /> },
    { key: 'assignedTo', header: 'Assigned To', sortValue: (r) => employeeName(r.assignedTo), render: (r) => <EmployeeLink id={r.assignedTo} /> },
    { key: 'createdAt', header: 'Created', render: (r) => formatDay(toDay(r.createdAt)) },
    { key: 'dueDate', header: 'Due', render: (r) => formatDay(r.dueDate) },
  ];

  return (
    <>
      <PageHeader title="Orders & Payments" subtitle="Fulfilment status and money collected for orders created in the selected period." actions={<ExportMenu />} />
      <OrderKpis />
      <OrderCharts />
      <Card className="mt-4" title={`Order list (${cur.orders.length})`}>
        <DataTable key={tableKey} columns={columns} rows={cur.orders} initialFilters={initial} onRowClick={(r) => nav(`/orders/${r.id}`)}
          searchText={(r) => `${r.id} ${r.title} ${r.dealId} ${r.service} ${leadById[r.leadId]?.name || ''}`} searchPlaceholder="Search order, deal, lead…" defaultSort={{ key: 'createdAt', dir: 'desc' }}
          filters={[
            { key: 'status', label: 'Statuses', options: ORDER_EFFECTIVE_STATUSES, get: (r) => effectiveOrderStatus(r) },
            { key: 'service', label: 'Services', options: SERVICE_NAMES, get: (r) => r.service },
          ]}
          footer={(rows) => (<tr><td className="td font-semibold" colSpan={5}>Total ({rows.length})</td><td className="td text-right font-semibold tabular-nums">{inr(sum(rows, (r) => r.value))}</td><td className="td" colSpan={5} /></tr>)}
          exportName="orders" exportColumns={orderColumns({ leadById })} />
      </Card>
    </>
  );
}
