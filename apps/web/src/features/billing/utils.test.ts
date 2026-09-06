import { afterEach, describe, expect, it, vi } from "vitest";

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
