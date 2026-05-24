export function getAppEnvironment() {
  return process.env.APP_ENV ?? process.env.NODE_ENV ?? "development";
}

export function isDevEnvironment() {
  return getAppEnvironment() === "development";
}
