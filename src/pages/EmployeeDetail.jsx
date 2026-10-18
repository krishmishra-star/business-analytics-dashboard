import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import Badge from '../components/ui/Badge.jsx';
import MiniTable from '../components/ui/MiniTable.jsx';
import { Card } from '../components/ui/Card.jsx';
import { DetailHeader, NotFoundRecord, RelatedCard } from '../components/ui/Detail.jsx';
import { LeadLink, DealLink, OrderLink, PaymentLink } from '../components/ui/Links.jsx';
import { Avatar, ActivityTable } from '../components/dashboard/TeamSection.jsx';
import { useData } from '../context/DataContext.jsx';
import { useFilters } from '../context/FilterContext.jsx';
import { scopeFor } from '../lib/filters.js';
import { salesTeamRows, opsTeamRows, effectiveOrderStatus, sum } from '../lib/aggregate.js';
import { formatDay, toDay } from '../lib/dates.js';
import { inr, num, pct } from '../lib/format.js';
import { EMPLOYEE_BY_ID, shortService } from '../data/constants.js';

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-surface-line bg-white p-3">
      <div className="text-xs text-ink-500">{label}</div>
      <div className="mt-0.5 text-xl font-bold tracking-tight text-ink-900">{value}</div>
    </div>
  );
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const emp = EMPLOYEE_BY_ID[id];
  const { data } = useData();
  const { range, presetLabel, days } = useFilters();

  const people = useMemo(() => ({ userId: id, department: 'all' }), [id]);
  const scope = useMemo(() => scopeFor(data, range, people), [data, range, people]);
  if (!emp) return <NotFoundRecord kind="Employee" backTo="/team" backLabel="Back to team" />;

  const isSales = emp.department === 'Sales';
  const isOps = emp.department === 'Operations';
  const sRow = isSales ? salesTeamRows(scope, people)[0] : null;
  const oRow = isOps ? opsTeamRows(scope, people)[0] : null;
  const received = scope.payments.filter((p) => p.receivedBy === id && p.status === 'Paid');

  return (
    <>
      <Breadcrumbs items={[{ label: 'Team Performance', to: '/team' }, { label: emp.name }]} />
      <DetailHeader title={emp.name} subtitle={`${emp.role} · ${emp.department} · ${presetLabel} (${days} day${days === 1 ? '' : 's'}, set in the filters)`} badges={<Avatar name={emp.name} size={32} />} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {sRow && (<>
          <Stat label="Leads handled" value={num(sRow.leads)} /><Stat label="Qualified" value={num(sRow.qualified)} /><Stat label="Converted" value={num(sRow.converted)} /><Stat label="Conversion rate" value={pct(sRow.conversion)} />
          <Stat label="Quotations created" value={num(sRow.quotations)} /><Stat label="Deals created" value={num(sRow.deals)} /><Stat label="Deal value" value={inr(sRow.dealValue)} /><Stat label="Revenue generated" value={inr(sRow.revenue)} />
        </>)}
        {oRow && (<>
          <Stat label="Orders assigned" value={num(oRow.orders)} /><Stat label="Orders updated" value={num(oRow.updated)} /><Stat label="Stages completed" value={num(oRow.stagesDone)} /><Stat label="Pending stages" value={num(oRow.pendingStages)} />
          <Stat label="Overdue orders" value={num(oRow.overdue)} /><Stat label="Order value" value={inr(oRow.value)} />
        </>)}
        {!isSales && !isOps && (<><Stat label="Payments received" value={num(received.length)} /><Stat label="Amount received" value={inr(sum(received, (p) => p.amount))} /></>)}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {isSales && (<>
          <RelatedCard title="Leads in period" count={scope.leads.length}>
            <MiniTable rows={scope.leads.slice(0, 12)} empty="No leads in this period." columns={[
              { key: 'id', header: 'Lead', render: (r) => <LeadLink id={r.id} /> }, { key: 'name', header: 'Name' },
              { key: 'status', header: 'Status', render: (r) => <Badge status={r.status} /> }, { key: 'created', header: 'Created', render: (r) => formatDay(toDay(r.createdAt)) },
            ]} />
          </RelatedCard>
          <RelatedCard title="Deals in period" count={scope.deals.length}>
            <MiniTable rows={scope.deals.slice(0, 12)} empty="No deals in this period." columns={[
              { key: 'id', header: 'Deal', render: (r) => <DealLink id={r.id} /> }, { key: 'service', header: 'Service', render: (r) => shortService(r.service) },
              { key: 'value', header: 'Value', align: 'right', render: (r) => inr(r.value) }, { key: 'stage', header: 'Stage', render: (r) => <Badge status={r.stage} /> },
            ]} />
          </RelatedCard>
        </>)}
        {isOps && (
          <RelatedCard title="Assigned orders in period" count={scope.orders.length}>
            <MiniTable rows={scope.orders.slice(0, 12)} empty="No orders assigned in this period." columns={[
              { key: 'id', header: 'Order', render: (r) => <OrderLink id={r.id} /> }, { key: 'service', header: 'Service', render: (r) => shortService(r.service) },
              { key: 'status', header: 'Status', render: (r) => <Badge status={effectiveOrderStatus(r)} /> }, { key: 'progress', header: 'Progress', align: 'right', render: (r) => `${r.progress}%` },
              { key: 'due', header: 'Due', render: (r) => formatDay(r.dueDate) },
            ]} />
          </RelatedCard>
        )}
        {!isSales && !isOps && (
          <RelatedCard title="Payments received in period" count={received.length}>
            <MiniTable rows={received.slice(0, 12)} empty="No payments received in this period." columns={[
              { key: 'id', header: 'Payment', render: (r) => <PaymentLink id={r.id} /> }, { key: 'amount', header: 'Amount', align: 'right', render: (r) => inr(r.amount) },
              { key: 'date', header: 'Date', render: (r) => formatDay(r.paymentDate) }, { key: 'method', header: 'Method', render: (r) => r.method },
            ]} />
          </RelatedCard>
        )}
        <Card title={`Activity (${scope.activities.length})`} className={isSales ? 'xl:col-span-2' : ''}>
          <ActivityTable rows={scope.activities} pageSize={8} />
        </Card>
      </div>
    </>
  );
}
