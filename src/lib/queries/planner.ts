import { and, asc, eq, gte, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { outOfOffice, resources } from "@/db/schema";
import { formatResourceName, sortResourcesBySeniority } from "@/lib/resources";
import {
  buildOutOfOfficeCells,
  type OutOfOfficeDaySegment,
} from "@/lib/planner-out-of-office";
import { getPlannerWeeks } from "@/lib/weeks";
import { getAllocationsInRange } from "./allocations";
import type { ProjectStatus } from "@/lib/project-status";
import { getProjects } from "./projects";

export type PlannerAllocation = {
  resourceId: string;
  weekStart: string;
  projectId: string;
  projectName: string;
  projectStatus: ProjectStatus;
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
  roleName: string | null;
  defaultFte: string;
  fteHoursPerWeek: string;
  isExternal: boolean;
};

export type PlannerProject = {
  id: string;
  name: string;
  status: ProjectStatus;
};

export type PlannerProjectDetail = PlannerProject & {
  totalHoursBudgeted: string | null;
  status: string;
  client: string | null;
  startDate: string | null;
  endDate: string | null;
};

export type ByResourcePlannerData = {
  weeks: ReturnType<typeof getPlannerWeeks>;
  resources: PlannerResource[];
  projects: PlannerProject[];
  allocations: PlannerAllocation[];
  outOfOfficeCells: PlannerOutOfOfficeCell[];
  rangeStart: string;
  rangeEnd: string;
};

export type ByProjectPlannerData = {
  weeks: ReturnType<typeof getPlannerWeeks>;
  resources: PlannerResource[];
  projects: PlannerProjectDetail[];
  allocations: PlannerAllocation[];
  outOfOfficeCells: PlannerOutOfOfficeCell[];
  rangeStart: string;
  rangeEnd: string;
};

export async function getByResourcePlannerData(): Promise<ByResourcePlannerData> {
  const weeks = getPlannerWeeks();
  const rangeStart = weeks[0]?.weekStart ?? "2026-01-05";
  const rangeEnd = weeks[weeks.length - 1]?.weekStart ?? "2027-12-27";

  const db = getDb();

  const [resourceRows, projectRows, allocationRows, oooRows] = await Promise.all([
    db.query.resources.findMany({
      where: eq(resources.isActive, 1),
      with: { role: true },
    }),
    getProjects(),
    getAllocationsInRange(rangeStart, rangeEnd),
    db.query.outOfOffice.findMany({
      where: and(
        lte(outOfOffice.startDate, rangeEnd),
        gte(outOfOffice.endDate, rangeStart),
      ),
      orderBy: [asc(outOfOffice.startDate)],
    }),
  ]);

  const sortedResourceRows = sortResourcesBySeniority(
    resourceRows.map((row) => ({
      ...row,
      roleName: row.role?.name ?? null,
    })),
  );

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
    resources: sortedResourceRows.map((row) => ({
      id: row.id,
      name: formatResourceName(row.firstName, row.lastName),
      roleName: row.role?.name ?? null,
      defaultFte: row.defaultFte,
      fteHoursPerWeek: row.fteHoursPerWeek,
      isExternal: row.isExternal === 1,
    })),
    projects: projectRows.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
    })),
    allocations: allocationRows.map((row) => ({
      resourceId: row.resourceId,
      weekStart: row.weekStart,
      projectId: row.projectId,
      projectName: row.project.name,
      projectStatus: row.project.status,
      fteAllocated: row.fteAllocated,
    })),
    outOfOfficeCells,
  };
}

export async function getByProjectPlannerData(): Promise<ByProjectPlannerData> {
  const weeks = getPlannerWeeks();
  const rangeStart = weeks[0]?.weekStart ?? "2026-01-05";
  const rangeEnd = weeks[weeks.length - 1]?.weekStart ?? "2027-12-27";

  const db = getDb();

  const [resourceRows, projectRows, allocationRows, oooRows] = await Promise.all([
    db.query.resources.findMany({
      where: eq(resources.isActive, 1),
      with: { role: true },
    }),
    getProjects(),
    getAllocationsInRange(rangeStart, rangeEnd),
    db.query.outOfOffice.findMany({
      where: and(
        lte(outOfOffice.startDate, rangeEnd),
        gte(outOfOffice.endDate, rangeStart),
      ),
      orderBy: [asc(outOfOffice.startDate)],
    }),
  ]);

  const sortedResourceRows = sortResourcesBySeniority(
    resourceRows.map((row) => ({
      ...row,
      roleName: row.role?.name ?? null,
    })),
  );

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
    resources: sortedResourceRows.map((row) => ({
      id: row.id,
      name: formatResourceName(row.firstName, row.lastName),
      roleName: row.role?.name ?? null,
      defaultFte: row.defaultFte,
      fteHoursPerWeek: row.fteHoursPerWeek,
      isExternal: row.isExternal === 1,
    })),
    projects: projectRows.map((row) => ({
      id: row.id,
      name: row.name,
      totalHoursBudgeted: row.totalHoursBudgeted,
      status: row.status,
      client: row.client,
      startDate: row.startDate,
      endDate: row.endDate,
    })),
    allocations: allocationRows.map((row) => ({
      resourceId: row.resourceId,
      weekStart: row.weekStart,
      projectId: row.projectId,
      projectName: row.project.name,
      projectStatus: row.project.status,
      fteAllocated: row.fteAllocated,
    })),
    outOfOfficeCells,
  };
}
