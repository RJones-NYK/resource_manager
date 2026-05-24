import { describe, expect, it } from "vitest";
import { getPlannerWeeks, plannerViewRangeLabel } from "@/lib/weeks";

describe("getPlannerWeeks", () => {
  it("covers Jan 2026 through Dec 2027", () => {
    const weeks = getPlannerWeeks();
    expect(weeks[0]?.weekStart).toBe("2026-01-05");
    expect(weeks[weeks.length - 1]?.weekStart).toBe("2027-12-27");
    expect(plannerViewRangeLabel(weeks)).toBe("Jan 2026 – Dec 2027");
  });
});
