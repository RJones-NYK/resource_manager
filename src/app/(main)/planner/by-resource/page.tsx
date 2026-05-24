import { PageHeader } from "@/components/layout/page-header";
import { ResourceTimeline } from "@/components/planner/resource-timeline";
import { ErrorAlert } from "@/components/ui/data-display";
import { getByResourcePlannerData } from "@/lib/queries/planner";

export const dynamic = "force-dynamic";

export default async function ByResourcePlannerPage() {
  let data: Awaited<ReturnType<typeof getByResourcePlannerData>> | null = null;
  let error: string | null = null;

  try {
    data = await getByResourcePlannerData();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load planner data";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="By resource"
        description="Weekly timeline showing each resource's project allocations and out-of-office periods."
      />
      {error && <ErrorAlert message={error} />}
      {data && <ResourceTimeline data={data} />}
    </div>
  );
}
