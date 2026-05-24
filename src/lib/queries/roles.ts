import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { roles } from "@/db/schema";

export async function getRoles() {
  const db = getDb();
  return db.query.roles.findMany({
    orderBy: [asc(roles.name)],
  });
}
