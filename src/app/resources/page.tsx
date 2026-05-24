export const dynamic = "force-dynamic";

import { getResources } from "@/lib/queries";

export default async function ResourcesPage() {
  let items: Awaited<ReturnType<typeof getResources>> = [];
  let error: string | null = null;

  try {
    items = await getResources();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load resources";
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Resources</h1>
        <p className="mt-1 text-foreground/70">
          Team members with FTE hours, location, and role.
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
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">FTE hours/week</th>
              <th className="px-4 py-3 font-medium">Default FTE</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-foreground/60">
                  No resources yet. Add data via migrations or CRUD (next step).
                </td>
              </tr>
            ) : (
              items.map((resource) => (
                <tr key={resource.id} className="border-b border-border/60">
                  <td className="px-4 py-3 font-medium">{resource.name}</td>
                  <td className="px-4 py-3">{resource.role?.name ?? "—"}</td>
                  <td className="px-4 py-3">{resource.location ?? "—"}</td>
                  <td className="px-4 py-3">{resource.fteHoursPerWeek}</td>
                  <td className="px-4 py-3">{resource.defaultFte}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
