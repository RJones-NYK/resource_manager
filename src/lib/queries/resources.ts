import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { resources } from "@/db/schema";

export async function getResources() {
  const db = getDb();
  return db.query.resources.findMany({
    with: { role: true },
    orderBy: [asc(resources.lastName), asc(resources.firstName)],
  });
}
