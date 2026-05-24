"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { outOfOffice } from "@/db/schema";
import { isOutOfOfficeReason } from "@/lib/out-of-office";
import {
  type ActionState,
  dbErrorMessage,
  isActionError,
  requiredText,
  parseOutOfOfficeReason,
} from "./types";
import { revalidateAfterAdminChange, revalidateAdminExtras } from "./revalidate";

function revalidateOutOfOffice() {
  revalidateAfterAdminChange("out-of-office");
  revalidateAdminExtras("/planner/by-resource");
}

function parseResourceIds(formData: FormData): string[] | { error: string } {
  const resourceIds = formData
    .getAll("resourceIds")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (resourceIds.length === 0) {
    return { error: "Select at least one resource" };
  }

  return resourceIds;
}

export async function createOutOfOffice(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const resourceIdsResult = parseResourceIds(formData);
  if ("error" in resourceIdsResult) return resourceIdsResult;
  const resourceIds = resourceIdsResult;

  const startDate = requiredText(formData.get("startDate"), "start date");
  if (isActionError(startDate)) return startDate;

  const endDate = requiredText(formData.get("endDate"), "end date");
  if (isActionError(endDate)) return endDate;

  if (endDate < startDate) {
    return { error: "End date must be on or after start date" };
  }

  const reason = parseOutOfOfficeReason(formData.get("reason"));
  if (isActionError(reason)) return reason;

  try {
    const db = getDb();
    await db.insert(outOfOffice).values(
      resourceIds.map((resourceId) => ({
        resourceId,
        startDate,
        endDate,
        reason,
      })),
    );
    revalidateOutOfOffice();
    return { success: true };
  } catch (error) {
    return { error: dbErrorMessage(error, "Failed to create out-of-office period") };
  }
}

export async function updateOutOfOffice(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing record id" };

  const resourceId = requiredText(formData.get("resourceId"), "resource");
  if (isActionError(resourceId)) return resourceId;

  const startDate = requiredText(formData.get("startDate"), "start date");
  if (isActionError(startDate)) return startDate;

  const endDate = requiredText(formData.get("endDate"), "end date");
  if (isActionError(endDate)) return endDate;

  if (endDate < startDate) {
    return { error: "End date must be on or after start date" };
  }

  const reasonText = requiredText(formData.get("reason"), "reason");
  if (isActionError(reasonText)) return reasonText;

  try {
    const db = getDb();

    const reason = reasonText;
    if (!isOutOfOfficeReason(reasonText)) {
      const [existing] = await db
        .select({ reason: outOfOffice.reason })
        .from(outOfOffice)
        .where(eq(outOfOffice.id, id))
        .limit(1);
      if (existing?.reason !== reasonText) {
        return { error: "Select a valid reason" };
      }
    }

    await db
      .update(outOfOffice)
      .set({
        resourceId,
        startDate,
        endDate,
        reason,
        updatedAt: new Date(),
      })
      .where(eq(outOfOffice.id, id));
    revalidateOutOfOffice();
    return { success: true };
  } catch (error) {
    return { error: dbErrorMessage(error, "Failed to update out-of-office period") };
  }
}

export async function deleteOutOfOffice(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const db = getDb();
  await db.delete(outOfOffice).where(eq(outOfOffice.id, id));
  revalidateOutOfOffice();
}
