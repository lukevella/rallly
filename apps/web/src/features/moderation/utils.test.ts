import { describe, expect, it } from "vitest";
import { containsSuspiciousPatterns } from "./utils";

describe("containsSuspiciousPatterns", () => {
  it("trusts a meeting link on a known domain", () => {
    expect(
      containsSuspiciousPatterns(
        "Join at https://example.webex.com/meet/jsmith",
      ),
    ).toBe(false);
    expect(containsSuspiciousPatterns("https://zoom.us/j/123")).toBe(false);
  });

  it("does not trust a host that only starts with a known domain", () => {
    expect(
      containsSuspiciousPatterns("Join at https://webex.com.evil.example/x"),
    ).toBe(true);
    expect(containsSuspiciousPatterns("https://zoom.us.evil.example")).toBe(
      true,
    );
  });
});
