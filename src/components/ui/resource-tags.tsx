export function ResourceExternalTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded border border-g300 bg-g100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-g700 ${className}`}
    >
      External
    </span>
  );
}
