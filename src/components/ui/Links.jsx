import { Link } from 'react-router-dom';
import { employeeName } from '../../lib/aggregate.js';

const base = 'font-medium text-brand-600 hover:text-brand-700 hover:underline';

export const LeadLink = ({ id, children }) => id ? <Link to={`/leads/${id}`} className={base} onClick={(e) => e.stopPropagation()}>{children || id}</Link> : <span>—</span>;
export const QuoteLink = ({ id, children }) => id ? <Link to={`/quotations/${id}`} className={base} onClick={(e) => e.stopPropagation()}>{children || id}</Link> : <span className="text-ink-300">—</span>;
export const DealLink = ({ id, children }) => id ? <Link to={`/deals/${id}`} className={base} onClick={(e) => e.stopPropagation()}>{children || id}</Link> : <span className="text-ink-300">—</span>;
export const OrderLink = ({ id, children }) => id ? <Link to={`/orders/${id}`} className={base} onClick={(e) => e.stopPropagation()}>{children || id}</Link> : <span className="text-ink-300">—</span>;
export const PaymentLink = ({ id, children }) => id ? <Link to={`/payments/${id}`} className={base} onClick={(e) => e.stopPropagation()}>{children || id}</Link> : <span className="text-ink-300">—</span>;
export const EmployeeLink = ({ id, children }) => id ? <Link to={`/team/${id}`} className="text-ink-700 hover:text-brand-600 hover:underline" onClick={(e) => e.stopPropagation()}>{children || employeeName(id)}</Link> : <span>—</span>;

export function recordPath(type, id) {
  const map = { Lead: 'leads', Quotation: 'quotations', Deal: 'deals', Order: 'orders', Payment: 'payments' };
  return map[type] ? `/${map[type]}/${id}` : '/';
}
