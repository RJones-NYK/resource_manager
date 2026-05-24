import { projectStatusEnum } from "@/db/schema";

export type ProjectStatus = (typeof projectStatusEnum.enumValues)[number];

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "active",
  "planned",
  "pipeline",
  "on_hold",
  "complete",
];

const STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  planned: "Planned",
  pipeline: "Pipeline",
  on_hold: "On hold",
  complete: "Complete",
};

export const PROJECT_STATUS_DESCRIPTIONS: Record<ProjectStatus, string> = {
  pipeline: "In the sales process",
  planned: "Contract being worked on",
  active: "Active delivery — work in progress now",
  on_hold: "Signed work that is paused",
  complete: "Done — appears in the completed list below",
};

/** Allocation chip styles on the by-resource planner */
export const PROJECT_STATUS_CHIP_CLASS: Record<ProjectStatus, string> = {
  active: "bg-teal-soft text-teal-dark border-teal/30",
  planned: "bg-cyan/10 text-cyan border-cyan/30",
  pipeline: "border-dashed bg-magenta-soft/60 text-magenta border-magenta/25",
  on_hold: "border-dashed bg-g100 text-g700 border-g300",
  complete: "bg-g50 text-g500 border-g200",
};

/** Cell capacity fill segments (by-resource planner) */
export const PROJECT_STATUS_FILL_CLASS: Record<ProjectStatus, string> = {
  active: "bg-teal/25",
  planned: "bg-cyan/20",
  pipeline: "bg-magenta/15",
  on_hold: "bg-g200/70",
  complete: "bg-g100",
};

export function isProjectStatus(value: string): value is ProjectStatus {
  return (projectStatusEnum.enumValues as readonly string[]).includes(value);
}

export function projectStatusLabel(status: string): string {
  if (isProjectStatus(status)) return STATUS_LABELS[status];
  return status.replace("_", " ");
}

export function projectStatusChipClassName(status: string): string {
  if (isProjectStatus(status)) return PROJECT_STATUS_CHIP_CLASS[status];
  return PROJECT_STATUS_CHIP_CLASS.planned;
}

export function projectStatusFillClassName(status: string): string {
  if (isProjectStatus(status)) return PROJECT_STATUS_FILL_CLASS[status];
  return PROJECT_STATUS_FILL_CLASS.planned;
}
