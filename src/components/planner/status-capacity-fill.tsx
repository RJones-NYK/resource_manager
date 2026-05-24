import {
  fteLoadLevel,
  totalAllocatedFte,
  type FteLoadLevel,
} from "@/lib/planner-capacity";
import {
  PROJECT_STATUS_ORDER,
  projectStatusFillClassName,
  projectStatusLabel,
  type ProjectStatus,
} from "@/lib/project-status";
import type { PlannerAllocation } from "@/lib/queries/planner";

function fillSegmentClass(loadLevel: FteLoadLevel, status: ProjectStatus): string {
  if (loadLevel === "warning") return "bg-magenta/25";
  if (loadLevel === "notice") return "bg-cyan/20";
  return projectStatusFillClassName(status);
}

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
  leftOffsetPercent = 0,
  loadLevel: loadLevelOverride,
  loadContext,
}: {
  allocations: PlannerAllocation[];
  capacity: number;
  /** Horizontal offset after out-of-office (percent of cell width). */
  leftOffsetPercent?: number;
  /** When set, drives warning/notice colouring (e.g. resource total on by-project). */
  loadLevel?: FteLoadLevel;
  loadContext?: { scopeFte?: number; scopeLabel?: string };
}) {
  const totalFte = totalAllocatedFte(allocations);
  if (totalFte <= 0 || capacity <= 0) return null;

  const loadLevel = loadLevelOverride ?? fteLoadLevel(totalFte);
  const oooOffset = Math.max(0, Math.min(leftOffsetPercent, 100));
  const fillWidthPercent = Math.min((totalFte / capacity) * 100, 100 - oooOffset);
  if (fillWidthPercent <= 0) return null;
  const byStatus = fteByStatus(allocations);

  const segments: { status: ProjectStatus; widthPercent: number }[] = [];
  for (const status of PROJECT_STATUS_ORDER) {
    const fte = byStatus.get(status) ?? 0;
    if (fte <= 0) continue;
    segments.push({
      status,
      // Partition the outer fill (already sized to fillWidthPercent), not the full cell.
      widthPercent: (fte / totalFte) * 100,
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
      className="pointer-events-none absolute inset-y-0 z-0 overflow-hidden"
      style={{ left: `${oooOffset}%`, width: `${fillWidthPercent}%` }}
      title={[
        `${totalFte.toFixed(1)} / ${capacity.toFixed(1)} FTE on this view — ${breakdown}`,
        loadContext?.scopeFte != null &&
        loadContext.scopeLabel &&
        loadContext.scopeFte < totalFte - 0.001
          ? `${loadContext.scopeFte.toFixed(1)} FTE on ${loadContext.scopeLabel} in this cell`
          : null,
        loadLevel === "warning"
          ? "Over allocated across all projects"
          : loadLevel === "notice"
            ? "High utilisation across all projects"
            : null,
      ]
        .filter(Boolean)
        .join(". ")}
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
            <span className={`block h-full ${fillSegmentClass(loadLevel, status)}`} />
          </span>
        );
      })}
    </span>
  );
}
