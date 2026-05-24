"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createOutOfOffice,
  updateOutOfOffice,
} from "@/lib/actions/admin/out-of-office";
import { emptyActionState } from "@/lib/actions/admin/types";
import { GhostButton, GradientButton } from "@/components/ui/buttons";
import {
  FieldLabel,
  FormFeedback,
  SelectInput,
  TextInput,
} from "@/components/ui/form-fields";
import {
  isOutOfOfficeReason,
  OUT_OF_OFFICE_REASONS,
} from "@/lib/out-of-office";
import { PanelHeader } from "@/components/ui/data-display";
import { MultiSelectCheckboxes } from "@/components/ui/multi-select-checkboxes";

type ResourceOption = { id: string; label: string };

type OutOfOfficeRecord = {
  id: string;
  resourceId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
};

export function OutOfOfficeForm({
  record,
  resources,
}: {
  record?: OutOfOfficeRecord;
  resources: ResourceOption[];
}) {
  const router = useRouter();
  const [resetKey, setResetKey] = useState(0);
  const [startDate, setStartDate] = useState(record?.startDate ?? "");
  const [endDate, setEndDate] = useState(record?.endDate ?? "");
  const action = record ? updateOutOfOffice : createOutOfOffice;
  const [state, formAction, pending] = useActionState(action, emptyActionState);

  useEffect(() => {
    setStartDate(record?.startDate ?? "");
    setEndDate(record?.endDate ?? "");
  }, [record?.id, record?.startDate, record?.endDate, resetKey]);

  useEffect(() => {
    if (!state.success) return;
    if (record) {
      router.replace("/admin/out-of-office");
    } else {
      setResetKey((key) => key + 1);
      setStartDate("");
      setEndDate("");
    }
    router.refresh();
  }, [state.success, record, router]);

  function handleStartDateChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextStart = event.target.value;
    setStartDate(nextStart);
    if (nextStart) {
      setEndDate(nextStart);
    }
  }

  function handleEndDateChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextEnd = event.target.value;
    if (startDate && nextEnd && nextEnd < startDate) {
      setEndDate(startDate);
      return;
    }
    setEndDate(nextEnd);
  }

  const resourceOptions = resources.map((resource) => ({
    value: resource.id,
    label: resource.label,
  }));

  const defaultReason = record?.reason ?? "";
  const reasonOptions: { value: string; label: string }[] =
    OUT_OF_OFFICE_REASONS.map((reason) => ({
      value: reason,
      label: reason,
    }));
  if (defaultReason && !isOutOfOfficeReason(defaultReason)) {
    reasonOptions.unshift({ value: defaultReason, label: defaultReason });
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-g200 bg-surface">
      <PanelHeader>
        {record ? "Edit out-of-office period" : "Add out-of-office period"}
      </PanelHeader>
      <form
        key={record?.id ?? `new-${resetKey}`}
        action={formAction}
        className="grid gap-4 p-4 sm:grid-cols-2"
      >
        {record ? <input type="hidden" name="id" value={record.id} /> : null}
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="ooo-resource">
            {record ? "Resource" : "Resources"}
          </FieldLabel>
          {record ? (
            <SelectInput
              id="ooo-resource"
              name="resourceId"
              defaultValue={record.resourceId}
              placeholder="Select resource"
              options={resourceOptions}
              required
            />
          ) : (
            <MultiSelectCheckboxes
              id="ooo-resource"
              name="resourceIds"
              options={resourceOptions}
            />
          )}
          {resources.length === 0 ? (
            <p className="field-hint">Add resources before recording out-of-office.</p>
          ) : !record ? (
            <p className="field-hint">
              Select one or more resources — use Select all for company-wide dates such as bank holidays.
            </p>
          ) : null}
        </div>
        <div>
          <FieldLabel htmlFor="ooo-start">Start date</FieldLabel>
          <TextInput
            id="ooo-start"
            name="startDate"
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            required
            error={!!state.error}
          />
        </div>
        <div>
          <FieldLabel htmlFor="ooo-end">End date</FieldLabel>
          <TextInput
            id="ooo-end"
            name="endDate"
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            min={startDate || undefined}
            required
            disabled={!startDate}
          />
          {!startDate ? (
            <p className="field-hint">Enter a start date first.</p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="ooo-reason">Reason</FieldLabel>
          <SelectInput
            id="ooo-reason"
            name="reason"
            defaultValue={defaultReason}
            placeholder="Select reason"
            options={reasonOptions}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <FormFeedback error={state.error} success={state.success} />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <GradientButton type="submit" disabled={pending}>
            {pending ? "Saving…" : record ? "Save changes" : "Add period"}
          </GradientButton>
          {record ? (
            <GhostButton href="/admin/out-of-office">Cancel</GhostButton>
          ) : null}
        </div>
      </form>
    </div>
  );
}
