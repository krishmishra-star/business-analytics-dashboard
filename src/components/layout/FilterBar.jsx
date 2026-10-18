import { RotateCcw, Calendar, AlertCircle } from 'lucide-react';
import { useFilters, PRESETS } from '../../context/FilterContext.jsx';
import { EMPLOYEES, DEPARTMENTS, REF_DATE, DATA_START } from '../../data/constants.js';
import { formatDay } from '../../lib/dates.js';

export default function FilterBar() {
  const f = useFilters();

  const users = EMPLOYEES.filter((e) => f.department === 'all' || e.department === f.department);

  const applyCustom = (s, e) => f.setCustomRange(s, e);

  return (
    <div className="card mb-5 p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div role="group" aria-label="Date range" className="inline-flex overflow-hidden rounded-lg border border-surface-line bg-white">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => (p.key === 'custom' ? applyCustom(f.customStart, f.customEnd) : f.setPreset(p.key))}
              aria-pressed={f.preset === p.key}
              className={`px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 ${f.preset === p.key ? 'bg-brand-500 text-white' : 'text-ink-700 hover:bg-surface'}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {(f.preset === 'custom' || f.customError) && (
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-ink-500">
              From
              <input type="date" aria-label="Start date" value={f.customStart} min={DATA_START} max={REF_DATE} onChange={(e) => applyCustom(e.target.value, f.customEnd)} className="input !py-1.5" />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-ink-500">
              To
              <input type="date" aria-label="End date" value={f.customEnd} min={DATA_START} max={REF_DATE} onChange={(e) => applyCustom(f.customStart, e.target.value)} className="input !py-1.5" />
            </label>
          </div>
        )}

        <label className="flex items-center gap-1.5 text-xs text-ink-500">
          <span className="sr-only">Department</span>
          <select aria-label="Department" value={f.department} onChange={(e) => f.setDepartment(e.target.value)} className="input !py-2">
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-ink-500">
          <span className="sr-only">User</span>
          <select aria-label="User" value={f.userId} onChange={(e) => f.setUser(e.target.value)} className="input !py-2">
            <option value="all">All Users</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </label>

        <button onClick={f.reset} className="btn" disabled={f.isDefault && !f.customError} title="Back to Last 30 Days, all users, all departments">
          <RotateCcw size={14} /> Reset Filters
        </button>

        <p className="ml-auto flex items-center gap-1.5 text-xs text-ink-400">
          <Calendar size={13} />
          {f.range.start === f.range.end ? formatDay(f.range.start) : `${formatDay(f.range.start)} – ${formatDay(f.range.end)}`}
          <span className="hidden sm:inline">· compared with {f.prevLabel}</span>
        </p>
      </div>
      {f.customError && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600"><AlertCircle size={14} /> {f.customError} Showing the last valid range instead.</p>
      )}
    </div>
  );
}
