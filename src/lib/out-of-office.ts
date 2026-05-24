export const OUT_OF_OFFICE_REASONS = [
  "Annual Leave",
  "Public Holiday",
  "Training",
  "Sales/Marketing",
] as const;

export type OutOfOfficeReason = (typeof OUT_OF_OFFICE_REASONS)[number];

export function isOutOfOfficeReason(value: string): value is OutOfOfficeReason {
  return OUT_OF_OFFICE_REASONS.includes(value as OutOfOfficeReason);
}
