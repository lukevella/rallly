import { describe, expect, it } from "vitest";
import { getPostHogInitOptions } from "./client-config";

describe("getPostHogInitOptions", () => {
  it("shares the anonymous id across subdomains", () => {
    const options = getPostHogInitOptions();

    expect(options.persistence).toBe("localStorage+cookie");
    expect(options.cross_subdomain_cookie).toBe(true);
    expect(options.cookieless_mode).toBeUndefined();
  });

  it("never creates person profiles for anonymous ids", () => {
    expect(getPostHogInitOptions().person_profiles).toBe("identified_only");
  });
});
