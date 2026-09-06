import { afterEach, describe, expect, it, vi } from "vitest";
import { getCountryCurrency } from "./utils";

// isBillingEnabled is a module constant read from the environment, so each
// branch needs a fresh module registry to observe the stubbed value.
const loadResolveSpaceTier = async (selfHosted: boolean) => {
  vi.stubEnv("NEXT_PUBLIC_SELF_HOSTED", selfHosted ? "true" : "false");
  vi.resetModules();
  const { resolveSpaceTier } = await import("./utils");
  return resolveSpaceTier;
};

describe("resolveSpaceTier", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the stored tier when billing is enabled", async () => {
    const resolveSpaceTier = await loadResolveSpaceTier(false);

    expect(resolveSpaceTier("hobby")).toBe("hobby");
    expect(resolveSpaceTier("pro")).toBe("pro");
  });

  it("treats every space as pro when there is no billing", async () => {
    const resolveSpaceTier = await loadResolveSpaceTier(true);

    expect(resolveSpaceTier("hobby")).toBe("pro");
    expect(resolveSpaceTier("pro")).toBe("pro");
  });
});

describe("getCountryCurrency", () => {
  const available = ["usd", "eur", "gbp"];

  it("maps the United Kingdom to GBP", () => {
    expect(getCountryCurrency("GB", available)).toBe("gbp");
  });

  it("maps euro area and EFTA countries to EUR", () => {
    expect(getCountryCurrency("DE", available)).toBe("eur");
    expect(getCountryCurrency("FR", available)).toBe("eur");
    expect(getCountryCurrency("CH", available)).toBe("eur");
    expect(getCountryCurrency("SE", available)).toBe("eur");
  });

  it("falls back to USD for everywhere else and when the country is unknown", () => {
    expect(getCountryCurrency("US", available)).toBe("usd");
    expect(getCountryCurrency("IN", available)).toBe("usd");
    expect(getCountryCurrency(undefined, available)).toBe("usd");
  });

  it("only returns a currency Stripe actually offers", () => {
    expect(getCountryCurrency("GB", ["usd", "eur"])).toBe("usd");
    expect(getCountryCurrency("US", ["eur", "gbp"])).toBe("eur");
  });
});
