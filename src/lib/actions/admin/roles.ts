"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { roles } from "@/db/schema";
import {
  type ActionState,
  dbErrorMessage,
  isActionError,
  requiredText,
  trimOrNull,
} from "./types";
import { revalidateAfterAdminChange, revalidateAdminExtras } from "./revalidate";

function revalidateRoles() {
  revalidateAfterAdminChange("roles");
  revalidateAdminExtras("/admin/resources");
}

export async function createRole(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = requiredText(formData.get("name"), "role name");
  if (isActionError(name)) return name;

  const description = trimOrNull(formData.get("description"));

  try {
    const db = getDb();
    await db.insert(roles).values({ name, description });
    revalidateRoles();
    return { success: true };
  } catch (error) {
    return { error: dbErrorMessage(error, "Failed to create role") };
  }
}

export async function updateRole(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Missing role id" };

  const name = requiredText(formData.get("name"), "role name");
  if (isActionError(name)) return name;

  const description = trimOrNull(formData.get("description"));

  try {
    const db = getDb();
    await db
      .update(roles)
      .set({ name, description, updatedAt: new Date() })
      .where(eq(roles.id, id));
    revalidateRoles();
    return { success: true };
  } catch (error) {
    return { error: dbErrorMessage(error, "Failed to update role") };
  }
}

export async function deleteRole(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const db = getDb();
  await db.delete(roles).where(eq(roles.id, id));
  revalidateRoles();
}
