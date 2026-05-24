import Link from "next/link";

type AccentVariant = "default" | "urgent" | "error";

export function AccentCard({
  children,
  className = "",
  variant = "default",
  href,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: AccentVariant;
  href?: string;
}) {
  const variantClass =
    variant === "urgent"
      ? "accent-card--urgent"
      : variant === "error"
        ? "accent-card--error"
        : "";

  const card = (
    <div className={`accent-card ${variantClass} ${className}`}>{children}</div>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-teal">
        {card}
      </Link>
    );
  }

  return card;
}

export function KpiCard({
  label,
  value,
  subLabel,
  variant = "default",
  href,
}: {
  label: string;
  value: string | number;
  subLabel?: string;
  variant?: AccentVariant;
  href?: string;
}) {
  return (
    <AccentCard variant={variant} href={href}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-g500">
        {label}
      </p>
      <p className="kpi-value mt-2">{value}</p>
      {subLabel && (
        <p
          className={`mt-1 text-[11px] font-medium ${
            variant === "urgent" ? "text-magenta" : "text-teal-dark"
          }`}
        >
          {subLabel}
        </p>
      )}
    </AccentCard>
  );
}
