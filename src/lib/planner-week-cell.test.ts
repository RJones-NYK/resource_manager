import { describe, expect, it } from "vitest";
import { weekCellAllocationLayout } from "@/lib/planner-capacity";
import {
  outOfOfficeWidthPercent,
  type OutOfOfficeDaySegment,
} from "@/lib/planner-out-of-office";

describe("outOfOfficeWidthPercent", () => {
  it("sums weekday segments into a left-first share of the week", () => {
    const segments: OutOfOfficeDaySegment[] = [
      { startDayIndex: 0, dayCount: 2 },
      { startDayIndex: 3, dayCount: 1 },
    ];
    expect(outOfOfficeWidthPercent(segments)).toBe(60);
  });
});

describe("weekCellAllocationLayout", () => {
  it("places allocation fill after out-of-office", () => {
    expect(weekCellAllocationLayout(0.5, 1, 40)).toEqual({
      leftPercent: 40,
      widthPercent: 50,
    });
  });

  it("caps combined width at 100%", () => {
    expect(weekCellAllocationLayout(1.2, 1, 40)).toEqual({
      leftPercent: 40,
      widthPercent: 60,
    });
  });
});
