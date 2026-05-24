"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { resources } from "@/db/schema";
import {
  type ActionState,
  dbErrorMessage,
  isActionError,
  parseFteHoursPerWeek,
  parseRequiredNumber,
  parseResourceLocation,
  requiredText,
  trimOrNull,
} from "./types";
import { revalidateAfterAdminChange, revalidateAdminExtras } from "./revalidate";

function revalidateResources() {
  revalidateAfterAdminChange("resources");
  revalidateAdminExtras("/admin/out-of-office", "/planner/by-resource");
}

export async function createResource(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const firstName = requiredText(formData.get("firstName"), "first name");
  if (isActionError(firstName)) return firstName;

  const lastName = requiredText(formData.get("lastName"), "last name");
  if (isActionError(lastName)) return lastName;

  const roleId = trimOrNull(formData.get("roleId"));
  const location = parseResourceLocation(formData.get("location"));
  if (location !== null && typeof location === "object") return location;

  const fteHoursPerWeek = parseFteHoursPerWeek(
    formData.get("fteHoursPerWeek"),
    "37.5",
  );
  if (isActionError(fteHoursPerWeek)) return fteHoursPerWeek;

  const defaultFte = parseRequiredNumber(
    formData.get("defaultFte"),
    "default FTE",
    "1.0",
  );
  if (isActionError(defaultFte)) return defaultFte;

  const isActive = formData.get("isActive") === "on" ? 1 : 0;
  const isExternal = formData.get("isExternal") === "on" ? 1 : 0;

  try {
    const db = getDb();
    await db.insert(resources).values({
      firstName,
      lastName,
      roleId,
      location,
      fteHoursPerWeek,
      defaultFte,
      isActive,
      isExternal,
    });
    revalidateResources();
    return { success: true };
  } catch (error) {
    return { error: dbErrorMessage(error, "Failed to create resource") };
  }
}

export async function updateResource(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing resource id" };

  const firstName = requiredText(formData.get("firstName"), "first name");
  if (isActionError(firstName)) return firstName;

  const lastName = requiredText(formData.get("lastName"), "last name");
  if (isActionError(lastName)) return lastName;

  const roleId = trimOrNull(formData.get("roleId"));
  const location = parseResourceLocation(formData.get("location"));
  if (location !== null && typeof location === "object") return location;

  const fteHoursPerWeek = parseFteHoursPerWeek(formData.get("fteHoursPerWeek"));
  if (isActionError(fteHoursPerWeek)) return fteHoursPerWeek;

  const defaultFte = parseRequiredNumber(formData.get("defaultFte"), "default FTE");
  if (isActionError(defaultFte)) return defaultFte;

  const isActive = formData.get("isActive") === "on" ? 1 : 0;
  const isExternal = formData.get("isExternal") === "on" ? 1 : 0;

  try {
    const db = getDb();
    await db
      .update(resources)
      .set({
        firstName,
        lastName,
        roleId,
        location,
        fteHoursPerWeek,
        defaultFte,
        isActive,
        isExternal,
        updatedAt: new Date(),
      })
      .where(eq(resources.id, id));
    revalidateResources();
    return { success: true };
  } catch (error) {
    return { error: dbErrorMessage(error, "Failed to update resource") };
  }
}

export async function deleteResource(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const db = getDb();
  await db.delete(resources).where(eq(resources.id, id));
  revalidateResources();
}
