export const dynamic = "force-dynamic";

import { deleteRole } from "@/lib/actions/admin/roles";
import { getRoles } from "@/lib/queries";
import { RoleForm } from "@/components/admin/role-form";
import { RowActions } from "@/components/admin/row-actions";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, ErrorAlert } from "@/components/ui/data-display";

export default async function AdminRolesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  let items: Awaited<ReturnType<typeof getRoles>> = [];
  let error: string | null = null;

  try {
    items = await getRoles();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load roles";
  }

  const editing = edit ? items.find((item) => item.id === edit) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Job roles assigned to resources."
      />
      {error && <ErrorAlert message={error} />}
      <RoleForm key={edit ?? "new"} role={editing} />
      <DataTable
        rows={items}
        emptyMessage="No roles yet. Add your first role above."
        columns={[
          {
            key: "name",
            header: "Name",
            cell: (row) => (
              <span className="font-medium text-ink">{row.name}</span>
            ),
          },
          {
            key: "description",
            header: "Description",
            cell: (row) => row.description ?? "—",
          },
          {
            key: "actions",
            header: "",
            className: "w-24 text-right",
            cell: (row) => (
              <RowActions
                editHref={`/admin/roles?edit=${row.id}`}
                deleteAction={deleteRole}
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
