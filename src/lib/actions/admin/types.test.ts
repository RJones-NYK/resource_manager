import { describe, expect, it } from "vitest";
import { parseZohoUrl } from "./types";

describe("parseZohoUrl", () => {
  it("accepts https URLs", () => {
    expect(parseZohoUrl("https://crm.zoho.eu/crm/tab/Projects/123")).toBe(
      "https://crm.zoho.eu/crm/tab/Projects/123",
    );
  });

  it("rejects non-https and invalid URLs", () => {
    expect(parseZohoUrl("http://example.com")).toEqual({
      error: "Zoho URL must use https",
    });
    expect(parseZohoUrl("not-a-url")).toEqual({ error: "Enter a valid https URL" });
  });

  it("allows empty", () => {
    expect(parseZohoUrl("")).toBeNull();
    expect(parseZohoUrl(null)).toBeNull();
  });
});
