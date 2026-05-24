export const RESOURCE_LOCATIONS = ["UK", "Italy"] as const;

export type ResourceLocation = (typeof RESOURCE_LOCATIONS)[number];

/** Role seniority: highest rank first. Unknown roles sort after these. */
export const ROLE_SENIORITY_ORDER = [
  "Clinical Business Partner",
  "Clinical Manager",
  "Clinical Consultant",
  "Clinical Analyst",
] as const;

/** Alternate role labels that share the same seniority rank. */
const ROLE_SENIORITY_ALIASES: Record<string, number> = {
  "business partner": 0,
  "clinical business partner": 0,
  "clinical manager": 1,
  "clinical consultant": 2,
  "clinical analyst": 3,
};

export type ResourceSortFields = {
  roleName?: string | null;
  isExternal?: boolean | number;
  lastName: string;
  firstName?: string;
};

export function isResourceLocation(value: string): value is ResourceLocation {
  return RESOURCE_LOCATIONS.includes(value as ResourceLocation);
}

export function formatResourceName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

function normalizeRoleName(roleName: string | null | undefined): string {
  return roleName?.trim().toLowerCase() ?? "";
}

export function roleSeniorityIndex(roleName: string | null | undefined): number {
  const normalized = normalizeRoleName(roleName);
  if (!normalized) return ROLE_SENIORITY_ORDER.length;

  const aliasIndex = ROLE_SENIORITY_ALIASES[normalized];
  if (aliasIndex !== undefined) return aliasIndex;

  const index = ROLE_SENIORITY_ORDER.findIndex(
    (role) => role.toLowerCase() === normalized,
  );
  return index === -1 ? ROLE_SENIORITY_ORDER.length : index;
}

function isExternalResource(isExternal: boolean | number | undefined): boolean {
  return isExternal === true || isExternal === 1;
}

function compareNames(aLast: string, aFirst: string, bLast: string, bFirst: string): number {
  const lastCompare = aLast.localeCompare(bLast, undefined, { sensitivity: "base" });
  if (lastCompare !== 0) return lastCompare;
  return aFirst.localeCompare(bFirst, undefined, { sensitivity: "base" });
}

export function compareResourcesBySeniority(
  a: ResourceSortFields,
  b: ResourceSortFields,
): number {
  const externalCompare =
    Number(isExternalResource(a.isExternal)) - Number(isExternalResource(b.isExternal));
  if (externalCompare !== 0) return externalCompare;

  const roleCompare = roleSeniorityIndex(a.roleName) - roleSeniorityIndex(b.roleName);
  if (roleCompare !== 0) return roleCompare;

  return compareNames(
    a.lastName,
    a.firstName ?? "",
    b.lastName,
    b.firstName ?? "",
  );
}

export function sortResourcesBySeniority<T extends ResourceSortFields>(items: T[]): T[] {
  return [...items].sort(compareResourcesBySeniority);
}
