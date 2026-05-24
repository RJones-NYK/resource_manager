import Link from "next/link";
import { checkDatabaseConnection } from "@/lib/queries";

export const dynamic = "force-dynamic";

const mvpSteps = [
  "Add roles, resources, and projects",
  "Assign weekly FTE allocations",
  "Review capacity by resource or by project",
  "Track out-of-office and budget burn",
];

export default async function HomePage() {
  const dbStatus = await checkDatabaseConnection();

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-surface p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-accent">
          Arithmos Resource Manager
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Team capacity planning
        </h1>
        <p className="mt-3 max-w-2xl text-foreground/70">
          Plan FTE allocations across projects, track availability, and review
          weekly timelines from both resource and project perspectives.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <StatusCard
          title="Database"
          ok={dbStatus.ok}
          detail={
            dbStatus.ok
              ? "Connected to Postgres"
              : `Not connected: ${dbStatus.error}`
          }
        />
        <StatusCard
          title="MVP views"
          ok
          detail="By resource and by project timeline scaffolds are ready"
        />
      </section>

      <section className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">Next build steps</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-foreground/80">
          {mvpSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <LinkCard
          href="/views/by-resource"
          title="By resource view"
          description="See each person’s project allocations week by week."
        />
        <LinkCard
          href="/views/by-project"
          title="By project view"
          description="See all resources assigned to a project week by week."
        />
      </section>
    </div>
  );
}

function StatusCard({
  title,
  ok,
  detail,
}: {
  title: string;
  ok: boolean;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`}
        />
        <h2 className="font-semibold">{title}</h2>
      </div>
      <p className="mt-2 text-sm text-foreground/70">{detail}</p>
    </div>
  );
}

function LinkCard({
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
      className="rounded-xl border border-border bg-surface p-6 transition hover:border-accent hover:bg-accent-muted"
    >
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-foreground/70">{description}</p>
    </Link>
  );
}
