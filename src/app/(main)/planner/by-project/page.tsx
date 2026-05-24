import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ProjectTimeline } from "@/components/planner/project-timeline";
import { ErrorAlert } from "@/components/ui/data-display";
import { getByProjectPlannerData } from "@/lib/queries/planner";

export const dynamic = "force-dynamic";

export default async function ByProjectPlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: projectId } = await searchParams;

  let data: Awaited<ReturnType<typeof getByProjectPlannerData>> | null = null;
  let error: string | null = null;

  try {
    data = await getByProjectPlannerData();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load planner data";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="By project"
        description="Weekly timeline showing all resources assigned to a project, with budget burn tracking."
      />
      {error && <ErrorAlert message={error} />}
      {data && (
        <Suspense fallback={null}>
          <ProjectTimeline data={data} initialProjectId={projectId} />
        </Suspense>
      )}
    </div>
  );
}
