import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader.jsx';
import ExportMenu from '../components/layout/ExportMenu.jsx';
import DataTable from '../components/ui/DataTable.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { DealKpis, DealCharts } from '../components/dashboard/DealsSection.jsx';
import { LeadLink, DealLink, EmployeeLink } from '../components/ui/Links.jsx';
import { useScope } from '../hooks/useScope.js';
import { useData } from '../context/DataContext.jsx';
import { useListParams } from '../hooks/useListParams.js';
import { DEAL_STAGES, PRIORITIES, SERVICE_NAMES, shortService } from '../data/constants.js';
import { formatDay, toDay } from '../lib/dates.js';
import { inr } from '../lib/format.js';
import { dealColumns } from '../lib/exportDefs.js';
import { employeeName, sum } from '../lib/aggregate.js';

export default function Deals() {
  const nav = useNavigate();
  const { cur } = useScope();
  const { leadById } = useData();
  const { initial, tableKey } = useListParams(['stage', 'priority', 'service']);

  const columns = [
    { key: 'id', header: 'Deal ID', render: (r) => <DealLink id={r.id} /> },
    { key: 'title', header: 'Deal', render: (r) => <span className="font-medium text-ink-900">{r.title}</span> },
    { key: 'lead', header: 'Lead', sortValue: (r) => leadById[r.leadId]?.name || '', render: (r) => <LeadLink id={r.leadId}>{leadById[r.leadId]?.name || r.leadId}</LeadLink> },
    { key: 'service', header: 'Service', render: (r) => shortService(r.service) },
    { key: 'value', header: 'Value', align: 'right', render: (r) => inr(r.value) },
    { key: 'priority', header: 'Priority', render: (r) => <Badge status={r.priority} /> },
    { key: 'stage', header: 'Stage', render: (r) => <Badge status={r.stage} /> },
    { key: 'ownerId', header: 'Owner', sortValue: (r) => employeeName(r.ownerId), render: (r) => <EmployeeLink id={r.ownerId} /> },
    { key: 'createdAt', header: 'Created', render: (r) => formatDay(toDay(r.createdAt)) },
    { key: 'expectedCloseDate', header: 'Expected Close', render: (r) => formatDay(r.expectedCloseDate) },
  ];

  return (
    <>
      <PageHeader title="Deals" subtitle="Deals created in the selected period. Open one to change its stage or priority." actions={<ExportMenu />} />
      <DealKpis />
      <DealCharts />
      <Card className="mt-4" title={`Deal list (${cur.deals.length})`}>
        <DataTable key={tableKey} columns={columns} rows={cur.deals} initialFilters={initial} onRowClick={(r) => nav(`/deals/${r.id}`)}
          searchText={(r) => `${r.id} ${r.title} ${r.service} ${leadById[r.leadId]?.name || ''}`} searchPlaceholder="Search deal, lead, service…" defaultSort={{ key: 'createdAt', dir: 'desc' }}
          filters={[
            { key: 'stage', label: 'Stages', options: DEAL_STAGES, get: (r) => r.stage },
            { key: 'priority', label: 'Priorities', options: PRIORITIES, get: (r) => r.priority },
            { key: 'service', label: 'Services', options: SERVICE_NAMES, get: (r) => r.service },
          ]}
          footer={(rows) => (<tr><td className="td font-semibold" colSpan={4}>Total ({rows.length})</td><td className="td text-right font-semibold tabular-nums">{inr(sum(rows, (r) => r.value))}</td><td className="td" colSpan={5} /></tr>)}
          exportName="deals" exportColumns={dealColumns({ leadById })} />
      </Card>
    </>
  );
}
