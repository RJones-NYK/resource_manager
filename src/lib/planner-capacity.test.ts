import { describe, expect, it } from "vitest";
import {
  fteLoadLevel,
  fteLoadLevelForResourceWeek,
  fteLoadLabel,
  outOfOfficeFteEquivalent,
  totalResourceLoadFte,
} from "@/lib/planner-capacity";

describe("outOfOfficeFteEquivalent", () => {
  it("converts OoO days to a share of weekly capacity", () => {
    expect(
      outOfOfficeFteEquivalent([{ startDayIndex: 0, dayCount: 3 }], 1),
    ).toBe(0.6);
  });
});

describe("totalResourceLoadFte", () => {
  it("combines allocations and out-of-office", () => {
    const load = totalResourceLoadFte(
      [{ fteAllocated: "0.5" } as never],
      [{ startDayIndex: 0, dayCount: 3 }],
      1,
    );
    expect(load).toBeCloseTo(1.1);
    expect(fteLoadLevel(load)).toBe("warning");
  });

  it("flags high utilisation when OoO plus light allocation exceeds 0.8", () => {
    const load = totalResourceLoadFte(
      [{ fteAllocated: "0.2" } as never],
      [{ startDayIndex: 0, dayCount: 3 }],
      1,
    );
    expect(load).toBeCloseTo(0.8);
    expect(fteLoadLevelForResourceWeek(
      [{ fteAllocated: "0.2" } as never],
      [{ startDayIndex: 0, dayCount: 3 }],
      1,
    )).toBe("normal");

    const noticeLoad = totalResourceLoadFte(
      [{ fteAllocated: "0.3" } as never],
      [{ startDayIndex: 0, dayCount: 3 }],
      1,
    );
    expect(noticeLoad).toBeCloseTo(0.9);
    expect(fteLoadLevel(noticeLoad)).toBe("notice");
  });
});

describe("fteLoadLabel", () => {
  it("describes committed load including out of office", () => {
    expect(
      fteLoadLabel("notice", 0.9, {
        allocatedFte: 0.3,
        oooFte: 0.6,
      }),
    ).toContain("0.9 FTE committed (0.3 allocated, 0.6 out of office)");
  });
});
