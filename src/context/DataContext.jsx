import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { generateSeed } from '../data/seed.js';
import { REF_DATE, DATA_VERSION } from '../data/constants.js';
import { KEYS, loadJSON, saveJSON, removeKey } from '../lib/storage.js';

const DataContext = createContext(null);

const nowStamp = () => `${REF_DATE}T${new Date().toTimeString().slice(0, 8)}`;

function loadInitial() {
  const stored = loadJSON(KEYS.data);
  if (stored && stored.version === DATA_VERSION && stored.leads && stored.deals && stored.orders) return stored;
  return generateSeed();
}

let actSeq = 0;
function addActivity(state, { employeeId, action, recordType, recordId, detail }) {
  actSeq += 1;
  return {
    ...state,
    activities: [
      { id: `ACT-N${Date.now()}${actSeq}`, at: nowStamp(), employeeId, action, recordType, recordId, detail: detail || '', involved: [employeeId] },
      ...state.activities,
    ],
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'RESET':
      return generateSeed();

    case 'DEAL_STAGE': {
      const { id, stage } = action;
      const deal = state.deals.find((d) => d.id === id);
      if (!deal || deal.stage === stage) return state;
      const at = nowStamp();
      const closed = stage === 'Won' || stage === 'Lost';
      const deals = state.deals.map((d) =>
        d.id === id ? { ...d, stage, closedAt: closed ? REF_DATE : null, stageHistory: [...d.stageHistory, { stage, at }] } : d,
      );

      // keep the linked quotation consistent with the deal outcome
      const quoteStatus = stage === 'Won' ? 'Accepted' : stage === 'Lost' ? 'Rejected' : 'Pending';
      const quotations = state.quotations.map((q) => {
        if (q.id !== deal.quotationId || q.status === quoteStatus) return q;
        const note = quoteStatus === 'Accepted' ? 'Deal won, quotation accepted' : quoteStatus === 'Rejected' ? 'Deal lost, quotation rejected' : 'Deal reopened, quotation pending again';
        return { ...q, status: quoteStatus, statusHistory: [...q.statusHistory, { status: quoteStatus, at, note }] };
      });

      // keep the lead status consistent with won deals
      const hasOtherWon = deals.some((d) => d.leadId === deal.leadId && d.stage === 'Won');
      const leads = state.leads.map((l) => {
        if (l.id !== deal.leadId) return l;
        if (hasOtherWon && l.status !== 'Converted') return { ...l, status: 'Converted' };
        if (!hasOtherWon && l.status === 'Converted') return { ...l, status: 'Qualified' };
        return l;
      });

      return addActivity({ ...state, deals, quotations, leads }, {
        employeeId: deal.ownerId, action: 'Deal stage changed', recordType: 'Deal', recordId: id, detail: `Moved to ${stage}`,
      });
    }

    case 'DEAL_PRIORITY': {
      const deal = state.deals.find((d) => d.id === action.id);
      if (!deal || deal.priority === action.priority) return state;
      const deals = state.deals.map((d) => (d.id === action.id ? { ...d, priority: action.priority } : d));
      return addActivity({ ...state, deals }, {
        employeeId: deal.ownerId, action: 'Deal priority changed', recordType: 'Deal', recordId: deal.id, detail: `Priority set to ${action.priority}`,
      });
    }

    case 'ORDER_PROGRESS': {
      const order = state.orders.find((o) => o.id === action.id);
      if (!order) return state;
      const progress = Math.max(0, Math.min(100, Math.round(action.progress)));
      if (progress === order.progress) return state;
      let status = order.status;
      let completedAt = order.completedAt;
      if (progress >= 100) { status = 'Completed'; completedAt = REF_DATE; }
      else {
        if (status === 'Completed') { status = 'In Progress'; completedAt = null; }
        if (status === 'Pending' && progress > 0) status = 'In Progress';
      }
      const orders = state.orders.map((o) => (o.id === order.id ? { ...o, progress, status, completedAt } : o));
      return addActivity({ ...state, orders }, {
        employeeId: order.assignedTo, action: progress >= 100 ? 'Order completed' : 'Order updated', recordType: 'Order', recordId: order.id, detail: `Progress ${progress}%`,
      });
    }

    case 'ORDER_STATUS': {
      const order = state.orders.find((o) => o.id === action.id);
      if (!order || order.status === action.status) return state;
      let { progress, completedAt } = order;
      const status = action.status;
      if (status === 'Completed') { progress = 100; completedAt = REF_DATE; }
      else {
        completedAt = null;
        if (status === 'Pending') progress = 0;
        if (status === 'In Progress' && (progress === 0 || progress === 100)) progress = progress === 0 ? 10 : 90;
        if (status === 'On Hold' && progress === 100) progress = 90;
      }
      const orders = state.orders.map((o) => (o.id === order.id ? { ...o, status, progress, completedAt } : o));
      return addActivity({ ...state, orders }, {
        employeeId: order.assignedTo, action: status === 'Completed' ? 'Order completed' : 'Order updated', recordType: 'Order', recordId: order.id, detail: `Status set to ${status}`,
      });
    }

    case 'PAYMENT_STATUS': {
      const pay = state.payments.find((p) => p.id === action.id);
      if (!pay || pay.status === action.status) return state;
      const payments = state.payments.map((p) =>
        p.id === pay.id ? { ...p, status: action.status, paymentDate: action.status === 'Paid' ? REF_DATE : p.paymentDate } : p,
      );
      const label = action.status === 'Paid' ? 'Payment recorded' : action.status === 'Failed' ? 'Payment failed' : 'Payment requested';
      return addActivity({ ...state, payments }, {
        employeeId: pay.receivedBy, action: label, recordType: 'Payment', recordId: pay.id, detail: `Status set to ${action.status}`,
      });
    }

    default:
      return state;
  }
}

export function DataProvider({ children }) {
  const [data, dispatch] = useReducer(reducer, null, loadInitial);

  useEffect(() => {
    saveJSON(KEYS.data, data);
  }, [data]);

  const updateDealStage = useCallback((id, stage) => dispatch({ type: 'DEAL_STAGE', id, stage }), []);
  const updateDealPriority = useCallback((id, priority) => dispatch({ type: 'DEAL_PRIORITY', id, priority }), []);
  const updateOrderProgress = useCallback((id, progress) => dispatch({ type: 'ORDER_PROGRESS', id, progress }), []);
  const updateOrderStatus = useCallback((id, status) => dispatch({ type: 'ORDER_STATUS', id, status }), []);
  const updatePaymentStatus = useCallback((id, status) => dispatch({ type: 'PAYMENT_STATUS', id, status }), []);
  const resetData = useCallback(() => {
    removeKey(KEYS.data);
    dispatch({ type: 'RESET' });
  }, []);

  const value = useMemo(() => {
    const byId = (arr) => Object.fromEntries(arr.map((r) => [r.id, r]));
    return {
      data,
      leadById: byId(data.leads),
      quoteById: byId(data.quotations),
      dealById: byId(data.deals),
      orderById: byId(data.orders),
      paymentById: byId(data.payments),
      updateDealStage, updateDealPriority, updateOrderProgress, updateOrderStatus, updatePaymentStatus, resetData,
    };
  }, [data, updateDealStage, updateDealPriority, updateOrderProgress, updateOrderStatus, updatePaymentStatus, resetData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
}
