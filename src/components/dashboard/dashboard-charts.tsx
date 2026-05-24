"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AccentCard } from "@/components/ui/cards";
import type { DashboardInsights } from "@/lib/queries/dashboard";

type DashboardChartsProps = {
  insights: DashboardInsights;
};

export function DashboardCharts({ insights }: DashboardChartsProps) {
  const totalStatusFte = insights.fteByStatus.reduce((sum, row) => sum + row.fte, 0);
  const utilisationTotal = insights.utilisationSlices.reduce(
    (sum, slice) => sum + slice.count,
    0,
  );

  return (
    <div className="space-y-8">
      <section>
        <p className="section-label mb-4">
          This week · w/c {insights.weekLabel}
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <AccentCard className="!p-0 overflow-hidden">
            <div className="border-b border-g200 px-5 py-4">
              <h3 className="text-[15px] font-medium text-ink">Team utilisation</h3>
              <p className="mt-1 text-[12px] font-light text-g500">
                Active resources by planned load vs capacity
              </p>
            </div>
            <div className="relative px-5 py-6">
              {utilisationTotal === 0 ? (
                <EmptyChart message="No active resources to show" />
              ) : (
                <>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={insights.utilisationSlices}
                          dataKey="count"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          innerRadius={62}
                          outerRadius={88}
                          paddingAngle={2}
                          stroke="var(--surface)"
                          strokeWidth={2}
                        >
                          {insights.utilisationSlices.map((slice) => (
                            <Cell key={slice.band} fill={slice.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null;
                            const row = payload[0].payload as { label: string; count: number };
                            return (
                              <div className="rounded-lg border border-g200 bg-surface px-3 py-2 text-[12px] shadow-sm">
                                <p className="font-medium text-ink">{row.label}</p>
                                <p className="text-g500">{row.count} people</p>
                              </div>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div
                    className="pointer-events-none absolute inset-0 flex items-center justify-center pt-4"
                    aria-hidden
                  >
                    <div className="text-center">
                      <p className="text-[22px] font-medium tabular-nums text-ink">
                        {insights.utilisationCentreLabel}
                      </p>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-g500">
                        planned
                      </p>
                    </div>
                  </div>
                </>
              )}
              <UtilisationLegend slices={insights.utilisationSlices} />
            </div>
          </AccentCard>

          <AccentCard className="!p-0 overflow-hidden">
            <div className="border-b border-g200 px-5 py-4">
              <h3 className="text-[15px] font-medium text-ink">FTE by project status</h3>
              <p className="mt-1 text-[12px] font-light text-g500">
                Where capacity is allocated this week
              </p>
            </div>
            <div className="px-5 py-6">
              {totalStatusFte <= 0 ? (
                <EmptyChart message="No allocations this week" />
              ) : (
                <>
                  <div className="flex h-10 w-full overflow-hidden rounded-md">
                    {insights.fteByStatus.map((row) => (
                      <div
                        key={row.status}
                        className="min-w-[2px] transition-[width]"
                        style={{
                          width: `${(row.fte / totalStatusFte) * 100}%`,
                          backgroundColor: row.color,
                        }}
                        title={`${row.label}: ${row.fte.toFixed(1)} FTE`}
                      />
                    ))}
                  </div>
                  <ul className="mt-4 space-y-2">
                    {insights.fteByStatus.map((row) => (
                      <li
                        key={row.status}
                        className="flex items-center justify-between gap-3 text-[13px]"
                      >
                        <span className="flex items-center gap-2 text-ink">
                          <span
                            className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                            style={{ backgroundColor: row.color }}
                          />
                          {row.label}
                        </span>
                        <span className="tabular-nums font-medium text-g700">
                          {row.fte.toFixed(1)} FTE
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[12px] text-g500">
                    {totalStatusFte.toFixed(1)} FTE total this week
                  </p>
                </>
              )}
            </div>
          </AccentCard>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AccentCard className="!p-0 overflow-hidden">
          <div className="border-b border-g200 px-5 py-4">
            <h3 className="text-[15px] font-medium text-ink">Top projects</h3>
            <p className="mt-1 text-[12px] font-light text-g500">
              Highest FTE this week
            </p>
          </div>
          <div className="px-3 py-4">
            {insights.topProjects.length === 0 ? (
              <div className="px-2 py-8">
                <EmptyChart message="No project allocations yet" />
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={insights.topProjects}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 11, fill: "var(--g700)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.[0]) return null;
                        const fte = Number(payload[0].value);
                        const client = (payload[0].payload as { client?: string | null })
                          .client;
                        return (
                          <div className="rounded-lg border border-g200 bg-surface px-3 py-2 text-[12px] shadow-sm">
                            <p className="font-medium text-ink">
                              {label}
                              {client ? ` · ${client}` : ""}
                            </p>
                            <p className="text-g500">{fte.toFixed(1)} FTE allocated</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="fte" fill="var(--teal)" radius={[0, 4, 4, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </AccentCard>

        <AccentCard className="!p-0 overflow-hidden">
          <div className="border-b border-g200 px-5 py-4">
            <h3 className="text-[15px] font-medium text-ink">8-week outlook</h3>
            <p className="mt-1 text-[12px] font-light text-g500">
              Total team FTE planned per week
            </p>
          </div>
          <div className="px-3 py-4">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={insights.weeklyTrend}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "var(--g500)" }}
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    angle={-35}
                    textAnchor="end"
                    height={52}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--g500)" }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.[0]) return null;
                      const fte = Number(payload[0].value);
                      return (
                        <div className="rounded-lg border border-g200 bg-surface px-3 py-2 text-[12px] shadow-sm">
                          <p className="font-medium text-ink">w/c {label}</p>
                          <p className="text-g500">{fte.toFixed(1)} FTE team total</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="fte" fill="var(--cyan)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </AccentCard>
      </section>

      {insights.attention.length > 0 && (
        <section>
          <p className="section-label mb-4">Needs attention</p>
          <AccentCard className="!p-0 overflow-hidden">
            <ul className="divide-y divide-g200">
              {insights.attention.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex items-start justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-g50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal"
                  >
                    <div>
                      <p className="text-[14px] font-medium text-ink">{item.title}</p>
                      <p className="mt-0.5 text-[12px] font-light text-g500">{item.detail}</p>
                    </div>
                    <AttentionKindBadge kind={item.kind} />
                  </Link>
                </li>
              ))}
            </ul>
          </AccentCard>
        </section>
      )}
    </div>
  );
}

function UtilisationLegend({
  slices,
}: {
  slices: DashboardInsights["utilisationSlices"];
}) {
  if (slices.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 border-t border-g200 pt-4">
      {slices.map((slice) => (
        <li
          key={slice.band}
          className="flex items-center gap-2 text-[12px] text-g700"
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: slice.color }}
          />
          <span>
            {slice.label}{" "}
            <span className="tabular-nums font-medium text-ink">({slice.count})</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function AttentionKindBadge({
  kind,
}: {
  kind: DashboardInsights["attention"][number]["kind"];
}) {
  const config = {
    over_allocated: {
      label: "Over",
      className: "bg-magenta-soft text-magenta",
    },
    unplanned: {
      label: "Unplanned",
      className: "bg-g100 text-g700",
    },
    budget_unstaffed: {
      label: "Unstaffed",
      className: "bg-teal-soft text-teal-dark",
    },
  }[kind];

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <p className="py-12 text-center text-[13px] font-light text-g500">{message}</p>
  );
}
