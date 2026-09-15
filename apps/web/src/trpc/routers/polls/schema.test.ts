import { describe, expect, it } from "vitest";
import { timeZoneInput } from "./schema";

describe("timeZoneInput", () => {
  it("normalizes an empty string to null", () => {
    expect(timeZoneInput.parse("")).toBeNull();
  });

  it("passes a timezone through unchanged", () => {
    expect(timeZoneInput.parse("Europe/Berlin")).toBe("Europe/Berlin");
  });

  it("keeps undefined as undefined so modify can mean 'leave unchanged'", () => {
    expect(timeZoneInput.parse(undefined)).toBeUndefined();
  });

  it("keeps null as null", () => {
    expect(timeZoneInput.parse(null)).toBeNull();
  });
});
