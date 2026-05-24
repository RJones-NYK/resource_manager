import { getDb } from "@/db";
import { sortResourcesBySeniority } from "@/lib/resources";

export async function getResources() {
  const db = getDb();
  const rows = await db.query.resources.findMany({
    with: { role: true },
  });

  return sortResourcesBySeniority(
    rows.map((row) => ({
      item: row,
      roleName: row.role?.name ?? null,
      isExternal: row.isExternal,
      lastName: row.lastName,
      firstName: row.firstName,
    })),
  ).map((entry) => entry.item);
}
