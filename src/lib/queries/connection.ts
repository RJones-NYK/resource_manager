import { sql } from "drizzle-orm";
import { getDb } from "@/db";

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
