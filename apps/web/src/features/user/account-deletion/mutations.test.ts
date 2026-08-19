import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUpsert, mockFindUnique, mockUpdateMany, mockDeleteMany } =
  vi.hoisted(() => ({
    mockUpsert: vi.fn(),
    mockFindUnique: vi.fn(),
    mockUpdateMany: vi.fn(),
    mockDeleteMany: vi.fn(),
  }));

vi.mock("@rallly/database", () => ({
  prisma: {
    verification: {
      upsert: mockUpsert,
      findUnique: mockFindUnique,
      updateMany: mockUpdateMany,
      deleteMany: mockDeleteMany,
    },
  },
}));

vi.mock("@/env", () => ({
  env: { SECRET_PASSWORD: "test-secret-value-32-chars-long!" },
}));

import {
  createAccountDeletionOTP,
  verifyAccountDeletionOTP,
} from "./mutations";

const USER_ID = "user-1";
const IDENTIFIER = `delete-account-otp-${USER_ID}`;

describe("createAccountDeletionOTP", () => {
  beforeEach(() => {
    mockUpsert.mockReset().mockResolvedValue({});
  });

  it("returns a six digit code", async () => {
    const code = await createAccountDeletionOTP({ userId: USER_ID });
    expect(code).toMatch(/^\d{6}$/);
  });

  // Delete-then-create would let two concurrent requests collide on the
  // unique identifier.
  it("upserts so concurrent requests cannot collide", async () => {
    await createAccountDeletionOTP({ userId: USER_ID });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { identifier: IDENTIFIER } }),
    );
  });

  it("stores the code hashed, never in plain text", async () => {
    const code = await createAccountDeletionOTP({ userId: USER_ID });
    const { create } = mockUpsert.mock.calls[0][0];

    expect(create.value).not.toContain(code);
    expect(create.value).toMatch(/^[0-9a-f]{64}:0$/);
  });
});

describe("verifyAccountDeletionOTP", () => {
  beforeEach(() => {
    mockFindUnique.mockReset();
    mockUpdateMany.mockReset().mockResolvedValue({ count: 1 });
    mockDeleteMany.mockReset().mockResolvedValue({ count: 1 });
    mockUpsert.mockReset().mockResolvedValue({});
  });

  const seedWith = async (attempts: number) => {
    const code = await createAccountDeletionOTP({ userId: USER_ID });
    const storedHash = mockUpsert.mock.calls[0][0].create.value.split(":")[0];
    mockFindUnique.mockResolvedValue({
      identifier: IDENTIFIER,
      value: `${storedHash}:${attempts}`,
      expiresAt: new Date(Date.now() + 60_000),
    });
    return code;
  };

  it("accepts the correct code", async () => {
    const code = await seedWith(0);
    await expect(
      verifyAccountDeletionOTP({ userId: USER_ID, code }),
    ).resolves.toBe(true);
  });

  it("rejects a wrong code and counts the attempt", async () => {
    await seedWith(0);

    await expect(
      verifyAccountDeletionOTP({ userId: USER_ID, code: "000000" }),
    ).resolves.toBe(false);
    expect(mockUpdateMany).toHaveBeenCalled();
  });

  // Without the value in the where clause, parallel guesses overwrite each
  // other's increment and the attempt limit stops holding.
  it("increments attempts conditionally on the value it read", async () => {
    await seedWith(1);
    await verifyAccountDeletionOTP({ userId: USER_ID, code: "000000" });

    const { where } = mockUpdateMany.mock.calls[0][0];
    expect(where.value).toMatch(/:1$/);
  });

  it("rejects once attempts are exhausted", async () => {
    const code = await seedWith(3);

    await expect(
      verifyAccountDeletionOTP({ userId: USER_ID, code }),
    ).resolves.toBe(false);
  });

  it("rejects an expired code", async () => {
    const code = await createAccountDeletionOTP({ userId: USER_ID });
    const storedHash = mockUpsert.mock.calls[0][0].create.value.split(":")[0];
    mockFindUnique.mockResolvedValue({
      identifier: IDENTIFIER,
      value: `${storedHash}:0`,
      expiresAt: new Date(Date.now() - 1),
    });

    await expect(
      verifyAccountDeletionOTP({ userId: USER_ID, code }),
    ).resolves.toBe(false);
  });

  it("rejects when there is no code", async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(
      verifyAccountDeletionOTP({ userId: USER_ID, code: "123456" }),
    ).resolves.toBe(false);
  });

  // Only one of a set of concurrent requests may claim a code: the loser's
  // conditional delete removes nothing.
  it("fails when another request already consumed the code", async () => {
    const code = await seedWith(0);
    mockDeleteMany.mockResolvedValue({ count: 0 });

    await expect(
      verifyAccountDeletionOTP({ userId: USER_ID, code }),
    ).resolves.toBe(false);
  });
});
