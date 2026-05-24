import { describe, expect, it } from "vitest";
import {
  buildProjectWeekSpans,
  formatProjectDateRange,
  weekOverlapsProjectDates,
} from "@/lib/planner-project-span";

describe("weekOverlapsProjectDates", () => {
  it("matches weeks that overlap the project range", () => {
    expect(
      weekOverlapsProjectDates("2026-05-18", "2026-05-20", "2026-06-30", "2026-01-05", "2026-12-21"),
    ).toBe(true);
    expect(
      weekOverlapsProjectDates("2026-01-05", "2026-05-20", "2026-06-30", "2026-01-05", "2026-12-21"),
    ).toBe(false);
  });

  it("treats open-ended ranges against the planner bounds", () => {
    expect(
      weekOverlapsProjectDates("2026-12-21", "2026-06-01", null, "2026-01-05", "2026-12-21"),
    ).toBe(true);
    expect(
      weekOverlapsProjectDates("2026-01-05", null, "2026-03-01", "2026-01-05", "2026-12-21"),
    ).toBe(true);
  });
});

describe("buildProjectWeekSpans", () => {
  const weeks = ["2026-05-04", "2026-05-11", "2026-05-18", "2026-05-25", "2026-06-01"];

  it("marks start, within, and end weeks", () => {
    const spans = buildProjectWeekSpans(weeks, "2026-05-12", "2026-05-27");
    expect(spans.map((span) => [span.weekStart, span.role, span.inSpan])).toEqual([
      ["2026-05-04", "before", false],
      ["2026-05-11", "start", true],
      ["2026-05-18", "within", true],
      ["2026-05-25", "end", true],
      ["2026-06-01", "after", false],
    ]);
  });

  it("returns no in-span weeks when dates are missing", () => {
    const spans = buildProjectWeekSpans(weeks, null, null);
    expect(spans.every((span) => !span.inSpan)).toBe(true);
  });
});

describe("formatProjectDateRange", () => {
  it("formats full and partial ranges", () => {
    expect(formatProjectDateRange("2026-05-18", "2026-08-30")).toBe(
      "18 May 2026 – 30 Aug 2026",
    );
    expect(formatProjectDateRange("2026-05-18", null)).toBe("From 18 May 2026");
    expect(formatProjectDateRange(null, "2026-08-30")).toBe("Until 30 Aug 2026");
    expect(formatProjectDateRange(null, null)).toBeNull();
  });
});
