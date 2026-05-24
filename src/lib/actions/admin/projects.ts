"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { projects, projectStatusEnum } from "@/db/schema";
import {
  type ActionState,
  dbErrorMessage,
  isActionError,
  parseOptionalNumber,
  requiredText,
  parseZohoUrl,
  trimOrNull,
} from "./types";
import { revalidateAfterAdminChange, revalidateAdminExtras } from "./revalidate";

const statuses = projectStatusEnum.enumValues;

function revalidateProjects() {
  revalidateAfterAdminChange("projects");
  revalidateAdminExtras("/planner/by-project");
}

function parseStatus(value: FormDataEntryValue | null) {
  const status = String(value ?? "planned");
  if (!statuses.includes(status as (typeof statuses)[number])) {
    return { error: "Select a valid status" } as const;
  }
  return status as (typeof statuses)[number];
}

export async function createProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = requiredText(formData.get("name"), "project name");
  if (isActionError(name)) return name;

  const client = trimOrNull(formData.get("client"));
  const status = parseStatus(formData.get("status"));
  if (typeof status === "object") {
    return status;
  }

  const startDate = trimOrNull(formData.get("startDate"));
  const endDate = trimOrNull(formData.get("endDate"));
  const totalHoursBudgeted = parseOptionalNumber(
    formData.get("totalHoursBudgeted"),
  );
  const notes = trimOrNull(formData.get("notes"));
  const zohoUrl = parseZohoUrl(formData.get("zohoUrl"));
  if (isActionError(zohoUrl)) return zohoUrl;

  try {
    const db = getDb();
    await db.insert(projects).values({
      name,
      client,
      zohoUrl,
      status,
      startDate,
      endDate,
      totalHoursBudgeted,
      notes,
    });
    revalidateProjects();
    return { success: true };
  } catch (error) {
    return { error: dbErrorMessage(error, "Failed to create project") };
  }
}

export async function updateProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing project id" };

  const name = requiredText(formData.get("name"), "project name");
  if (isActionError(name)) return name;

  const client = trimOrNull(formData.get("client"));
  const status = parseStatus(formData.get("status"));
  if (typeof status === "object") {
    return status;
  }

  const startDate = trimOrNull(formData.get("startDate"));
  const endDate = trimOrNull(formData.get("endDate"));
  const totalHoursBudgeted = parseOptionalNumber(
    formData.get("totalHoursBudgeted"),
  );
  const notes = trimOrNull(formData.get("notes"));
  const zohoUrl = parseZohoUrl(formData.get("zohoUrl"));
  if (isActionError(zohoUrl)) return zohoUrl;

  try {
    const db = getDb();
    await db
      .update(projects)
      .set({
        name,
        client,
        zohoUrl,
        status,
        startDate,
        endDate,
        totalHoursBudgeted,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id));
    revalidateProjects();
    return { success: true };
  } catch (error) {
    return { error: dbErrorMessage(error, "Failed to update project") };
  }
}

export async function deleteProject(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const db = getDb();
  await db.delete(projects).where(eq(projects.id, id));
  revalidateProjects();
}
