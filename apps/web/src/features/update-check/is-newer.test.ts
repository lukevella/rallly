import { describe, expect, it } from "vitest";
import { isNewer } from "./is-newer";

describe("isNewer", () => {
  it("returns true when latest has a higher patch", () => {
    expect(isNewer("1.2.4", "1.2.3")).toBe(true);
  });

  it("returns false when versions are equal", () => {
    expect(isNewer("1.2.3", "1.2.3")).toBe(false);
  });

  it("returns false when latest is older", () => {
    expect(isNewer("1.2.3", "1.2.4")).toBe(false);
  });

  it("handles double-digit segments without lexicographic bugs", () => {
    expect(isNewer("1.10.0", "1.9.0")).toBe(true);
    expect(isNewer("1.9.0", "1.10.0")).toBe(false);
  });

  it("strips a leading 'v' from either operand", () => {
    expect(isNewer("v1.2.4", "1.2.3")).toBe(true);
    expect(isNewer("1.2.4", "v1.2.3")).toBe(true);
  });

  it("treats missing segments as zero", () => {
    expect(isNewer("1.2", "1.2.0")).toBe(false);
    expect(isNewer("1.3", "1.2.5")).toBe(true);
  });
});
