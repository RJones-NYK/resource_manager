import type { PlannerAllocation } from "@/lib/queries/planner";
import {
  PLANNER_WORK_DAYS,
  totalOutOfOfficeDays,
  type OutOfOfficeDaySegment,
} from "@/lib/planner-out-of-office";

/** Total committed FTE above this value shows a high-utilisation notice. */
export const FTE_NOTICE_THRESHOLD = 0.8;

/** Total committed FTE above this value shows an over-allocation warning. */
export const FTE_WARNING_THRESHOLD = 1;

export type FteLoadLevel = "normal" | "notice" | "warning";

export function totalAllocatedFte(allocations: PlannerAllocation[]): number {
  return allocations.reduce(
    (sum, allocation) => sum + Number(allocation.fteAllocated),
    0,
  );
}

/** Out-of-office days expressed as FTE against the resource's weekly capacity. */
export function outOfOfficeFteEquivalent(
  segments: OutOfOfficeDaySegment[],
  capacity: number,
): number {
  const days = totalOutOfOfficeDays(segments);
  if (days <= 0 || capacity <= 0) return 0;
  return (days / PLANNER_WORK_DAYS) * capacity;
}

/** Allocations plus out-of-office for utilisation thresholds and indicators. */
export function totalResourceLoadFte(
  allocations: PlannerAllocation[],
  oooSegments: OutOfOfficeDaySegment[],
  capacity: number,
): number {
  return (
    totalAllocatedFte(allocations) + outOfOfficeFteEquivalent(oooSegments, capacity)
  );
}

export function fteLoadLevel(totalFte: number): FteLoadLevel {
  if (totalFte > FTE_WARNING_THRESHOLD + 0.001) return "warning";
  if (totalFte > FTE_NOTICE_THRESHOLD + 0.001) return "notice";
  return "normal";
}

export function fteLoadLevelForAllocations(
  allocations: PlannerAllocation[],
): FteLoadLevel {
  return fteLoadLevel(totalAllocatedFte(allocations));
}

export function fteLoadLevelForResourceWeek(
  allocations: PlannerAllocation[],
  oooSegments: OutOfOfficeDaySegment[],
  capacity: number,
): FteLoadLevel {
  return fteLoadLevel(totalResourceLoadFte(allocations, oooSegments, capacity));
}

export type WeekCellAllocationLayout = {
  leftPercent: number;
  widthPercent: number;
};

/** Lay allocation fill after out-of-office so the cell builds left-to-right to 100%. */
export function weekCellAllocationLayout(
  totalFte: number,
  capacity: number,
  oooWidthPercent: number,
): WeekCellAllocationLayout {
  const oooWidth = Math.max(0, Math.min(oooWidthPercent, 100));
  if (totalFte <= 0 || capacity <= 0) {
    return { leftPercent: oooWidth, widthPercent: 0 };
  }

  const rawFillPercent = (totalFte / capacity) * 100;
  return {
    leftPercent: oooWidth,
    widthPercent: Math.min(rawFillPercent, 100 - oooWidth),
  };
}

export type FteLoadContext = {
  /** FTE in the focused scope (e.g. current project) when it differs from the resource total. */
  scopeFte?: number;
  scopeLabel?: string;
  /** Project allocations included in the load total (excluding out of office). */
  allocatedFte?: number;
  /** Out-of-office component of the load total. */
  oooFte?: number;
};

function fteLoadSummary(totalFte: number, context?: FteLoadContext): string {
  const allocated = context?.allocatedFte;
  const ooo = context?.oooFte ?? 0;
  const hasOoo = ooo > 0.001;

  let summary: string;
  if (hasOoo && allocated != null) {
    summary = `${totalFte.toFixed(1)} FTE committed (${allocated.toFixed(1)} allocated, ${ooo.toFixed(1)} out of office)`;
  } else if (allocated != null) {
    summary = `${allocated.toFixed(1)} FTE allocated`;
  } else {
    summary = `${totalFte.toFixed(1)} FTE committed`;
  }

  if (
    context?.scopeFte != null &&
    context.scopeLabel &&
    allocated != null &&
    context.scopeFte < allocated - 0.001
  ) {
    return `${context.scopeFte.toFixed(1)} FTE on ${context.scopeLabel}; ${summary}`;
  }
  return summary;
}

export function fteLoadLabel(
  level: FteLoadLevel,
  totalFte: number,
  context?: FteLoadContext,
): string {
  const summary = fteLoadSummary(totalFte, context);
  if (level === "warning") {
    return `${summary} — over allocated (above ${FTE_WARNING_THRESHOLD} FTE)`;
  }
  if (level === "notice") {
    return `${summary} — high utilisation (above ${FTE_NOTICE_THRESHOLD} FTE)`;
  }
  return summary;
}
