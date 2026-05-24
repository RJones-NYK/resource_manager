import { isOutOfOfficeReason } from "@/lib/out-of-office";
import {
  isResourceLocation,
  type ResourceLocation,
} from "@/lib/resources";

export type ActionState = {
  error?: string;
  success?: boolean;
};

export const emptyActionState: ActionState = {};

export function trimOrNull(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

export function requiredText(
  value: FormDataEntryValue | null,
  label: string,
): string | { error: string } {
  const text = String(value ?? "").trim();
  if (!text) {
    return { error: `Enter a ${label}` };
  }
  return text;
}

export function parseOptionalNumber(
  value: FormDataEntryValue | null,
): string | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const num = Number(text);
  if (Number.isNaN(num) || num < 0) return null;
  return text;
}

export function parseRequiredNumber(
  value: FormDataEntryValue | null,
  label: string,
  fallback?: string,
): string | { error: string } {
  const text = String(value ?? "").trim() || fallback || "";
  if (!text) {
    return { error: `Enter a ${label}` };
  }
  const num = Number(text);
  if (Number.isNaN(num) || num < 0) {
    return { error: `Enter a valid ${label}` };
  }
  return text;
}

/** Weekly hours that define 1 FTE — whole or half hours only (e.g. 37.5, 40). */
export function parseFteHoursPerWeek(
  value: FormDataEntryValue | null,
  fallback?: string,
): string | { error: string } {
  const text = String(value ?? "").trim() || fallback || "";
  if (!text) {
    return { error: "Enter FTE hours per week" };
  }
  const num = Number(text);
  if (Number.isNaN(num) || num < 0) {
    return { error: "Enter a valid FTE hours per week" };
  }
  const rounded = Math.round(num * 2) / 2;
  if (Math.abs(rounded - num) > 0.001) {
    return { error: "FTE hours per week must be in 0.5 hour steps" };
  }
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function parseOutOfOfficeReason(
  value: FormDataEntryValue | null,
): string | { error: string } {
  const text = requiredText(value, "reason");
  if (isActionError(text)) return text;
  if (isOutOfOfficeReason(text)) {
    return text;
  }
  return { error: "Select a valid reason" };
}

export function parseResourceLocation(
  value: FormDataEntryValue | null,
): ResourceLocation | null | { error: string } {
  const text = String(value ?? "").trim();
  if (!text) {
    return null;
  }
  if (isResourceLocation(text)) {
    return text;
  }
  return { error: "Select UK or Italy" };
}

export function isActionError(value: unknown): value is { error: string } {
  return typeof value === "object" && value !== null && "error" in value;
}

export function parseZohoUrl(
  value: FormDataEntryValue | null,
): string | null | { error: string } {
  const text = trimOrNull(value);
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== "https:") {
      return { error: "Zoho URL must use https" };
    }
    return text;
  } catch {
    return { error: "Enter a valid https URL" };
  }
}

export function dbErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (error.message.includes("unique") || error.message.includes("duplicate")) {
      return "That name already exists";
    }
    console.error(error);
  } else if (error) {
    console.error(error);
  }
  return fallback;
}
