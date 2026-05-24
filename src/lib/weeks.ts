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

/** Planner view: Jan 2026 through the week containing 27 Dec 2026 */
export function getPlannerYear2026Weeks(): WeekColumn[] {
  return generateWeekRange("2026-01-01", "2026-12-27");
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
