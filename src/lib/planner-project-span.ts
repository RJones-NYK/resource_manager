import { addDays } from "@/lib/weeks";

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type ProjectWeekSpanRole = "before" | "start" | "within" | "end" | "after";

export type ProjectWeekSpan = {
  weekStart: string;
  role: ProjectWeekSpanRole;
  inSpan: boolean;
};

export function formatPlannerDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatProjectDateRange(
  startDate: string | null,
  endDate: string | null,
): string | null {
  if (!startDate && !endDate) return null;
  if (startDate && endDate) {
    if (startDate === endDate) return formatPlannerDate(startDate);
    return `${formatPlannerDate(startDate)} – ${formatPlannerDate(endDate)}`;
  }
  if (startDate) return `From ${formatPlannerDate(startDate)}`;
  return `Until ${formatPlannerDate(endDate!)}`;
}

/** True when any Mon–Fri day in the planner week overlaps the project date range. */
export function weekOverlapsProjectDates(
  weekStart: string,
  startDate: string | null,
  endDate: string | null,
  plannerRangeStart: string,
  plannerRangeEnd: string,
): boolean {
  const weekEnd = addDays(weekStart, 4);
  const effectiveStart = startDate ?? plannerRangeStart;
  const effectiveEnd = endDate ?? addDays(plannerRangeEnd, 4);

  return weekStart <= effectiveEnd && weekEnd >= effectiveStart;
}

export function buildProjectWeekSpans(
  weekStarts: string[],
  startDate: string | null,
  endDate: string | null,
): ProjectWeekSpan[] {
  if (weekStarts.length === 0) return [];
  if (!startDate && !endDate) {
    return weekStarts.map((weekStart) => ({
      weekStart,
      role: "after",
      inSpan: false,
    }));
  }

  const plannerRangeStart = weekStarts[0]!;
  const plannerRangeEnd = weekStarts[weekStarts.length - 1]!;

  const inSpanWeeks = weekStarts.filter((weekStart) =>
    weekOverlapsProjectDates(
      weekStart,
      startDate,
      endDate,
      plannerRangeStart,
      plannerRangeEnd,
    ),
  );

  if (inSpanWeeks.length === 0) {
    return weekStarts.map((weekStart) => ({
      weekStart,
      role: weekStart < (startDate ?? plannerRangeStart) ? "before" : "after",
      inSpan: false,
    }));
  }

  const firstInSpan = inSpanWeeks[0]!;
  const lastInSpan = inSpanWeeks[inSpanWeeks.length - 1]!;

  return weekStarts.map((weekStart) => {
    const inSpan = inSpanWeeks.includes(weekStart);
    if (!inSpan) {
      return {
        weekStart,
        role: weekStart < firstInSpan ? ("before" as const) : ("after" as const),
        inSpan: false,
      };
    }
    if (firstInSpan === lastInSpan) {
      return { weekStart, role: "start" as const, inSpan: true };
    }
    if (weekStart === firstInSpan) {
      return { weekStart, role: "start" as const, inSpan: true };
    }
    if (weekStart === lastInSpan) {
      return { weekStart, role: "end" as const, inSpan: true };
    }
    return { weekStart, role: "within" as const, inSpan: true };
  });
}
