import { AlertTriangle, Info } from "lucide-react";
import {
  FTE_NOTICE_THRESHOLD,
  FTE_WARNING_THRESHOLD,
  fteLoadLabel,
  type FteLoadLevel,
} from "@/lib/planner-capacity";

export function CapacityLoadIndicator({
  level,
  totalFte,
  title,
}: {
  level: FteLoadLevel;
  totalFte: number;
  title?: string;
}) {
  if (level === "normal") return null;

  const label = title ?? fteLoadLabel(level, totalFte);

  if (level === "warning") {
    return (
      <span
        className="pointer-events-none absolute top-0.5 right-0.5 z-[3] inline-flex rounded bg-surface/90 p-0.5 text-magenta shadow-sm ring-1 ring-magenta/30"
        title={label}
        aria-label={label}
      >
        <AlertTriangle className="h-3 w-3" strokeWidth={2.25} aria-hidden />
      </span>
    );
  }

  return (
    <span
      className="pointer-events-none absolute top-0.5 right-0.5 z-[3] inline-flex rounded bg-surface/90 p-0.5 text-cyan shadow-sm ring-1 ring-cyan/30"
      title={label}
      aria-label={label}
    >
      <Info className="h-3 w-3" strokeWidth={2.25} aria-hidden />
    </span>
  );
}

export function CapacityLoadLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-light text-g500">
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex rounded bg-surface p-0.5 text-cyan ring-1 ring-cyan/30">
          <Info className="h-3 w-3" strokeWidth={2.25} aria-hidden />
        </span>
        High utilisation (&gt;{FTE_NOTICE_THRESHOLD} FTE committed, incl. out of office)
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex rounded bg-surface p-0.5 text-magenta ring-1 ring-magenta/30">
          <AlertTriangle className="h-3 w-3" strokeWidth={2.25} aria-hidden />
        </span>
        Over allocated (&gt;{FTE_WARNING_THRESHOLD} FTE committed, incl. out of office)
      </span>
    </div>
  );
}
