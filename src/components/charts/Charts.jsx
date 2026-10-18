import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart,
} from 'recharts';
import { inr, inrCompact, num } from '../../lib/format.js';
import { EmptyState } from '../ui/Card.jsx';

const AXIS = { fontSize: 11, fill: '#7a87a3' };
const GRID = '#eef1f7';

export const fmtByKind = (kind) => (kind === 'inr' ? inr : num);
const axisFmt = (kind) => (kind === 'inr' ? inrCompact : (v) => num(v));

function ChartTooltip({ active, payload, label, kind = 'num', labelFormatter }) {
  if (!active || !payload?.length) return null;
  const f = fmtByKind(kind);
  const title = labelFormatter ? labelFormatter(label, payload) : label ?? payload[0]?.payload?.name;
  return (
    <div className="rounded-lg border border-surface-line bg-white px-3 py-2 text-xs shadow-lg">
      {title !== undefined && <div className="mb-1 font-semibold text-ink-900">{title}</div>}
      {payload.filter((p) => p.value !== undefined && p.value !== null).map((p) => (
        <div key={p.dataKey + p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-ink-500"><i className="inline-block h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />{p.name}</span>
          <span className="font-semibold tabular-nums text-ink-900">{(p.payload?.__fmt?.[p.dataKey] || f)(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

const hasData = (data, keys) => data.some((d) => keys.some((k) => Number(d[k]) > 0));

// ---------- line chart ----------
export function TrendLines({ data, series, height = 230, kind = 'num', xKey = 'label' }) {
  if (!hasData(data, series.map((s) => s.key))) return <EmptyState />;
  return (
    <div style={{ height }} role="img" aria-label="Trend chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
          <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={axisFmt(kind)} width={46} />
          <Tooltip content={<ChartTooltip kind={kind} />} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 4 }} formatter={(v) => <span style={{ color: '#475569' }}>{v}</span>} />
          {series.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={data.length <= 14 ? { r: 3 } : false} activeDot={{ r: 4 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- vertical (column) bars; supports stacking + a second axis ----------
export function ColumnBars({ data, series, xKey = 'short', height = 240, kind = 'num', stacked = false, onBarClick, rightAxis = false, rightKind = 'inr', angle = 0 }) {
  if (!hasData(data, series.map((s) => s.key))) return <EmptyState />;
  return (
    <div style={{ height }} role="img" aria-label="Bar chart">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: rightAxis ? 0 : 8, left: -8, bottom: angle ? 24 : 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey={xKey} tick={AXIS} tickLine={false} axisLine={false} interval={0} angle={angle} textAnchor={angle ? 'end' : 'middle'} height={angle ? 54 : 24} minTickGap={4} />
          <YAxis yAxisId="l" tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={axisFmt(kind)} width={46} />
          {rightAxis && <YAxis yAxisId="r" orientation="right" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={axisFmt(rightKind)} width={52} />}
          <Tooltip cursor={{ fill: '#f4f6fb' }} content={<ChartTooltip kind={kind} />} />
          {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span style={{ color: '#475569' }}>{v}</span>} />}
          {series.map((s, i) => (
            <Bar
              key={s.key} yAxisId={s.axis === 'right' ? 'r' : 'l'} dataKey={s.key} name={s.name} fill={s.color}
              stackId={stacked ? 'a' : undefined} radius={stacked ? (i === series.length - 1 ? [4, 4, 0, 0] : 0) : [4, 4, 0, 0]} maxBarSize={36}
              cursor={onBarClick ? 'pointer' : undefined} onClick={onBarClick ? (d) => onBarClick(d.payload ?? d, s) : undefined}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- horizontal bars ----------
export function RowBars({ data, dataKey = 'value', nameKey = 'short', color = '#2f64f0', colors, kind = 'num', height, onBarClick, labelWidth = 96 }) {
  if (!hasData(data, [dataKey])) return <EmptyState />;
  const h = height || Math.max(180, data.length * 34 + 20);
  return (
    <div style={{ height: h }} role="img" aria-label="Horizontal bar chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={axisFmt(kind)} allowDecimals={false} />
          <YAxis type="category" dataKey={nameKey} tick={{ ...AXIS, fill: '#51607e' }} tickLine={false} axisLine={false} width={labelWidth} interval={0} />
          <Tooltip cursor={{ fill: '#f4f6fb' }} content={<ChartTooltip kind={kind} labelFormatter={(l, p) => p[0]?.payload?.service || l} />} />
          <Bar dataKey={dataKey} name="Value" radius={[0, 4, 4, 0]} maxBarSize={22} cursor={onBarClick ? 'pointer' : undefined} onClick={onBarClick ? (d) => onBarClick(d.payload ?? d) : undefined}>
            {data.map((d, i) => <Cell key={d[nameKey] + i} fill={colors ? colors[i % colors.length] : color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------- donut with legend ----------
export function Donut({ data, kind = 'num', center, onSliceClick, size = 176, legendValue }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <EmptyState />;
  const f = fmtByKind(kind);
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
      <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label="Donut chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data.filter((d) => d.value > 0)} dataKey="value" nameKey="name" innerRadius="64%" outerRadius="94%" paddingAngle={2} stroke="none" cursor={onSliceClick ? 'pointer' : undefined} onClick={onSliceClick ? (d) => onSliceClick(d.name ?? d.payload?.name) : undefined}>
              {data.filter((d) => d.value > 0).map((d) => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip content={<ChartTooltip kind={kind} />} />
          </PieChart>
        </ResponsiveContainer>
        {center && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
            <div><div className="text-xl font-bold leading-none text-ink-900">{center.value}</div><div className="mt-1 text-[10px] uppercase tracking-wide text-ink-400">{center.label}</div></div>
          </div>
        )}
      </div>
      <ul className="min-w-[11rem] flex-1 space-y-1.5 text-sm">
        {data.map((d) => (
          <li key={d.name}>
            <button onClick={onSliceClick ? () => onSliceClick(d.name) : undefined} disabled={!onSliceClick} className={`flex w-full items-center gap-2 rounded px-1 py-0.5 text-left ${onSliceClick ? 'hover:bg-surface' : 'cursor-default'}`}>
              <i className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
              <span className="flex-1 truncate text-ink-700">{d.name}</span>
              <span className="tabular-nums font-semibold text-ink-900">{legendValue ? legendValue(d) : f(d.value)}</span>
              <span className="w-12 text-right text-xs tabular-nums text-ink-400">{total ? `${((d.value / total) * 100).toFixed(1)}%` : '0%'}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- semi-circle gauge ----------
export function Gauge({ value, caption, color = '#2f64f0' }) {
  const v = Math.max(0, Math.min(100, value || 0));
  const r = 70;
  const c = Math.PI * r;
  return (
    <div className="flex flex-col items-center py-2">
      <svg viewBox="0 0 180 100" className="w-full max-w-[220px]" role="img" aria-label={`Gauge at ${v.toFixed(1)} percent`}>
        <path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke="#eef1f7" strokeWidth="14" strokeLinecap="round" />
        <path d="M20 90 A70 70 0 0 1 160 90" fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${(v / 100) * c} ${c}`} />
        <text x="90" y="76" textAnchor="middle" className="fill-ink-900" style={{ fontSize: 24, fontWeight: 700 }}>{v.toFixed(1)}%</text>
      </svg>
      {caption && <p className="-mt-1 text-xs text-ink-500">{caption}</p>}
    </div>
  );
}

// ---------- progress row ----------
export function ProgressRow({ label, value, max, color = '#2f64f0', right, onClick }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} className={`block w-full text-left ${onClick ? 'rounded hover:bg-surface' : ''}`}>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-ink-600 text-ink-700">{label}</span>
        <span className="shrink-0 font-semibold tabular-nums text-ink-900">{right}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} /></div>
    </Tag>
  );
}
