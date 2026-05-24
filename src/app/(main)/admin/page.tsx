import Link from "next/link";
import {
  Briefcase,
  CalendarOff,
  FolderKanban,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

const sections = [
  {
    href: "/admin/roles",
    title: "Roles",
    description: "Job roles such as TMF Lead, Consultant, and PM.",
    icon: Briefcase,
  },
  {
    href: "/admin/resources",
    title: "Resources",
    description: "Team members with FTE hours, location, and role.",
    icon: Users,
  },
  {
    href: "/admin/projects",
    title: "Projects",
    description: "Client projects with budgeted hours and status.",
    icon: FolderKanban,
  },
  {
    href: "/admin/out-of-office",
    title: "Out of office",
    description: "Unavailability periods that affect capacity planning.",
    icon: CalendarOff,
  },
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Administration"
        description="Manage the reference data that feeds the planner views."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="accent-card block focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-teal"
            >
              <div className="flex items-start gap-3">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-teal-dark" aria-hidden="true" />
                <div>
                  <h3 className="text-[15px] font-medium text-ink">
                    {section.title}
                  </h3>
                  <p className="mt-2 text-[13px] font-light text-g500">
                    {section.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
