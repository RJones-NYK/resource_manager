import { count, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { allocations, projects, resources, roles } from "@/db/schema";

function getCurrentWeekStart(): string {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date.toISOString().slice(0, 10);
}

export async function getDashboardStats() {
  const db = getDb();
  const weekStart = getCurrentWeekStart();

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
