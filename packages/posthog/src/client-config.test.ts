import { describe, expect, it } from "vitest";
import { getPostHogInitOptions } from "./client-config";

describe("getPostHogInitOptions", () => {
  it("runs cookieless when there is no identified user", () => {
    const options = getPostHogInitOptions({});

    expect(options.cookieless_mode).toBe("always");
    expect(options.bootstrap).toBeUndefined();
  });

  it("bootstraps an identified user in memory without a cookie", () => {
    const options = getPostHogInitOptions({ distinctId: "user_123" });

    expect(options.persistence).toBe("memory");
    expect(options.bootstrap).toEqual({
      distinctID: "user_123",
      isIdentifiedID: true,
    });
    expect(options.cookieless_mode).toBeUndefined();
  });

  it("never creates person profiles for anonymous ids", () => {
    expect(getPostHogInitOptions({}).person_profiles).toBe("identified_only");
    expect(
      getPostHogInitOptions({ distinctId: "user_123" }).person_profiles,
    ).toBe("identified_only");
  });
});
