import {
  PROJECT_STATUS_ORDER,
  projectStatusFillClassName,
  projectStatusLabel,
  type ProjectStatus,
} from "@/lib/project-status";
import type { PlannerAllocation } from "@/lib/queries/planner";

function fteByStatus(allocations: PlannerAllocation[]): Map<ProjectStatus, number> {
  const map = new Map<ProjectStatus, number>();
  for (const allocation of allocations) {
    const status = allocation.projectStatus;
    if (!PROJECT_STATUS_ORDER.includes(status as ProjectStatus)) continue;
    const key = status as ProjectStatus;
    map.set(key, (map.get(key) ?? 0) + Number(allocation.fteAllocated));
  }
  return map;
}

export function StatusCapacityFill({
  allocations,
  capacity,
}: {
  allocations: PlannerAllocation[];
  capacity: number;
}) {
  const totalFte = allocations.reduce(
    (sum, allocation) => sum + Number(allocation.fteAllocated),
    0,
  );
  if (totalFte <= 0 || capacity <= 0) return null;

  const isOverAllocated = totalFte > capacity + 0.001;
  const fillWidthPercent = Math.min((totalFte / capacity) * 100, 100);
  const byStatus = fteByStatus(allocations);

  const segments: { status: ProjectStatus; widthPercent: number }[] = [];
  for (const status of PROJECT_STATUS_ORDER) {
    const fte = byStatus.get(status) ?? 0;
    if (fte <= 0) continue;
    segments.push({
      status,
      widthPercent: (fte / totalFte) * fillWidthPercent,
    });
  }

  const breakdown = segments
    .map(
      ({ status }) =>
        `${projectStatusLabel(status)}: ${(byStatus.get(status) ?? 0).toFixed(1)} FTE`,
    )
    .join(", ");

  return (
    <span
      className="pointer-events-none absolute inset-y-0 left-0 z-0 overflow-hidden"
      style={{ width: `${fillWidthPercent}%` }}
      title={`${totalFte.toFixed(1)} / ${capacity.toFixed(1)} FTE — ${breakdown}${isOverAllocated ? " (over-allocated)" : ""}`}
    >
      {segments.map(({ status, widthPercent }, index) => {
        const leftPercent = segments
          .slice(0, index)
          .reduce((sum, segment) => sum + segment.widthPercent, 0);

        return (
          <span
            key={status}
            className="absolute inset-y-0 overflow-hidden"
            style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
          >
            <span
              className={`block h-full ${
                isOverAllocated ? "bg-magenta/20" : projectStatusFillClassName(status)
              }`}
            />
          </span>
        );
      })}
    </span>
  );
}
