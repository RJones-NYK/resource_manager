import { deleteProject } from "@/lib/actions/admin/projects";
import { projectStatusLabel } from "@/lib/project-status";
import type { getProjects } from "@/lib/queries";
import { RowActions } from "@/components/admin/row-actions";
import { DataTable } from "@/components/ui/data-display";
import { ChevronDown } from "lucide-react";

type Project = Awaited<ReturnType<typeof getProjects>>[number];

function buildColumns(showStatus: boolean) {
  const columns = [
    {
      key: "name",
      header: "Name",
      cell: (row: Project) => (
        <span className="font-medium text-ink">{row.name}</span>
      ),
    },
    {
      key: "client",
      header: "Client",
      cell: (row: Project) => row.client ?? "—",
    },
    ...(showStatus
      ? [
          {
            key: "status",
            header: "Status",
            cell: (row: Project) => (
              <span className="capitalize">{projectStatusLabel(row.status)}</span>
            ),
          },
        ]
      : []),
    {
      key: "budget",
      header: "Budget (hrs)",
      cell: (row: Project) => row.totalHoursBudgeted ?? "—",
    },
    {
      key: "zoho",
      header: "Zoho",
      cell: (row: Project) =>
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
      cell: (row: Project) =>
        `${row.startDate ?? "—"} → ${row.endDate ?? "—"}`,
    },
    {
      key: "actions",
      header: "",
      className: "w-24 text-right",
      cell: (row: Project) => (
        <RowActions
          editHref={`/admin/projects?edit=${row.id}`}
          deleteAction={deleteProject}
          recordId={row.id}
          recordLabel={row.name}
        />
      ),
    },
  ];

  return columns;
}

export function ProjectsList({
  projects,
  editingId,
}: {
  projects: Project[];
  editingId?: string;
}) {
  const completedProjects = projects.filter((p) => p.status === "complete");
  const openProjects = projects.filter((p) => p.status !== "complete");
  const editingComplete = Boolean(
    editingId && completedProjects.some((p) => p.id === editingId),
  );

  const openColumns = buildColumns(true);
  const completedColumns = buildColumns(false);

  return (
    <div className="space-y-4">
      <DataTable
        rows={openProjects}
        columns={openColumns}
        emptyMessage={
          projects.length === 0
            ? "No projects yet. Add a project using the form above."
            : "No open projects — everything here is marked complete."
        }
      />

      {completedProjects.length > 0 ? (
        <details
          className="collapsible-section group overflow-hidden rounded-[var(--radius)] border border-g200 bg-surface"
          open={editingComplete || undefined}
        >
          <summary className="panel-header flex cursor-pointer list-none items-center justify-between gap-3 select-none [&::-webkit-details-marker]:hidden">
            <span>
              Completed
              <span className="ml-2 font-light text-g500">
                ({completedProjects.length})
              </span>
            </span>
            <ChevronDown
              className="h-4 w-4 shrink-0 text-g500 transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <DataTable
            embedded
            rows={completedProjects}
            columns={completedColumns}
            emptyMessage="No completed projects."
          />
        </details>
      ) : null}
    </div>
  );
}
