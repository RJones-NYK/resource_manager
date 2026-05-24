export const dynamic = "force-dynamic";

export default function ByProjectViewPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">By project</h1>
        <p className="mt-1 text-foreground/70">
          Weekly timeline showing all resources assigned to a selected project,
          with budget burn tracking.
        </p>
      </header>

      <PlaceholderTimeline
        rows={["Project Alpha", "Project Beta"]}
        columns={["W12", "W13", "W14", "W15"]}
        caption="Scaffold — project selector with resource rows × week columns"
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
              <th className="px-4 py-3 text-left font-medium">Project / Resource</th>
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
