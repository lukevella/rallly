import { describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({
  env: { TRUSTED_PROXIES: "10.0.0.0/8, 172.16.0.1" },
}));

import { getClientIp } from "./client-ip";

describe("getClientIp", () => {
  it("prefers x-real-ip", () => {
    const headers = new Headers({
      "x-real-ip": "1.1.1.1",
      "x-forwarded-for": "2.2.2.2",
    });
    expect(getClientIp(headers)).toBe("1.1.1.1");
  });

  it("reads a single x-forwarded-for entry", () => {
    const headers = new Headers({ "x-forwarded-for": "2.2.2.2" });
    expect(getClientIp(headers)).toBe("2.2.2.2");
  });

  it("strips trusted proxies from the right of x-forwarded-for", () => {
    const headers = new Headers({
      "x-forwarded-for": "6.6.6.6, 2.2.2.2, 172.16.0.1, 10.1.2.3",
    });
    expect(getClientIp(headers)).toBe("2.2.2.2");
  });
});
