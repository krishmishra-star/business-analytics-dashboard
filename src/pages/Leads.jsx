import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader.jsx';
import ExportMenu from '../components/layout/ExportMenu.jsx';
import DataTable from '../components/ui/DataTable.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { LeadKpis } from '../components/dashboard/LeadSection.jsx';
import { LeadLink, EmployeeLink } from '../components/ui/Links.jsx';
import { useScope } from '../hooks/useScope.js';
import { useListParams } from '../hooks/useListParams.js';
import { LEAD_STATUSES, LEAD_SOURCES, SERVICE_NAMES, shortService } from '../data/constants.js';
import { formatDay, toDay } from '../lib/dates.js';
import { leadColumns } from '../lib/exportDefs.js';
import { employeeName } from '../lib/aggregate.js';

export default function Leads() {
  const nav = useNavigate();
  const { cur, data } = useScope();
  const { initial, tableKey } = useListParams(['status', 'source', 'service']);

  const qCount = {};
  data.quotations.forEach((q) => { qCount[q.leadId] = (qCount[q.leadId] || 0) + 1; });
  const dCount = {};
  data.deals.forEach((d) => { dCount[d.leadId] = (dCount[d.leadId] || 0) + 1; });

  const columns = [
    { key: 'id', header: 'Lead ID', render: (r) => <LeadLink id={r.id} /> },
    { key: 'name', header: 'Name', render: (r) => <span><span className="font-medium text-ink-900">{r.name}</span><span className="block text-[11px] text-ink-400">{r.company}</span></span> },
    { key: 'service', header: 'Service', render: (r) => shortService(r.service) },
    { key: 'source', header: 'Source' },
    { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> },
    { key: 'assignedTo', header: 'Assigned To', sortValue: (r) => employeeName(r.assignedTo), render: (r) => <EmployeeLink id={r.assignedTo} /> },
    { key: 'createdAt', header: 'Created', render: (r) => formatDay(toDay(r.createdAt)) },
    { key: 'quotes', header: 'Quotes', align: 'right', sortValue: (r) => qCount[r.id] || 0, render: (r) => qCount[r.id] || 0 },
    { key: 'deals', header: 'Deals', align: 'right', sortValue: (r) => dCount[r.id] || 0, render: (r) => dCount[r.id] || 0 },
    { key: 'view', header: '', sortable: false, render: (r) => <button className="btn !px-2 !py-1 text-xs" onClick={(e) => { e.stopPropagation(); nav(`/leads/${r.id}`); }}>View</button> },
  ];

  return (
    <>
      <PageHeader title="Leads" subtitle="Every lead created in the selected period. Click a row for its quotations, deals and activity." actions={<ExportMenu />} />
      <LeadKpis />
      <Card className="mt-4" title={`Lead list (${cur.leads.length})`}>
        <DataTable key={tableKey} columns={columns} rows={cur.leads} initialFilters={initial} onRowClick={(r) => nav(`/leads/${r.id}`)}
          searchText={(r) => `${r.id} ${r.name} ${r.company} ${r.email} ${r.phone}`} searchPlaceholder="Search name, company, email, ID…" defaultSort={{ key: 'createdAt', dir: 'desc' }}
          filters={[
            { key: 'status', label: 'Statuses', options: LEAD_STATUSES, get: (r) => r.status },
            { key: 'source', label: 'Sources', options: LEAD_SOURCES, get: (r) => r.source },
            { key: 'service', label: 'Services', options: SERVICE_NAMES, get: (r) => r.service },
          ]}
          exportName="leads" exportColumns={leadColumns()} />
      </Card>
    </>
  );
}
