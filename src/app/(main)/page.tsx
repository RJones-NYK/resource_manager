import Link from "next/link";
import {
  checkDatabaseConnection,
  getDashboardStats,
} from "@/lib/queries";
import { PageHeader } from "@/components/layout/page-header";
import { AccentCard, KpiCard } from "@/components/ui/cards";
import { GradientButton } from "@/components/ui/buttons";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [dbStatus, stats] = await Promise.all([
    checkDatabaseConnection(),
    getDashboardStats().catch(() => null),
  ]);

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

      <section>
        <p className="section-label mb-4">Overview</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Active projects"
            value={stats?.activeProjects ?? "—"}
            subLabel={
              stats
                ? `${stats.projects} total`
                : dbStatus.ok
                  ? "Loading failed"
                  : "Database offline"
            }
            href="/admin/projects"
          />
          <KpiCard
            label="Active resources"
            value={stats?.activeResources ?? "—"}
            subLabel={
              stats ? `${stats.resources} total` : undefined
            }
            href="/admin/resources"
          />
          <KpiCard
            label="Roles"
            value={stats?.roles ?? "—"}
            subLabel="Job roles defined"
            href="/admin/roles"
          />
          <KpiCard
            label="Allocations this week"
            value={stats?.allocationsThisWeek ?? "—"}
            subLabel={
              stats ? `Week of ${stats.weekStart}` : undefined
            }
            href="/planner/by-resource"
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <AccentCard variant={dbStatus.ok ? "default" : "error"}>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-g500">
            Database
          </p>
          <p className="mt-2 text-[15px] font-medium text-ink">
            {dbStatus.ok ? "Connected to Postgres" : "Not connected"}
          </p>
          <p className="mt-1 text-[12px] font-light text-g500">
            {dbStatus.ok
              ? "Mac mini · resource_manager_dev"
              : dbStatus.error}
          </p>
        </AccentCard>

        <AccentCard href="/admin">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-g500">
            Administration
          </p>
          <p className="mt-2 text-[15px] font-medium text-ink">
            Manage roles, resources, and projects
          </p>
          <p className="mt-1 text-[12px] font-light text-teal-dark">
            Open admin →
          </p>
        </AccentCard>
      </section>

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
