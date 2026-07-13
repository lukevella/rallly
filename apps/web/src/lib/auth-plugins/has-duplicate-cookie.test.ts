import { describe, expect, it } from "vitest";
import { hasDuplicateCookie } from "./has-duplicate-cookie";

describe("hasDuplicateCookie", () => {
  const name = "__Secure-better-auth.session_token";

  it("returns false for an empty header", () => {
    expect(hasDuplicateCookie("", name)).toBe(false);
  });

  it("returns false when the cookie appears once", () => {
    expect(hasDuplicateCookie(`${name}=abc.def; locale=en`, name)).toBe(false);
  });

  it("returns true when the cookie appears twice", () => {
    expect(
      hasDuplicateCookie(`${name}=old.sig; locale=en; ${name}=new.sig`, name),
    ).toBe(true);
  });

  it("does not match cookies that share a prefix", () => {
    expect(
      hasDuplicateCookie(
        `${name}=abc.def; ${name}.extra=zzz; better-auth.session_token=x`,
        name,
      ),
    ).toBe(false);
  });

  it("matches regardless of surrounding whitespace", () => {
    expect(hasDuplicateCookie(`${name}=a;  ${name}=b`, name)).toBe(true);
  });

  it("ignores values that contain the cookie name", () => {
    expect(hasDuplicateCookie(`other=${name}=abc; ${name}=a`, name)).toBe(
      false,
    );
  });
});
