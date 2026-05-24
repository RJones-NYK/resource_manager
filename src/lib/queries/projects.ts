import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { projects } from "@/db/schema";

export async function getProjects() {
  const db = getDb();
  return db.query.projects.findMany({
    orderBy: [asc(projects.name)],
  });
}
