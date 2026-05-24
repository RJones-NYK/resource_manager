import type { ProjectStatus } from "@/lib/project-status";
import { projectStatusLabel } from "@/lib/project-status";

export type UtilisationBand = "unplanned" | "under" | "healthy" | "high" | "over";

export const UTILISATION_BAND_ORDER: UtilisationBand[] = [
  "unplanned",
  "under",
  "healthy",
  "high",
  "over",
];

export const UTILISATION_BAND_LABELS: Record<UtilisationBand, string> = {
  unplanned: "Unplanned",
  under: "Under 50%",
  healthy: "50–80%",
  high: "80–100%",
  over: "Over capacity",
};

export const UTILISATION_BAND_COLORS: Record<UtilisationBand, string> = {
  unplanned: "#e5e7eb",
  under: "#00b3d0",
  healthy: "#00a5a6",
  high: "#008a8b",
  over: "#b1608e",
};

export const PROJECT_STATUS_CHART_COLOR: Record<ProjectStatus, string> = {
  active: "#00a5a6",
  planned: "#00b3d0",
  pipeline: "#b1608e",
  on_hold: "#9ca3af",
  complete: "#d1d5db",
};

export function classifyUtilisation(
  totalFte: number,
  capacity: number,
): UtilisationBand {
  if (totalFte <= 0.001) return "unplanned";
  const cap = capacity > 0 ? capacity : 1;
  const ratio = totalFte / cap;
  if (ratio > 1.001) return "over";
  if (ratio > 0.8) return "high";
  if (ratio >= 0.5) return "healthy";
  return "under";
}

export function statusChartLabel(status: ProjectStatus): string {
  return projectStatusLabel(status);
}
