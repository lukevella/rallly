import { beforeEach, describe, expect, it, vi } from "vitest";
import { isEmailTaken } from "./data";

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock("@rallly/database", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
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
