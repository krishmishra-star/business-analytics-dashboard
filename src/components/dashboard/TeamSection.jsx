import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card.jsx';
import DataTable from '../ui/DataTable.jsx';
import Badge from '../ui/Badge.jsx';
import { EmployeeLink, recordPath } from '../ui/Links.jsx';
import { useScope } from '../../hooks/useScope.js';
import { salesTeamRows, opsTeamRows } from '../../lib/aggregate.js';
import { employeeName } from '../../lib/aggregate.js';
import { formatDateTime } from '../../lib/dates.js';
import { inr, pct } from '../../lib/format.js';
import { ACTIVITY_TYPES, EMPLOYEES } from '../../data/constants.js';
import { activityColumns } from '../../lib/exportDefs.js';
import { Link } from 'react-router-dom';

export function Avatar({ name, size = 28 }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('');
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-semibold text-white" style={{ width: size, height: size, background: `hsl(${hue} 55% 48%)`, fontSize: size * 0.4 }} aria-hidden="true">{initials}</span>
  );
}

const nameCell = (r) => (
  <span className="flex items-center gap-2"><Avatar name={r.name} /><span><EmployeeLink id={r.id}>{r.name}</EmployeeLink><span className="block text-[11px] text-ink-400">{r.role}</span></span></span>
);

export function SalesTeamCard({ pageSize = 6, withExport = false }) {
  const nav = useNavigate();
  const { cur, people } = useScope();
  const rows = salesTeamRows(cur, people);
  const columns = [
    { key: 'name', header: 'Employee', render: nameCell },
    { key: 'leads', header: 'Leads Handled', align: 'right' },
    { key: 'qualified', header: 'Qualified', align: 'right' },
    { key: 'converted', header: 'Converted', align: 'right' },
    { key: 'conversion', header: 'Conv. %', align: 'right', render: (r) => pct(r.conversion) },
    { key: 'quotations', header: 'Quotations', align: 'right' },
    { key: 'deals', header: 'Deals', align: 'right' },
    { key: 'dealValue', header: 'Deal Value', align: 'right', render: (r) => inr(r.dealValue) },
    { key: 'revenue', header: 'Revenue', align: 'right', render: (r) => inr(r.revenue) },
  ];
  const exportColumns = [
    ['Employee', (r) => r.name], ['Leads Handled', (r) => r.leads], ['Qualified', (r) => r.qualified], ['Converted', (r) => r.converted],
    ['Conversion %', (r) => r.conversion.toFixed(1)], ['Quotations', (r) => r.quotations], ['Deals', (r) => r.deals], ['Deal Value (INR)', (r) => r.dealValue], ['Revenue (INR)', (r) => r.revenue],
  ];
  return (
    <Card title="Sales Team Activity" action={<Badge tone="blue">Sales Team</Badge>} subtitle="Click an employee to see their performance">
      <DataTable columns={columns} rows={rows} searchText={(r) => r.name} searchPlaceholder="Search employee…" pageSize={pageSize} defaultSort={{ key: 'revenue', dir: 'desc' }} onRowClick={(r) => nav(`/team/${r.id}`)} compact
        exportName={withExport ? 'sales-team' : undefined} exportColumns={exportColumns} emptyTitle="No sales team members match the current filters" />
    </Card>
  );
}

export function OpsTeamCard({ pageSize = 6, withExport = false }) {
  const nav = useNavigate();
  const { cur, people } = useScope();
  const rows = opsTeamRows(cur, people);
  const columns = [
    { key: 'name', header: 'Employee', render: nameCell },
    { key: 'orders', header: 'Orders Assigned', align: 'right' },
    { key: 'updated', header: 'Orders Updated', align: 'right' },
    { key: 'stagesDone', header: 'Stages Completed', align: 'right' },
    { key: 'pendingStages', header: 'Pending Stages', align: 'right' },
    { key: 'overdue', header: 'Overdue Orders', align: 'right', render: (r) => <span className={r.overdue ? 'font-semibold text-red-600' : ''}>{r.overdue}</span> },
  ];
  const exportColumns = [
    ['Employee', (r) => r.name], ['Orders Assigned', (r) => r.orders], ['Orders Updated', (r) => r.updated], ['Stages Completed', (r) => r.stagesDone],
    ['Pending Stages', (r) => r.pendingStages], ['Overdue Orders', (r) => r.overdue],
  ];
  return (
    <Card title="Operations Team Activity" action={<Badge tone="purple">Operations</Badge>} subtitle="Click an employee to see their performance">
      <DataTable columns={columns} rows={rows} searchText={(r) => r.name} searchPlaceholder="Search employee…" pageSize={pageSize} defaultSort={{ key: 'orders', dir: 'desc' }} onRowClick={(r) => nav(`/team/${r.id}`)} compact
        exportName={withExport ? 'operations-team' : undefined} exportColumns={exportColumns} emptyTitle="No operations team members match the current filters" />
    </Card>
  );
}

// Recent activity feed as a filterable table. `limit` trims rows for the dashboard.
export function ActivityTable({ rows, pageSize = 8, withExport = false, initialFilters }) {
  const nav = useNavigate();
  const columns = [
    { key: 'at', header: 'Time', render: (r) => <span className="text-xs text-ink-500">{formatDateTime(r.at)}</span> },
    { key: 'employee', header: 'Employee', sortValue: (r) => employeeName(r.employeeId), render: (r) => <span className="flex items-center gap-2"><Avatar name={employeeName(r.employeeId)} size={22} /><EmployeeLink id={r.employeeId} /></span> },
    { key: 'action', header: 'Action' },
    { key: 'recordType', header: 'Type', render: (r) => <Badge tone="slate">{r.recordType}</Badge> },
    { key: 'recordId', header: 'Record', render: (r) => <Link to={recordPath(r.recordType, r.recordId)} className="font-medium text-brand-600 hover:underline" onClick={(e) => e.stopPropagation()}>{r.recordId}</Link> },
    { key: 'detail', header: 'Detail', sortable: false, render: (r) => <span className="text-xs text-ink-500">{r.detail}</span> },
  ];
  return (
    <DataTable columns={columns} rows={rows} pageSize={pageSize} defaultSort={{ key: 'at', dir: 'desc' }} compact
      searchText={(r) => `${r.action} ${r.recordId} ${r.detail} ${employeeName(r.employeeId)}`} searchPlaceholder="Search activity…"
      initialFilters={initialFilters}
      filters={[
        { key: 'type', label: 'Types', options: ACTIVITY_TYPES, get: (r) => r.recordType },
        { key: 'emp', label: 'Employees', options: EMPLOYEES.map((e) => e.name), get: (r) => employeeName(r.employeeId) },
      ]}
      onRowClick={(r) => nav(recordPath(r.recordType, r.recordId))}
      exportName={withExport ? 'activity' : undefined} exportColumns={activityColumns()} />
  );
}

export function RecentActivityCard({ withExport = false, pageSize = 8 }) {
  const { cur } = useScope();
  return (
    <Card title="Recent CRM Activity" subtitle="Latest actions in the selected period · click a row to open the record">
      <ActivityTable rows={cur.activities} withExport={withExport} pageSize={pageSize} />
    </Card>
  );
}
