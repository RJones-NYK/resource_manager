export type EnvironmentBadgeProps = {
  environmentLabel: string;
  connected: boolean;
  databaseName: string | null;
  databaseHost: string | null;
  connectionError?: string;
};

export function EnvironmentBadge({
  environmentLabel,
  connected,
  databaseName,
  databaseHost,
  connectionError,
}: EnvironmentBadgeProps) {
  const statusLabel = connected ? "Connected" : "Disconnected";
  const detail =
    databaseName && databaseHost
      ? `${databaseName} on ${databaseHost}`
      : databaseName ?? databaseHost ?? "No database configured";

  const title = connected
    ? `${environmentLabel} · ${statusLabel} · ${detail}`
    : `${environmentLabel} · ${statusLabel} · ${connectionError ?? detail}`;

  return (
    <span className="env-badge" role="status" title={title}>
      <span
        className={`env-badge__dot ${connected ? "env-badge__dot--ok" : "env-badge__dot--error"}`}
        aria-hidden="true"
      />
      <span className="env-badge__label">
        {environmentLabel}
        <span className="env-badge__sep" aria-hidden="true">
          ·
        </span>
        {statusLabel}
      </span>
    </span>
  );
}
