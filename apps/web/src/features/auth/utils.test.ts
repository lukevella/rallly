import { afterEach, describe, expect, it, vi } from "vitest";
import { isEmailBlocked } from "./utils";

describe("isEmailBlocked", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows all emails when ALLOWED_EMAILS is not set", () => {
    vi.stubEnv("ALLOWED_EMAILS", "");
    expect(isEmailBlocked("anyone@example.com")).toBe(false);
  });

  it("allows an email matching a wildcard pattern", () => {
    vi.stubEnv("ALLOWED_EMAILS", "*@company.com");
    expect(isEmailBlocked("user@company.com")).toBe(false);
  });

  it("blocks an email that matches no pattern", () => {
    vi.stubEnv("ALLOWED_EMAILS", "*@company.com");
    expect(isEmailBlocked("user@other.com")).toBe(true);
  });

  it("matches case-insensitively", () => {
    vi.stubEnv("ALLOWED_EMAILS", "*@company.com");
    expect(isEmailBlocked("User@Company.com")).toBe(false);
  });

  it("ignores whitespace around comma-separated patterns", () => {
    vi.stubEnv("ALLOWED_EMAILS", "*@company.com, *@example.com");
    expect(isEmailBlocked("user@example.com")).toBe(false);
  });

  it("ignores empty entries from trailing commas", () => {
    vi.stubEnv("ALLOWED_EMAILS", "*@company.com,");
    expect(isEmailBlocked("user@other.com")).toBe(true);
  });

  it("allows an exact email entry regardless of case", () => {
    vi.stubEnv("ALLOWED_EMAILS", "Admin@Company.com");
    expect(isEmailBlocked("admin@company.com")).toBe(false);
  });

  it("does not treat pattern dots as regex wildcards", () => {
    vi.stubEnv("ALLOWED_EMAILS", "*@company.com");
    expect(isEmailBlocked("user@companyxcom")).toBe(true);
  });
});
