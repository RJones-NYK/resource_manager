"use client";

import { GhostButton, GradientButton } from "@/components/ui/buttons";

export default function MainError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-xl font-medium text-ink">Something went wrong</h1>
      <p className="mt-2 text-[14px] font-light text-g500">
        The page could not be loaded. Try again, or return to the dashboard.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <GhostButton type="button" onClick={() => reset()}>
          Try again
        </GhostButton>
        <GradientButton href="/">Dashboard</GradientButton>
      </div>
    </div>
  );
}
