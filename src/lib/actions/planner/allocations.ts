"use server";

import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { allocations } from "@/db/schema";
import {
  dbErrorMessage,
  isActionError,
  requiredText,
} from "@/lib/actions/admin/types";
import { revalidatePath } from "next/cache";

export type AllocationActionState = {
  error?: string;
  success?: boolean;
};

function parseFte(value: FormDataEntryValue | null): number | { error: string } {
  const text = String(value ?? "").trim();
  if (!text) {
    return { error: "Select an FTE amount" };
  }
  const fte = Number(text);
  if (Number.isNaN(fte) || fte < 0 || fte > 1) {
    return { error: "FTE must be between 0 and 1" };
  }
  const rounded = Math.round(fte * 10) / 10;
  if (Math.abs(rounded - fte) > 0.001) {
    return { error: "FTE must be in 0.1 increments" };
  }
  return rounded;
}

function parseWeekStarts(value: FormDataEntryValue | null): string[] | { error: string } {
  const text = String(value ?? "").trim();
  if (!text) {
    return { error: "No weeks selected" };
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return { error: "No weeks selected" };
    }
    if (!parsed.every((item) => typeof item === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item))) {
      return { error: "Invalid week selection" };
    }
    return parsed;
  } catch {
    return { error: "Invalid week selection" };
  }
}

function revalidatePlanner() {
  revalidatePath("/");
  revalidatePath("/planner/by-resource");
  revalidatePath("/planner/by-project");
}

export async function saveAllocations(
  _prev: AllocationActionState,
  formData: FormData,
): Promise<AllocationActionState> {
  const resourceId = requiredText(formData.get("resourceId"), "resource");
  if (isActionError(resourceId)) return resourceId;

  const projectId = requiredText(formData.get("projectId"), "project");
  if (isActionError(projectId)) return projectId;

  const fte = parseFte(formData.get("fte"));
  if (isActionError(fte)) return fte;

  const weekStarts = parseWeekStarts(formData.get("weekStarts"));
  if (isActionError(weekStarts)) return weekStarts;

  const db = getDb();

  try {
    if (fte === 0) {
      await db
        .delete(allocations)
        .where(
          and(
            eq(allocations.resourceId, resourceId),
            eq(allocations.projectId, projectId),
            inArray(allocations.weekStart, weekStarts),
          ),
        );
    } else {
      const fteText = fte.toFixed(1);
      for (const weekStart of weekStarts) {
        await db
          .insert(allocations)
          .values({
            resourceId,
            projectId,
            weekStart,
            fteAllocated: fteText,
          })
          .onConflictDoUpdate({
            target: [
              allocations.resourceId,
              allocations.projectId,
              allocations.weekStart,
            ],
            set: {
              fteAllocated: fteText,
              updatedAt: new Date(),
            },
          });
      }
    }

    revalidatePlanner();
    return { success: true };
  } catch (error) {
    return { error: dbErrorMessage(error, "Failed to save allocations") };
  }
}

