"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import {
  saveAllocations,
  type AllocationActionState,
} from "@/lib/actions/planner/allocations";
import type { EditorAssignmentRow } from "@/lib/planner-assignment-rows";
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

type AssignmentRowState = EditorAssignmentRow;

function buildResourceRows(existing: EditorAssignmentRow[]): AssignmentRowState[] {
  return [...existing, { projectId: "", fte: "0.5" }];
}

function ResourceAssignmentRows({
  rows,
  projects,
  onChange,
}: {
  rows: AssignmentRowState[];
  projects: PlannerProject[];
  onChange: (rows: AssignmentRowState[]) => void;
}) {
  const projectOptions = useMemo(
    () => [
      { value: "", label: "Select project…" },
      ...projects.map((project) => ({
        value: project.id,
        label: project.name,
      })),
    ],
    [projects],
  );

  const fteOptions = FTE_OPTIONS.map((fte) => ({ value: fte, label: fte }));

  const updateRow = (index: number, patch: Partial<AssignmentRowState>) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const selectNewProject = (projectId: string) => {
    const next = rows.map((row, i) =>
      i === newRowIndex ? { ...row, projectId } : row,
    );
    if (projectId.trim() && !next.some((row) => !row.projectId)) {
      next.push({ projectId: "", fte: "0.5" });
    }
    onChange(next);
  };

  const removeRow = (index: number) => {
    const next = rows.filter((_, i) => i !== index);
    if (!next.some((row) => !row.projectId)) {
      next.push({ projectId: "", fte: "0.5" });
    }
    onChange(next);
  };

  const projectName = (projectId: string) =>
    projects.find((project) => project.id === projectId)?.name ?? "assignment";

  const existingRows = rows.filter((row) => row.projectId);
  const newRowIndex = rows.findIndex((row) => !row.projectId);

  return (
    <div className="space-y-3">
      {existingRows.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-g500">
            Current assignments
          </p>
          {rows.map((row, index) => {
            if (!row.projectId) return null;
            return (
              <div
                key={`${row.projectId}-${index}`}
                className="flex flex-wrap items-end gap-3"
              >
                <div className="min-w-[200px] flex-1">
                  <FieldLabel htmlFor={`allocation-project-${index}`}>Project</FieldLabel>
                  <SelectInput
                    id={`allocation-project-${index}`}
                    value={row.projectId}
                    onChange={(event) =>
                      updateRow(index, { projectId: event.target.value })
                    }
                    options={projectOptions.filter((option) => option.value !== "")}
                  />
                </div>
                <div className="w-32">
                  <FieldLabel htmlFor={`allocation-fte-${index}`}>FTE</FieldLabel>
                  <SelectInput
                    id={`allocation-fte-${index}`}
                    value={row.fte}
                    onChange={(event) => updateRow(index, { fte: event.target.value })}
                    options={fteOptions}
                  />
                </div>
                <div className="flex shrink-0 flex-col">
                  <span className="field-label invisible" aria-hidden>
                    Remove
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg text-g500 transition hover:bg-magenta-soft hover:text-magenta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                    aria-label={`Remove ${projectName(row.projectId)}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {newRowIndex >= 0 && (
        <div className="flex flex-wrap items-end gap-3 border-t border-g200/80 pt-3">
          <div className="min-w-[200px] flex-1">
            <FieldLabel htmlFor="allocation-project-new">Add project</FieldLabel>
            <SelectInput
              id="allocation-project-new"
              value={rows[newRowIndex]?.projectId ?? ""}
              onChange={(event) => selectNewProject(event.target.value)}
              options={projectOptions}
            />
          </div>
          <div className="w-32">
            <FieldLabel htmlFor="allocation-fte-new">FTE</FieldLabel>
            <SelectInput
              id="allocation-fte-new"
              value={rows[newRowIndex]?.fte ?? "0.5"}
              onChange={(event) => updateRow(newRowIndex, { fte: event.target.value })}
              options={fteOptions}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function AllocationEditor({
  selection,
  projects,
  fixedProject,
  initialProjectId,
  initialFte,
  existingAssignments,
  onClose,
}: {
  selection: Selection;
  projects: PlannerProject[];
  /** When set, project is fixed (by-project view) and the project picker is hidden. */
  fixedProject?: PlannerProject;
  initialProjectId?: string;
  initialFte?: string;
  /** By-resource view: edit all assignments for the selected week(s). */
  existingAssignments?: EditorAssignmentRow[];
  onClose: () => void;
}) {
  const resourceMode = existingAssignments !== undefined && !fixedProject;
  const [state, formAction, pending] = useActionState(saveAllocations, emptyState);
  const [resourceRows, setResourceRows] = useState<AssignmentRowState[]>(() =>
    buildResourceRows(existingAssignments ?? []),
  );

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  useEffect(() => {
    if (resourceMode) {
      setResourceRows(buildResourceRows(existingAssignments ?? []));
    }
  }, [resourceMode, existingAssignments, selection.resourceId, selection.weekStarts]);

  const weekLabel = weekRangeLabel(selection.weekStarts);
  const weekCount = selection.weekStarts.length;
  const projectId = fixedProject?.id ?? initialProjectId ?? "";

  const assignmentsPayload = useMemo(() => {
    if (!resourceMode) return "";
    return JSON.stringify(
      resourceRows.filter((row) => row.projectId.trim().length > 0),
    );
  }, [resourceMode, resourceRows]);

  const canApply =
    projects.length > 0 &&
    (!resourceMode ||
      resourceRows.some((row) => row.projectId.trim().length > 0) ||
      (existingAssignments?.length ?? 0) > 0);

  return (
    <div className="card-accent rounded-[var(--radius)] border border-g200 bg-surface p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-g500">
            {resourceMode ? "Edit allocation" : "Assign allocation"}
          </p>
          {fixedProject ? (
            <>
              <p className="mt-1 text-[15px] font-medium text-ink">{fixedProject.name}</p>
              <p className="text-[13px] font-light text-g500">{selection.resourceName}</p>
            </>
          ) : (
            <p className="mt-1 text-[15px] font-medium text-ink">{selection.resourceName}</p>
          )}
          <p className="text-[13px] font-light text-g500">
            {weekCount === 1 ? "Week commencing" : `${weekCount} weeks`}{" "}
            {weekLabel}
          </p>
        </div>
        <GhostButton type="button" onClick={onClose}>
          Cancel
        </GhostButton>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="resourceId" value={selection.resourceId} />
        <input
          type="hidden"
          name="weekStarts"
          value={JSON.stringify(selection.weekStarts)}
        />

        {resourceMode ? (
          <>
            <input type="hidden" name="assignments" value={assignmentsPayload} />
            <ResourceAssignmentRows
              rows={resourceRows}
              projects={projects}
              onChange={setResourceRows}
            />
          </>
        ) : (
          <div className="flex flex-wrap items-end gap-4">
            {fixedProject ? (
              <input type="hidden" name="projectId" value={fixedProject.id} />
            ) : (
              <div className="min-w-[200px] flex-1">
                <FieldLabel htmlFor="allocation-project">Project</FieldLabel>
                <SelectInput
                  id="allocation-project"
                  name="projectId"
                  required
                  defaultValue={projectId}
                  options={[
                    { value: "", label: "Select project…" },
                    ...projects.map((project) => ({
                      value: project.id,
                      label: project.name,
                    })),
                  ]}
                />
              </div>
            )}

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
          </div>
        )}

        <GradientButton type="submit" disabled={pending || !canApply}>
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
        {resourceMode ? (
          <>
            Use the delete control or set FTE to 0 to remove a project. Changes apply
            to every selected week.
          </>
        ) : (
          <>
            Drag across weeks to select a range, or click a single week. Set FTE to 0 to
            remove an allocation for the chosen project.
          </>
        )}
      </p>
    </div>
  );
}
