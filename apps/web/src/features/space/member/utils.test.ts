import { afterEach, describe, expect, it, vi } from "vitest";

const loadModule = async ({
  isBillingEnabled,
}: {
  isBillingEnabled: boolean;
}) => {
  vi.resetModules();
  vi.doMock("@/features/billing/constants", () => ({ isBillingEnabled }));
  return await import("./utils");
};

afterEach(() => {
  vi.doUnmock("@/features/billing/constants");
  vi.resetModules();
});

describe("effectiveSpaceMemberWhere", () => {
  it("limits membership to pro spaces or owned spaces when billing is enabled", async () => {
    const { effectiveSpaceMemberWhere } = await loadModule({
      isBillingEnabled: true,
    });

    expect(effectiveSpaceMemberWhere({ userId: "user-1" })).toEqual({
      userId: "user-1",
      OR: [{ space: { tier: "pro" } }, { space: { ownerId: "user-1" } }],
    });
  });

  it("does not limit membership when billing is disabled", async () => {
    const { effectiveSpaceMemberWhere } = await loadModule({
      isBillingEnabled: false,
    });

    expect(effectiveSpaceMemberWhere({ userId: "user-1" })).toEqual({
      userId: "user-1",
    });
  });
});

describe("isEffectiveSpaceMember", () => {
  it("treats every member of a pro space as effective", async () => {
    const { isEffectiveSpaceMember } = await loadModule({
      isBillingEnabled: true,
    });

    expect(
      isEffectiveSpaceMember({
        userId: "user-1",
        space: { tier: "pro", ownerId: "owner" },
      }),
    ).toBe(true);
  });

  it("treats only the owner of a hobby space as effective when billing is enabled", async () => {
    const { isEffectiveSpaceMember } = await loadModule({
      isBillingEnabled: true,
    });

    expect(
      isEffectiveSpaceMember({
        userId: "owner",
        space: { tier: "hobby", ownerId: "owner" },
      }),
    ).toBe(true);
    expect(
      isEffectiveSpaceMember({
        userId: "user-1",
        space: { tier: "hobby", ownerId: "owner" },
      }),
    ).toBe(false);
  });

  it("treats every member as effective when billing is disabled", async () => {
    const { isEffectiveSpaceMember } = await loadModule({
      isBillingEnabled: false,
    });

    expect(
      isEffectiveSpaceMember({
        userId: "user-1",
        space: { tier: "hobby", ownerId: "owner" },
      }),
    ).toBe(true);
  });
});
