import { describe, expect, it } from "vitest";
import {
  parseAssignmentRows,
  parseFte,
  parseWeekStarts,
} from "./allocation-validation";

describe("parseFte", () => {
  it("accepts valid FTE in 0.1 steps", () => {
    expect(parseFte("0.5")).toBe(0.5);
    expect(parseFte("1")).toBe(1);
    expect(parseFte("0")).toBe(0);
  });

  it("rejects out of range and invalid increments", () => {
    expect(parseFte("1.1")).toEqual({ error: "FTE must be between 0 and 1" });
    expect(parseFte("0.15")).toEqual({ error: "FTE must be in 0.1 increments" });
    expect(parseFte("")).toEqual({ error: "Select an FTE amount" });
  });
});

describe("parseWeekStarts", () => {
  it("parses ISO week arrays", () => {
    expect(parseWeekStarts(JSON.stringify(["2026-01-05", "2026-01-12"]))).toEqual([
      "2026-01-05",
      "2026-01-12",
    ]);
  });

  it("rejects invalid payloads", () => {
    expect(parseWeekStarts("[]")).toEqual({ error: "No weeks selected" });
    expect(parseWeekStarts(JSON.stringify(["2026-1-5"]))).toEqual({
      error: "Invalid week selection",
    });
  });
});

describe("parseAssignmentRows", () => {
  it("parses project rows and skips duplicates", () => {
    const rows = parseAssignmentRows(
      JSON.stringify([
        { projectId: "p1", fte: "0.5" },
        { projectId: "p1", fte: "0.3" },
        { projectId: "p2", fte: "0.2" },
      ]),
    );
    expect(rows).toEqual([
      { projectId: "p1", fte: 0.5 },
      { projectId: "p2", fte: 0.2 },
    ]);
  });

  it("returns empty array for blank payload", () => {
    expect(parseAssignmentRows("")).toEqual([]);
  });
});
