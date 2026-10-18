import { formatDateTime } from './dates.js';
import { employeeName } from './aggregate.js';

// Activity entries touching any of the given records, newest first.
export function activitiesFor(data, refs) {
  const keys = new Set(refs.map(([type, id]) => `${type}:${id}`));
  return data.activities.filter((a) => keys.has(`${a.recordType}:${a.recordId}`));
}

export function activityToTimeline(list, limit = 30) {
  return list.slice(0, limit).map((a) => ({
    key: a.id,
    title: `${a.action} · ${a.recordId}`,
    body: a.detail,
    meta: `${employeeName(a.employeeId)} · ${formatDateTime(a.at)}`,
  }));
}

export function paidTotal(payments) {
  return payments.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
}

const STAGE_NAMES = ['Documents collected', 'Application prepared', 'Filed with authority', 'Review & queries', 'Delivered to client'];
export function orderStages(order, doneCount) {
  const n = order.stageCount;
  const names = n >= 5 ? STAGE_NAMES : [...STAGE_NAMES.slice(0, n - 1), STAGE_NAMES[4]];
  return names.map((name, i) => ({
    name,
    state: i < doneCount ? 'done' : i === doneCount && order.status !== 'Completed' && order.status !== 'Pending' ? 'current' : 'todo',
  }));
}
