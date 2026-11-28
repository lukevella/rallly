import { describe, expect, it } from "vitest";
import { getNextVoterCookie, getVoterCookie, parseVoterTokens } from "./utils";

const addVoterToken = (value: string | undefined, token: string) =>
  getNextVoterCookie("abc123", value, token).value;

describe("getVoterCookie", () => {
  it("scopes the cookie to the poll by name and path", () => {
    const cookie = getVoterCookie("abc123");
    expect(cookie.name).toBe("rallly-voter-abc123");
    expect(cookie.options.path).toBe("/invite/abc123");
    expect(cookie.options.httpOnly).toBe(true);
  });
});

describe("parseVoterTokens", () => {
  it("reads nothing from a missing cookie", () => {
    expect(parseVoterTokens(undefined)).toEqual([]);
  });

  it("drops values that are not tokens", () => {
    expect(parseVoterTokens("a1,,b c,Fe26.2**x_y-z")).toEqual([
      "a1",
      "Fe26.2**x_y-z",
    ]);
  });
});

describe("addVoterToken", () => {
  it("puts the new token first without a duplicate", () => {
    expect(addVoterToken("a,b", "b")).toBe("b,a");
    expect(addVoterToken(undefined, "a")).toBe("a");
  });

  it("drops the oldest tokens when the value grows too long", () => {
    let value: string | undefined;
    for (let i = 0; i < 200; i++) {
      value = addVoterToken(value, `${i}`.padStart(32, "0"));
    }
    const tokens = parseVoterTokens(value);
    expect(value?.length).toBeLessThanOrEqual(3000);
    expect(tokens[0]).toBe("199".padStart(32, "0"));
    expect(tokens).not.toContain("0".padStart(32, "0"));
  });
});
