import { describe, expect, it } from "vitest";

import { getRange } from "./get-range";

describe("getRange", () => {
  it("should return the start date if the start and end date are the same", () => {
    const start = new Date("2021-01-01");
    const end = new Date("2021-01-01");
    expect(getRange(start, end)).toBe("01 Jan");
  });

  it("should return the start and end date if the start and end date are different", () => {
    const start = new Date("2021-01-01");
    const end = new Date("2021-01-02");
    expect(getRange(start, end)).toBe("01 Jan - 02 Jan");
  });
});
