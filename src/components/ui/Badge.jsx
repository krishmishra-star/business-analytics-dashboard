const TONES = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  orange: 'bg-amber-50 text-amber-700 ring-amber-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  purple: 'bg-violet-50 text-violet-700 ring-violet-200',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
};

const STATUS_TONE = {
  New: 'blue', Contacted: 'sky', Qualified: 'green', Converted: 'purple', Unqualified: 'red',
  Accepted: 'green', Pending: 'orange', Rejected: 'red',
  Proposal: 'purple', Negotiation: 'orange', Won: 'green', Lost: 'red',
  'In Progress': 'blue', 'On Hold': 'slate', Completed: 'green', Overdue: 'red',
  Paid: 'green', Failed: 'red',
  High: 'red', Medium: 'orange', Low: 'green',
};

export default function Badge({ children, tone, status }) {
  const t = TONES[tone || STATUS_TONE[status ?? children] || 'slate'];
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${t}`}>
      {children ?? status}
    </span>
  );
}
