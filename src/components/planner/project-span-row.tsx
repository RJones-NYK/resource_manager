import { plannerSummaryCellClassName } from "@/components/planner/planner-timeline-scroll";
import {
  formatProjectDateRange,
  type ProjectWeekSpan,
} from "@/lib/planner-project-span";
import { projectStatusFillClassName } from "@/lib/project-status";
import type { WeekColumn, WeekPhase } from "@/lib/weeks";

function barClassName(span: ProjectWeekSpan, singleWeek: boolean, fillClass: string): string {
  if (singleWeek) return `${fillClass} rounded-sm`;
  if (span.role === "start") return `${fillClass} rounded-l-sm`;
  if (span.role === "end") return `${fillClass} rounded-r-sm`;
  return fillClass;
}

export function ProjectSpanRow({
  weeks,
  spansByWeek,
  startDate,
  endDate,
  status,
  getPhase,
}: {
  weeks: WeekColumn[];
  spansByWeek: Map<string, ProjectWeekSpan>;
  startDate: string | null;
  endDate: string | null;
  status: string;
  getPhase: (weekStart: string) => WeekPhase;
}) {
  const dateLabel = formatProjectDateRange(startDate, endDate);
  const fillClass = projectStatusFillClassName(status);
  const inSpanCount = [...spansByWeek.values()].filter((span) => span.inSpan).length;
  const singleWeek = inSpanCount === 1;

  return (
    <tr className="border-b border-g200/80 bg-g50/40">
      <th
        scope="row"
        className="sticky left-0 z-10 border-r border-g200 bg-g50/80 px-4 py-1.5 text-left"
      >
        <div className="text-[10px] font-semibold uppercase tracking-wide text-g500">
          Project dates
        </div>
        {dateLabel ? (
          <div className="mt-0.5 text-[11px] font-medium text-ink">{dateLabel}</div>
        ) : (
          <div className="mt-0.5 text-[11px] font-light text-g500">
            Not set — add dates in Admin → Projects
          </div>
        )}
      </th>
      {weeks.map((week) => {
        const span = spansByWeek.get(week.weekStart) ?? {
          weekStart: week.weekStart,
          role: "after" as const,
          inSpan: false,
        };
        const phase = getPhase(week.weekStart);
        const base = plannerSummaryCellClassName(phase).replace(
          " py-1.5",
          " relative h-7 py-0",
        );

        return (
          <td
            key={week.weekStart}
            className={base}
            title={
              span.inSpan && dateLabel
                ? `Within project dates (${dateLabel})`
                : undefined
            }
          >
            {span.inSpan ? (
              <span
                className="pointer-events-none absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2"
                aria-hidden
              >
                <span
                  className={`block h-full ${barClassName(span, singleWeek, fillClass)}`}
                />
              </span>
            ) : null}
          </td>
        );
      })}
    </tr>
  );
}
