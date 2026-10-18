import { useMemo } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useFilters } from '../context/FilterContext.jsx';
import { scopeFor } from '../lib/filters.js';
import { summarize } from '../lib/aggregate.js';

// Everything the pages need, derived from one shared data + filter state.
export function useScope() {
  const { data } = useData();
  const filters = useFilters();
  const { range, prevRange, people } = filters;

  return useMemo(() => {
    const cur = scopeFor(data, range, people);
    const prev = scopeFor(data, prevRange, people);
    return {
      data, filters, range, prevRange, people, cur, prev,
      summary: summarize(data, cur, people),
      prevSummary: summarize(data, prev, people),
    };
  }, [data, filters, range, prevRange, people]);
}
