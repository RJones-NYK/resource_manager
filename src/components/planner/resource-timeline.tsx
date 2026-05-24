"use client";

import { Pencil } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { AllocationEditor } from "@/components/planner/allocation-editor";
import { ResourceExternalTag } from "@/components/ui/resource-tags";
import {
  editorAssignmentRowsForWeeks,
  type EditorAssignmentRow,
} from "@/lib/planner-assignment-rows";
import type {
  ByResourcePlannerData,
  PlannerAllocation,
} from "@/lib/queries/planner";
import {
  describeOutOfOfficeSegments,
  PLANNER_OOO_STRIPE_CLASS,
  PLANNER_WORK_DAYS,
  type OutOfOfficeDaySegment,
} from "@/lib/planner-out-of-office";
import { ProjectStatusLegend } from "@/components/planner/project-status-legend";
import {
  PlannerTimelineScroll,
  plannerWeekCellClassName,
  plannerWeekHeaderClassName,
  usePlannerWeekPhases,
} from "@/components/planner/planner-timeline-scroll";
import { CapacityLoadIndicator, CapacityLoadLegend } from "@/components/planner/capacity-load-indicator";
import { StatusCapacityFill } from "@/components/planner/status-capacity-fill";
import {
  fteLoadLevelForAllocations,
  totalAllocatedFte,
} from "@/lib/planner-capacity";
import { projectStatusLabel } from "@/lib/project-status";
import type { WeekColumn, WeekPhase } from "@/lib/weeks";

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
              <span className={`block h-full ${PLANNER_OOO_STRIPE_CLASS}`} />
            </span>
          </span>
        );
      })}
    </>
  );
}

function cellAllocationTitle(allocations: PlannerAllocation[]): string {
  return allocations
    .map(
      (allocation) =>
        `${allocation.projectName} (${projectStatusLabel(allocation.projectStatus)}) — ${allocation.fteAllocated} FTE`,
    )
    .join("\n");
}

function CellEditAffordance({
  allocations,
  onEdit,
}: {
  allocations: PlannerAllocation[];
  onEdit: () => void;
}) {
  if (allocations.length === 0) return null;

  return (
    <button
      type="button"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onEdit();
      }}
      className="absolute inset-0 z-[2] flex items-center justify-center opacity-0 transition-opacity group-hover/cell:opacity-100 focus-visible:opacity-100"
      title={cellAllocationTitle(allocations)}
      aria-label="Edit allocation"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-g200 bg-surface/95 text-g500 shadow-sm">
        <Pencil className="h-2.5 w-2.5" strokeWidth={2.25} aria-hidden />
      </span>
    </button>
  );
}

export function ResourceTimeline({ data }: { data: ByResourcePlannerData }) {
  const { scrollWeekStart, getPhase } = usePlannerWeekPhases(data.weeks);
  const weekStarts = useMemo(
    () => data.weeks.map((week) => week.weekStart),
    [data.weeks],
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
  const [existingAssignments, setExistingAssignments] = useState<
    EditorAssignmentRow[]
  >([]);
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
    (resourceId: string, resourceName: string, weeks: string[]) => {
      if (weeks.length === 0) return;
      setSelection({ resourceId, resourceName, weekStarts: weeks });
      setExistingAssignments(
        editorAssignmentRowsForWeeks(data.allocations, resourceId, weeks),
      );
      setDragPreview(null);
    },
    [data.allocations],
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
  ) => {
    openEditor(resourceId, resourceName, [weekStart]);
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
          key={`${selection.resourceId}:${selection.weekStarts.join(",")}`}
          selection={selection}
          projects={data.projects}
          existingAssignments={existingAssignments}
          onClose={() => {
            setSelection(null);
            setExistingAssignments([]);
          }}
        />
      )}

      <PlannerTimelineScroll scrollWeekStart={scrollWeekStart}>
          <table className="min-w-max border-collapse text-[12px]">
            <thead>
              <MonthYearHeaderRow weeks={data.weeks} />
              <tr className="border-b border-g200 bg-g50">
                <th className="sticky left-0 z-20 min-w-[160px] border-r border-g200 bg-g50 px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-g500">
                  Resource
                </th>
                {data.weeks.map((week) => (
                  <WeekHeaderCell
                    key={week.weekStart}
                    week={week}
                    phase={getPhase(week.weekStart)}
                  />
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
                    const weekPhase = getPhase(week.weekStart);
                    const oooSegments = oooSegmentsByCell.get(key) ?? [];
                    const cellAllocations = allocationsByCell.get(key) ?? [];
                    const capacity = Number(resource.defaultFte) || 1;
                    const totalFte = totalAllocatedFte(cellAllocations);
                    const loadLevel = fteLoadLevelForAllocations(cellAllocations);

                    return (
                      <td
                        key={week.weekStart}
                        className={plannerWeekCellClassName(
                          weekPhase,
                          isSelected,
                          isSelected ? "normal" : loadLevel,
                        )}
                        onPointerDown={() =>
                          handlePointerDown(resource.id, resource.name, week.weekStart)
                        }
                        onPointerEnter={() =>
                          handlePointerEnter(resource.id, week.weekStart)
                        }
                      >
                        <StatusCapacityFill
                          allocations={cellAllocations}
                          capacity={capacity}
                        />
                        <CapacityLoadIndicator level={loadLevel} totalFte={totalFte} />
                        <OooSegments segments={oooSegments} />
                        <div className="group/cell relative z-[2] min-h-[36px]">
                          <CellEditAffordance
                            allocations={cellAllocations}
                            onEdit={() =>
                              handleAllocationClick(
                                resource.id,
                                resource.name,
                                week.weekStart,
                              )
                            }
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
      </PlannerTimelineScroll>

      <div className="space-y-2">
        <ProjectStatusLegend />
        <CapacityLoadLegend />
        <p className="text-[11px] font-light text-g500">
          Jan–Dec 2026 ({data.weeks.length} weeks). Click or drag across weeks to edit
          allocations. Cell fill uses project status (active, planned, pipeline,
          etc.); magenta stripes show out-of-office. Hover an allocated week to edit.
        </p>
      </div>
    </div>
  );
}

export function WeekHeaderCell({ week, phase }: { week: WeekColumn; phase: WeekPhase }) {
  const weekNumberClass =
    phase === "past"
      ? "text-[10px] font-semibold text-g500"
      : "text-[10px] font-semibold text-teal-dark";
  const dateClass =
    phase === "past"
      ? "text-[10px] font-medium text-g500"
      : "text-[10px] font-medium text-ink";

  return (
    <th
      data-planner-week={week.weekStart}
      className={plannerWeekHeaderClassName(phase)}
    >
      <div className={weekNumberClass}>W{week.weekNumber}</div>
      <div className={dateClass}>{week.weekCommencingLabel}</div>
      <div className="text-[9px] font-light text-g500">{week.monthYearLabel}</div>
    </th>
  );
}

export function MonthYearHeaderRow({ weeks }: { weeks: WeekColumn[] }) {
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
