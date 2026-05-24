import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

// Next.js dev bundles RSC and server actions separately; module-level singletons
// multiply pools and exhaust Postgres max_connections without a global client.
const globalForDb = globalThis as unknown as {
  pgClient: ReturnType<typeof postgres> | undefined;
  db: DrizzleDb | undefined;
};

export function getDb(): DrizzleDb {
  if (globalForDb.db) {
    return globalForDb.db;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const isDev = process.env.NODE_ENV !== "production";

  globalForDb.pgClient = postgres(connectionString, {
    max: isDev ? 1 : 10,
    prepare: false,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  });

  globalForDb.db = drizzle(globalForDb.pgClient, { schema });
  return globalForDb.db;
}
