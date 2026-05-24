"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AllocationEditor } from "@/components/planner/allocation-editor";
import {
  PlannerTimelineScroll,
  plannerSummaryCellClassName,
  plannerWeekCellClassName,
  usePlannerWeekPhases,
} from "@/components/planner/planner-timeline-scroll";
import {
  MonthYearHeaderRow,
  WeekHeaderCell,
} from "@/components/planner/resource-timeline";
import {
  ProjectStatusBadge,
  ProjectStatusLegend,
} from "@/components/planner/project-status-legend";
import { ResourceExternalTag } from "@/components/ui/resource-tags";
import { projectStatusLabel } from "@/lib/project-status";
import { FieldLabel, SelectInput } from "@/components/ui/form-fields";
import type {
  ByProjectPlannerData,
  PlannerAllocation,
  PlannerProjectDetail,
  PlannerResource,
} from "@/lib/queries/planner";
import {
  describeOutOfOfficeSegments,
  PLANNER_OOO_STRIPE_CLASS,
  PLANNER_WORK_DAYS,
  type OutOfOfficeDaySegment,
} from "@/lib/planner-out-of-office";

const RESOURCE_PALETTE = [
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

function resourceColorIndex(resourceId: string, resourceIds: string[]) {
  const index = resourceIds.indexOf(resourceId);
  return index >= 0 ? index % RESOURCE_PALETTE.length : 0;
}

function allocationHours(fte: string, fteHoursPerWeek: string): number {
  return Number(fte) * Number(fteHoursPerWeek);
}

function defaultProjectId(
  projects: PlannerProjectDetail[],
  preferredId?: string | null,
): string {
  if (preferredId && projects.some((project) => project.id === preferredId)) {
    return preferredId;
  }
  const active = projects.find((project) => project.status === "active");
  return active?.id ?? projects[0]?.id ?? "";
}

function formatHours(value: number): string {
  if (value === 0) return "—";
  return value % 1 === 0 ? String(value) : value.toFixed(1);
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

function AllocationChip({
  allocation,
  resourceName,
  colorClass,
  onSelect,
}: {
  allocation: PlannerAllocation;
  resourceName: string;
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
      title={`${resourceName} — ${allocation.fteAllocated} FTE`}
    >
      <span className="block truncate">{resourceName}</span>
      <span className="font-light opacity-80">{allocation.fteAllocated}</span>
    </button>
  );
}

function BudgetSummary({
  project,
  totalBurned,
}: {
  project: PlannerProjectDetail;
  totalBurned: number;
}) {
  const budget = project.totalHoursBudgeted
    ? Number(project.totalHoursBudgeted)
    : null;

  if (budget === null) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-[13px] font-light text-g500">
        <ProjectStatusBadge status={project.status} />
        <p>
          <span className="font-medium text-ink">{formatHours(totalBurned)} h</span> planned
          in 2026 — no budget set for this project.
        </p>
      </div>
    );
  }

  const remaining = budget - totalBurned;
  const percentUsed = budget > 0 ? Math.min((totalBurned / budget) * 100, 100) : 0;
  const isOverBudget = totalBurned > budget + 0.01;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
        <ProjectStatusBadge status={project.status} />
        <span className="font-medium text-ink">
          {formatHours(totalBurned)} / {formatHours(budget)} h
        </span>
        <span className={isOverBudget ? "text-magenta font-medium" : "text-g500"}>
          {isOverBudget
            ? `${formatHours(totalBurned - budget)} h over budget`
            : `${formatHours(remaining)} h remaining`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-g100">
        <div
          className={`h-full transition-all ${isOverBudget ? "bg-magenta" : "bg-teal"}`}
          style={{ width: `${percentUsed}%` }}
        />
      </div>
    </div>
  );
}

export function ProjectTimeline({
  data,
  initialProjectId,
}: {
  data: ByProjectPlannerData;
  initialProjectId?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { scrollWeekStart, getPhase } = usePlannerWeekPhases(data.weeks);

  const weekStarts = useMemo(
    () => data.weeks.map((week) => week.weekStart),
    [data.weeks],
  );

  const resourceIds = useMemo(
    () => data.resources.map((resource) => resource.id),
    [data.resources],
  );

  const resourcesById = useMemo(() => {
    const map = new Map<string, PlannerResource>();
    for (const resource of data.resources) {
      map.set(resource.id, resource);
    }
    return map;
  }, [data.resources]);

  const [selectedProjectId, setSelectedProjectId] = useState(() =>
    defaultProjectId(data.projects, initialProjectId),
  );

  useEffect(() => {
    if (initialProjectId) {
      setSelectedProjectId(defaultProjectId(data.projects, initialProjectId));
    }
  }, [initialProjectId, data.projects]);

  const selectedProject = useMemo(
    () => data.projects.find((project) => project.id === selectedProjectId),
    [data.projects, selectedProjectId],
  );

  const projectAllocations = useMemo(
    () => data.allocations.filter((allocation) => allocation.projectId === selectedProjectId),
    [data.allocations, selectedProjectId],
  );

  const allocationsByCell = useMemo(() => {
    const map = new Map<string, PlannerAllocation[]>();
    for (const allocation of projectAllocations) {
      const key = cellKey(allocation.resourceId, allocation.weekStart);
      const existing = map.get(key) ?? [];
      existing.push(allocation);
      map.set(key, existing);
    }
    return map;
  }, [projectAllocations]);

  const oooSegmentsByCell = useMemo(() => {
    const map = new Map<string, OutOfOfficeDaySegment[]>();
    for (const entry of data.outOfOfficeCells) {
      map.set(cellKey(entry.resourceId, entry.weekStart), entry.segments);
    }
    return map;
  }, [data.outOfOfficeCells]);

  const weeklyHours = useMemo(() => {
    const hoursByWeek = new Map<string, number>();
    for (const allocation of projectAllocations) {
      const resource = resourcesById.get(allocation.resourceId);
      if (!resource) continue;
      const hours = allocationHours(allocation.fteAllocated, resource.fteHoursPerWeek);
      hoursByWeek.set(
        allocation.weekStart,
        (hoursByWeek.get(allocation.weekStart) ?? 0) + hours,
      );
    }
    return hoursByWeek;
  }, [projectAllocations, resourcesById]);

  const cumulativeHoursByWeek = useMemo(() => {
    let running = 0;
    return data.weeks.map((week) => {
      running += weeklyHours.get(week.weekStart) ?? 0;
      return { weekStart: week.weekStart, cumulative: running };
    });
  }, [data.weeks, weeklyHours]);

  const totalBurned = cumulativeHoursByWeek[cumulativeHoursByWeek.length - 1]?.cumulative ?? 0;

  const [selection, setSelection] = useState<Selection | null>(null);
  const [editorDefaults, setEditorDefaults] = useState<{ fte?: string }>({});
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

  const handleProjectChange = useCallback(
    (projectId: string) => {
      setSelectedProjectId(projectId);
      setSelection(null);
      const params = new URLSearchParams(searchParams.toString());
      if (projectId) {
        params.set("project", projectId);
      } else {
        params.delete("project");
      }
      const query = params.toString();
      router.replace(query ? `?${query}` : "/planner/by-project", { scroll: false });
    },
    [router, searchParams],
  );

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
    (resourceId: string, resourceName: string, weeks: string[], defaults?: { fte?: string }) => {
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
    const weeks = dragPreview?.weekStarts ?? [dragRef.current.anchorWeek];
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
      fte: allocation.fteAllocated,
    });
  };

  if (data.projects.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-g200 bg-surface px-6 py-10 text-center">
        <p className="text-[14px] font-medium text-ink">No projects</p>
        <p className="mt-1 text-[13px] font-light text-g500">
          Add a project in Admin → Projects to start planning allocations.
        </p>
      </div>
    );
  }

  if (data.resources.length === 0) {
    return (
      <div className="rounded-[var(--radius)] border border-g200 bg-surface px-6 py-10 text-center">
        <p className="text-[14px] font-medium text-ink">No active resources</p>
        <p className="mt-1 text-[13px] font-light text-g500">
          Add team members in Admin → Resources to assign time to this project.
        </p>
      </div>
    );
  }

  return (
    <div
      className="space-y-4"
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[240px] flex-1">
          <FieldLabel htmlFor="planner-project">Project</FieldLabel>
          <SelectInput
            id="planner-project"
            value={selectedProjectId}
            onChange={(event) => handleProjectChange(event.target.value)}
            options={data.projects.map((project) => {
              const status = projectStatusLabel(project.status);
              const name = project.client
                ? `${project.name} (${project.client})`
                : project.name;
              return { value: project.id, label: `${name} — ${status}` };
            })}
          />
        </div>
        {selectedProject && (
          <div className="min-w-[200px] flex-1 rounded-[var(--radius)] border border-g200 bg-g50/80 px-4 py-3">
            <BudgetSummary project={selectedProject} totalBurned={totalBurned} />
          </div>
        )}
      </div>

      {selection && selectedProject && (
        <AllocationEditor
          selection={selection}
          projects={data.projects}
          fixedProject={selectedProject}
          initialFte={editorDefaults.fte}
          onClose={() => {
            setSelection(null);
            setEditorDefaults({});
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

                    return (
                      <td
                        key={week.weekStart}
                        className={plannerWeekCellClassName(weekPhase, isSelected)}
                        onPointerDown={() =>
                          handlePointerDown(resource.id, resource.name, week.weekStart)
                        }
                        onPointerEnter={() =>
                          handlePointerEnter(resource.id, week.weekStart)
                        }
                      >
                        <OooSegments segments={oooSegments} />
                        <div className="relative z-[2] min-h-[36px]">
                          {cellAllocations.map((allocation) => {
                            const colorIndex = resourceColorIndex(
                              allocation.resourceId,
                              resourceIds,
                            );
                            const palette = RESOURCE_PALETTE[colorIndex]!;
                            return (
                              <AllocationChip
                                key={`${allocation.resourceId}-${allocation.fteAllocated}`}
                                allocation={allocation}
                                resourceName={resource.name}
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
              <tr className="border-t border-g200 bg-g50/60">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-g200 bg-g50/80 px-4 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-g500"
                >
                  Hours / wk
                </th>
                {data.weeks.map((week) => (
                  <td
                    key={week.weekStart}
                    className={plannerSummaryCellClassName(getPhase(week.weekStart))}
                  >
                    {formatHours(weeklyHours.get(week.weekStart) ?? 0)}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-g200/80 bg-g50/40">
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r border-g200 bg-g50/60 px-4 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-g500"
                >
                  Cumulative
                </th>
                {cumulativeHoursByWeek.map(({ weekStart, cumulative }) => (
                  <td
                    key={weekStart}
                    className={`${plannerSummaryCellClassName(getPhase(weekStart))} font-light`}
                  >
                    {formatHours(cumulative)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
      </PlannerTimelineScroll>

      <div className="space-y-2">
        <ProjectStatusLegend />
        <p className="text-[11px] font-light text-g500">
          Jan–Dec 2026 ({data.weeks.length} weeks). Select a project, then click or drag
          across weeks on a resource row to assign FTE. Hours use each person&apos;s FTE
          hours/week; cumulative row tracks budget burn.
        </p>
      </div>
    </div>
  );
}
