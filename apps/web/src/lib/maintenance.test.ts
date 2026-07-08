import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hashBypassToken,
  isMaintenanceModeEnabled,
  isValidBypassCookie,
  isValidBypassToken,
} from "./maintenance";

const TOKEN = "correct-horse-battery-staple";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isMaintenanceModeEnabled", () => {
  it("is enabled when MAINTENANCE_MODE is 'true'", () => {
    vi.stubEnv("MAINTENANCE_MODE", "true");
    expect(isMaintenanceModeEnabled()).toBe(true);
  });

  it("is disabled when MAINTENANCE_MODE is 'false'", () => {
    vi.stubEnv("MAINTENANCE_MODE", "false");
    expect(isMaintenanceModeEnabled()).toBe(false);
  });

  it("is disabled when MAINTENANCE_MODE is unset", () => {
    vi.stubEnv("MAINTENANCE_MODE", undefined);
    expect(isMaintenanceModeEnabled()).toBe(false);
  });
});

describe("isValidBypassToken", () => {
  it("accepts the configured token", async () => {
    vi.stubEnv("MAINTENANCE_BYPASS_TOKEN", TOKEN);
    expect(await isValidBypassToken({ token: TOKEN })).toBe(true);
  });

  it("rejects a wrong token", async () => {
    vi.stubEnv("MAINTENANCE_BYPASS_TOKEN", TOKEN);
    expect(await isValidBypassToken({ token: "wrong-token" })).toBe(false);
  });

  it("rejects everything when no token is configured", async () => {
    vi.stubEnv("MAINTENANCE_BYPASS_TOKEN", undefined);
    expect(await isValidBypassToken({ token: TOKEN })).toBe(false);
    expect(await isValidBypassToken({ token: "" })).toBe(false);
  });
});

describe("isValidBypassCookie", () => {
  it("accepts the hash of the configured token", async () => {
    vi.stubEnv("MAINTENANCE_BYPASS_TOKEN", TOKEN);
    const value = await hashBypassToken({ token: TOKEN });
    expect(await isValidBypassCookie({ value })).toBe(true);
  });

  it("rejects the raw token as a cookie value", async () => {
    vi.stubEnv("MAINTENANCE_BYPASS_TOKEN", TOKEN);
    expect(await isValidBypassCookie({ value: TOKEN })).toBe(false);
  });

  it("rejects values of the wrong length", async () => {
    vi.stubEnv("MAINTENANCE_BYPASS_TOKEN", TOKEN);
    expect(await isValidBypassCookie({ value: "abc123" })).toBe(false);
  });

  it("rejects everything when no token is configured", async () => {
    vi.stubEnv("MAINTENANCE_BYPASS_TOKEN", undefined);
    const value = await hashBypassToken({ token: TOKEN });
    expect(await isValidBypassCookie({ value })).toBe(false);
  });
});
