import { useNavigate } from 'react-router-dom';
import { Users, UserCheck, UserPlus, UserX, Percent, FileText, Handshake, Receipt, Target } from 'lucide-react';
import KpiCard from '../ui/KpiCard.jsx';
import { Card } from '../ui/Card.jsx';
import { TrendLines, Donut } from '../charts/Charts.jsx';
import { useScope } from '../../hooks/useScope.js';
import { dailyLeadTrend, leadSources, leadStatusDistribution, sparkSeries } from '../../lib/aggregate.js';
import { toDay } from '../../lib/dates.js';
import { inr, num, pct } from '../../lib/format.js';
import { SOURCE_COLORS, STATUS_COLORS, MONTHLY_TARGET } from '../../data/constants.js';

const q = (obj) => `?${new URLSearchParams(obj).toString()}`;

export function LeadKpis() {
  const { cur, summary: s, prevSummary: p, range, filters } = useScope();
  const pl = filters.prevLabel;
  const spark = (items, fn) => sparkSeries(items, (r) => toDay(r.createdAt), range, fn);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-8">
      <KpiCard label="New Leads" icon={Users} tone="blue" value={num(s.leads.total)} cur={s.leads.total} prev={p.leads.total} prevLabel={pl} spark={spark(cur.leads)} to="/leads" info="Leads created in the selected period" />
      <KpiCard label="Qualified Leads" icon={UserCheck} tone="green" value={num(s.leads.qualified)} sub={pct(s.leads.qualifiedPct)} subLabel="of new leads (incl. converted)" cur={s.leads.qualified} prev={p.leads.qualified} prevLabel={pl} spark={spark(cur.leads.filter((l) => l.status === 'Qualified' || l.status === 'Converted'))} to={`/leads${q({ status: 'Qualified' })}`} info="Leads with status Qualified or Converted" />
      <KpiCard label="Converted Leads" icon={UserPlus} tone="purple" value={num(s.leads.converted)} sub={pct(s.leads.convertedPct)} subLabel="of new leads" cur={s.leads.converted} prev={p.leads.converted} prevLabel={pl} spark={spark(cur.leads.filter((l) => l.status === 'Converted'))} to={`/leads${q({ status: 'Converted' })}`} info="Leads that have at least one won deal" />
      <KpiCard label="Unqualified Leads" icon={UserX} tone="red" value={num(s.leads.unqualified)} sub={pct(s.leads.unqualifiedPct)} subLabel="of new leads" cur={s.leads.unqualified} prev={p.leads.unqualified} prevLabel={pl} invert spark={spark(cur.leads.filter((l) => l.status === 'Unqualified'))} to={`/leads${q({ status: 'Unqualified' })}`} info="Leads marked as not a fit. Fewer is better." />
      <KpiCard label="Conversion Rate" icon={Percent} tone="sky" value={pct(s.leads.conversionRate)} cur={s.leads.conversionRate} prev={p.leads.conversionRate} prevLabel={pl} to={`/leads${q({ status: 'Converted' })}`} info="Converted leads ÷ new leads in the period" />
      <KpiCard label="Quotations Created" icon={FileText} tone="green" value={num(s.quotes.total)} cur={s.quotes.total} prev={p.quotes.total} prevLabel={pl} spark={spark(cur.quotations)} to="/quotations" info="Quotations sent in the period" />
      <KpiCard label="Deals Created" icon={Handshake} tone="purple" value={num(s.deals.total)} cur={s.deals.total} prev={p.deals.total} prevLabel={pl} spark={spark(cur.deals)} to="/deals" info="Deals opened in the period" />
      <KpiCard label="Invoices Generated" icon={Receipt} tone="orange" value={num(s.invoices)} cur={s.invoices} prev={p.invoices} prevLabel={pl} spark={sparkSeries(cur.payments, (r) => r.paymentDate, range)} to="/payments" info="One invoice per payment request raised in the period" />
    </div>
  );
}

function Funnel({ s, onStage }) {
  const total = s.leads.total;
  const stages = [
    { key: 'all', label: 'New Leads', value: s.leads.total, pct: 100, color: '#2f64f0' },
    { key: 'Qualified', label: 'Qualified', value: s.leads.qualified, pct: s.leads.qualifiedPct, color: '#10b981' },
    { key: 'Converted', label: 'Converted', value: s.leads.converted, pct: s.leads.convertedPct, color: '#f59e0b' },
  ];
  if (!total) return <p className="py-10 text-center text-sm text-ink-400">No leads in this period.</p>;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex w-full flex-col items-center gap-1.5">
        {stages.map((st, i) => {
          const w = Math.max(34, total ? (st.value / total) * 100 : 0);
          return (
            <button key={st.key} onClick={() => onStage(st.key)} aria-label={`${st.label}: ${st.value}`}
              className="flex h-[52px] items-center justify-center text-white transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              style={{ width: `${w}%`, background: st.color, clipPath: 'polygon(0 0, 100% 0, 94% 100%, 6% 100%)', borderRadius: i === 0 ? '6px 6px 0 0' : 0 }}>
              <span className="text-center leading-tight">
                <span className="block text-[11px] font-medium opacity-90">{st.label}</span>
                <span className="block text-base font-bold">{st.value}</span>
                <span className="block text-[10px] opacity-80">{pct(st.pct)}</span>
              </span>
            </button>
          );
        })}
      </div>
      <button onClick={() => onStage('Unqualified')} className="mt-1 w-full max-w-[220px] rounded-lg border border-dashed border-violet-300 bg-violet-50 px-3 py-2 text-center text-violet-800 hover:bg-violet-100" aria-label={`Unqualified: ${s.leads.unqualified}`}>
        <span className="block text-[11px] font-medium">Unqualified (not a stage)</span>
        <span className="text-base font-bold">{s.leads.unqualified}</span>
        <span className="ml-1.5 text-[10px] opacity-80">{pct(s.leads.unqualifiedPct)}</span>
      </button>
    </div>
  );
}

function TargetCard({ s, filters }) {
  const achieved = s.revenue.collected;
  const target = s.revenue.target;
  const remaining = Math.max(0, target - achieved);
  const done = target ? (achieved / target) * 100 : 0;
  return (
    <div>
      <p className="text-xs text-ink-500">Monthly revenue target</p>
      <p className="text-2xl font-bold tracking-tight text-ink-900">{inr(MONTHLY_TARGET)}</p>
      {filters.days !== 30 && <p className="text-xs text-ink-400">Prorated for these {filters.days} day{filters.days === 1 ? '' : 's'}: {inr(target)}</p>}
      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-surface" role="progressbar" aria-valuenow={Math.min(100, done)} aria-valuemin={0} aria-valuemax={100} aria-label="Target achievement">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${Math.min(100, done)}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between text-xs"><span className="font-semibold text-brand-600">{pct(done)} complete</span><span className="text-ink-400">{pct(Math.max(0, 100 - done))} to go</span></div>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-ink-500"><i className="h-2 w-2 rounded-full bg-emerald-500" />Achieved (collected)</dt><dd className="font-semibold tabular-nums text-ink-900">{inr(achieved)}</dd></div>
        <div className="flex items-center justify-between"><dt className="flex items-center gap-2 text-ink-500"><i className="h-2 w-2 rounded-full bg-slate-300" />Remaining</dt><dd className="font-semibold tabular-nums text-ink-900">{inr(remaining)}</dd></div>
      </dl>
      <dl className="mt-4 space-y-2 border-t border-surface-line pt-3 text-sm">
        <div className="flex items-center justify-between"><dt className="text-ink-500">Billed in period (deal value)</dt><dd className="font-semibold tabular-nums text-ink-900">{inr(s.deals.value)}</dd></div>
        <div className="flex items-center justify-between"><dt className="text-ink-500">Collected per day</dt><dd className="font-semibold tabular-nums text-ink-900">{inr(Math.round(achieved / Math.max(1, filters.days)))}</dd></div>
        <div className="flex items-center justify-between"><dt className="text-ink-500">Target per day</dt><dd className="font-semibold tabular-nums text-ink-900">{inr(Math.round(target / Math.max(1, filters.days)))}</dd></div>
      </dl>
    </div>
  );
}

export function LeadCharts() {
  const nav = useNavigate();
  const { cur, summary: s, range, filters } = useScope();
  const trend = dailyLeadTrend(cur.leads, range);
  const sources = leadSources(cur.leads).map((d) => ({ ...d, color: SOURCE_COLORS[d.name] }));
  const statuses = leadStatusDistribution(cur.leads).map((d) => ({ ...d, color: STATUS_COLORS[d.name] }));
  const goStatus = (st) => nav(st === 'all' ? '/leads' : `/leads${q({ status: st })}`);

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-6">
      <Card className="lg:col-span-2" title="Target Achievement" info="Achieved = revenue actually collected in the period, compared with the monthly target scaled to the period length." action={<Target size={16} className="text-brand-500" />}>
        <TargetCard s={s} filters={filters} />
      </Card>
      <Card className="lg:col-span-2" title="Lead Funnel" subtitle="Click a stage to see those leads" info="Qualified includes converted leads. Unqualified leads are shown separately because they aren't a sequential stage.">
        <Funnel s={s} onStage={goStatus} />
      </Card>
      <Card className="lg:col-span-2" title="Lead Status Distribution" subtitle="Click a status to open the list">
        <Donut data={statuses} onSliceClick={goStatus} center={{ value: num(cur.leads.length), label: 'Leads' }} size={150} />
      </Card>
      <Card className="lg:col-span-4" title="Daily Lead Trend" subtitle="Leads by the day they were created">
        <TrendLines data={trend} series={[{ key: 'newLeads', name: 'New Leads', color: '#2f64f0' }, { key: 'qualified', name: 'Qualified', color: '#10b981' }, { key: 'converted', name: 'Converted', color: '#f59e0b' }]} />
      </Card>
      <Card className="lg:col-span-2" title="Lead Sources" subtitle="Click a source to open the list">
        <Donut data={sources} onSliceClick={(name) => nav(`/leads${q({ source: name })}`)} center={{ value: num(cur.leads.length), label: 'Total leads' }} size={150} />
      </Card>
    </div>
  );
}
