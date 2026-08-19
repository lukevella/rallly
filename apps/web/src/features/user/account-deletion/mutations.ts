import "server-only";

import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@rallly/database";
import {
  ACCOUNT_DELETION_OTP_MAX_ATTEMPTS,
  ACCOUNT_DELETION_OTP_TTL_MS,
} from "./constants";
import { toAccountDeletionOTPIdentifier } from "./utils";

// Stored hashed so a database read cannot be replayed as a deletion code.
const hashCode = (code: string) =>
  createHash("sha256").update(code).digest("hex");

/**
 * Mint a deletion code for a user, replacing any previous one. Deletion codes
 * are namespaced by user id so they can never be satisfied by a login or
 * email-verification code.
 */
export async function createAccountDeletionOTP({ userId }: { userId: string }) {
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const identifier = toAccountDeletionOTPIdentifier(userId);

  await prisma.verification.deleteMany({ where: { identifier } });
  await prisma.verification.create({
    data: {
      id: crypto.randomUUID(),
      identifier,
      value: `${hashCode(code)}:0`,
      expiresAt: new Date(Date.now() + ACCOUNT_DELETION_OTP_TTL_MS),
    },
  });

  return code;
}

/**
 * Verify and consume a deletion code. Returns false for every failure mode
 * (missing, expired, wrong, attempts exhausted) so the caller can report it
 * as a value without leaking which one it was.
 */
export async function verifyAccountDeletionOTP({
  userId,
  code,
}: {
  userId: string;
  code: string;
}) {
  const identifier = toAccountDeletionOTPIdentifier(userId);
  const record = await prisma.verification.findUnique({
    where: { identifier },
  });

  if (!record) {
    return false;
  }

  if (record.expiresAt < new Date()) {
    await prisma.verification.deleteMany({ where: { identifier } });
    return false;
  }

  const [storedHash, attempts = "0"] = record.value.split(":");

  if (Number.parseInt(attempts, 10) >= ACCOUNT_DELETION_OTP_MAX_ATTEMPTS) {
    await prisma.verification.deleteMany({ where: { identifier } });
    return false;
  }

  const provided = Buffer.from(hashCode(code));
  const expected = Buffer.from(storedHash);
  const matches =
    provided.length === expected.length && timingSafeEqual(provided, expected);

  if (!matches) {
    await prisma.verification.update({
      where: { identifier },
      data: { value: `${storedHash}:${Number.parseInt(attempts, 10) + 1}` },
    });
    return false;
  }

  // Consumed on success so a code cannot be replayed.
  await prisma.verification.deleteMany({ where: { identifier } });
  return true;
}
