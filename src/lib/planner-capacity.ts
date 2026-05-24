import type { PlannerAllocation } from "@/lib/queries/planner";

/** Total allocated FTE above this value shows a high-utilisation notice. */
export const FTE_NOTICE_THRESHOLD = 0.8;

/** Total allocated FTE above this value shows an over-allocation warning. */
export const FTE_WARNING_THRESHOLD = 1;

export type FteLoadLevel = "normal" | "notice" | "warning";

export function totalAllocatedFte(allocations: PlannerAllocation[]): number {
  return allocations.reduce(
    (sum, allocation) => sum + Number(allocation.fteAllocated),
    0,
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

export function fteLoadLabel(level: FteLoadLevel, totalFte: number): string {
  const fte = totalFte.toFixed(1);
  if (level === "warning") {
    return `${fte} FTE allocated — over allocated (above ${FTE_WARNING_THRESHOLD} FTE)`;
  }
  if (level === "notice") {
    return `${fte} FTE allocated — high utilisation (above ${FTE_NOTICE_THRESHOLD} FTE)`;
  }
  return `${fte} FTE allocated`;
}
