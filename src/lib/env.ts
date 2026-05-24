export function getAppEnvironment() {
  return process.env.APP_ENV ?? process.env.NODE_ENV ?? "development";
}

export function isDevEnvironment() {
  return getAppEnvironment() === "development";
}

export function getEnvironmentLabel() {
  const env = getAppEnvironment();
  if (env === "development") return "Development";
  if (env === "production") return "Production";
  if (env === "test") return "Test";
  return env.charAt(0).toUpperCase() + env.slice(1);
}

export function getDatabaseConnectionInfo() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const database = parsed.pathname.replace(/^\//, "");
    return {
      database: database || null,
      host: parsed.hostname || null,
    };
  } catch {
    return null;
  }
}
