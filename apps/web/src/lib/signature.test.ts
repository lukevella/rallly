import { describe, expect, it } from "vitest";
import { createSignature, verifySignature } from "./signature";

const secret = "0123456789abcdef0123456789abcdef";
const input = { context: "test", payload: "hello", secret };

describe("signature", () => {
  it("verifies its own output", () => {
    const signature = createSignature(input);
    expect(verifySignature({ ...input, signature })).toBe(true);
  });

  it("is URL safe", () => {
    const signature = createSignature(input);
    expect(encodeURIComponent(signature)).toBe(signature);
    expect(signature).not.toContain(".");
  });

  it("rejects a different context, payload, or secret", () => {
    const signature = createSignature(input);
    expect(verifySignature({ ...input, signature, context: "other" })).toBe(
      false,
    );
    expect(verifySignature({ ...input, signature, payload: "hellp" })).toBe(
      false,
    );
    expect(
      verifySignature({ ...input, signature, secret: "x".repeat(32) }),
    ).toBe(false);
  });

  it("rejects malformed signatures without throwing", () => {
    for (const signature of ["", "abc", "!!!"]) {
      expect(verifySignature({ ...input, signature })).toBe(false);
    }
  });
});
