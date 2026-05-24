import type { PlannerAllocation } from "@/lib/queries/planner";

export type EditorAssignmentRow = {
  projectId: string;
  fte: string;
};

/** Union of projects across selected weeks; FTE when consistent, else a sensible default. */
export function editorAssignmentRowsForWeeks(
  allocations: PlannerAllocation[],
  resourceId: string,
  weekStarts: string[],
): EditorAssignmentRow[] {
  const byProject = new Map<string, { fte: string; varies: boolean }>();

  for (const weekStart of weekStarts) {
    for (const allocation of allocations) {
      if (allocation.resourceId !== resourceId || allocation.weekStart !== weekStart) {
        continue;
      }
      const existing = byProject.get(allocation.projectId);
      if (!existing) {
        byProject.set(allocation.projectId, {
          fte: allocation.fteAllocated,
          varies: false,
        });
        continue;
      }
      if (existing.fte !== allocation.fteAllocated) {
        existing.varies = true;
      }
    }
  }

  return Array.from(byProject.entries())
    .map(([projectId, { fte, varies }]) => ({
      projectId,
      fte: varies ? "0.5" : fte,
    }))
    .sort((a, b) => a.projectId.localeCompare(b.projectId));
}
