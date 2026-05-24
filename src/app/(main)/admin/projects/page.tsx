export const dynamic = "force-dynamic";

import { deleteProject } from "@/lib/actions/admin/projects";
import { getProjects } from "@/lib/queries";
import { ProjectForm } from "@/components/admin/project-form";
import { RowActions } from "@/components/admin/row-actions";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, ErrorAlert } from "@/components/ui/data-display";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  let items: Awaited<ReturnType<typeof getProjects>> = [];
  let error: string | null = null;

  try {
    items = await getProjects();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load projects";
  }

  const editing = edit ? items.find((item) => item.id === edit) : undefined;
  const clientSuggestions = [
    ...new Set(
      items
        .map((item) => item.client?.trim())
        .filter((client): client is string => Boolean(client)),
    ),
  ].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Client projects with budgeted hours and status."
      />
      {error && <ErrorAlert message={error} />}
      <ProjectForm
        key={edit ?? "new"}
        project={editing}
        clientSuggestions={clientSuggestions}
      />
      <DataTable
        rows={items}
        emptyMessage="No projects yet. Add a project using the form above."
        columns={[
          {
            key: "name",
            header: "Name",
            cell: (row) => (
              <span className="font-medium text-ink">{row.name}</span>
            ),
          },
          {
            key: "client",
            header: "Client",
            cell: (row) => row.client ?? "—",
          },
          {
            key: "status",
            header: "Status",
            cell: (row) => (
              <span className="capitalize">
                {row.status.replace("_", " ")}
              </span>
            ),
          },
          {
            key: "budget",
            header: "Budget (hrs)",
            cell: (row) => row.totalHoursBudgeted ?? "—",
          },
          {
            key: "zoho",
            header: "Zoho",
            cell: (row) =>
              row.zohoUrl ? (
                <a
                  href={row.zohoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-dark underline-offset-2 hover:underline"
                >
                  Open
                </a>
              ) : (
                "—"
              ),
          },
          {
            key: "dates",
            header: "Dates",
            cell: (row) =>
              `${row.startDate ?? "—"} → ${row.endDate ?? "—"}`,
          },
          {
            key: "actions",
            header: "",
            className: "w-24 text-right",
            cell: (row) => (
              <RowActions
                editHref={`/admin/projects?edit=${row.id}`}
                deleteAction={deleteProject}
                recordId={row.id}
                recordLabel={row.name}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
