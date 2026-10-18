import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader.jsx';
import ExportMenu from '../components/layout/ExportMenu.jsx';
import DataTable from '../components/ui/DataTable.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { QuotationKpis } from '../components/dashboard/QuotationSection.jsx';
import { LeadLink, QuoteLink, DealLink } from '../components/ui/Links.jsx';
import { useScope } from '../hooks/useScope.js';
import { useData } from '../context/DataContext.jsx';
import { useListParams } from '../hooks/useListParams.js';
import { QUOTE_STATUSES, SERVICE_NAMES, shortService } from '../data/constants.js';
import { formatDay, toDay } from '../lib/dates.js';
import { inr } from '../lib/format.js';
import { quotationColumns } from '../lib/exportDefs.js';
import { sum } from '../lib/aggregate.js';

export default function Quotations() {
  const nav = useNavigate();
  const { cur } = useScope();
  const { leadById } = useData();
  const { initial, tableKey } = useListParams(['status', 'service']);

  const columns = [
    { key: 'id', header: 'Quotation ID', render: (r) => <QuoteLink id={r.id} /> },
    { key: 'lead', header: 'Lead', sortValue: (r) => leadById[r.leadId]?.name || '', render: (r) => <LeadLink id={r.leadId}>{leadById[r.leadId]?.name || r.leadId}</LeadLink> },
    { key: 'service', header: 'Service', render: (r) => shortService(r.service) },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => inr(r.amount) },
    { key: 'createdAt', header: 'Created', render: (r) => formatDay(toDay(r.createdAt)) },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
    { key: 'dealId', header: 'Related Deal', sortValue: (r) => r.dealId || '', render: (r) => <DealLink id={r.dealId} /> },
    { key: 'view', header: 'Details', sortable: false, render: (r) => <button className="btn !px-2 !py-1 text-xs" onClick={(e) => { e.stopPropagation(); nav(`/quotations/${r.id}`); }}>View Details</button> },
  ];

  return (
    <>
      <PageHeader title="Quotations" subtitle="Every quotation sent in the selected period, with the deal it led to (if any)." actions={<ExportMenu />} />
      <QuotationKpis />
      <Card className="mt-4" title={`Quotation list (${cur.quotations.length})`}>
        <DataTable key={tableKey} columns={columns} rows={cur.quotations} initialFilters={initial} onRowClick={(r) => nav(`/quotations/${r.id}`)}
          searchText={(r) => `${r.id} ${r.service} ${leadById[r.leadId]?.name || ''} ${leadById[r.leadId]?.company || ''} ${r.dealId || ''}`} searchPlaceholder="Search ID, lead, service…" defaultSort={{ key: 'createdAt', dir: 'desc' }}
          filters={[
            { key: 'status', label: 'Statuses', options: QUOTE_STATUSES, get: (r) => r.status },
            { key: 'service', label: 'Services', options: SERVICE_NAMES, get: (r) => r.service },
          ]}
          footer={(rows) => (
            <tr><td className="td font-semibold" colSpan={3}>Total ({rows.length})</td><td className="td text-right font-semibold tabular-nums">{inr(sum(rows, (r) => r.amount))}</td><td className="td" colSpan={4} /></tr>
          )}
          exportName="quotations" exportColumns={quotationColumns({ leadById })} />
      </Card>
    </>
  );
}
