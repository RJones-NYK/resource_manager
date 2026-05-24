import { AppHeader } from "@/components/layout/app-header";
import {
  getDatabaseConnectionInfo,
  getEnvironmentLabel,
} from "@/lib/env";
import { checkDatabaseConnection } from "@/lib/queries";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dbStatus = await checkDatabaseConnection();
  const dbInfo = getDatabaseConnectionInfo();

  return (
    <>
      <AppHeader
        environmentStatus={{
          environmentLabel: getEnvironmentLabel(),
          connected: dbStatus.ok,
          databaseName: dbInfo?.database ?? null,
          databaseHost: dbInfo?.host ?? null,
          connectionError: dbStatus.ok ? undefined : dbStatus.error,
        }}
      />
      {children}
    </>
  );
}
