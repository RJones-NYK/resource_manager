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

type AssignmentRow = { projectId: string; fte: number };

function parseAssignmentRows(
  value: FormDataEntryValue | null,
): AssignmentRow[] | { error: string } {
  const text = String(value ?? "").trim();
  if (!text) {
    return [];
  }
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) {
      return { error: "Invalid assignment rows" };
    }
    const rows: AssignmentRow[] = [];
    const seen = new Set<string>();
    for (const item of parsed) {
      if (
        typeof item !== "object" ||
        item === null ||
        typeof (item as { projectId?: unknown }).projectId !== "string"
      ) {
        return { error: "Invalid assignment rows" };
      }
      const projectId = (item as { projectId: string }).projectId.trim();
      if (!projectId || seen.has(projectId)) continue;
      seen.add(projectId);
      const fte = parseFte(
        (item as { fte?: unknown }).fte as FormDataEntryValue | null,
      );
      if (isActionError(fte)) return fte;
      rows.push({ projectId, fte });
    }
    return rows;
  } catch {
    return { error: "Invalid assignment rows" };
  }
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

async function replaceWeekAssignments(
  resourceId: string,
  weekStarts: string[],
  rows: AssignmentRow[],
): Promise<void> {
  const db = getDb();
  const positiveRows = rows.filter((row) => row.fte > 0);

  for (const weekStart of weekStarts) {
    await db
      .delete(allocations)
      .where(
        and(eq(allocations.resourceId, resourceId), eq(allocations.weekStart, weekStart)),
      );

    for (const row of positiveRows) {
      await db.insert(allocations).values({
        resourceId,
        projectId: row.projectId,
        weekStart,
        fteAllocated: row.fte.toFixed(1),
      });
    }
  }
}

async function saveSingleProjectAllocation(
  resourceId: string,
  projectId: string,
  weekStarts: string[],
  fte: number,
): Promise<void> {
  const db = getDb();

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
    return;
  }

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

export async function saveAllocations(
  _prev: AllocationActionState,
  formData: FormData,
): Promise<AllocationActionState> {
  const resourceId = requiredText(formData.get("resourceId"), "resource");
  if (isActionError(resourceId)) return resourceId;

  const weekStarts = parseWeekStarts(formData.get("weekStarts"));
  if (isActionError(weekStarts)) return weekStarts;

  const batchRows = parseAssignmentRows(formData.get("assignments"));
  if (isActionError(batchRows)) return batchRows;

  try {
    if (formData.has("assignments")) {
      await replaceWeekAssignments(resourceId, weekStarts, batchRows);
      revalidatePlanner();
      return { success: true };
    }

    const projectId = requiredText(formData.get("projectId"), "project");
    if (isActionError(projectId)) return projectId;

    const fte = parseFte(formData.get("fte"));
    if (isActionError(fte)) return fte;

    await saveSingleProjectAllocation(resourceId, projectId, weekStarts, fte);
    revalidatePlanner();
    return { success: true };
  } catch (error) {
    return { error: dbErrorMessage(error, "Failed to save allocations") };
  }
}

