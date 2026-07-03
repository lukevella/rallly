import { describe, expect, it } from "vitest";
import { normalizeTimeZone } from "./utils";

describe("normalizeTimeZone", () => {
  it("returns a valid IANA zone unchanged", () => {
    expect(normalizeTimeZone("Europe/Malta")).toBe("Europe/Malta");
    expect(normalizeTimeZone("UTC")).toBe("UTC");
  });

  it("treats empty and nullish values as unset", () => {
    expect(normalizeTimeZone("")).toBeUndefined();
    expect(normalizeTimeZone(null)).toBeUndefined();
    expect(normalizeTimeZone(undefined)).toBeUndefined();
  });

  it("treats invalid zone names as unset instead of throwing", () => {
    expect(normalizeTimeZone("Not/AZone")).toBeUndefined();
    expect(normalizeTimeZone("garbage")).toBeUndefined();
  });
});
