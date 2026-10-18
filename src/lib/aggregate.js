import {
  REF_DATE, SERVICES, LEAD_SOURCES, LEAD_STATUSES, DEAL_STAGES, PRIORITIES,
  ORDER_EFFECTIVE_STATUSES, PAYMENT_METHODS, EMPLOYEES, EMPLOYEE_BY_ID, MONTHLY_TARGET, SERVICE_BY_NAME,
} from '../data/constants.js';
import { eachDay, diffDays, toDay, formatShortDay } from './dates.js';
import { matchesPeople } from './filters.js';
import { safePct } from './format.js';

export const sum = (arr, f) => arr.reduce((s, x) => s + (f ? f(x) : x), 0);

export const isQualified = (l) => l.status === 'Qualified' || l.status === 'Converted';

// Order status as seen "today": overdue orders are those past their due date that are not completed or on hold.
export function effectiveOrderStatus(o) {
  if (o.status === 'Completed') return 'Completed';
  if (o.status === 'On Hold') return 'On Hold';
  if (o.dueDate < REF_DATE) return 'Overdue';
  return o.status;
}

export const stagesDone = (o) => Math.floor((o.progress / 100) * o.stageCount + 1e-9);

function paidByOrder(payments, asOfDay) {
  const m = {};
  for (const p of payments) {
    if (p.status === 'Paid' && p.paymentDate <= asOfDay) m[p.orderId] = (m[p.orderId] || 0) + p.amount;
  }
  return m;
}

// Total still owed on orders created up to the end of the period.
export function outstandingOrders(data, people, range) {
  const paid = paidByOrder(data.payments, range.end);
  return data.orders
    .filter((o) => matchesPeople(o.involved, people) && toDay(o.createdAt) <= range.end)
    .map((o) => ({ order: o, paid: paid[o.id] || 0, outstanding: Math.max(0, o.value - (paid[o.id] || 0)) }))
    .filter((r) => r.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding);
}

// ---------- headline numbers for one period ----------
export function summarize(data, scope, people) {
  const { leads, quotations, deals, orders, payments, range } = scope;

  const qualified = leads.filter(isQualified).length;
  const converted = leads.filter((l) => l.status === 'Converted').length;
  const unqualified = leads.filter((l) => l.status === 'Unqualified').length;

  const quotedValue = sum(quotations, (q) => q.amount);
  const withDeal = quotations.filter((q) => q.dealId).length;

  const won = deals.filter((d) => d.stage === 'Won');
  const lost = deals.filter((d) => d.stage === 'Lost');

  const billed = sum(orders, (o) => o.value);
  const paidPays = payments.filter((p) => p.status === 'Paid');
  const collected = sum(paidPays, (p) => p.amount);
  const outstandingList = outstandingOrders(data, people, range);
  const outstanding = sum(outstandingList, (r) => r.outstanding);

  const eff = orders.map(effectiveOrderStatus);
  const pendingAmt = sum(payments.filter((p) => p.status === 'Pending'), (p) => p.amount);
  const failedAmt = sum(payments.filter((p) => p.status === 'Failed'), (p) => p.amount);

  return {
    leads: {
      total: leads.length, qualified, converted, unqualified,
      conversionRate: safePct(converted, leads.length),
      qualifiedPct: safePct(qualified, leads.length),
      convertedPct: safePct(converted, leads.length),
      unqualifiedPct: safePct(unqualified, leads.length),
    },
    quotes: {
      total: quotations.length, value: quotedValue,
      accepted: quotations.filter((q) => q.status === 'Accepted').length,
      pending: quotations.filter((q) => q.status === 'Pending').length,
      rejected: quotations.filter((q) => q.status === 'Rejected').length,
      withDeal, toDealRate: safePct(withDeal, quotations.length),
    },
    deals: {
      total: deals.length, won: won.length, lost: lost.length,
      open: deals.length - won.length - lost.length,
      value: sum(deals, (d) => d.value), wonValue: sum(won, (d) => d.value),
    },
    revenue: {
      billed, collected, outstanding,
      collectedPct: safePct(collected, billed),
      target: MONTHLY_TARGET * (diffDays(range.start, range.end) + 1) / 30,
    },
    orders: {
      total: orders.length,
      completed: eff.filter((s) => s === 'Completed').length,
      inProgress: eff.filter((s) => s === 'In Progress').length,
      pending: eff.filter((s) => s === 'Pending').length,
      onHold: eff.filter((s) => s === 'On Hold').length,
      overdue: eff.filter((s) => s === 'Overdue').length,
    },
    payments: {
      count: payments.length, paidCount: paidPays.length,
      paidAmount: collected, pendingAmount: pendingAmt, failedAmount: failedAmt,
      totalAmount: collected + pendingAmt + failedAmt,
      collectionRate: safePct(collected, collected + pendingAmt + failedAmt),
    },
    invoices: payments.length,
  };
}

// ---------- daily series ----------
const dayLabel = (d) => formatShortDay(d);

export function dailyLeadTrend(leads, range) {
  const days = eachDay(range.start, range.end);
  const map = Object.fromEntries(days.map((d) => [d, { date: d, label: dayLabel(d), newLeads: 0, qualified: 0, converted: 0 }]));
  for (const l of leads) {
    const row = map[toDay(l.createdAt)];
    if (!row) continue;
    row.newLeads += 1;
    if (isQualified(l)) row.qualified += 1;
    if (l.status === 'Converted') row.converted += 1;
  }
  return days.map((d) => map[d]);
}

export function dailyRevenue(scope) {
  const days = eachDay(scope.range.start, scope.range.end);
  const map = Object.fromEntries(days.map((d) => [d, { date: d, label: dayLabel(d), revenue: 0, collected: 0 }]));
  for (const o of scope.orders) if (map[toDay(o.createdAt)]) map[toDay(o.createdAt)].revenue += o.value;
  for (const p of scope.payments) if (p.status === 'Paid' && map[p.paymentDate]) map[p.paymentDate].collected += p.amount;
  return days.map((d) => map[d]);
}

export function dailyPayments(scope) {
  const days = eachDay(scope.range.start, scope.range.end);
  const map = Object.fromEntries(days.map((d) => [d, { date: d, label: dayLabel(d), paid: 0, pending: 0, failed: 0 }]));
  for (const p of scope.payments) {
    const row = map[p.paymentDate];
    if (!row) continue;
    if (p.status === 'Paid') row.paid += p.amount;
    else if (p.status === 'Pending') row.pending += p.amount;
    else row.failed += p.amount;
  }
  return days.map((d) => map[d]);
}

// tiny series for KPI sparklines
export function sparkSeries(items, getDay, range, valueFn = () => 1) {
  const days = eachDay(range.start, range.end);
  const m = Object.fromEntries(days.map((d) => [d, 0]));
  for (const it of items) {
    const d = getDay(it);
    if (d in m) m[d] += valueFn(it);
  }
  return days.map((d) => ({ v: m[d] }));
}

// ---------- breakdowns ----------
export function leadSources(leads) {
  const total = leads.length;
  return LEAD_SOURCES.map((source) => {
    const count = leads.filter((l) => l.source === source).length;
    return { name: source, value: count, pct: safePct(count, total) };
  });
}

export function leadStatusDistribution(leads) {
  const total = leads.length;
  return LEAD_STATUSES.map((s) => {
    const count = leads.filter((l) => l.status === s).length;
    return { name: s, value: count, pct: safePct(count, total) };
  });
}

export function quotesByService(quotations) {
  return SERVICES.map((svc) => {
    const qs = quotations.filter((q) => q.service === svc.name);
    const accepted = qs.filter((q) => q.status === 'Accepted').length;
    const pending = qs.filter((q) => q.status === 'Pending').length;
    const rejected = qs.filter((q) => q.status === 'Rejected').length;
    const deals = qs.filter((q) => q.dealId).length;
    return {
      service: svc.name, short: svc.short, count: qs.length, value: sum(qs, (q) => q.amount),
      accepted, pending, rejected, deals, convRate: safePct(deals, qs.length),
    };
  });
}

export function quoteStatusDistribution(quotations) {
  return ['Accepted', 'Pending', 'Rejected'].map((s) => ({ name: s, value: quotations.filter((q) => q.status === s).length }));
}

export function dealsByService(deals) {
  return SERVICES.map((svc) => {
    const ds = deals.filter((d) => d.service === svc.name);
    return {
      service: svc.name, short: svc.short, created: ds.length,
      value: sum(ds, (d) => d.value),
      wonValue: sum(ds.filter((d) => d.stage === 'Won'), (d) => d.value),
    };
  });
}

export function revenueByService(orders) {
  const total = sum(orders, (o) => o.value);
  return SERVICES.map((svc) => {
    const os = orders.filter((o) => o.service === svc.name);
    const value = sum(os, (o) => o.value);
    return { service: svc.name, short: svc.short, value, count: os.length, pct: safePct(value, total) };
  }).sort((a, b) => b.value - a.value);
}

export function priorityBreakdown(deals) {
  const totalValue = sum(deals, (d) => d.value);
  return PRIORITIES.map((p) => {
    const ds = deals.filter((d) => d.priority === p);
    const value = sum(ds, (d) => d.value);
    return { priority: p, deals: ds.length, value, pct: safePct(value, totalValue) };
  });
}

export function dealsByStage(deals) {
  return DEAL_STAGES.map((stage) => {
    const ds = deals.filter((d) => d.stage === stage);
    return { stage, count: ds.length, value: sum(ds, (d) => d.value) };
  });
}

export function orderStatusDistribution(orders) {
  return ORDER_EFFECTIVE_STATUSES.map((s) => ({ name: s, value: orders.filter((o) => effectiveOrderStatus(o) === s).length }));
}

export function orderProgressByService(orders) {
  return SERVICES.map((svc) => {
    const os = orders.filter((o) => o.service === svc.name);
    const row = { service: svc.name, short: svc.short, total: os.length };
    ORDER_EFFECTIVE_STATUSES.forEach((s) => { row[s] = os.filter((o) => effectiveOrderStatus(o) === s).length; });
    row.avgProgress = os.length ? Math.round(sum(os, (o) => o.progress) / os.length) : 0;
    row.completedCount = row.Completed;
    row.pendingCount = os.length - row.Completed;
    return row;
  }).filter((r) => r.total > 0);
}

export function paymentMethodDistribution(payments) {
  const paid = payments.filter((p) => p.status === 'Paid');
  const total = sum(paid, (p) => p.amount);
  return PAYMENT_METHODS.map((m) => {
    const ps = paid.filter((p) => p.method === m);
    const amount = sum(ps, (p) => p.amount);
    return { name: m, value: amount, count: ps.length, pct: safePct(amount, total) };
  });
}

// ---------- team ----------
export function visibleEmployees(people, departments) {
  return EMPLOYEES.filter((e) => departments.includes(e.department))
    .filter((e) => (people.userId && people.userId !== 'all' ? e.id === people.userId : true))
    .filter((e) => (people.department && people.department !== 'all' ? e.department === people.department : true));
}

export function salesTeamRows(scope, people) {
  return visibleEmployees(people, ['Sales']).map((e) => {
    const leads = scope.leads.filter((l) => l.assignedTo === e.id);
    const converted = leads.filter((l) => l.status === 'Converted').length;
    const deals = scope.deals.filter((d) => d.ownerId === e.id);
    const revenue = sum(scope.payments.filter((p) => p.status === 'Paid' && p.dealOwnerId === e.id), (p) => p.amount);
    return {
      id: e.id, name: e.name, department: e.department, role: e.role,
      leads: leads.length, qualified: leads.filter(isQualified).length, converted,
      conversion: safePct(converted, leads.length),
      quotations: scope.quotations.filter((q) => q.createdBy === e.id).length,
      deals: deals.length, dealValue: sum(deals, (d) => d.value), revenue,
    };
  });
}

export function opsTeamRows(scope, people) {
  return visibleEmployees(people, ['Operations']).map((e) => {
    const orders = scope.orders.filter((o) => o.assignedTo === e.id);
    const updated = scope.activities.filter((a) => a.employeeId === e.id && a.recordType === 'Order' && a.action !== 'Order created').length;
    const done = sum(orders, stagesDone);
    const totalStages = sum(orders, (o) => o.stageCount);
    return {
      id: e.id, name: e.name, department: e.department, role: e.role,
      orders: orders.length, updated, stagesDone: done, pendingStages: totalStages - done,
      overdue: orders.filter((o) => effectiveOrderStatus(o) === 'Overdue').length,
      value: sum(orders, (o) => o.value),
    };
  });
}

// Orders grouped by service with a stage-status split, for the "Orders & Stage Progress" card
export function stageProgressByService(orders) {
  return orderProgressByService(orders).map((r) => ({
    service: r.service, short: r.short, Pending: r.Pending, 'In Progress': r['In Progress'], Completed: r.Completed, 'On Hold': r['On Hold'], Overdue: r.Overdue, total: r.total,
  })).sort((a, b) => b.total - a.total);
}

export const employeeName = (id) => EMPLOYEE_BY_ID[id]?.name || id || '—';
export { SERVICE_BY_NAME };
