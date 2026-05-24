"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createRole, updateRole } from "@/lib/actions/admin/roles";
import { emptyActionState } from "@/lib/actions/admin/types";
import { GhostButton, GradientButton } from "@/components/ui/buttons";
import {
  FieldLabel,
  FormFeedback,
  TextArea,
  TextInput,
} from "@/components/ui/form-fields";
import { PanelHeader } from "@/components/ui/data-display";

type Role = {
  id: string;
  name: string;
  description: string | null;
};

export function RoleForm({ role }: { role?: Role }) {
  const router = useRouter();
  const [resetKey, setResetKey] = useState(0);
  const action = role ? updateRole : createRole;
  const [state, formAction, pending] = useActionState(action, emptyActionState);

  useEffect(() => {
    if (!state.success) return;
    if (role) {
      router.replace("/admin/roles");
    } else {
      setResetKey((key) => key + 1);
    }
    router.refresh();
  }, [state.success, role, router]);

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-g200 bg-surface">
      <PanelHeader>{role ? "Edit role" : "Add role"}</PanelHeader>
      <form
        key={role?.id ?? `new-${resetKey}`}
        action={formAction}
        className="space-y-4 p-4"
      >
        {role ? <input type="hidden" name="id" value={role.id} /> : null}
        <div>
          <FieldLabel htmlFor="role-name">Name</FieldLabel>
          <TextInput
            id="role-name"
            name="name"
            defaultValue={role?.name}
            required
            error={!!state.error}
          />
        </div>
        <div>
          <FieldLabel htmlFor="role-description">Description</FieldLabel>
          <TextArea
            id="role-description"
            name="description"
            defaultValue={role?.description ?? ""}
          />
        </div>
        <FormFeedback error={state.error} success={state.success} />
        <div className="flex flex-wrap items-center gap-3">
          <GradientButton type="submit" disabled={pending}>
            {pending ? "Saving…" : role ? "Save changes" : "Add role"}
          </GradientButton>
          {role ? (
            <GhostButton href="/admin/roles">Cancel</GhostButton>
          ) : null}
        </div>
      </form>
    </div>
  );
}
