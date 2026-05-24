export function PlaceholderTimeline({
  rowLabel,
  rows,
  columns,
  caption,
}: {
  rowLabel: string;
  rows: string[];
  columns: string[];
  caption: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-[12px] font-light text-g500">{caption}</p>
      <div className="overflow-hidden rounded-[var(--radius)] border border-g200 bg-surface">
        <div className="overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="border-b border-g200 bg-g50">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-g500">
                  {rowLabel}
                </th>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-g500"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row} className="border-b border-g200/80">
                  <td className="px-4 py-3 font-medium text-ink">{row}</td>
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-3 font-light text-g500">
                      —
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
