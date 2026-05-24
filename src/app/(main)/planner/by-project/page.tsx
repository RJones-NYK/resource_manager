import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderTimeline } from "@/components/planner/placeholder-timeline";

export const dynamic = "force-dynamic";

export default function ByProjectPlannerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="By project"
        description="Weekly timeline showing all resources assigned to a project, with budget burn tracking."
      />
      <PlaceholderTimeline
        rowLabel="Resource"
        rows={["Alice", "Bob"]}
        columns={["W12", "W13", "W14", "W15"]}
        caption="Scaffold — project selector with resource rows × week columns"
      />
    </div>
  );
}
