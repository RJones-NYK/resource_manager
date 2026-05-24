export const dynamic = "force-dynamic";

export default function ByResourceViewPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">By resource</h1>
        <p className="mt-1 text-foreground/70">
          Weekly timeline showing each resource&apos;s project allocations and
          out-of-office periods.
        </p>
      </header>

      <PlaceholderTimeline
        rows={["Alice", "Bob", "Carol"]}
        columns={["W12", "W13", "W14", "W15"]}
        caption="Scaffold — resource rows × week columns with FTE cells and OOO overlays"
      />
    </div>
  );
}

function PlaceholderTimeline({
  rows,
  columns,
  caption,
}: {
  rows: string[];
  columns: string[];
  caption: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground/60">{caption}</p>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-accent-muted/40">
              <th className="px-4 py-3 text-left font-medium">Resource</th>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 text-left font-medium">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row} className="border-b border-border/60">
                <td className="px-4 py-3 font-medium">{row}</td>
                {columns.map((col) => (
                  <td key={col} className="px-4 py-3 text-foreground/50">
                    —
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
