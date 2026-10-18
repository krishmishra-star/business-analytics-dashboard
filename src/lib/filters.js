import { EMPLOYEE_BY_ID } from '../data/constants.js';
import { inRange, toDay } from './dates.js';

// people = { userId: 'all' | 'E01', department: 'all' | 'Sales' ... }
export function matchesPeople(involved, people) {
  if (!people) return true;
  const { userId, department } = people;
  if (userId && userId !== 'all') {
    if (!involved.includes(userId)) return false;
    if (department && department !== 'all' && EMPLOYEE_BY_ID[userId]?.department !== department) return false;
    return true;
  }
  if (department && department !== 'all') return involved.some((id) => EMPLOYEE_BY_ID[id]?.department === department);
  return true;
}

export function scopeFor(data, range, people) {
  const ok = (r) => matchesPeople(r.involved, people);
  return {
    range,
    leads: data.leads.filter((r) => ok(r) && inRange(toDay(r.createdAt), range)),
    quotations: data.quotations.filter((r) => ok(r) && inRange(toDay(r.createdAt), range)),
    deals: data.deals.filter((r) => ok(r) && inRange(toDay(r.createdAt), range)),
    orders: data.orders.filter((r) => ok(r) && inRange(toDay(r.createdAt), range)),
    payments: data.payments.filter((r) => ok(r) && inRange(r.paymentDate, range)),
    activities: data.activities.filter((r) => ok(r) && inRange(toDay(r.at), range)),
  };
}
