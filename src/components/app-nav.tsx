import Link from "next/link";
import { isDevEnvironment } from "@/lib/env";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/views/by-resource", label: "By resource" },
  { href: "/views/by-project", label: "By project" },
  { href: "/resources", label: "Resources" },
  { href: "/projects", label: "Projects" },
];

export function AppNav() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Resource Manager
          </Link>
          {isDevEnvironment() && (
            <p className="text-xs text-warning">Development database</p>
          )}
        </div>
        <nav className="flex flex-wrap gap-4 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-foreground/80 transition hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
