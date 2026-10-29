import { describe, expect, it } from "vitest";
import { validateLicenseKeyInputSchema } from "@/features/licensing/schema";
import { generateLicenseKey } from "@/features/licensing/utils";

describe("validateLicenseKeyInputSchema", () => {
  it("accepts a generated key with a fingerprint", () => {
    const key = generateLicenseKey({ version: 4 });
    expect(
      validateLicenseKeyInputSchema.safeParse({ key, fingerprint: "abc" })
        .success,
    ).toBe(true);
  });

  it("rejects a key containing a NUL byte, which Postgres text rejects", () => {
    expect(
      validateLicenseKeyInputSchema.safeParse({ key: "RLYV4-\0" }).success,
    ).toBe(false);
  });

  it("rejects an oversized key, which would overflow the rate limit key", () => {
    expect(
      validateLicenseKeyInputSchema.safeParse({ key: "A".repeat(1_000_000) })
        .success,
    ).toBe(false);
  });

  it("rejects an oversized fingerprint", () => {
    expect(
      validateLicenseKeyInputSchema.safeParse({
        key: generateLicenseKey({ version: 4 }),
        fingerprint: "A".repeat(1_000_000),
      }).success,
    ).toBe(false);
  });
});
