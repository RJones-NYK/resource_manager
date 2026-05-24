import Link from "next/link";
import {
  checkDatabaseConnection,
  getDashboardInsights,
} from "@/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { AccentCard, KpiCard } from "@/components/ui/cards";
import { GradientButton } from "@/components/ui/buttons";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [dbStatus, insights] = await Promise.all([
    checkDatabaseConnection(),
    getDashboardInsights().catch(() => null),
  ]);

  const utilisationPct =
    insights && insights.kpis.totalCapacityFte > 0
      ? Math.round(
          (insights.kpis.totalFtePlanned / insights.kpis.totalCapacityFte) * 100,
        )
      : null;

  return (
    <div className="mx-auto max-w-[1100px] space-y-8 px-6 py-8">
      <PageHeader
        title="Team capacity planning"
        description="Plan FTE allocations across projects, track availability, and review weekly timelines."
        actions={
          <GradientButton href="/planner/by-resource">
            Open planner
          </GradientButton>
        }
      />

      {!dbStatus.ok && (
        <AccentCard variant="error">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-g500">
            Database
          </p>
          <p className="mt-2 text-[15px] font-medium text-ink">Not connected</p>
          <p className="mt-1 text-[12px] font-light text-g500">{dbStatus.error}</p>
        </AccentCard>
      )}

      {insights ? (
        <>
          <section>
            <p className="section-label mb-4">
              Overview · w/c {insights.weekLabel}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Over-allocated"
                value={insights.kpis.overAllocated}
                subLabel={
                  insights.kpis.overAllocated === 1
                    ? "person above capacity"
                    : "people above capacity"
                }
                variant={insights.kpis.overAllocated > 0 ? "urgent" : "default"}
                href="/planner/by-resource"
              />
              <KpiCard
                label="Unplanned"
                value={insights.kpis.unplanned}
                subLabel="no allocation this week"
                href="/planner/by-resource"
              />
              <KpiCard
                label="FTE planned"
                value={insights.kpis.totalFtePlanned.toFixed(1)}
                subLabel={
                  utilisationPct !== null
                    ? `${utilisationPct}% of ${insights.kpis.totalCapacityFte.toFixed(1)} capacity`
                    : undefined
                }
                href="/planner/by-resource"
              />
              <KpiCard
                label="On leave"
                value={insights.kpis.onLeaveThisWeek}
                subLabel={`of ${insights.kpis.activeResources} active`}
                href="/admin/out-of-office"
              />
            </div>
          </section>

          <DashboardCharts insights={insights} />
        </>
      ) : (
        <AccentCard variant="error">
          <p className="text-[15px] font-medium text-ink">
            Could not load dashboard data
          </p>
          <p className="mt-1 text-[12px] font-light text-g500">
            {dbStatus.ok
              ? "Check the server logs and try refreshing."
              : "Connect to the database to see capacity insights."}
          </p>
        </AccentCard>
      )}

      <section>
        <p className="section-label mb-4">Planner views</p>
        <div className="grid gap-4 md:grid-cols-2">
          <PlannerLink
            href="/planner/by-resource"
            title="By resource"
            description="Each person's project allocations week by week."
          />
          <PlannerLink
            href="/planner/by-project"
            title="By project"
            description="All resources assigned to a project week by week."
          />
        </div>
      </section>

      {dbStatus.ok && (
        <p className="text-center text-[11px] font-light text-g500">
          Connected to Postgres · {insights?.kpis.activeResources ?? "—"} active
          resources
        </p>
      )}
    </div>
  );
}

function PlannerLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="accent-card block focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-teal"
    >
      <h3 className="text-[15px] font-medium text-ink">{title}</h3>
      <p className="mt-2 text-[13px] font-light text-g500">{description}</p>
    </Link>
  );
}
