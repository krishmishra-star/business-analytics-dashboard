import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { REF_DATE, DATA_START, EMPLOYEE_BY_ID } from '../data/constants.js';
import { addDays, diffDays } from '../lib/dates.js';
import { KEYS, loadJSON, saveJSON } from '../lib/storage.js';

const FilterContext = createContext(null);

export const PRESETS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: 'custom', label: 'Custom' },
];

const DEFAULTS = {
  preset: '30d',
  customStart: addDays(REF_DATE, -13),
  customEnd: REF_DATE,
  userId: 'all',
  department: 'all',
};

export function validateCustom(start, end) {
  if (!start || !end) return 'Pick both a start and an end date.';
  if (end < start) return 'End date can’t be earlier than the start date.';
  if (end > REF_DATE) return 'End date can’t be after 17 Oct 2026 (the latest day in the demo data).';
  if (start < DATA_START) return 'Start date can’t be before 1 May 2026 (the first day in the demo data).';
  return null;
}

export function rangeFor(f) {
  if (f.preset === 'today') return { start: REF_DATE, end: REF_DATE };
  if (f.preset === '7d') return { start: addDays(REF_DATE, -6), end: REF_DATE };
  if (f.preset === 'custom' && !validateCustom(f.customStart, f.customEnd)) return { start: f.customStart, end: f.customEnd };
  return { start: addDays(REF_DATE, -29), end: REF_DATE };
}

function load() {
  const saved = loadJSON(KEYS.filters);
  if (!saved) return DEFAULTS;
  const merged = { ...DEFAULTS, ...saved };
  if (merged.userId !== 'all' && !EMPLOYEE_BY_ID[merged.userId]) merged.userId = 'all';
  if (merged.preset === 'custom' && validateCustom(merged.customStart, merged.customEnd)) merged.preset = '30d';
  return merged;
}

export function FilterProvider({ children }) {
  const [f, setF] = useState(load);
  const [customError, setCustomError] = useState(null);

  useEffect(() => {
    saveJSON(KEYS.filters, f);
  }, [f]);

  const setPreset = useCallback((preset) => {
    setCustomError(null);
    setF((s) => ({ ...s, preset }));
  }, []);

  // Applies a custom range only if it's valid; otherwise keeps the current range and reports why.
  const setCustomRange = useCallback((start, end) => {
    const err = validateCustom(start, end);
    setCustomError(err);
    setF((s) => ({ ...s, customStart: start, customEnd: end, preset: err ? s.preset : 'custom' }));
    return err;
  }, []);

  const setUser = useCallback((userId) => setF((s) => ({ ...s, userId })), []);
  const setDepartment = useCallback((department) => {
    setF((s) => {
      const userOk = s.userId === 'all' || department === 'all' || EMPLOYEE_BY_ID[s.userId]?.department === department;
      return { ...s, department, userId: userOk ? s.userId : 'all' };
    });
  }, []);
  const reset = useCallback(() => {
    setCustomError(null);
    setF(DEFAULTS);
  }, []);

  const value = useMemo(() => {
    const range = rangeFor(f);
    const len = diffDays(range.start, range.end) + 1;
    const prevEnd = addDays(range.start, -1);
    const prevRange = { start: addDays(prevEnd, -(len - 1)), end: prevEnd };
    const people = { userId: f.userId, department: f.department };
    const isDefault = f.preset === DEFAULTS.preset && f.userId === 'all' && f.department === 'all';
    const presetLabel = f.preset === 'custom' ? 'Custom range' : PRESETS.find((p) => p.key === f.preset)?.label;
    const prevLabel = f.preset === 'today' ? 'yesterday' : `previous ${len} days`;
    return { ...f, range, prevRange, people, days: len, isDefault, presetLabel, prevLabel, customError, setPreset, setCustomRange, setUser, setDepartment, reset };
  }, [f, customError, setPreset, setCustomRange, setUser, setDepartment, reset]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used inside FilterProvider');
  return ctx;
}
