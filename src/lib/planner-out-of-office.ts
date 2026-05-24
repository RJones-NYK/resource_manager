import { addDays } from "@/lib/weeks";

/** Mon–Fri indices within a planner week (weekStart is Monday). */
export const PLANNER_WORK_DAYS = 5;

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

export type OutOfOfficeDaySegment = {
  /** 0 = Monday … 4 = Friday */
  startDayIndex: number;
  dayCount: number;
};

export type OutOfOfficeRecordRange = {
  resourceId: string;
  startDate: string;
  endDate: string;
};

/** Weekday indices (Mon–Fri) that fall inside both the planner week and the OOO range. */
export function weekdayIndicesInWeekRange(
  weekStart: string,
  rangeStart: string,
  rangeEnd: string,
): number[] {
  const indices: number[] = [];
  for (let dayIndex = 0; dayIndex < PLANNER_WORK_DAYS; dayIndex++) {
    const date = addDays(weekStart, dayIndex);
    if (date >= rangeStart && date <= rangeEnd) {
      indices.push(dayIndex);
    }
  }
  return indices;
}

/** Group consecutive weekday indices into horizontal bar segments. */
export function mergeWeekdayIndices(indices: number[]): OutOfOfficeDaySegment[] {
  if (indices.length === 0) return [];

  const sorted = [...indices].sort((a, b) => a - b);
  const segments: OutOfOfficeDaySegment[] = [];
  let start = sorted[0]!;
  let count = 1;

  for (let i = 1; i < sorted.length; i++) {
    const dayIndex = sorted[i]!;
    if (dayIndex === start + count) {
      count += 1;
    } else {
      segments.push({ startDayIndex: start, dayCount: count });
      start = dayIndex;
      count = 1;
    }
  }

  segments.push({ startDayIndex: start, dayCount: count });
  return segments;
}

export function describeOutOfOfficeSegments(segments: OutOfOfficeDaySegment[]): string {
  if (segments.length === 0) return "Out of office";

  const parts = segments.map((segment) => {
    const start = WEEKDAY_LABELS[segment.startDayIndex]!;
    if (segment.dayCount === 1) return start;
    const end = WEEKDAY_LABELS[segment.startDayIndex + segment.dayCount - 1]!;
    return `${start}–${end}`;
  });

  const dayCount = segments.reduce((sum, segment) => sum + segment.dayCount, 0);
  const dayLabel = dayCount === 1 ? "1 day" : `${dayCount} days`;
  return `Out of office (${dayLabel}): ${parts.join(", ")}`;
}

export function buildOutOfOfficeCells(
  records: OutOfOfficeRecordRange[],
  weekStarts: string[],
): Map<string, OutOfOfficeDaySegment[]> {
  const byCell = new Map<string, Set<number>>();

  for (const record of records) {
    for (const weekStart of weekStarts) {
      const indices = weekdayIndicesInWeekRange(
        weekStart,
        record.startDate,
        record.endDate,
      );
      if (indices.length === 0) continue;

      const key = `${record.resourceId}:${weekStart}`;
      const days = byCell.get(key) ?? new Set<number>();
      for (const index of indices) {
        days.add(index);
      }
      byCell.set(key, days);
    }
  }

  const result = new Map<string, OutOfOfficeDaySegment[]>();
  for (const [key, days] of byCell) {
    result.set(key, mergeWeekdayIndices([...days]));
  }
  return result;
}
