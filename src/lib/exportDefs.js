import { employeeName } from './aggregate.js';
import { effectiveOrderStatus } from './aggregate.js';
import { toDay } from './dates.js';

const money = (n) => Math.round(n || 0);

export const leadColumns = () => [
  ['Lead ID', (r) => r.id], ['Name', (r) => r.name], ['Company', (r) => r.company], ['Email', (r) => r.email], ['Phone', (r) => r.phone],
  ['Source', (r) => r.source], ['Service', (r) => r.service], ['Status', (r) => r.status],
  ['Assigned To', (r) => employeeName(r.assignedTo)], ['Created', (r) => toDay(r.createdAt)],
];

export const quotationColumns = ({ leadById }) => [
  ['Quotation ID', (r) => r.id], ['Lead ID', (r) => r.leadId], ['Lead', (r) => leadById[r.leadId]?.name || ''],
  ['Service', (r) => r.service], ['Amount (INR)', (r) => money(r.amount)], ['Created', (r) => toDay(r.createdAt)],
  ['Status', (r) => r.status], ['Related Deal', (r) => r.dealId || ''], ['Created By', (r) => employeeName(r.createdBy)],
];

export const dealColumns = ({ leadById }) => [
  ['Deal ID', (r) => r.id], ['Title', (r) => r.title], ['Lead ID', (r) => r.leadId], ['Lead', (r) => leadById[r.leadId]?.name || ''],
  ['Service', (r) => r.service], ['Value (INR)', (r) => money(r.value)], ['Priority', (r) => r.priority], ['Stage', (r) => r.stage],
  ['Owner', (r) => employeeName(r.ownerId)], ['Created', (r) => toDay(r.createdAt)], ['Expected Close', (r) => r.expectedCloseDate],
  ['Quotation', (r) => r.quotationId || ''],
];

export const orderColumns = ({ leadById }) => [
  ['Order ID', (r) => r.id], ['Title', (r) => r.title], ['Deal ID', (r) => r.dealId], ['Lead ID', (r) => r.leadId],
  ['Lead', (r) => leadById[r.leadId]?.name || ''], ['Service', (r) => r.service], ['Value (INR)', (r) => money(r.value)],
  ['Status', (r) => effectiveOrderStatus(r)], ['Progress %', (r) => r.progress], ['Assigned To', (r) => employeeName(r.assignedTo)],
  ['Created', (r) => toDay(r.createdAt)], ['Due Date', (r) => r.dueDate],
];

export const paymentColumns = ({ orderById }) => [
  ['Payment ID', (r) => r.id], ['Order ID', (r) => r.orderId], ['Deal ID', (r) => r.dealId],
  ['Service', (r) => orderById[r.orderId]?.service || ''], ['Amount (INR)', (r) => money(r.amount)], ['Payment Date', (r) => r.paymentDate],
  ['Method', (r) => r.method], ['Status', (r) => r.status], ['Installment', (r) => r.installment], ['Transaction Ref', (r) => r.reference],
];

export const activityColumns = () => [
  ['Activity ID', (r) => r.id], ['Timestamp', (r) => r.at], ['Employee', (r) => employeeName(r.employeeId)],
  ['Action', (r) => r.action], ['Record Type', (r) => r.recordType], ['Record ID', (r) => r.recordId], ['Detail', (r) => r.detail],
];

// A flat "metric / current / previous / change" report of the currently filtered dashboard.
export function reportRows({ summary: s, prevSummary: p, filters }) {
  const rows = [];
  const add = (section, metric, cur, prev) => {
    const change = prev ? (((cur - prev) / Math.abs(prev)) * 100).toFixed(1) : cur ? 'n/a (no previous data)' : '0.0';
    rows.push({ section, metric, cur: Math.round(cur * 100) / 100, prev: Math.round(prev * 100) / 100, change });
  };
  add('Leads', 'New leads', s.leads.total, p.leads.total);
  add('Leads', 'Qualified leads', s.leads.qualified, p.leads.qualified);
  add('Leads', 'Converted leads', s.leads.converted, p.leads.converted);
  add('Leads', 'Unqualified leads', s.leads.unqualified, p.leads.unqualified);
  add('Leads', 'Lead conversion rate (%)', s.leads.conversionRate, p.leads.conversionRate);
  add('Quotations', 'Quotations created', s.quotes.total, p.quotes.total);
  add('Quotations', 'Quoted value (INR)', s.quotes.value, p.quotes.value);
  add('Quotations', 'Accepted', s.quotes.accepted, p.quotes.accepted);
  add('Quotations', 'Pending', s.quotes.pending, p.quotes.pending);
  add('Quotations', 'Rejected', s.quotes.rejected, p.quotes.rejected);
  add('Quotations', 'Quote-to-deal rate (%)', s.quotes.toDealRate, p.quotes.toDealRate);
  add('Deals', 'Deals created', s.deals.total, p.deals.total);
  add('Deals', 'Won deals', s.deals.won, p.deals.won);
  add('Deals', 'Lost deals', s.deals.lost, p.deals.lost);
  add('Deals', 'Total deal value (INR)', s.deals.value, p.deals.value);
  add('Revenue', 'Order value billed (INR)', s.revenue.billed, p.revenue.billed);
  add('Revenue', 'Revenue collected (INR)', s.revenue.collected, p.revenue.collected);
  add('Revenue', 'Outstanding at period end (INR)', s.revenue.outstanding, p.revenue.outstanding);
  add('Orders', 'Orders created', s.orders.total, p.orders.total);
  add('Orders', 'Completed', s.orders.completed, p.orders.completed);
  add('Orders', 'In progress', s.orders.inProgress, p.orders.inProgress);
  add('Orders', 'Overdue', s.orders.overdue, p.orders.overdue);
  add('Payments', 'Payment records', s.payments.count, p.payments.count);
  add('Payments', 'Collection rate (%)', s.payments.collectionRate, p.payments.collectionRate);
  const meta = [
    { section: 'Report', metric: 'Period', cur: `${filters.range.start} to ${filters.range.end}`, prev: `${filters.prevRange.start} to ${filters.prevRange.end}`, change: '' },
    { section: 'Report', metric: 'User filter', cur: filters.userId === 'all' ? 'All users' : employeeName(filters.userId), prev: '', change: '' },
    { section: 'Report', metric: 'Department filter', cur: filters.department === 'all' ? 'All departments' : filters.department, prev: '', change: '' },
  ];
  return [...meta, ...rows];
}

export const reportColumns = () => [
  ['Section', (r) => r.section], ['Metric', (r) => r.metric], ['Selected period', (r) => r.cur],
  ['Previous period', (r) => r.prev], ['Change %', (r) => r.change],
];
