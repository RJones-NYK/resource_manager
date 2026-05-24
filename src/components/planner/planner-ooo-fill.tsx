import {
  describeOutOfOfficeSegments,
  outOfOfficeWidthPercent,
  PLANNER_OOO_STRIPE_CLASS,
  type OutOfOfficeDaySegment,
} from "@/lib/planner-out-of-office";

export function PlannerOooFill({
  segments,
}: {
  segments: OutOfOfficeDaySegment[];
}) {
  const widthPercent = outOfOfficeWidthPercent(segments);
  if (widthPercent <= 0) return null;

  return (
    <span
      className="pointer-events-none absolute inset-y-0 left-0 z-[1] overflow-hidden"
      style={{ width: `${widthPercent}%` }}
      title={describeOutOfOfficeSegments(segments)}
    >
      <span className="block h-full bg-magenta/10">
        <span className={`block h-full ${PLANNER_OOO_STRIPE_CLASS}`} />
      </span>
    </span>
  );
}
