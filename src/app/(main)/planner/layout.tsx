import { ContextBar, SectionTabs } from "@/components/layout/section-nav";

const plannerTabs = [
  { href: "/planner/by-resource", label: "By resource" },
  { href: "/planner/by-project", label: "By project" },
];

export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ContextBar pill="Planner" meta="Weekly FTE timelines" />
      <SectionTabs tabs={plannerTabs} ariaLabel="Planner views" />
      <div className="mx-auto max-w-[1100px] px-6 py-8">{children}</div>
    </>
  );
}
