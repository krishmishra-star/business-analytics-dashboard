import { useNavigate } from 'react-router-dom';
import { FileText, IndianRupee, CheckCircle2, Clock, XCircle, Percent } from 'lucide-react';
import KpiCard from '../ui/KpiCard.jsx';
import { Card } from '../ui/Card.jsx';
import DataTable from '../ui/DataTable.jsx';
import { ColumnBars, RowBars, Donut, Gauge } from '../charts/Charts.jsx';
import { useScope } from '../../hooks/useScope.js';
import { quotesByService, quoteStatusDistribution, sparkSeries } from '../../lib/aggregate.js';
import { toDay } from '../../lib/dates.js';
import { inr, inrCompact, num, pct } from '../../lib/format.js';
import { STATUS_COLORS, SERVICE_COLORS } from '../../data/constants.js';

const q = (obj) => `?${new URLSearchParams(obj).toString()}`;

export function QuotationKpis() {
  const { cur, summary: s, prevSummary: p, range, filters } = useScope();
  const pl = filters.prevLabel;
  const spark = (items, fn) => sparkSeries(items, (r) => toDay(r.createdAt), range, fn);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <KpiCard label="Total Quotations" icon={FileText} tone="blue" value={num(s.quotes.total)} cur={s.quotes.total} prev={p.quotes.total} prevLabel={pl} spark={spark(cur.quotations)} to="/quotations" />
      <KpiCard label="Total Quoted Value" icon={IndianRupee} tone="purple" value={inrCompact(s.quotes.value)} sub={inr(s.quotes.value)} cur={s.quotes.value} prev={p.quotes.value} prevLabel={pl} spark={spark(cur.quotations, (r) => r.amount)} to="/quotations" />
      <KpiCard label="Accepted" icon={CheckCircle2} tone="green" value={num(s.quotes.accepted)} cur={s.quotes.accepted} prev={p.quotes.accepted} prevLabel={pl} to={`/quotations${q({ status: 'Accepted' })}`} />
      <KpiCard label="Pending" icon={Clock} tone="orange" value={num(s.quotes.pending)} cur={s.quotes.pending} prev={p.quotes.pending} prevLabel={pl} to={`/quotations${q({ status: 'Pending' })}`} />
      <KpiCard label="Rejected" icon={XCircle} tone="red" value={num(s.quotes.rejected)} cur={s.quotes.rejected} prev={p.quotes.rejected} prevLabel={pl} invert to={`/quotations${q({ status: 'Rejected' })}`} />
      <KpiCard label="Quote-to-Deal Rate" icon={Percent} tone="sky" value={pct(s.quotes.toDealRate)} cur={s.quotes.toDealRate} prev={p.quotes.toDealRate} prevLabel={pl} to="/quotations" info="Quotations that turned into a deal ÷ all quotations in the period" />
    </div>
  );
}

export function QuotationCharts() {
  const nav = useNavigate();
  const { cur, summary: s } = useScope();
  const byService = quotesByService(cur.quotations);
  const status = quoteStatusDistribution(cur.quotations).map((d) => ({ ...d, color: STATUS_COLORS[d.name] }));
  const goService = (row) => nav(`/quotations${q({ service: row.service })}`);

  const columns = [
    { key: 'service', header: 'Service / Order', render: (r) => <span className="font-medium text-ink-900">{r.service}</span> },
    { key: 'count', header: 'Quotations', align: 'right' },
    { key: 'value', header: 'Quoted Amount', align: 'right', render: (r) => inr(r.value) },
    { key: 'accepted', header: 'Accepted', align: 'right' },
    { key: 'pending', header: 'Pending', align: 'right' },
    { key: 'rejected', header: 'Rejected', align: 'right' },
    { key: 'convRate', header: 'Quote→Deal', align: 'right', render: (r) => pct(r.convRate) },
  ];

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
      <Card className="lg:col-span-5" title="Quotations by Service / Order Category" subtitle="Click a bar to open those quotations">
        <ColumnBars data={byService.filter((d) => d.count > 0)} series={[{ key: 'count', name: 'Quotations', color: '#2f64f0' }]} onBarClick={goService} angle={-28} />
      </Card>
      <Card className="lg:col-span-4" title="Quotation Value by Service" subtitle="Total quoted amount">
        <RowBars data={byService.filter((d) => d.value > 0).sort((a, b) => b.value - a.value)} dataKey="value" kind="inr" colors={SERVICE_COLORS} onBarClick={goService} labelWidth={104} />
      </Card>
      <Card className="lg:col-span-3" title="Quote-to-Deal Conversion Rate" info="Share of quotations that are linked to a deal">
        <Gauge value={s.quotes.toDealRate} color="#2f64f0" caption={`${num(s.quotes.withDeal)} deals / ${num(s.quotes.total)} quotations`} />
      </Card>
      <Card className="lg:col-span-8" title="Service-Wise Quotation Details" subtitle="Click a row to open that service's quotations">
        <DataTable columns={columns} rows={byService} rowKey={(r) => r.service} searchText={(r) => r.service} searchPlaceholder="Search service…" pageSize={8} onRowClick={goService} defaultSort={{ key: 'count', dir: 'desc' }}
          footer={(rows) => (
            <tr>
              <td className="td font-semibold">Total</td>
              <td className="td text-right font-semibold tabular-nums">{num(rows.reduce((a, r) => a + r.count, 0))}</td>
              <td className="td text-right font-semibold tabular-nums">{inr(rows.reduce((a, r) => a + r.value, 0))}</td>
              <td className="td text-right font-semibold tabular-nums">{rows.reduce((a, r) => a + r.accepted, 0)}</td>
              <td className="td text-right font-semibold tabular-nums">{rows.reduce((a, r) => a + r.pending, 0)}</td>
              <td className="td text-right font-semibold tabular-nums">{rows.reduce((a, r) => a + r.rejected, 0)}</td>
              <td className="td" />
            </tr>
          )} />
      </Card>
      <Card className="lg:col-span-4" title="Quotation Status Distribution" subtitle="Click a status to open the list">
        <Donut data={status} onSliceClick={(name) => nav(`/quotations${q({ status: name })}`)} center={{ value: num(cur.quotations.length), label: 'Quotations' }} size={150} />
      </Card>
    </div>
  );
}
