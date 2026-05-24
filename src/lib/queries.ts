import { asc, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { projects, resources } from "@/db/schema";

export async function getResources() {
  const db = getDb();
  return db.query.resources.findMany({
    with: { role: true },
    orderBy: [asc(resources.name)],
  });
}

export async function getProjects() {
  const db = getDb();
  return db.query.projects.findMany({
    orderBy: [asc(projects.name)],
  });
}

export async function checkDatabaseConnection() {
  try {
    const db = getDb();
    await db.execute(sql`SELECT 1`);
    return { ok: true as const };
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}
