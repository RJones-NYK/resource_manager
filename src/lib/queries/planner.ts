import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { outOfOffice, resources } from "@/db/schema";
import { formatResourceName } from "@/lib/resources";
import {
  buildOutOfOfficeCells,
  type OutOfOfficeDaySegment,
} from "@/lib/planner-out-of-office";
import { getPlannerYear2026Weeks } from "@/lib/weeks";
import { getAllocationsInRange } from "./allocations";
import { getProjects } from "./projects";

export type PlannerAllocation = {
  resourceId: string;
  weekStart: string;
  projectId: string;
  projectName: string;
  fteAllocated: string;
};

export type PlannerOutOfOfficeCell = {
  resourceId: string;
  weekStart: string;
  segments: OutOfOfficeDaySegment[];
};

export type PlannerResource = {
  id: string;
  name: string;
  defaultFte: string;
  isExternal: boolean;
};

export type PlannerProject = {
  id: string;
  name: string;
};

export type ByResourcePlannerData = {
  weeks: ReturnType<typeof getPlannerYear2026Weeks>;
  resources: PlannerResource[];
  projects: PlannerProject[];
  allocations: PlannerAllocation[];
  outOfOfficeCells: PlannerOutOfOfficeCell[];
  rangeStart: string;
  rangeEnd: string;
};

export async function getByResourcePlannerData(): Promise<ByResourcePlannerData> {
  const weeks = getPlannerYear2026Weeks();
  const rangeStart = weeks[0]?.weekStart ?? "2026-01-05";
  const rangeEnd = weeks[weeks.length - 1]?.weekStart ?? "2026-12-21";

  const db = getDb();

  const [resourceRows, projectRows, allocationRows, oooRows] = await Promise.all([
    db.query.resources.findMany({
      where: eq(resources.isActive, 1),
      orderBy: [asc(resources.lastName), asc(resources.firstName)],
    }),
    getProjects(),
    getAllocationsInRange(rangeStart, rangeEnd),
    db.query.outOfOffice.findMany({
      orderBy: [asc(outOfOffice.startDate)],
    }),
  ]);

  const oooSegmentMap = buildOutOfOfficeCells(
    oooRows.map((row) => ({
      resourceId: row.resourceId,
      startDate: row.startDate,
      endDate: row.endDate,
    })),
    weeks.map((week) => week.weekStart),
  );

  const outOfOfficeCells: PlannerOutOfOfficeCell[] = [];
  for (const [key, segments] of oooSegmentMap) {
    const [resourceId, weekStart] = key.split(":");
    if (!resourceId || !weekStart) continue;
    outOfOfficeCells.push({ resourceId, weekStart, segments });
  }

  return {
    weeks,
    rangeStart,
    rangeEnd,
    resources: resourceRows.map((row) => ({
      id: row.id,
      name: formatResourceName(row.firstName, row.lastName),
      defaultFte: row.defaultFte,
      isExternal: row.isExternal === 1,
    })),
    projects: projectRows.map((row) => ({
      id: row.id,
      name: row.name,
    })),
    allocations: allocationRows.map((row) => ({
      resourceId: row.resourceId,
      weekStart: row.weekStart,
      projectId: row.projectId,
      projectName: row.project.name,
      fteAllocated: row.fteAllocated,
    })),
    outOfOfficeCells,
  };
}
