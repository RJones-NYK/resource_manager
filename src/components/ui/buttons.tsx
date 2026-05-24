import Link from "next/link";

export function GradientButton({
  children,
  href,
  type = "button",
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const classes = `btn-primary inline-flex items-center justify-center ${className} ${
    disabled ? "cursor-not-allowed opacity-50" : ""
  }`;

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  href,
  type = "button",
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
}) {
  const classes = `btn-ghost inline-flex items-center justify-center ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
