export const dynamic = "force-dynamic";

import { getProjects } from "@/lib/queries";

export default async function ProjectsPage() {
  let items: Awaited<ReturnType<typeof getProjects>> = [];
  let error: string | null = null;

  try {
    items = await getProjects();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load projects";
  }

  return (
<div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="mt-1 text-foreground/70">
          Client projects with budgeted hours and status.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-foreground/60">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Budget (hrs)</th>
              <th className="px-4 py-3 font-medium">Dates</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-foreground/60">
                  No projects yet. Add data via migrations or CRUD (next step).
                </td>
              </tr>
            ) : (
              items.map((project) => (
                <tr key={project.id} className="border-b border-border/60">
                  <td className="px-4 py-3 font-medium">{project.name}</td>
                  <td className="px-4 py-3">{project.client ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{project.status.replace("_", " ")}</td>
                  <td className="px-4 py-3">{project.totalHoursBudgeted ?? "—"}</td>
                  <td className="px-4 py-3">
                    {project.startDate ?? "—"} → {project.endDate ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
