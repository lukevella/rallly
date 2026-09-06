import { describe, expect, it } from "vitest";
import { yearlySavingsPercent } from "./pricing";

describe("yearlySavingsPercent", () => {
  it("rounds the saving of yearly against twelve months to a whole percent", () => {
    expect(yearlySavingsPercent({ monthly: 700, yearly: 5600 })).toBe(33);
    expect(yearlySavingsPercent({ monthly: 560, yearly: 4500 })).toBe(33);
    expect(yearlySavingsPercent({ monthly: 1000, yearly: 8400 })).toBe(30);
  });

  it("is zero when yearly costs the same as twelve months", () => {
    expect(yearlySavingsPercent({ monthly: 100, yearly: 1200 })).toBe(0);
  });
});
