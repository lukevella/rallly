import { afterEach, describe, expect, it, vi } from "vitest";

const loadModule = async ({ isSelfHosted }: { isSelfHosted: boolean }) => {
  vi.resetModules();
  vi.doMock("@/lib/constants", () => ({ isSelfHosted }));
  return await import("./utils");
};

afterEach(() => {
  vi.doUnmock("@/lib/constants");
  vi.resetModules();
});

describe("effectiveSpaceMemberWhere", () => {
  it("limits membership to pro spaces or owned spaces on cloud", async () => {
    const { effectiveSpaceMemberWhere } = await loadModule({
      isSelfHosted: false,
    });

    expect(effectiveSpaceMemberWhere({ userId: "user-1" })).toEqual({
      userId: "user-1",
      OR: [{ space: { tier: "pro" } }, { space: { ownerId: "user-1" } }],
    });
  });

  it("does not limit membership on self hosted instances", async () => {
    const { effectiveSpaceMemberWhere } = await loadModule({
      isSelfHosted: true,
    });

    expect(effectiveSpaceMemberWhere({ userId: "user-1" })).toEqual({
      userId: "user-1",
    });
  });
});
