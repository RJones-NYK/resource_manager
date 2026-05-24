import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { outOfOffice } from "@/db/schema";

export async function getOutOfOffice() {
  const db = getDb();
  return db.query.outOfOffice.findMany({
    with: { resource: true },
    orderBy: [asc(outOfOffice.startDate)],
  });
}
