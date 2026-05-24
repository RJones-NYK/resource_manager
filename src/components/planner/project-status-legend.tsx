import { PLANNER_OOO_STRIPE_CLASS } from "@/lib/planner-out-of-office";
import {
  PROJECT_STATUS_ORDER,
  projectStatusChipClassName,
  projectStatusLabel,
} from "@/lib/project-status";

export function ProjectStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded border px-2 py-0.5 text-[10px] font-medium ${projectStatusChipClassName(status)}`}
    >
      {projectStatusLabel(status)}
    </span>
  );
}

function OutOfOfficeLegendSwatch() {
  return (
    <span
      className="h-3 w-5 shrink-0 overflow-hidden rounded border border-magenta/20"
      aria-hidden
    >
      <span className="block h-full bg-magenta/10">
        <span className={`block h-full ${PLANNER_OOO_STRIPE_CLASS}`} />
      </span>
    </span>
  );
}

export function ProjectStatusLegend() {
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5"
      aria-label="Planner colours"
    >
      {PROJECT_STATUS_ORDER.map((status) => (
        <span
          key={status}
          className="inline-flex items-center gap-1.5 text-[10px] font-light text-g500"
        >
          <span
            className={`h-3 w-5 shrink-0 rounded border ${projectStatusChipClassName(status)}`}
            aria-hidden
          />
          {projectStatusLabel(status)}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5 text-[10px] font-light text-g500">
        <OutOfOfficeLegendSwatch />
        Out of office
      </span>
    </div>
  );
}
