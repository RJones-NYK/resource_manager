export const dynamic = "force-dynamic";

import { deleteOutOfOffice } from "@/lib/actions/admin/out-of-office";
import { getOutOfOffice, getResources } from "@/lib/queries";
import { formatResourceName } from "@/lib/resources";
import { OutOfOfficeForm } from "@/components/admin/out-of-office-form";
import { RowActions } from "@/components/admin/row-actions";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, ErrorAlert } from "@/components/ui/data-display";

export default async function AdminOutOfOfficePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  let items: Awaited<ReturnType<typeof getOutOfOffice>> = [];
  let resources: Awaited<ReturnType<typeof getResources>> = [];
  let error: string | null = null;

  try {
    [items, resources] = await Promise.all([
      getOutOfOffice(),
      getResources(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load out of office";
  }

  const editing = edit ? items.find((item) => item.id === edit) : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Out of office"
        description="Unavailability periods that reduce available capacity in the planner."
      />
      {error && <ErrorAlert message={error} />}
      <OutOfOfficeForm
        key={edit ?? "new"}
        record={editing}
        resources={resources.map((resource) => ({
          id: resource.id,
          label: formatResourceName(resource.firstName, resource.lastName),
        }))}
      />
      <DataTable
        rows={items}
        emptyMessage="No out-of-office periods recorded."
        columns={[
          {
            key: "resource",
            header: "Resource",
            cell: (row) => (
              <span className="font-medium text-ink">
                {row.resource
                  ? formatResourceName(
                      row.resource.firstName,
                      row.resource.lastName,
                    )
                  : "—"}
              </span>
            ),
          },
          {
            key: "start",
            header: "Start",
            cell: (row) => row.startDate,
          },
          {
            key: "end",
            header: "End",
            cell: (row) => row.endDate,
          },
          {
            key: "reason",
            header: "Reason",
            cell: (row) => row.reason ?? "—",
          },
          {
            key: "actions",
            header: "",
            className: "w-24 text-right",
            cell: (row) => (
              <RowActions
                editHref={`/admin/out-of-office?edit=${row.id}`}
                deleteAction={deleteOutOfOffice}
                recordId={row.id}
                recordLabel={
                  row.resource
                    ? formatResourceName(
                        row.resource.firstName,
                        row.resource.lastName,
                      )
                    : "out-of-office period"
                }
              />
            ),
          },
        ]}
      />
    </div>
  );
}
