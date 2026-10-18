// Small static table for related records on detail pages.
export default function MiniTable({ columns, rows, empty = 'Nothing linked yet.', rowKey = (r) => r.id, footer }) {
  if (!rows.length) return <p className="py-4 text-sm text-ink-400">{empty}</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-surface-line">
      <table className="w-full min-w-max border-collapse">
        <thead className="bg-surface/70">
          <tr>{columns.map((c) => <th key={c.key} scope="col" className={`th ${c.align === 'right' ? 'text-right' : ''}`}>{c.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-surface-line">
          {rows.map((r) => (
            <tr key={rowKey(r)}>{columns.map((c) => <td key={c.key} className={`td ${c.align === 'right' ? 'text-right tabular-nums' : ''}`}>{c.render ? c.render(r) : r[c.key]}</td>)}</tr>
          ))}
        </tbody>
        {footer && <tfoot className="border-t border-surface-line bg-surface/70">{footer(rows)}</tfoot>}
      </table>
    </div>
  );
}
