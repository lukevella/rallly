import { beforeEach, describe, expect, it, vi } from "vitest";
import { getUserSignInAccounts, isEmailTaken } from "./data";

const { mockFindUnique, mockFindMany } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock("@rallly/database", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
    },
    account: {
      findMany: mockFindMany,
    },
  },
}));

describe("isEmailTaken", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
  });

  it("returns true when another account already uses the address", async () => {
    mockFindUnique.mockResolvedValue({ id: "user-1" });

    await expect(isEmailTaken("taken@example.com")).resolves.toBe(true);
  });

  it("returns false when no account uses the address", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(isEmailTaken("free@example.com")).resolves.toBe(false);
  });

  it("matches addresses case-insensitively", async () => {
    mockFindUnique.mockResolvedValue({ id: "user-1" });

    await isEmailTaken("Taken@Example.COM");

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { email: "taken@example.com" },
      select: { id: true },
    });
  });
});

describe("getUserSignInAccounts", () => {
  it("reads the user's accounts without the password credential", async () => {
    mockFindMany.mockResolvedValue([{ id: "account-1", provider: "google" }]);

    await expect(getUserSignInAccounts("user-1")).resolves.toEqual([
      { id: "account-1", provider: "google" },
    ]);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", provider: { not: "credential" } },
      }),
    );
  });
});
