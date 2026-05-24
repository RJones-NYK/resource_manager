export const dynamic = "force-dynamic";

import { deleteResource } from "@/lib/actions/admin/resources";
import { getResources, getRoles } from "@/lib/queries";
import { formatResourceName } from "@/lib/resources";
import { ResourceForm } from "@/components/admin/resource-form";
import { ResourceExternalTag } from "@/components/ui/resource-tags";
import { RowActions } from "@/components/admin/row-actions";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, ErrorAlert } from "@/components/ui/data-display";

export default async function AdminResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  let items: Awaited<ReturnType<typeof getResources>> = [];
  let roles: Awaited<ReturnType<typeof getRoles>> = [];
  let error: string | null = null;

  try {
    [items, roles] = await Promise.all([getResources(), getRoles()]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load resources";
  }

  const editing = edit ? items.find((item) => item.id === edit) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resources"
        description="Team members with FTE hours, location, and role."
      />
      {error && <ErrorAlert message={error} />}
      <ResourceForm
        key={edit ?? "new"}
        resource={editing}
        roles={roles.map((role) => ({ id: role.id, name: role.name }))}
      />
      <DataTable
        rows={items}
        emptyMessage="No resources yet. Add team members using the form above."
        columns={[
          {
            key: "name",
            header: "Name",
            cell: (row) => (
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-ink">
                  {formatResourceName(row.firstName, row.lastName)}
                </span>
                {row.isExternal ? <ResourceExternalTag /> : null}
              </span>
            ),
          },
          {
            key: "role",
            header: "Role",
            cell: (row) => row.role?.name ?? "—",
          },
          {
            key: "location",
            header: "Location",
            cell: (row) => row.location ?? "—",
          },
          {
            key: "fteHours",
            header: "FTE hrs/week",
            cell: (row) => row.fteHoursPerWeek,
          },
          {
            key: "defaultFte",
            header: "Default FTE",
            cell: (row) => row.defaultFte,
          },
          {
            key: "active",
            header: "Status",
            cell: (row) => (row.isActive ? "Active" : "Inactive"),
          },
          {
            key: "actions",
            header: "",
            className: "w-24 text-right",
            cell: (row) => (
              <RowActions
                editHref={`/admin/resources?edit=${row.id}`}
                deleteAction={deleteResource}
                recordId={row.id}
                recordLabel={formatResourceName(row.firstName, row.lastName)}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
