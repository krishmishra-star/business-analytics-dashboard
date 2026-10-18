import {
  REF_DATE, DATA_START, SERVICES, LEAD_SOURCES, EMPLOYEES, DATA_VERSION,
} from './constants.js';
import { addDays, diffDays, minDay } from '../lib/dates.js';

// ---------- deterministic random helpers ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ['Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Rohan', 'Karan', 'Siddharth', 'Manish', 'Ankit', 'Vikram', 'Neha', 'Pooja', 'Ritu', 'Kavya', 'Isha', 'Anjali', 'Divya', 'Shreya', 'Nikhil', 'Deepak', 'Farhan', 'Imran', 'Sana', 'Zoya', 'Harpreet', 'Gurpreet', 'Meenal', 'Tushar', 'Varun', 'Pallavi', 'Rajat', 'Swati', 'Yash', 'Mohit', 'Sakshi', 'Ayesha'];
const LAST = ['Sharma', 'Verma', 'Gupta', 'Mehta', 'Patel', 'Shah', 'Iyer', 'Nair', 'Reddy', 'Khan', 'Singh', 'Joshi', 'Kulkarni', 'Desai', 'Bansal', 'Agarwal', 'Chopra', 'Malhotra', 'Sinha', 'Bose', 'Pillai', 'Menon', 'Kapoor', 'Saxena', 'Tiwari', 'Dubey'];
const BIZ_A = ['Bright', 'Urban', 'Nova', 'Zen', 'Craft', 'Blue', 'Swift', 'Green', 'Peak', 'Orbit', 'Lotus', 'Prime', 'Kite', 'Maple', 'Pixel', 'Spice', 'Terra', 'Union', 'Vista', 'Wave'];
const BIZ_B = ['Works', 'Labs', 'Foods', 'Studio', 'Traders', 'Logistics', 'Tech', 'Ventures', 'Retail', 'Designs', 'Solutions', 'Mart', 'Cafe', 'Exports', 'Media', 'Wellness'];

const ORDER_TITLES = {
  pvt: ['Incorporation filing', 'MOA/AOA drafting & DIN'],
  llp: ['LLP agreement & filing', 'LLPIN & PAN/TAN'],
  gst: ['GST application & ARN', 'GSTIN activation'],
  tm: ['Trademark search & filing', 'Objection handling'],
  startup: ['DPIIT application', 'Recognition certificate'],
  iso: ['Gap analysis & documentation', 'Audit & certification'],
  compliance: ['Annual return filing', 'Books & ROC compliance'],
  other: ['Service execution', 'Follow-up documentation'],
};

export function generateSeed() {
  const rand = mulberry32(20261017);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const int = (a, b) => a + Math.floor(rand() * (b - a + 1));
  const chance = (p) => rand() < p;
  const weighted = (entries) => {
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let r = rand() * total;
    for (const [v, w] of entries) {
      r -= w;
      if (r <= 0) return v;
    }
    return entries[entries.length - 1][0];
  };
  const round50 = (n) => Math.round(n / 50) * 50;
  const clampDay = (d) => minDay(d, REF_DATE);
  const stamp = (day, h0 = 9, h1 = 18) =>
    `${day}T${String(int(h0, h1)).padStart(2, '0')}:${String(int(0, 59)).padStart(2, '0')}:${String(int(0, 59)).padStart(2, '0')}`;

  const sales = EMPLOYEES.filter((e) => e.department === 'Sales');
  const ops = EMPLOYEES.filter((e) => e.department === 'Operations');
  const accountsEmp = EMPLOYEES.find((e) => e.department === 'Accounts');
  const salesWeights = [['E01', 26], ['E02', 22], ['E03', 18], ['E04', 20], ['E05', 14]];

  const totalDays = diffDays(DATA_START, REF_DATE);

  // ---------- leads ----------
  const leads = [];
  const LEAD_COUNT = 172;
  for (let i = 0; i < LEAD_COUNT; i++) {
    let age;
    if (i === 0 || i === 1 || i === 2) age = 0; // guarantees activity "today"
    else if (i === 3 || i === 4) age = 1;
    else if (i === 5) age = 2;
    else age = Math.floor(totalDays * Math.pow(rand(), 1.35));
    const day = addDays(REF_DATE, -age);

    let status;
    if (chance(0.28)) status = 'Unqualified';
    else if (age < 6) status = weighted([['New', 50], ['Contacted', 35], ['Qualified', 15]]);
    else status = weighted([['New', 9], ['Contacted', 20], ['Qualified', 38], ['Converted', 33]]);
    if (age < 6 && status === 'Unqualified' && chance(0.5)) status = 'Contacted';

    const service = weighted([
      [SERVICES[0].name, 22], [SERVICES[1].name, 12], [SERVICES[2].name, 18], [SERVICES[3].name, 14],
      [SERVICES[4].name, 8], [SERVICES[5].name, 9], [SERVICES[6].name, 11], [SERVICES[7].name, 6],
    ]);
    const first = pick(FIRST);
    const last = pick(LAST);
    const company = `${pick(BIZ_A)} ${pick(BIZ_B)}`;
    leads.push({
      id: `L-${1001 + i}`,
      name: `${first} ${last}`,
      company,
      email: `${first}.${last}@${company.toLowerCase().replace(/\s+/g, '')}.in`.toLowerCase(),
      phone: `+91 ${int(70, 99)}${int(10000000, 99999999)}`,
      source: weighted([['Google Ads', 38], ['Website', 28], ['Referral', 16], ['Direct', 12], ['Other', 6]]),
      service,
      status,
      assignedTo: weighted(salesWeights),
      createdAt: stamp(day),
      notes: pick([
        'Asked for a callback after 4 PM.', 'Wants a fixed-price package.', 'Compared pricing with two other firms.',
        'Referred by an existing client.', 'Needs the work done within two weeks.', 'First-time founder, needs guidance.',
        'Already has documents ready.', 'Prefers WhatsApp over calls.',
      ]),
    });
  }
  leads.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  // re-number ids so older leads have smaller ids
  leads.forEach((l, i) => { l.id = `L-${1001 + i}`; });

  // ---------- quotations ----------
  const quotations = [];
  let qSeq = 5001;
  const makeQuote = (lead, service, offsetDays) => {
    const svc = SERVICES.find((s) => s.name === service);
    const day = clampDay(addDays(lead.createdAt.slice(0, 10), offsetDays));
    const q = {
      id: `Q-${qSeq++}`,
      leadId: lead.id,
      service,
      amount: round50(svc.min + rand() * (svc.max - svc.min)),
      createdAt: stamp(day),
      createdBy: lead.assignedTo,
      status: 'Pending',
      dealId: null,
    };
    quotations.push(q);
    return q;
  };

  const quotesByLead = {};
  for (const lead of leads) {
    let count = 0;
    if (lead.status === 'Contacted') count = chance(0.7) ? 1 : 0;
    else if (lead.status === 'Qualified') count = chance(0.65) ? 1 : 2;
    else if (lead.status === 'Converted') count = weighted([[1, 55], [2, 33], [3, 12]]);
    else if (lead.status === 'Unqualified') count = chance(0.12) ? 1 : 0;
    quotesByLead[lead.id] = [];
    for (let k = 0; k < count; k++) {
      const service = k === 0 ? lead.service : pick(SERVICES.filter((s) => s.name !== lead.service)).name;
      quotesByLead[lead.id].push(makeQuote(lead, service, k === 0 ? int(1, 5) : int(3, 12)));
    }
  }

  // ---------- deals ----------
  const deals = [];
  let dSeq = 2001;
  const stageOrder = ['New', 'Contacted', 'Proposal', 'Negotiation'];

  const makeDeal = (lead, quote, stage, priorityHint) => {
    const created = clampDay(addDays(quote.createdAt.slice(0, 10), int(0, 3)));
    const closed = stage === 'Won' || stage === 'Lost' ? clampDay(addDays(created, int(3, 22))) : null;
    const value = quote.amount;
    const id = `D-${dSeq++}`;
    const priority = priorityHint || weighted(value > 15000 ? [['High', 60], ['Medium', 32], ['Low', 8]] : [['High', 32], ['Medium', 44], ['Low', 24]]);

    // stage history walk
    const createdStamp = stamp(created);
    const history = [{ stage: 'New', at: createdStamp }];
    const finalIdx = stage === 'Won' || stage === 'Lost' ? 3 : stageOrder.indexOf(stage);
    const endDay = closed || REF_DATE;
    const span = Math.max(1, diffDays(created, endDay));
    for (let s = 1; s <= finalIdx; s++) {
      const d = clampDay(addDays(created, Math.max(1, Math.round((span * s) / (finalIdx + 1)))));
      history.push({ stage: stageOrder[s], at: stamp(minDay(d, endDay)) });
    }
    if (stage === 'Won' || stage === 'Lost') history.push({ stage, at: stamp(closed) });

    const deal = {
      id,
      title: `${SERVICES.find((s) => s.name === quote.service).short} – ${lead.company}`,
      leadId: lead.id,
      service: quote.service,
      value,
      priority,
      stage,
      ownerId: lead.assignedTo,
      createdAt: createdStamp,
      expectedCloseDate: addDays(created, int(10, 30)),
      closedAt: closed,
      quotationId: quote.id,
      stageHistory: history,
    };
    quote.dealId = id;
    quote.status = stage === 'Won' ? 'Accepted' : stage === 'Lost' ? 'Rejected' : 'Pending';
    deals.push(deal);
    return deal;
  };

  for (const lead of leads) {
    const quotes = quotesByLead[lead.id];
    if (!quotes.length) continue;
    if (lead.status === 'Converted') {
      makeDeal(lead, quotes[0], 'Won');
      if (quotes[1]) {
        const stage = weighted([['Won', 35], ['Negotiation', 25], ['Proposal', 15], ['Lost', 25]]);
        makeDeal(lead, quotes[1], stage);
      }
      for (const extra of quotes.slice(2)) if (!extra.dealId) extra.status = chance(0.5) ? 'Rejected' : 'Pending';
    } else if (lead.status === 'Qualified') {
      if (chance(0.85)) {
        const stage = weighted([['New', 12], ['Contacted', 16], ['Proposal', 26], ['Negotiation', 22], ['Lost', 24]]);
        makeDeal(lead, quotes[0], stage);
      }
      for (const q of quotes) if (!q.dealId && chance(0.3)) q.status = 'Rejected';
    } else {
      for (const q of quotes) if (!q.dealId && chance(0.25)) q.status = 'Rejected';
    }
  }
  deals.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const dealRemap = {};
  deals.forEach((d, i) => { dealRemap[d.id] = `D-${2001 + i}`; });
  deals.forEach((d) => { d.id = dealRemap[d.id]; });
  quotations.forEach((q) => { if (q.dealId) q.dealId = dealRemap[q.dealId]; });
  quotations.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const qRemap = {};
  quotations.forEach((q, i) => { qRemap[q.id] = `Q-${5001 + i}`; });
  quotations.forEach((q) => { q.id = qRemap[q.id]; });
  deals.forEach((d) => { d.quotationId = qRemap[d.quotationId]; });

  // quotation status history
  const dealById = Object.fromEntries(deals.map((d) => [d.id, d]));
  quotations.forEach((q) => {
    q.statusHistory = [{ status: 'Pending', at: q.createdAt, note: 'Quotation sent to lead' }];
    if (q.status !== 'Pending') {
      const deal = q.dealId ? dealById[q.dealId] : null;
      const at = deal?.closedAt ? stamp(deal.closedAt) : stamp(clampDay(addDays(q.createdAt.slice(0, 10), int(2, 9))));
      q.statusHistory.push({ status: q.status, at, note: q.status === 'Accepted' ? 'Lead accepted the quotation' : 'Lead declined the quotation' });
    }
  });

  // ---------- orders ----------
  const orders = [];
  let oSeq = 3001;
  const wonDeals = deals.filter((d) => d.stage === 'Won');
  for (const deal of wonDeals) {
    const lead = leads.find((l) => l.id === deal.leadId);
    const svc = SERVICES.find((s) => s.name === deal.service);
    const n = chance(0.35) ? 2 : 1;
    const first = n === 2 ? round50(deal.value * 0.6) : deal.value;
    const values = n === 2 ? [first, deal.value - first] : [first];
    values.forEach((value, k) => {
      const created = clampDay(addDays(deal.closedAt, int(0, 4) + k * 2));
      const due = addDays(created, int(8, 34));
      const age = diffDays(created, REF_DATE);
      let status;
      if (chance(Math.min(0.6, age / 80))) status = 'Completed';
      else status = weighted(age < 10 ? [['Pending', 45], ['In Progress', 45], ['On Hold', 10]] : [['Pending', 12], ['In Progress', 66], ['On Hold', 22]]);
      let progress = 0;
      if (status === 'Completed') progress = 100;
      else if (status === 'In Progress') progress = Math.round(int(20, 90) / 5) * 5;
      else if (status === 'On Hold') progress = Math.round(int(20, 60) / 5) * 5;
      else progress = chance(0.5) ? 0 : 5;
      const completedAt = status === 'Completed' ? clampDay(addDays(created, int(3, Math.max(4, Math.min(30, age))))) : null;
      orders.push({
        id: `O-${oSeq++}`,
        dealId: deal.id,
        leadId: lead.id,
        title: `${ORDER_TITLES[svc.key][k]}`,
        service: deal.service,
        value,
        status,
        progress,
        assignedTo: pick(ops).id,
        dealOwnerId: deal.ownerId,
        createdAt: stamp(created),
        dueDate: due,
        completedAt,
        stageCount: svc.stages,
      });
    });
  }
  orders.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const oRemap = {};
  orders.forEach((o, i) => { oRemap[o.id] = `O-${3001 + i}`; o.id = oRemap[o.id]; });
  const orderById = Object.fromEntries(orders.map((o) => [o.id, o]));

  // ---------- payments ----------
  const payments = [];
  let pSeq = 7001;
  const makeRef = (method, day) => {
    const stampPart = day.replace(/-/g, '').slice(2);
    if (method === 'UPI') return `UPI${stampPart}${int(1000, 9999)}`;
    if (method === 'Bank Transfer') return `NEFT${stampPart}${int(10000, 99999)}`;
    if (method === 'Card') return `CARD${stampPart}${int(1000, 9999)}`;
    if (method === 'Cheque') return `CHQ${int(100000, 999999)}`;
    return `CSH${stampPart}${int(100, 999)}`;
  };
  for (const order of orders) {
    const plan = weighted([[[1], 30], [[0.5, 0.5], 45], [[0.3, 0.4, 0.3], 25]]);
    const oDay = order.createdAt.slice(0, 10);
    let allocated = 0;
    plan.forEach((frac, idx) => {
      const amount = idx === plan.length - 1 ? order.value - allocated : round50(order.value * frac);
      allocated += amount;
      const offset = idx === 0 ? int(0, 2) : idx * int(7, 12);
      const day = addDays(oDay, offset);
      if (day > REF_DATE) return; // future installments are simply not recorded yet
      if (amount <= 0) return;
      const isFinal = idx === plan.length - 1;
      let status;
      if (order.status === 'Completed') status = chance(0.9) ? 'Paid' : weighted([['Pending', 70], ['Failed', 30]]);
      else status = weighted([['Paid', 68], ['Pending', 21], ['Failed', 11]]);
      if (isFinal && order.status !== 'Completed' && order.progress < 60 && plan.length > 1) status = chance(0.6) ? 'Pending' : status;
      const method = weighted([['UPI', 40], ['Bank Transfer', 30], ['Card', 15], ['Cash', 8], ['Cheque', 7]]);
      const receivedBy = chance(0.72) ? accountsEmp.id : order.dealOwnerId;
      payments.push({
        id: `P-${pSeq++}`,
        orderId: order.id,
        dealId: order.dealId,
        amount,
        paymentDate: day,
        method,
        status,
        reference: makeRef(method, day),
        installment: plan.length > 1 ? (idx === 0 ? 'Advance' : isFinal ? 'Final' : 'Milestone') : 'Full payment',
        receivedBy,
        orderAssigneeId: order.assignedTo,
        dealOwnerId: order.dealOwnerId,
      });
    });
  }
  payments.sort((a, b) => a.paymentDate.localeCompare(b.paymentDate));
  payments.forEach((p, i) => { p.id = `P-${7001 + i}`; });

  // ---------- involved ids (used by user/department filters) ----------
  leads.forEach((l) => { l.involved = [l.assignedTo]; });
  quotations.forEach((q) => { q.involved = [q.createdBy]; });
  deals.forEach((d) => { d.involved = [d.ownerId]; });
  orders.forEach((o) => { o.involved = [o.assignedTo, o.dealOwnerId]; });
  payments.forEach((p) => { p.involved = [...new Set([p.receivedBy, p.orderAssigneeId, p.dealOwnerId])]; });

  // ---------- activities ----------
  const activities = [];
  const addAct = (at, employeeId, action, recordType, recordId, detail) => {
    if (at.slice(0, 10) > REF_DATE) return;
    activities.push({ at, employeeId, action, recordType, recordId, detail: detail || '', involved: [employeeId] });
  };
  leads.forEach((l) => {
    addAct(l.createdAt, l.assignedTo, 'Lead created', 'Lead', l.id, `New lead from ${l.source}`);
    if (l.status !== 'New') {
      addAct(stamp(clampDay(addDays(l.createdAt.slice(0, 10), 1))), l.assignedTo, 'Lead updated', 'Lead', l.id, 'Contacted the lead');
    }
    if (l.status === 'Qualified' || l.status === 'Converted') {
      addAct(stamp(clampDay(addDays(l.createdAt.slice(0, 10), 2))), l.assignedTo, 'Lead qualified', 'Lead', l.id, 'Marked as qualified');
    }
    if (l.status === 'Unqualified') {
      addAct(stamp(clampDay(addDays(l.createdAt.slice(0, 10), 2))), l.assignedTo, 'Lead disqualified', 'Lead', l.id, 'Marked as unqualified');
    }
  });
  quotations.forEach((q) => addAct(q.createdAt, q.createdBy, 'Quotation created', 'Quotation', q.id, `${q.service}`));
  deals.forEach((d) => {
    d.stageHistory.forEach((h, i) => {
      addAct(h.at, d.ownerId, i === 0 ? 'Deal created' : 'Deal stage changed', 'Deal', d.id, i === 0 ? d.title : `Moved to ${h.stage}`);
    });
  });
  orders.forEach((o) => {
    addAct(o.createdAt, o.dealOwnerId, 'Order created', 'Order', o.id, o.title);
    if (o.status !== 'Pending') addAct(stamp(clampDay(addDays(o.createdAt.slice(0, 10), 2))), o.assignedTo, 'Order updated', 'Order', o.id, `Progress ${o.progress}%`);
    if (o.status === 'Completed' && o.completedAt) addAct(stamp(o.completedAt), o.assignedTo, 'Order completed', 'Order', o.id, o.title);
  });
  payments.forEach((p) => {
    const at = stamp(p.paymentDate);
    if (p.status === 'Paid') addAct(at, p.receivedBy, 'Payment recorded', 'Payment', p.id, `₹${p.amount.toLocaleString('en-IN')} via ${p.method}`);
    else if (p.status === 'Failed') addAct(at, p.receivedBy, 'Payment failed', 'Payment', p.id, `${p.method} attempt failed`);
    else addAct(at, p.receivedBy, 'Payment requested', 'Payment', p.id, `₹${p.amount.toLocaleString('en-IN')} awaiting`);
  });
  activities.sort((a, b) => b.at.localeCompare(a.at));
  activities.forEach((a, i) => { a.id = `ACT-${String(activities.length - i).padStart(5, '0')}`; });

  return {
    version: DATA_VERSION,
    employees: EMPLOYEES,
    leads,
    quotations,
    deals,
    orders,
    payments,
    activities,
  };
}

export { LEAD_SOURCES };
