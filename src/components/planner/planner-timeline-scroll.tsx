"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { GhostButton } from "@/components/ui/buttons";
import {
  currentWeekStart,
  getWeekPhase,
  resolvePlannerScrollWeek,
  type WeekColumn,
  type WeekPhase,
} from "@/lib/weeks";

export const PLANNER_STICKY_COLUMN_PX = 160;
export const PLANNER_WEEK_COLUMN_PX = 52;

export function usePlannerWeekPhases(weeks: WeekColumn[]) {
  const anchorWeekStart = useMemo(() => currentWeekStart(), []);
  const weekStarts = useMemo(() => weeks.map((week) => week.weekStart), [weeks]);
  const scrollWeekStart = useMemo(
    () => resolvePlannerScrollWeek(weekStarts, anchorWeekStart),
    [weekStarts, anchorWeekStart],
  );

  const getPhase = useCallback(
    (weekStart: string): WeekPhase => getWeekPhase(weekStart, anchorWeekStart),
    [anchorWeekStart],
  );

  return { anchorWeekStart, scrollWeekStart, getPhase };
}

export function plannerWeekHeaderClassName(phase: WeekPhase): string {
  const base =
    "min-w-[52px] max-w-[52px] border-r border-g200/60 px-1 py-2 text-center font-normal";
  if (phase === "past") return `${base} bg-g50/80`;
  if (phase === "current") return `${base} bg-teal-soft/50 ring-1 ring-inset ring-teal/30`;
  return base;
}

export function plannerWeekCellClassName(phase: WeekPhase, isSelected: boolean): string {
  const base =
    "relative min-w-[52px] max-w-[52px] border-r border-g200/60 px-0.5 py-1 align-top transition-colors select-none";
  if (isSelected) {
    return `${base} bg-teal-soft ring-1 ring-inset ring-teal/40`;
  }
  if (phase === "past") {
    return `${base} bg-g50/70 hover:bg-g50`;
  }
  if (phase === "current") {
    return `${base} bg-surface hover:bg-g50 ring-1 ring-inset ring-teal/25`;
  }
  return `${base} bg-surface hover:bg-g50`;
}

export function plannerSummaryCellClassName(phase: WeekPhase): string {
  const base = "border-r border-g200/60 px-0.5 py-1.5 text-center text-[10px]";
  if (phase === "past") return `${base} bg-g50/60 text-g500`;
  if (phase === "current") return `${base} bg-teal-soft/30 font-medium text-ink ring-1 ring-inset ring-teal/20`;
  return `${base} text-ink`;
}

function scrollContainerToWeek(
  container: HTMLElement,
  weekStart: string,
  behavior: ScrollBehavior,
) {
  const anchor = container.querySelector<HTMLElement>(
    `[data-planner-week="${weekStart}"]`,
  );
  if (!anchor) return;

  const containerRect = container.getBoundingClientRect();
  const anchorRect = anchor.getBoundingClientRect();
  const offset = anchorRect.left - containerRect.left + container.scrollLeft;
  const targetScroll =
    offset - PLANNER_STICKY_COLUMN_PX - PLANNER_WEEK_COLUMN_PX;

  container.scrollTo({
    left: Math.max(0, targetScroll),
    behavior,
  });
}

export function PlannerTimelineScroll({
  scrollWeekStart,
  children,
}: {
  scrollWeekStart: string;
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToWeek = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const container = scrollRef.current;
      if (!container) return;
      scrollContainerToWeek(container, scrollWeekStart, behavior);
    },
    [scrollWeekStart],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollToWeek("auto");
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollToWeek]);

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-g200 bg-surface">
      <div className="flex justify-end border-b border-g200 bg-g50/80 px-2 py-1">
        <GhostButton
          type="button"
          onClick={() => scrollToWeek("smooth")}
          className="px-2.5 py-1 text-[11px]"
        >
          Today
        </GhostButton>
      </div>
      <div ref={scrollRef} className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}
