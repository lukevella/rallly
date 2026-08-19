import { describe, expect, it } from "vitest";
import { getMajorVersion, isOutdated } from "./utils";

describe("getMajorVersion", () => {
  it("extracts the major from a tagged version", () => {
    expect(getMajorVersion("v4.5.1")).toBe(4);
  });

  it("extracts the major from an untagged version", () => {
    expect(getMajorVersion("4.5.1")).toBe(4);
  });

  it("ignores prerelease suffixes", () => {
    expect(getMajorVersion("5.0.0-beta.1")).toBe(5);
  });

  it("returns null for non-version strings", () => {
    expect(getMajorVersion("unknown")).toBeNull();
    expect(getMajorVersion("")).toBeNull();
  });
});

describe("isOutdated", () => {
  it("detects an older patch version", () => {
    expect(isOutdated("4.1.0", "4.1.1")).toBe(true);
  });

  it("detects an older minor version numerically", () => {
    expect(isOutdated("4.9.0", "4.10.0")).toBe(true);
  });

  it("treats equal versions as current", () => {
    expect(isOutdated("v4.2.0", "v4.2.0")).toBe(false);
  });

  it("treats newer versions as current", () => {
    expect(isOutdated("4.10.0", "4.9.0")).toBe(false);
  });

  it("compares across majors without guarding", () => {
    expect(isOutdated("4.2.0", "5.0.0")).toBe(true);
  });

  it("ignores prerelease suffixes", () => {
    expect(isOutdated("4.2.0-beta.1", "4.2.0")).toBe(false);
  });
});
