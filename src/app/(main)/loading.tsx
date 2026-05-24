export default function MainLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="h-8 w-48 animate-pulse rounded bg-g200/80" />
      <div className="mt-6 h-32 animate-pulse rounded-[var(--radius)] bg-g200/60" />
      <div className="mt-4 h-32 animate-pulse rounded-[var(--radius)] bg-g200/40" />
    </div>
  );
}
