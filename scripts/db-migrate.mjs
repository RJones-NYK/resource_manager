import { resolve } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { loadEnvFiles } from "./load-env.mjs";

loadEnvFiles();

const databaseUrl = process.env.DATABASE_URL;
const lifecycle = process.env.npm_lifecycle_event ?? "";
const optional =
  lifecycle === "prebuild" || process.env.SKIP_DB_MIGRATE === "1";
const devLifecycle = ["predev", "predev:turbo", "predev:clean"].includes(
  lifecycle,
);

if (!databaseUrl) {
  if (optional) {
    console.warn("db-migrate: DATABASE_URL not set — skipping migrations");
    process.exit(0);
  }
  console.error(
    "db-migrate: DATABASE_URL is not set (check .env.local)",
  );
  process.exit(1);
}

const client = postgres(databaseUrl, { max: 1, prepare: false });
const db = drizzle(client);

try {
  await migrate(db, { migrationsFolder: resolve(process.cwd(), "drizzle") });
  console.log("db-migrate: migrations applied");
} catch (error) {
  console.error("db-migrate: failed to apply migrations");
  console.error(error);
  if (devLifecycle) {
    console.warn(
      "db-migrate: database unreachable — starting dev server without applying migrations",
    );
    process.exit(0);
  }
  process.exit(1);
} finally {
  await client.end({ timeout: 5 });
}
