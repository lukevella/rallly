import { describe, expect, it } from "vitest";
import type { AuthorizedSpaceId } from "@/features/space/types";
import {
  canViewAllSpaceContent,
  createSpaceContentScope,
  inferIndustry,
} from "@/features/space/utils";

const spaceId = "space-1" as AuthorizedSpaceId;

describe("createSpaceContentScope", () => {
  it("does not restrict members of a space that works together", () => {
    expect(
      createSpaceContentScope({
        space: { id: spaceId, contentVisibility: "space" },
        userId: "user-1",
      }),
    ).toEqual({ spaceId });
  });

  it("restricts members of a space that works independently to their own content", () => {
    expect(
      createSpaceContentScope({
        space: { id: spaceId, contentVisibility: "owner" },
        userId: "user-1",
      }),
    ).toEqual({ spaceId, createdBy: "user-1" });
  });
});

describe("canViewAllSpaceContent", () => {
  it("is true when the space works together", () => {
    expect(canViewAllSpaceContent({ contentVisibility: "space" })).toBe(true);
  });

  it("is false when the space works independently", () => {
    expect(canViewAllSpaceContent({ contentVisibility: "owner" })).toBe(false);
  });
});

describe("inferIndustry", () => {
  it("infers education from an academic domain", () => {
    expect(inferIndustry({ email: "ada@example.edu" })).toBe("education");
    expect(inferIndustry({ email: "ada@dept.cam.ac.uk" })).toBe("education");
    expect(inferIndustry({ email: "ada@stmarys.sch.uk" })).toBe("education");
  });

  it("infers government from a public sector domain", () => {
    expect(inferIndustry({ email: "ada@example.gov" })).toBe("government");
    expect(inferIndustry({ email: "ada@example.gov.uk" })).toBe("government");
    expect(inferIndustry({ email: "ada@example.mil" })).toBe("government");
  });

  it("infers non-profit from a .org domain", () => {
    expect(inferIndustry({ email: "ada@example.org" })).toBe("non_profit");
  });

  it("matches domain labels whole, not as substrings", () => {
    expect(inferIndustry({ email: "ada@acme.education.com" })).toBeUndefined();
    expect(inferIndustry({ email: "ada@government.com" })).toBeUndefined();
  });

  it("does not let a label anywhere but the suffix claim a sector", () => {
    // Each of these carries a sector label while ending in .com or .co, so
    // anyone could register one and be classified. Only the suffix counts.
    expect(inferIndustry({ email: "ada@edu.example.com" })).toBeUndefined();
    expect(
      inferIndustry({ email: "ada@foo.edu.attacker.com" }),
    ).toBeUndefined();
    expect(inferIndustry({ email: "ada@attacker.edu.com" })).toBeUndefined();
    expect(inferIndustry({ email: "ada@attacker.gov.com" })).toBeUndefined();
    expect(inferIndustry({ email: "ada@foo.org.example.com" })).toBeUndefined();
    expect(inferIndustry({ email: "ada@gov.mil.attacker.co" })).toBeUndefined();
  });

  it("requires a label in front of the suffix", () => {
    // A bare suffix is not somebody's organization.
    expect(inferIndustry({ email: "ada@edu" })).toBeUndefined();
    expect(inferIndustry({ email: "ada@org" })).toBeUndefined();
  });

  it("still matches a genuine multi-label suffix", () => {
    expect(inferIndustry({ email: "ada@example.gov.uk" })).toBe("government");
    expect(inferIndustry({ email: "ada@sales.example.ac.uk" })).toBe(
      "education",
    );
    expect(inferIndustry({ email: "ada@example.edu.au" })).toBe("education");
    expect(inferIndustry({ email: "ada@charity.org.uk" })).toBe("non_profit");
  });

  it("falls through free-mail domains to the organization name", () => {
    expect(
      inferIndustry({
        email: "ada@gmail.com",
        organizationName: "Northside Dental Clinic",
      }),
    ).toBe("healthcare");
    expect(inferIndustry({ email: "ada@outlook.com" })).toBeUndefined();
  });

  it("prefers the domain over the organization name", () => {
    expect(
      inferIndustry({
        email: "ada@example.edu",
        organizationName: "Acme Software",
      }),
    ).toBe("education");
  });

  it("infers legal and sports from the organization name", () => {
    expect(inferIndustry({ organizationName: "Smith & Jones LLP" })).toBe(
      "legal",
    );
    expect(inferIndustry({ organizationName: "Harbour Law" })).toBe("legal");
    expect(inferIndustry({ organizationName: "Riverside FC" })).toBe(
      "sports_and_recreation",
    );
    expect(inferIndustry({ organizationName: "Oakwood Tennis Club" })).toBe(
      "sports_and_recreation",
    );
  });

  it("matches organization name keywords as whole words", () => {
    expect(inferIndustry({ organizationName: "Acme Software" })).toBe(
      "technology",
    );
    expect(inferIndustry({ organizationName: "ACME SOFTWARE" })).toBe(
      "technology",
    );
    expect(inferIndustry({ organizationName: "Software-Werk" })).toBe(
      "technology",
    );
    // "care" must not fire on "Careers", nor "vet" on "Velvet"
    expect(inferIndustry({ organizationName: "Careers Ltd" })).toBeUndefined();
    expect(inferIndustry({ organizationName: "Velvet Ltd" })).toBeUndefined();
  });

  it("resolves overlapping keywords by table order", () => {
    // "church" (religious) is checked before "services" (professional)
    expect(inferIndustry({ organizationName: "Grace Church Services" })).toBe(
      "religious_organisation",
    );
  });

  it("returns undefined when nothing matches", () => {
    expect(inferIndustry({})).toBeUndefined();
    expect(inferIndustry({ email: "ada@gmail.com" })).toBeUndefined();
    expect(
      inferIndustry({ email: "  ", organizationName: "  " }),
    ).toBeUndefined();
    expect(
      inferIndustry({ email: null, organizationName: null }),
    ).toBeUndefined();
  });

  it("tolerates a malformed email", () => {
    expect(inferIndustry({ email: "not-an-email" })).toBeUndefined();
    expect(
      inferIndustry({
        email: "not-an-email",
        organizationName: "City Council",
      }),
    ).toBe("government");
  });
});
