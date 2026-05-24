"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarRange,
  Settings2,
} from "lucide-react";

function ConstellationOverlay() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <circle cx="12%" cy="35%" r="3" fill="white" />
      <circle cx="28%" cy="62%" r="2.5" fill="white" />
      <circle cx="45%" cy="28%" r="3.5" fill="white" />
      <circle cx="62%" cy="55%" r="2" fill="white" />
      <circle cx="78%" cy="32%" r="3" fill="white" />
      <circle cx="88%" cy="68%" r="2.5" fill="white" />
      <line x1="12%" y1="35%" x2="28%" y2="62%" stroke="white" strokeWidth="1" />
      <line x1="28%" y1="62%" x2="45%" y2="28%" stroke="white" strokeWidth="1" />
      <line x1="45%" y1="28%" x2="62%" y2="55%" stroke="white" strokeWidth="1" />
      <line x1="62%" y1="55%" x2="78%" y2="32%" stroke="white" strokeWidth="1" />
      <line x1="78%" y1="32%" x2="88%" y2="68%" stroke="white" strokeWidth="1" />
      <line x1="45%" y1="28%" x2="78%" y2="32%" stroke="white" strokeWidth="0.75" />
    </svg>
  );
}

const mainNav = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (path: string) => path === "/",
  },
  {
    href: "/planner/by-resource",
    label: "Planner",
    icon: CalendarRange,
    match: (path: string) => path.startsWith("/planner"),
  },
  {
    href: "/admin",
    label: "Admin",
    icon: Settings2,
    match: (path: string) => path.startsWith("/admin"),
  },
];

function getContextLabel(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/planner/by-resource")) return "By resource";
  if (pathname.startsWith("/planner/by-project")) return "By project";
  if (pathname.startsWith("/planner")) return "Planner";
  if (pathname === "/admin") return "Administration";
  if (pathname.startsWith("/admin/roles")) return "Roles";
  if (pathname.startsWith("/admin/resources")) return "Resources";
  if (pathname.startsWith("/admin/projects")) return "Projects";
  if (pathname.startsWith("/admin/out-of-office")) return "Out of office";
  if (pathname.startsWith("/admin")) return "Administration";
  return "Resource Manager";
}

export function AppHeader() {
  const pathname = usePathname();
  const contextLabel = getContextLabel(pathname);

  return (
    <>
      <header className="app-header-gradient relative overflow-hidden">
        <ConstellationOverlay />
        <div className="relative mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex flex-col gap-1.5">
            <Image
              src="/arithmos-logo-white-horizontal.png"
              alt="Arithmos"
              width={200}
              height={66}
              className="h-7 w-auto sm:h-8"
              priority
            />
            <span className="text-[11px] font-light uppercase tracking-[0.08em] text-white/78">
              Resource Manager
            </span>
          </Link>

          <span className="frosted-pill shrink-0">{contextLabel}</span>
        </div>
      </header>

      <div className="border-b border-g200 bg-surface px-6">
        <nav
          className="mx-auto flex max-w-[1100px] gap-4 overflow-x-auto sm:gap-6"
          aria-label="Main"
        >
          {mainNav.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-tab inline-flex items-center gap-1.5 py-3 ${
                  active ? "nav-tab--active" : ""
                }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
