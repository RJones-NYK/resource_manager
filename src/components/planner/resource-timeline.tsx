"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { AllocationEditor } from "@/components/planner/allocation-editor";
import { ResourceExternalTag } from "@/components/ui/resource-tags";
import type {
  ByResourcePlannerData,
  PlannerAllocation,
} from "@/lib/queries/planner";
import {
  describeOutOfOfficeSegments,
  PLANNER_WORK_DAYS,
  type OutOfOfficeDaySegment,
} from "@/lib/planner-out-of-office";
import type { WeekColumn } from "@/lib/weeks";

const PROJECT_PALETTE = [
  { chip: "bg-teal-soft text-teal-dark border-teal/30" },
  { chip: "bg-cyan/10 text-cyan border-cyan/30" },
  { chip: "bg-magenta-soft text-magenta border-magenta/30" },
  { chip: "bg-g100 text-g700 border-g200" },
  { chip: "bg-teal-muted text-teal-dark border-teal/20" },
] as const;

type Selection = {
  resourceId: string;
  resourceName: string;
  weekStarts: string[];
};

function cellKey(resourceId: string, weekStart: string) {
  return `${resourceId}:${weekStart}`;
}

function weekRangeBetween(
  anchor: string,
  target: string,
  weekStarts: string[],
): string[] {
  const anchorIndex = weekStarts.indexOf(anchor);
  const targetIndex = weekStarts.indexOf(target);
  if (anchorIndex === -1 || targetIndex === -1) return [];
  const [start, end] =
    anchorIndex <= targetIndex
      ? [anchorIndex, targetIndex]
      : [targetIndex, anchorIndex];
  return weekStarts.slice(start, end + 1);
}

function projectColorIndex(projectId: string, projectIds: string[]) {
  const index = projectIds.indexOf(projectId);
  return index >= 0 ? index % PROJECT_PALETTE.length : 0;
}

function sumCellFte(allocations: PlannerAllocation[]): number {
  return allocations.reduce((sum, allocation) => sum + Number(allocation.fteAllocated), 0);
}

const OOO_STRIPE =
  "bg-[repeating-linear-gradient(-45deg,transparent,transparent_4px,rgba(177,96,142,0.12)_4px,rgba(177,96,142,0.12)_8px)]";

function OooSegments({ segments }: { segments: OutOfOfficeDaySegment[] }) {
  if (segments.length === 0) return null;

  return (
    <>
      {segments.map((segment) => {
        const leftPercent = (segment.startDayIndex / PLANNER_WORK_DAYS) * 100;
        const widthPercent = (segment.dayCount / PLANNER_WORK_DAYS) * 100;

        return (
          <span
            key={`${segment.startDayIndex}-${segment.dayCount}`}
            className="pointer-events-none absolute inset-y-0 z-[1] overflow-hidden"
            style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
            title={describeOutOfOfficeSegments([segment])}
          >
            <span className="block h-full bg-magenta/10">
              <span className={`block h-full ${OOO_STRIPE}`} />
            </span>
          </span>
        );
      })}
    </>
  );
}

function CapacityFill({
  totalFte,
  capacity,
}: {
  totalFte: number;
  capacity: number;
}) {
  if (totalFte <= 0) return null;

  const fillPercent = Math.min((totalFte / capacity) * 100, 100);
  const isOverAllocated = totalFte > capacity + 0.001;

  return (
    <span
      className="pointer-events-none absolute inset-y-0 left-0 z-0 overflow-hidden"
      style={{ width: `${fillPercent}%` }}
      title={`${totalFte.toFixed(1)} / ${capacity.toFixed(1)} FTE${isOverAllocated ? " (over-allocated)" : ""}`}
    >
      <span
        className={`block h-full ${isOverAllocated ? "bg-magenta/20" : "bg-teal/20"}`}
      />
    </span>
  );
}

function AllocationChip({
  allocation,
  colorClass,
  onSelect,
}: {
  allocation: PlannerAllocation;
  colorClass: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      className={`mb-0.5 block w-full truncate rounded border px-1 py-0.5 text-left text-[10px] font-medium leading-tight ${colorClass}`}
      title={`${allocation.projectName} — ${allocation.fteAllocated} FTE`}
    >
      <span className="block truncate">{allocation.projectName}</span>
      <span className="font-light opacity-80">{allocation.fteAllocated}</span>
    </button>
  );
}

export function ResourceTimeline({ data }: { data: ByResourcePlannerData }) {
  const weekStarts = useMemo(
    () => data.weeks.map((week) => week.weekStart),
    [data.weeks],
  );

  const projectIds = useMemo(
    () => data.projects.map((project) => project.id),
    [data.projects],
  );

  const allocationsByCell = useMemo(() => {
    const map = new Map<string, PlannerAllocation[]>();
    for (const allocation of data.allocations) {
      const key = cellKey(allocation.resourceId, allocation.weekStart);
      const existing = map.get(key) ?? [];
      existing.push(allocation);
      map.set(key, existing);
    }
    return map;
  }, [data.allocations]);

  const oooSegmentsByCell = useMemo(() => {
    const map = new Map<string, OutOfOfficeDaySegment[]>();
    for (const entry of data.outOfOfficeCells) {
      map.set(cellKey(entry.resourceId, entry.weekStart), entry.segments);
    }
    return map;
  }, [data.outOfOfficeCells]);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [editorDefaults, setEditorDefaults] = useState<{
    projectId?: string;
    fte?: string;
  }>({});
  const dragRef = useRef<{
    resourceId: string;
    resourceName: string;
    anchorWeek: string;
  } | null>(null);
  const [dragPreview, setDragPreview] = useState<{
    resourceId: string;
    weekStarts: string[];
  } | null>(null);
  const isDraggingRef = useRef(false);

  const isWeekSelected = useCallback(
    (resourceId: string, weekStart: string) => {
      if (dragPreview?.resourceId === resourceId) {
        return dragPreview.weekStarts.includes(weekStart);
      }
      if (selection?.resourceId === resourceId) {
        return selection.weekStarts.includes(weekStart);
      }
      return false;
    },
    [dragPreview, selection],
  );

  const openEditor = useCallback(
    (
      resourceId: string,
      resourceName: string,
      weeks: string[],
      defaults?: { projectId?: string; fte?: string },
    ) => {
      if (weeks.length === 0) return;
      setSelection({ resourceId, resourceName, weekStarts: weeks });
      setEditorDefaults(defaults ?? {});
      setDragPreview(null);
    },
    [],
  );

  const handlePointerDown = (
    resourceId: string,
    resourceName: string,
    weekStart: string,
  ) => {
    isDraggingRef.current = true;
    dragRef.current = { resourceId, resourceName, anchorWeek: weekStart };
    setDragPreview({ resourceId, weekStarts: [weekStart] });
    setSelection(null);
  };

  const handlePointerEnter = (resourceId: string, weekStart: string) => {
    if (!isDraggingRef.current || !dragRef.current) return;
    if (dragRef.current.resourceId !== resourceId) return;
    setDragPreview({
      resourceId,
      weekStarts: weekRangeBetween(
        dragRef.current.anchorWeek,
        weekStart,
        weekStarts,
      ),
    });
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current || !dragRef.current) return;
    const weeks =
      dragPreview?.weekStarts ?? [dragRef.current.anchorWeek];
    openEditor(dragRef.current.resourceId, dragRef.current.resourceName, weeks);
    isDraggingRef.current = false;
    dragRef.current = null;
  };

  const handleAllocationClick = (
    resourceId: string,
    resourceName: string,
    weekStart: string,
    allocation: PlannerAllocation,
  ) => {
    openEditor(resourceId, resourceName, [weekStart], {
      projectId: allocation.projectId,
      fte: allocation.fteAllocated,
    });
  };

  if (data.resources.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-g200 bg-surface px-6 py-10 text-center">
        <p className="text-[14px] font-medium text-ink">No active resources</p>
        <p className="mt-1 text-[13px] font-light text-g500">
          Add team members in Admin → Resources to start planning allocations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4" onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
      {selection && (
        <AllocationEditor
          selection={selection}
          projects={data.projects}
          initialProjectId={editorDefaults.projectId}
          initialFte={editorDefaults.fte}
          onClose={() => {
            setSelection(null);
            setEditorDefaults({});
          }}
        />
      )}

      <div className="overflow-hidden rounded-[var(--radius)] border border-g200 bg-surface">
        <div className="overflow-x-auto">
          <table className="min-w-max border-collapse text-[12px]">
            <thead>
              <MonthYearHeaderRow weeks={data.weeks} />
              <tr className="border-b border-g200 bg-g50">
                <th className="sticky left-0 z-20 min-w-[160px] border-r border-g200 bg-g50 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-g500">
                  Resource
                </th>
                {data.weeks.map((week) => (
                  <WeekHeaderCell key={week.weekStart} week={week} />
                ))}
              </tr>
            </thead>
            <tbody>
              {data.resources.map((resource) => (
                <tr key={resource.id} className="border-b border-g200/80">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-g200 bg-surface px-4 py-2 text-left font-medium text-ink"
                  >
                    <span className="flex flex-wrap items-center gap-1.5">
                      {resource.name}
                      {resource.isExternal ? <ResourceExternalTag /> : null}
                    </span>
                  </th>
                  {data.weeks.map((week) => {
                    const key = cellKey(resource.id, week.weekStart);
                    const isSelected = isWeekSelected(resource.id, week.weekStart);
                    const oooSegments = oooSegmentsByCell.get(key) ?? [];
                    const cellAllocations = allocationsByCell.get(key) ?? [];
                    const totalFte = sumCellFte(cellAllocations);
                    const capacity = Number(resource.defaultFte) || 1;

                    return (
                      <td
                        key={week.weekStart}
                        className={`relative min-w-[52px] max-w-[52px] border-r border-g200/60 px-0.5 py-1 align-top transition-colors select-none ${
                          isSelected
                            ? "bg-teal-soft ring-1 ring-inset ring-teal/40"
                            : "bg-surface hover:bg-g50"
                        }`}
                        onPointerDown={() =>
                          handlePointerDown(resource.id, resource.name, week.weekStart)
                        }
                        onPointerEnter={() =>
                          handlePointerEnter(resource.id, week.weekStart)
                        }
                      >
                        <CapacityFill totalFte={totalFte} capacity={capacity} />
                        <OooSegments segments={oooSegments} />
                        <div className="relative z-[2] min-h-[36px]">
                          {cellAllocations.map((allocation) => {
                            const colorIndex = projectColorIndex(
                              allocation.projectId,
                              projectIds,
                            );
                            const palette = PROJECT_PALETTE[colorIndex]!;
                            return (
                              <AllocationChip
                                key={`${allocation.projectId}-${allocation.fteAllocated}`}
                                allocation={allocation}
                                colorClass={palette.chip}
                                onSelect={() =>
                                  handleAllocationClick(
                                    resource.id,
                                    resource.name,
                                    week.weekStart,
                                    allocation,
                                  )
                                }
                              />
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] font-light text-g500">
        Jan–Dec 2026 ({data.weeks.length} weeks). Click or drag across weeks to assign
        project time. Teal fill shows capacity used; magenta stripes show out-of-office
        (Mon–Fri, proportional to days away).
      </p>
    </div>
  );
}

function WeekHeaderCell({ week }: { week: WeekColumn }) {
  return (
    <th className="min-w-[52px] max-w-[52px] border-r border-g200/60 px-1 py-2 text-center font-normal">
      <div className="text-[10px] font-semibold text-teal-dark">W{week.weekNumber}</div>
      <div className="text-[10px] font-medium text-ink">{week.weekCommencingLabel}</div>
      <div className="text-[9px] font-light text-g500">{week.monthYearLabel}</div>
    </th>
  );
}

function MonthYearHeaderRow({ weeks }: { weeks: WeekColumn[] }) {
  const spans: { label: string; count: number }[] = [];
  for (const week of weeks) {
    const last = spans[spans.length - 1];
    if (last?.label === week.monthYearLabel) {
      last.count += 1;
    } else {
      spans.push({ label: week.monthYearLabel, count: 1 });
    }
  }

  return (
    <tr className="border-b border-g200/80 bg-g50/80">
      <th className="sticky left-0 z-20 border-r border-g200 bg-g50/80" />
      {spans.map((span) => (
        <th
          key={span.label}
          colSpan={span.count}
          className="border-r border-g200/60 px-1 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-g500"
        >
          {span.label}
        </th>
      ))}
    </tr>
  );
}
