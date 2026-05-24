"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  CalendarOff,
  FolderKanban,
  LayoutGrid,
  Users,
} from "lucide-react";

type Tab = { href: string; label: string; icon?: LucideIcon };

export function SectionTabs({
  tabs,
  ariaLabel,
}: {
  tabs: Tab[];
  ariaLabel: string;
}) {
  const pathname = usePathname();

  return (
    <div className="border-b border-g200 bg-surface px-6">
      <nav
        className="mx-auto flex max-w-[1100px] gap-6 overflow-x-auto"
        aria-label={ariaLabel}
      >
        {tabs.map((tab) => {
          const isOverview = tab.href === "/admin" || tab.href === "/planner";
          const active = isOverview
            ? pathname === tab.href
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`nav-tab inline-flex items-center gap-1.5 py-3 ${
                active ? "nav-tab--active" : ""
              }`}
            >
              {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export const adminTabs: Tab[] = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/roles", label: "Roles", icon: Briefcase },
  { href: "/admin/resources", label: "Resources", icon: Users },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/out-of-office", label: "Out of office", icon: CalendarOff },
];

export function ContextBar({
  pill,
  meta,
  trailing,
}: {
  pill: string;
  meta?: string;
  trailing?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-g200 bg-surface px-6 py-2">
      <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="ctx-pill">{pill}</span>
          {meta && (
            <span className="text-[12px] font-light text-g500">{meta}</span>
          )}
        </div>
        {trailing && (
          <span className="text-[11px] font-medium text-g500">{trailing}</span>
        )}
      </div>
    </div>
  );
}
