export type AllocationActionState = {
  error?: string;
  success?: boolean;
};

export function parseFte(value: FormDataEntryValue | null): number | { error: string } {
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

export type AssignmentRow = { projectId: string; fte: number };

export function isActionError(value: unknown): value is { error: string } {
  return typeof value === "object" && value !== null && "error" in value;
}

export function parseAssignmentRows(
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

export function parseWeekStarts(value: FormDataEntryValue | null): string[] | { error: string } {
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
