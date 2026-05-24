export const RESOURCE_LOCATIONS = ["UK", "Italy"] as const;

export type ResourceLocation = (typeof RESOURCE_LOCATIONS)[number];

export function isResourceLocation(value: string): value is ResourceLocation {
  return RESOURCE_LOCATIONS.includes(value as ResourceLocation);
}

export function formatResourceName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}
