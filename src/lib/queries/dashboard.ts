import { and, asc, count, eq, gte, lte } from "drizzle-orm";
import { getDb } from "@/db";
import {
  allocations,
  outOfOffice,
  projects,
  resources,
} from "@/db/schema";
import {
  classifyUtilisation,
  PROJECT_STATUS_CHART_COLOR,
  statusChartLabel,
  UTILISATION_BAND_COLORS,
  UTILISATION_BAND_LABELS,
  UTILISATION_BAND_ORDER,
  type UtilisationBand,
} from "@/lib/dashboard-metrics";
import { weekdayIndicesInWeekRange } from "@/lib/planner-out-of-office";
import type { ProjectStatus } from "@/lib/project-status";
import { PROJECT_STATUS_ORDER, isProjectStatus } from "@/lib/project-status";
import { formatResourceName } from "@/lib/resources";
import { addDays, buildWeekColumn, currentWeekStart } from "@/lib/weeks";
import { roles } from "@/db/schema";

export type DashboardUtilisationSlice = {
  band: UtilisationBand;
  label: string;
  count: number;
  color: string;
};

export type DashboardStatusFte = {
  status: ProjectStatus;
  label: string;
  fte: number;
  color: string;
};

export type DashboardTopProject = {
  id: string;
  name: string;
  client: string | null;
  fte: number;
};

export type DashboardWeekTrend = {
  weekStart: string;
  label: string;
  fte: number;
};

export type DashboardAttentionItem = {
  id: string;
  kind: "over_allocated" | "unplanned" | "budget_unstaffed";
  title: string;
  detail: string;
  href: string;
};

export type DashboardInsights = {
  weekStart: string;
  weekLabel: string;
  kpis: {
    overAllocated: number;
    unplanned: number;
    totalFtePlanned: number;
    totalCapacityFte: number;
    onLeaveThisWeek: number;
    activeResources: number;
  };
  utilisationSlices: DashboardUtilisationSlice[];
  utilisationCentreLabel: string;
  fteByStatus: DashboardStatusFte[];
  topProjects: DashboardTopProject[];
  weeklyTrend: DashboardWeekTrend[];
  attention: DashboardAttentionItem[];
};

export type DashboardStats = {
  roles: number;
  resources: number;
  activeResources: number;
  projects: number;
  activeProjects: number;
  allocationsThisWeek: number;
  weekStart: string;
};

const TREND_WEEKS = 8;
const TOP_PROJECTS_LIMIT = 8;
const ATTENTION_LIMIT = 10;
const BUDGET_LOOKAHEAD_WEEKS = 4;

function sumFteByResourceWeek(
  rows: { resourceId: string; weekStart: string; fteAllocated: string }[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.resourceId}:${row.weekStart}`;
    map.set(key, (map.get(key) ?? 0) + Number(row.fteAllocated));
  }
  return map;
}

function resourceOnLeaveThisWeek(
  resourceId: string,
  weekStart: string,
  oooRows: { resourceId: string; startDate: string; endDate: string }[],
): boolean {
  for (const row of oooRows) {
    if (row.resourceId !== resourceId) continue;
    if (weekdayIndicesInWeekRange(weekStart, row.startDate, row.endDate).length > 0) {
      return true;
    }
  }
  return false;
}

function trendWeekStarts(anchor: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => addDays(anchor, index * 7));
}

export async function getDashboardInsights(): Promise<DashboardInsights> {
  const db = getDb();
  const weekStart = currentWeekStart();
  const weekLabel = buildWeekColumn(weekStart).weekCommencingLabel;
  const trendWeeks = trendWeekStarts(weekStart, TREND_WEEKS);
  const trendEnd = trendWeeks[trendWeeks.length - 1] ?? weekStart;
  const budgetRangeEnd = addDays(weekStart, (BUDGET_LOOKAHEAD_WEEKS - 1) * 7);

  const [resourceRows, allocationRows, oooRows, projectRows] = await Promise.all([
    db.query.resources.findMany({
      where: eq(resources.isActive, 1),
      orderBy: [asc(resources.lastName), asc(resources.firstName)],
    }),
    db.query.allocations.findMany({
      where: and(
        gte(allocations.weekStart, weekStart),
        lte(allocations.weekStart, trendEnd),
      ),
      with: { project: true },
    }),
    db.query.outOfOffice.findMany({
      where: and(
        lte(outOfOffice.startDate, budgetRangeEnd),
        gte(outOfOffice.endDate, weekStart),
      ),
      orderBy: [asc(outOfOffice.startDate)],
    }),
    db.query.projects.findMany({
      orderBy: [asc(projects.name)],
    }),
  ]);

  const fteByCell = sumFteByResourceWeek(allocationRows);
  const thisWeekAllocations = allocationRows.filter((row) => row.weekStart === weekStart);

  const bandCounts = new Map<UtilisationBand, number>();
  for (const band of UTILISATION_BAND_ORDER) {
    bandCounts.set(band, 0);
  }

  let overAllocated = 0;
  let unplanned = 0;
  let totalFtePlanned = 0;
  let totalCapacityFte = 0;
  let onLeaveThisWeek = 0;

  const attention: DashboardAttentionItem[] = [];

  for (const resource of resourceRows) {
    const capacity = Number(resource.defaultFte) || 1;
    const name = formatResourceName(resource.firstName, resource.lastName);
    totalCapacityFte += capacity;
    const totalFte = fteByCell.get(`${resource.id}:${weekStart}`) ?? 0;
    totalFtePlanned += totalFte;

    const band = classifyUtilisation(totalFte, capacity);
    bandCounts.set(band, (bandCounts.get(band) ?? 0) + 1);
    if (band === "over") {
      overAllocated += 1;
      attention.push({
        id: `over-${resource.id}`,
        kind: "over_allocated",
        title: name,
        detail: `${totalFte.toFixed(1)} FTE planned · ${capacity.toFixed(1)} capacity`,
        href: "/planner/by-resource",
      });
    }
    if (band === "unplanned") {
      unplanned += 1;
      attention.push({
        id: `unplanned-${resource.id}`,
        kind: "unplanned",
        title: name,
        detail: "No allocations this week",
        href: "/planner/by-resource",
      });
    }

    if (resourceOnLeaveThisWeek(resource.id, weekStart, oooRows)) {
      onLeaveThisWeek += 1;
    }
  }

  const utilisationSlices: DashboardUtilisationSlice[] = UTILISATION_BAND_ORDER.map(
    (band) => ({
      band,
      label: UTILISATION_BAND_LABELS[band],
      count: bandCounts.get(band) ?? 0,
      color: UTILISATION_BAND_COLORS[band],
    }),
  ).filter((slice) => slice.count > 0);

  const plannedCount = resourceRows.length - unplanned;
  const utilisationCentreLabel =
    resourceRows.length > 0
      ? `${plannedCount} / ${resourceRows.length}`
      : "—";

  const fteByStatusMap = new Map<ProjectStatus, number>();
  for (const status of PROJECT_STATUS_ORDER) {
    fteByStatusMap.set(status, 0);
  }
  for (const row of thisWeekAllocations) {
    const status = row.project.status;
    if (!isProjectStatus(status)) continue;
    fteByStatusMap.set(
      status,
      (fteByStatusMap.get(status) ?? 0) + Number(row.fteAllocated),
    );
  }
  const fteByStatus: DashboardStatusFte[] = PROJECT_STATUS_ORDER.map((status) => ({
    status,
    label: statusChartLabel(status),
    fte: Math.round((fteByStatusMap.get(status) ?? 0) * 10) / 10,
    color: PROJECT_STATUS_CHART_COLOR[status],
  })).filter((row) => row.fte > 0);

  const projectFteMap = new Map<
    string,
    { name: string; client: string | null; fte: number }
  >();
  for (const row of thisWeekAllocations) {
    const existing = projectFteMap.get(row.projectId);
    const fte = Number(row.fteAllocated);
    if (existing) {
      existing.fte += fte;
    } else {
      projectFteMap.set(row.projectId, {
        name: row.project.name,
        client: row.project.client,
        fte,
      });
    }
  }
  const topProjects: DashboardTopProject[] = [...projectFteMap.entries()]
    .map(([id, data]) => ({
      id,
      name: data.name,
      client: data.client,
      fte: Math.round(data.fte * 10) / 10,
    }))
    .sort((a, b) => b.fte - a.fte)
    .slice(0, TOP_PROJECTS_LIMIT);

  const weeklyTrend: DashboardWeekTrend[] = trendWeeks.map((ws) => {
    let weekFte = 0;
    for (const resource of resourceRows) {
      weekFte += fteByCell.get(`${resource.id}:${ws}`) ?? 0;
    }
    return {
      weekStart: ws,
      label: buildWeekColumn(ws).weekCommencingLabel,
      fte: Math.round(weekFte * 10) / 10,
    };
  });

  const fteInBudgetWindow = new Map<string, number>();
  for (const row of allocationRows) {
    if (row.weekStart < weekStart || row.weekStart > budgetRangeEnd) continue;
    fteInBudgetWindow.set(
      row.projectId,
      (fteInBudgetWindow.get(row.projectId) ?? 0) + Number(row.fteAllocated),
    );
  }
  for (const project of projectRows) {
    if (project.status !== "active") continue;
    if (!project.totalHoursBudgeted) continue;
    if ((fteInBudgetWindow.get(project.id) ?? 0) > 0.001) continue;
    attention.push({
      id: `budget-${project.id}`,
      kind: "budget_unstaffed",
      title: project.name,
      detail: "Budget set · no FTE in next 4 weeks",
      href: "/planner/by-project",
    });
  }

  const attentionSorted = [
    ...attention.filter((item) => item.kind === "over_allocated"),
    ...attention.filter((item) => item.kind === "unplanned"),
    ...attention.filter((item) => item.kind === "budget_unstaffed"),
  ].slice(0, ATTENTION_LIMIT);

  return {
    weekStart,
    weekLabel,
    kpis: {
      overAllocated,
      unplanned,
      totalFtePlanned: Math.round(totalFtePlanned * 10) / 10,
      totalCapacityFte: Math.round(totalCapacityFte * 10) / 10,
      onLeaveThisWeek,
      activeResources: resourceRows.length,
    },
    utilisationSlices,
    utilisationCentreLabel,
    fteByStatus,
    topProjects,
    weeklyTrend,
    attention: attentionSorted,
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = getDb();
  const weekStart = currentWeekStart();

  const [
    rolesResult,
    resourcesResult,
    activeResourcesResult,
    projectsResult,
    activeProjectsResult,
    allocationsResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(roles),
    db.select({ count: count() }).from(resources),
    db
      .select({ count: count() })
      .from(resources)
      .where(eq(resources.isActive, 1)),
    db.select({ count: count() }).from(projects),
    db
      .select({ count: count() })
      .from(projects)
      .where(eq(projects.status, "active")),
    db
      .select({ count: count() })
      .from(allocations)
      .where(eq(allocations.weekStart, weekStart)),
  ]);

  return {
    roles: rolesResult[0]?.count ?? 0,
    resources: resourcesResult[0]?.count ?? 0,
    activeResources: activeResourcesResult[0]?.count ?? 0,
    projects: projectsResult[0]?.count ?? 0,
    activeProjects: activeProjectsResult[0]?.count ?? 0,
    allocationsThisWeek: allocationsResult[0]?.count ?? 0,
    weekStart,
  };
}
