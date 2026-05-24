"use client";

import { useActionState, useEffect } from "react";
import {
  saveAllocations,
  type AllocationActionState,
} from "@/lib/actions/planner/allocations";
import { weekRangeLabel } from "@/lib/weeks";
import { GradientButton, GhostButton } from "@/components/ui/buttons";
import { FieldLabel, FormFeedback, SelectInput } from "@/components/ui/form-fields";
import type { PlannerProject } from "@/lib/queries/planner";

const FTE_OPTIONS = Array.from({ length: 11 }, (_, index) =>
  (index * 0.1).toFixed(1),
);

const emptyState: AllocationActionState = {};

type Selection = {
  resourceId: string;
  resourceName: string;
  weekStarts: string[];
};

export function AllocationEditor({
  selection,
  projects,
  initialProjectId,
  initialFte,
  onClose,
}: {
  selection: Selection;
  projects: PlannerProject[];
  initialProjectId?: string;
  initialFte?: string;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveAllocations, emptyState);

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  const weekLabel = weekRangeLabel(selection.weekStarts);
  const weekCount = selection.weekStarts.length;

  return (
    <div className="card-accent rounded-[var(--radius)] border border-g200 bg-surface p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-g500">
            Assign allocation
          </p>
          <p className="mt-1 text-[15px] font-medium text-ink">
            {selection.resourceName}
          </p>
          <p className="text-[13px] font-light text-g500">
            {weekCount === 1 ? "Week commencing" : `${weekCount} weeks`}{" "}
            {weekLabel}
          </p>
        </div>
        <GhostButton type="button" onClick={onClose}>
          Cancel
        </GhostButton>
      </div>

      <form action={formAction} className="flex flex-wrap items-end gap-4">
        <input type="hidden" name="resourceId" value={selection.resourceId} />
        <input
          type="hidden"
          name="weekStarts"
          value={JSON.stringify(selection.weekStarts)}
        />

        <div className="min-w-[200px] flex-1">
          <FieldLabel htmlFor="allocation-project">Project</FieldLabel>
          <SelectInput
            id="allocation-project"
            name="projectId"
            required
            defaultValue={initialProjectId ?? ""}
            options={[
              { value: "", label: "Select project…" },
              ...projects.map((project) => ({
                value: project.id,
                label: project.name,
              })),
            ]}
          />
        </div>

        <div className="w-32">
          <FieldLabel htmlFor="allocation-fte">FTE</FieldLabel>
          <SelectInput
            id="allocation-fte"
            name="fte"
            required
            defaultValue={initialFte ?? "0.5"}
            options={FTE_OPTIONS.map((fte) => ({
              value: fte,
              label: fte,
            }))}
          />
        </div>

        <GradientButton type="submit" disabled={pending || projects.length === 0}>
          {pending ? "Saving…" : "Apply"}
        </GradientButton>
      </form>

      {projects.length === 0 && (
        <p className="mt-3 text-[12px] text-g500">
          Add a project in Admin before assigning time.
        </p>
      )}

      {state.error && (
        <div className="mt-3">
          <FormFeedback error={state.error} />
        </div>
      )}

      <p className="mt-3 text-[11px] font-light text-g500">
        Drag across weeks to select a range, or click a single week. Set FTE to 0 to
        remove an allocation for the chosen project.
      </p>
    </div>
  );
}
