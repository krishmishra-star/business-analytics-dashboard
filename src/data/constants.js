// The dashboard treats this as "today" so the seeded dataset always lines up with the filters.
export const REF_DATE = '2026-10-17';
export const DATA_START = '2026-05-01';
export const DATA_VERSION = 'v1';

export const MONTHLY_TARGET = 250000;

export const SERVICES = [
  { key: 'pvt', name: 'Private Limited Company Registration', short: 'Private Limited', min: 12000, max: 26000, stages: 5 },
  { key: 'llp', name: 'LLP Registration', short: 'LLP', min: 8000, max: 18000, stages: 4 },
  { key: 'gst', name: 'GST Registration', short: 'GST', min: 3000, max: 8000, stages: 3 },
  { key: 'tm', name: 'Trademark Registration', short: 'Trademark', min: 6000, max: 13000, stages: 5 },
  { key: 'startup', name: 'Startup India Registration', short: 'Startup India', min: 4000, max: 9500, stages: 4 },
  { key: 'iso', name: 'ISO Certification', short: 'ISO', min: 10000, max: 30000, stages: 5 },
  { key: 'compliance', name: 'Annual Compliance', short: 'Annual Compliance', min: 5000, max: 20000, stages: 4 },
  { key: 'other', name: 'Other Services', short: 'Other', min: 2000, max: 15000, stages: 3 },
];

export const SERVICE_BY_NAME = Object.fromEntries(SERVICES.map((s) => [s.name, s]));
export const SERVICE_NAMES = SERVICES.map((s) => s.name);
export const shortService = (name) => SERVICE_BY_NAME[name]?.short || name;

export const LEAD_SOURCES = ['Google Ads', 'Website', 'Referral', 'Direct', 'Other'];
export const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Converted', 'Unqualified'];
export const QUOTE_STATUSES = ['Accepted', 'Pending', 'Rejected'];
export const DEAL_STAGES = ['New', 'Contacted', 'Proposal', 'Negotiation', 'Won', 'Lost'];
export const PRIORITIES = ['High', 'Medium', 'Low'];
export const ORDER_STATUSES = ['Pending', 'In Progress', 'On Hold', 'Completed'];
export const ORDER_EFFECTIVE_STATUSES = ['Completed', 'In Progress', 'Pending', 'On Hold', 'Overdue'];
export const PAYMENT_STATUSES = ['Paid', 'Pending', 'Failed'];
export const PAYMENT_METHODS = ['UPI', 'Bank Transfer', 'Card', 'Cash', 'Cheque'];
export const DEPARTMENTS = ['Sales', 'Operations', 'Accounts'];
export const ACTIVITY_TYPES = ['Lead', 'Quotation', 'Deal', 'Order', 'Payment'];

export const EMPLOYEES = [
  { id: 'E01', name: 'Nancy Singh', department: 'Sales', role: 'Senior Sales Executive' },
  { id: 'E02', name: 'Sneha Choudhary', department: 'Sales', role: 'Sales Executive' },
  { id: 'E03', name: 'Tannu Kumari', department: 'Sales', role: 'Sales Executive' },
  { id: 'E04', name: 'Rahul Verma', department: 'Sales', role: 'Sales Executive' },
  { id: 'E05', name: 'Aditi Rao', department: 'Sales', role: 'Business Development' },
  { id: 'E06', name: 'Gaurav Pant', department: 'Operations', role: 'Filing Specialist' },
  { id: 'E07', name: 'Srishti Upadhyay', department: 'Operations', role: 'Compliance Associate' },
  { id: 'E08', name: 'Azam Afaroz', department: 'Operations', role: 'Operations Executive' },
  { id: 'E09', name: 'Priya Nair', department: 'Operations', role: 'Documentation Lead' },
  { id: 'E10', name: 'Meera Iyer', department: 'Accounts', role: 'Accounts Executive' },
];
export const EMPLOYEE_BY_ID = Object.fromEntries(EMPLOYEES.map((e) => [e.id, e]));

export const STATUS_COLORS = {
  // leads
  New: '#2f64f0', Contacted: '#0ea5e9', Qualified: '#10b981', Converted: '#7c3aed', Unqualified: '#ef4444',
  // quotes
  Accepted: '#10b981', Pending: '#f59e0b', Rejected: '#ef4444',
  // deals
  Proposal: '#7c3aed', Negotiation: '#f59e0b', Won: '#10b981', Lost: '#ef4444',
  // orders
  'In Progress': '#2f64f0', 'On Hold': '#94a3b8', Completed: '#10b981', Overdue: '#ef4444',
  // payments
  Paid: '#10b981', Failed: '#ef4444',
  // priority
  High: '#ef4444', Medium: '#f59e0b', Low: '#10b981',
};

export const SERVICE_COLORS = ['#2f64f0', '#0ea5e9', '#10b981', '#f59e0b', '#7c3aed', '#ec4899', '#14b8a6', '#94a3b8'];
export const SOURCE_COLORS = { 'Google Ads': '#2f64f0', Website: '#10b981', Referral: '#f59e0b', Direct: '#7c3aed', Other: '#94a3b8' };
export const METHOD_COLORS = { UPI: '#2f64f0', 'Bank Transfer': '#10b981', Card: '#7c3aed', Cash: '#f59e0b', Cheque: '#94a3b8' };
