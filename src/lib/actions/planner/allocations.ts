"use server";

import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { allocations } from "@/db/schema";
import {
  dbErrorMessage,
  isActionError,
  requiredText,
} from "@/lib/actions/admin/types";
import {
  type AllocationActionState,
  type AssignmentRow,
  parseAssignmentRows,
  parseFte,
  parseWeekStarts,
} from "@/lib/allocation-validation";
import { revalidatePath } from "next/cache";

export type { AllocationActionState };

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

  await db.transaction(async (tx) => {
    for (const weekStart of weekStarts) {
      await tx
        .delete(allocations)
        .where(
          and(
            eq(allocations.resourceId, resourceId),
            eq(allocations.weekStart, weekStart),
          ),
        );

      for (const row of positiveRows) {
        const fteText = row.fte.toFixed(1);
        await tx
          .insert(allocations)
          .values({
            resourceId,
            projectId: row.projectId,
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
  });
}

async function saveSingleProjectAllocation(
  resourceId: string,
  projectId: string,
  weekStarts: string[],
  fte: number,
): Promise<void> {
  const db = getDb();

  await db.transaction(async (tx) => {
    if (fte === 0) {
      await tx
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
      await tx
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
  });
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
