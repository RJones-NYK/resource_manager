"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProject, updateProject } from "@/lib/actions/admin/projects";
import { emptyActionState } from "@/lib/actions/admin/types";
import { GhostButton, GradientButton } from "@/components/ui/buttons";
import {
  FieldLabel,
  FormFeedback,
  SelectInput,
  TextArea,
  ComboInput,
  TextInput,
} from "@/components/ui/form-fields";
import { PanelHeader } from "@/components/ui/data-display";
import {
  PROJECT_STATUS_DESCRIPTIONS,
  type ProjectStatus,
  projectStatusLabel,
} from "@/lib/project-status";

const statusOptions: { value: ProjectStatus; label: string }[] = (
  ["pipeline", "planned", "active", "on_hold", "complete"] as const
).map((value) => ({ value, label: projectStatusLabel(value) }));

type Project = {
  id: string;
  name: string;
  client: string | null;
  status: "pipeline" | "planned" | "active" | "on_hold" | "complete";
  startDate: string | null;
  endDate: string | null;
  totalHoursBudgeted: string | null;
  zohoUrl: string | null;
  notes: string | null;
};

export function ProjectForm({
  project,
  clientSuggestions = [],
}: {
  project?: Project;
  clientSuggestions?: string[];
}) {
  const router = useRouter();
  const [resetKey, setResetKey] = useState(0);
  const [status, setStatus] = useState<ProjectStatus>(
    project?.status ?? "planned",
  );
  const action = project ? updateProject : createProject;
  const [state, formAction, pending] = useActionState(action, emptyActionState);

  useEffect(() => {
    if (!state.success) return;
    if (project) {
      router.replace("/admin/projects");
    } else {
      setResetKey((key) => key + 1);
      setStatus("planned");
    }
    router.refresh();
  }, [state.success, project, router]);

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-g200 bg-surface">
      <PanelHeader>{project ? "Edit project" : "Add project"}</PanelHeader>
      <form
        key={project?.id ?? `new-${resetKey}`}
        action={formAction}
        className="grid gap-4 p-4 sm:grid-cols-2"
      >
        {project ? <input type="hidden" name="id" value={project.id} /> : null}
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="project-name">Name</FieldLabel>
          <TextInput
            id="project-name"
            name="name"
            defaultValue={project?.name}
            required
            error={!!state.error}
          />
        </div>
        <div>
          <FieldLabel htmlFor="project-client">Client</FieldLabel>
          <ComboInput
            id="project-client"
            name="client"
            defaultValue={project?.client ?? ""}
            suggestions={clientSuggestions}
            placeholder="Select or type a client"
          />
        </div>
        <div>
          <FieldLabel htmlFor="project-status">Status</FieldLabel>
          <SelectInput
            id="project-status"
            name="status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ProjectStatus)
            }
            options={statusOptions}
            required
          />
          <p className="mt-1.5 text-[12px] font-light text-g500">
            {PROJECT_STATUS_DESCRIPTIONS[status]}
          </p>
        </div>
        <div>
          <FieldLabel htmlFor="project-start">Start date</FieldLabel>
          <TextInput
            id="project-start"
            name="startDate"
            type="date"
            defaultValue={project?.startDate ?? ""}
          />
        </div>
        <div>
          <FieldLabel htmlFor="project-end">End date</FieldLabel>
          <TextInput
            id="project-end"
            name="endDate"
            type="date"
            defaultValue={project?.endDate ?? ""}
          />
        </div>
        <div>
          <FieldLabel htmlFor="project-budget">Budget (hours)</FieldLabel>
          <TextInput
            id="project-budget"
            name="totalHoursBudgeted"
            type="number"
            defaultValue={project?.totalHoursBudgeted ?? ""}
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="project-zoho">Zoho link</FieldLabel>
          <TextInput
            id="project-zoho"
            name="zohoUrl"
            type="url"
            defaultValue={project?.zohoUrl ?? ""}
            placeholder="https://…"
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="project-notes">Notes</FieldLabel>
          <TextArea
            id="project-notes"
            name="notes"
            defaultValue={project?.notes ?? ""}
          />
        </div>
        <div className="sm:col-span-2">
          <FormFeedback error={state.error} success={state.success} />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <GradientButton type="submit" disabled={pending}>
            {pending ? "Saving…" : project ? "Save changes" : "Add project"}
          </GradientButton>
          {project ? (
            <GhostButton href="/admin/projects">Cancel</GhostButton>
          ) : null}
        </div>
      </form>
    </div>
  );
}
