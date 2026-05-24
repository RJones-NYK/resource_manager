import { and, asc, gte, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { allocations } from "@/db/schema";

export async function getAllocationsInRange(
  weekStartFrom: string,
  weekStartTo: string,
) {
  const db = getDb();
  return db.query.allocations.findMany({
    where: and(
      gte(allocations.weekStart, weekStartFrom),
      lte(allocations.weekStart, weekStartTo),
    ),
    with: { project: true },
    orderBy: [asc(allocations.weekStart)],
  });
}
