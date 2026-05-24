"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createResource,
  updateResource,
} from "@/lib/actions/admin/resources";
import { emptyActionState } from "@/lib/actions/admin/types";
import { GhostButton, GradientButton } from "@/components/ui/buttons";
import {
  FieldLabel,
  FormFeedback,
  SelectInput,
  TextInput,
} from "@/components/ui/form-fields";
import { PanelHeader } from "@/components/ui/data-display";
import { RESOURCE_LOCATIONS } from "@/lib/resources";

const locationOptions = RESOURCE_LOCATIONS.map((location) => ({
  value: location,
  label: location,
}));

type RoleOption = { id: string; name: string };

type Resource = {
  id: string;
  firstName: string;
  lastName: string;
  roleId: string | null;
  location: string | null;
  fteHoursPerWeek: string;
  defaultFte: string;
  isActive: number;
  isExternal: number;
};

export function ResourceForm({
  resource,
  roles,
}: {
  resource?: Resource;
  roles: RoleOption[];
}) {
  const router = useRouter();
  const [resetKey, setResetKey] = useState(0);
  const action = resource ? updateResource : createResource;
  const [state, formAction, pending] = useActionState(action, emptyActionState);

  useEffect(() => {
    if (!state.success) return;
    if (resource) {
      router.replace("/admin/resources");
    } else {
      setResetKey((key) => key + 1);
    }
    router.refresh();
  }, [state.success, resource, router]);

  const roleOptions = roles.map((role) => ({
    value: role.id,
    label: role.name,
  }));

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-g200 bg-surface">
      <PanelHeader>{resource ? "Edit resource" : "Add resource"}</PanelHeader>
      <form
        key={resource?.id ?? `new-${resetKey}`}
        action={formAction}
        className="grid gap-4 p-4 sm:grid-cols-2"
      >
        {resource ? <input type="hidden" name="id" value={resource.id} /> : null}
        <div>
          <FieldLabel htmlFor="resource-first-name">First name</FieldLabel>
          <TextInput
            id="resource-first-name"
            name="firstName"
            defaultValue={resource?.firstName}
            required
            error={!!state.error}
          />
        </div>
        <div>
          <FieldLabel htmlFor="resource-last-name">Last name</FieldLabel>
          <TextInput
            id="resource-last-name"
            name="lastName"
            defaultValue={resource?.lastName}
            required
          />
        </div>
        <div>
          <FieldLabel htmlFor="resource-role">Role</FieldLabel>
          <SelectInput
            id="resource-role"
            name="roleId"
            defaultValue={resource?.roleId ?? ""}
            placeholder="Select role"
            options={roleOptions}
          />
          {roles.length === 0 ? (
            <p className="field-hint">Add roles first to assign a job role.</p>
          ) : null}
        </div>
        <div>
          <FieldLabel htmlFor="resource-location">Location</FieldLabel>
          <SelectInput
            id="resource-location"
            name="location"
            defaultValue={resource?.location ?? ""}
            placeholder="Select location"
            options={locationOptions}
          />
        </div>
        <div>
          <FieldLabel htmlFor="resource-fte-hours">FTE hours per week</FieldLabel>
          <TextInput
            id="resource-fte-hours"
            name="fteHoursPerWeek"
            type="number"
            min={0}
            step={0.5}
            defaultValue={resource?.fteHoursPerWeek ?? "37.5"}
            required
          />
        </div>
        <div>
          <FieldLabel htmlFor="resource-default-fte">Default FTE</FieldLabel>
          <TextInput
            id="resource-default-fte"
            name="defaultFte"
            type="number"
            defaultValue={resource?.defaultFte ?? "1.0"}
            required
          />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-2">
          <label className="checkbox-row">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={resource ? resource.isActive === 1 : true}
            />
            Active resource
          </label>
          <label className="checkbox-row">
            <input
              type="checkbox"
              name="isExternal"
              defaultChecked={resource ? resource.isExternal === 1 : false}
            />
            External resource
          </label>
        </div>
        <div className="sm:col-span-2">
          <FormFeedback error={state.error} success={state.success} />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <GradientButton type="submit" disabled={pending}>
            {pending ? "Saving…" : resource ? "Save changes" : "Add resource"}
          </GradientButton>
          {resource ? (
            <GhostButton href="/admin/resources">Cancel</GhostButton>
          ) : null}
        </div>
      </form>
    </div>
  );
}
