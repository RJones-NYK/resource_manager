import { describe, expect, it } from "vitest";
import { sortResourcesBySeniority } from "./resources";

const PRODUCTION_RESOURCES = [
  { roleName: "Solution Architect", isExternal: 1, lastName: "Bain", firstName: "Doug" },
  { roleName: "Clinical Manager", isExternal: 0, lastName: "CM", firstName: "TBD" },
  { roleName: "Clinical Analyst", isExternal: 0, lastName: "Galantini", firstName: "Jacopo" },
  {
    roleName: "Clinical Business Partner",
    isExternal: 0,
    lastName: "Jones",
    firstName: "Robert",
  },
  { roleName: "Clinical Manager", isExternal: 1, lastName: "Puddefoot", firstName: "Leif" },
  { roleName: "Clinical Manager", isExternal: 1, lastName: "Raineri", firstName: "Massimo" },
  { roleName: "Clinical Consultant", isExternal: 0, lastName: "Trescato", firstName: "Isotta" },
];

describe("sortResourcesBySeniority", () => {
  it("orders production resources with all internal first, then external by seniority", () => {
    const sorted = sortResourcesBySeniority(PRODUCTION_RESOURCES);

    expect(sorted.map((resource) => resource.lastName)).toEqual([
      "Jones",
      "CM",
      "Trescato",
      "Galantini",
      "Puddefoot",
      "Raineri",
      "Bain",
    ]);
  });

  it("orders internal before external, then role seniority, then last name", () => {
    const sorted = sortResourcesBySeniority([
      {
        roleName: "Clinical Analyst",
        isExternal: false,
        lastName: "Zeta",
        firstName: "Ann",
      },
      {
        roleName: "Clinical Business Partner",
        isExternal: false,
        lastName: "Young",
        firstName: "Ann",
      },
      {
        roleName: "Clinical Business Partner",
        isExternal: false,
        lastName: "Alpha",
        firstName: "Ann",
      },
      {
        roleName: "Business Partner",
        isExternal: true,
        lastName: "Alpha",
        firstName: "Bob",
      },
      {
        roleName: "Clinical Manager",
        isExternal: false,
        lastName: "Beta",
        firstName: "Ann",
      },
      {
        roleName: "Clinical Consultant",
        isExternal: false,
        lastName: "Gamma",
        firstName: "Ann",
      },
      {
        roleName: "Clinical Analyst",
        isExternal: false,
        lastName: "Alpha",
        firstName: "Ann",
      },
      {
        roleName: null,
        isExternal: false,
        lastName: "NoRole",
        firstName: "Ann",
      },
    ]);

    expect(sorted.map((resource) => resource.lastName)).toEqual([
      "Alpha",
      "Young",
      "Beta",
      "Gamma",
      "Alpha",
      "Zeta",
      "NoRole",
      "Alpha",
    ]);
    expect(sorted[7]?.isExternal).toBe(true);
  });

  it("matches role names case-insensitively", () => {
    const sorted = sortResourcesBySeniority([
      {
        roleName: "clinical manager",
        isExternal: 0,
        lastName: "Smith",
      },
      {
        roleName: "Clinical Business Partner",
        isExternal: 0,
        lastName: "Jones",
      },
    ]);

    expect(sorted.map((resource) => resource.lastName)).toEqual(["Jones", "Smith"]);
  });
});
