import { useSearchParams } from 'react-router-dom';

// Reads table filters from the URL (e.g. /leads?status=Qualified) so dashboard clicks land on a pre-filtered list.
export function useListParams(keys) {
  const [sp] = useSearchParams();
  const initial = {};
  keys.forEach((k) => { const v = sp.get(k); if (v) initial[k] = v; });
  return { initial, tableKey: sp.toString() };
}
