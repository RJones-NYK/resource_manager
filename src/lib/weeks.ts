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

export type WeekColumn = {
  weekStart: string;
  weekNumber: number;
  weekCommencingLabel: string;
  monthYearLabel: string;
};

function parseDate(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`);
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/** Monday of the week containing the given date */
export function todayDateString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function currentWeekStart(): string {
  return toWeekStart(todayDateString());
}

export type WeekPhase = "past" | "current" | "future";

export function getWeekPhase(weekStart: string, anchorWeekStart?: string): WeekPhase {
  const anchor = anchorWeekStart ?? currentWeekStart();
  if (weekStart < anchor) return "past";
  if (weekStart === anchor) return "current";
  return "future";
}

/** Week to scroll to when the anchor week is outside the visible range */
export function resolvePlannerScrollWeek(
  weekStarts: string[],
  anchorWeekStart: string = currentWeekStart(),
): string {
  if (weekStarts.length === 0) return anchorWeekStart;
  if (weekStarts.includes(anchorWeekStart)) return anchorWeekStart;
  if (anchorWeekStart < weekStarts[0]!) return weekStarts[0]!;
  return weekStarts[weekStarts.length - 1]!;
}

export function toWeekStart(dateStr: string): string {
  const date = parseDate(dateStr);
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + offset);
  return formatDate(date);
}

/** ISO week number (weeks start Monday) */
export function getIsoWeekNumber(weekStart: string): number {
  const date = parseDate(weekStart);
  const thursday = new Date(date);
  thursday.setDate(thursday.getDate() + 3);
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((thursday.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return weekNumber;
}

function formatWeekCommencing(weekStart: string): string {
  const date = parseDate(weekStart);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

function formatMonthYear(weekStart: string): string {
  const date = parseDate(weekStart);
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function buildWeekColumn(weekStart: string): WeekColumn {
  return {
    weekStart,
    weekNumber: getIsoWeekNumber(weekStart),
    weekCommencingLabel: formatWeekCommencing(weekStart),
    monthYearLabel: formatMonthYear(weekStart),
  };
}

/** First Monday on or after the given date */
export function firstMondayOnOrAfter(dateStr: string): string {
  const date = parseDate(dateStr);
  const day = date.getDay();
  if (day === 1) return formatDate(date);
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  date.setDate(date.getDate() + daysUntilMonday);
  return formatDate(date);
}

export function generateWeekRange(
  rangeStart: string,
  rangeEnd: string,
): WeekColumn[] {
  const start = firstMondayOnOrAfter(rangeStart);
  const end = toWeekStart(rangeEnd);
  const weeks: WeekColumn[] = [];

  let current = start;
  while (current <= end) {
    weeks.push(buildWeekColumn(current));
    current = addDays(current, 7);
  }

  return weeks;
}

/** Planner view: Jan 2026 through the week containing 31 Dec 2027 */
export const PLANNER_VIEW_START = "2026-01-01";
export const PLANNER_VIEW_END = "2027-12-31";

export function getPlannerWeeks(): WeekColumn[] {
  return generateWeekRange(PLANNER_VIEW_START, PLANNER_VIEW_END);
}

/** @deprecated Use getPlannerWeeks */
export function getPlannerYear2026Weeks(): WeekColumn[] {
  return getPlannerWeeks();
}

export function plannerViewRangeLabel(weeks: WeekColumn[]): string {
  if (weeks.length === 0) return "";
  const start = weeks[0]!.monthYearLabel;
  const end = weeks[weeks.length - 1]!.monthYearLabel;
  return start === end ? start : `${start} – ${end}`;
}

export function weekRangeLabel(weekStarts: string[]): string {
  if (weekStarts.length === 0) return "";
  if (weekStarts.length === 1) {
    return buildWeekColumn(weekStarts[0]!).weekCommencingLabel;
  }
  const first = buildWeekColumn(weekStarts[0]!);
  const last = buildWeekColumn(weekStarts[weekStarts.length - 1]!);
  return `${first.weekCommencingLabel} – ${last.weekCommencingLabel}`;
}
