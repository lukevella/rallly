import { describe, expect, it } from "vitest";
import {
  buildSecurityAdvisories,
  isVulnerable,
  parseVersionRange,
} from "./security-advisories";

function advisory(
  ranges: (string | null)[],
  overrides: Record<string, unknown> = {},
) {
  return {
    ghsa_id: "GHSA-xxxx-xxxx-xxxx",
    html_url:
      "https://github.com/lukevella/rallly/security/advisories/GHSA-xxxx-xxxx-xxxx",
    severity: "high",
    published_at: "2026-08-25T00:00:00Z",
    vulnerabilities: ranges.map((vulnerable_version_range) => ({
      vulnerable_version_range,
    })),
    ...overrides,
  };
}

describe("parseVersionRange", () => {
  it("parses the range syntaxes GitHub emits", () => {
    expect(parseVersionRange("< 4.12.0")).toEqual([
      { operator: "<", version: "4.12.0" },
    ]);
    expect(parseVersionRange("<=3.11.2")).toEqual([
      { operator: "<=", version: "3.11.2" },
    ]);
    expect(parseVersionRange(">= 4.0.0, < 4.13.1")).toEqual([
      { operator: ">=", version: "4.0.0" },
      { operator: "<", version: "4.13.1" },
    ]);
    expect(parseVersionRange(">= 10.0.0 < 15.5.24")).toEqual([
      { operator: ">=", version: "10.0.0" },
      { operator: "<", version: "15.5.24" },
    ]);
    expect(parseVersionRange("v4.5.4")).toEqual([
      { operator: "=", version: "4.5.4" },
    ]);
  });

  it("rejects anything it cannot read", () => {
    expect(parseVersionRange("")).toBeNull();
    expect(parseVersionRange("all versions")).toBeNull();
    expect(parseVersionRange("< 4.12.0, nope")).toBeNull();
    expect(parseVersionRange("~4.12.0")).toBeNull();
  });
});

describe("isVulnerable", () => {
  const [adv] = buildSecurityAdvisories([
    advisory([">= 4.0.0, < 4.13.1", "<=3.11.2"]),
  ]);
  if (!adv) throw new Error("fixture failed to build");

  it("matches versions inside any range", () => {
    expect(isVulnerable("4.12.3", adv)).toBe(true);
    expect(isVulnerable("v4.0.0", adv)).toBe(true);
    expect(isVulnerable("3.11.2", adv)).toBe(true);
    expect(isVulnerable("3.0.0", adv)).toBe(true);
  });

  it("clears versions outside every range", () => {
    expect(isVulnerable("4.13.1", adv)).toBe(false);
    expect(isVulnerable("4.15.1", adv)).toBe(false);
    expect(isVulnerable("3.11.3", adv)).toBe(false);
    expect(isVulnerable("5.0.0", adv)).toBe(false);
  });
});

describe("buildSecurityAdvisories", () => {
  it("keeps advisories with at least one readable range", () => {
    const advisories = buildSecurityAdvisories([
      advisory(["< 4.12.0"]),
      advisory(["all versions", "< 4.5.4"], { ghsa_id: "GHSA-2" }),
      advisory(["all versions"], { ghsa_id: "GHSA-3" }),
      advisory([null], { ghsa_id: "GHSA-4" }),
      { ghsa_id: "GHSA-5" },
      null,
    ]);

    expect(advisories.map((a) => a.ghsaId)).toEqual([
      "GHSA-xxxx-xxxx-xxxx",
      "GHSA-2",
    ]);
    expect(advisories[1]?.ranges).toHaveLength(1);
  });

  it("drops an unknown severity to null", () => {
    const [adv] = buildSecurityAdvisories([
      advisory(["< 4.12.0"], { severity: "moderate" }),
    ]);
    expect(adv?.severity).toBeNull();
  });

  it("returns nothing for a non-array", () => {
    expect(buildSecurityAdvisories({ message: "rate limited" })).toEqual([]);
  });
});
