export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="section-label">Resource Manager</p>
        <h1 className="page-title mt-1">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-[14px] font-light text-g500">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </header>
  );
}
