import "server-only";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@rallly/database";
import { env } from "@/env";
import {
  ACCOUNT_DELETION_OTP_MAX_ATTEMPTS,
  ACCOUNT_DELETION_OTP_TTL_MS,
} from "./constants";
import { toAccountDeletionOTPIdentifier } from "./utils";

// Keyed, not a bare digest: six digits is a million candidates, so an
// unkeyed hash of a stored code can simply be enumerated by anyone who can
// read the table. The key makes the stored value useless without the secret.
const hashCode = (code: string) =>
  createHmac("sha256", env.SECRET_PASSWORD).update(code).digest("hex");

/**
 * Mint a deletion code for a user, replacing any previous one. Deletion codes
 * are namespaced by user id so they can never be satisfied by a login or
 * email-verification code.
 */
export async function createAccountDeletionOTP({ userId }: { userId: string }) {
  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const identifier = toAccountDeletionOTPIdentifier(userId);

  // Upsert rather than delete-then-create: identifier is unique, so two
  // concurrent requests racing between the delete and the create would make
  // one of them fail on the constraint.
  const value = `${hashCode(code)}:0`;
  const expiresAt = new Date(Date.now() + ACCOUNT_DELETION_OTP_TTL_MS);

  await prisma.verification.upsert({
    where: { identifier },
    create: { id: crypto.randomUUID(), identifier, value, expiresAt },
    update: { value, expiresAt },
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

  // Every write below is conditional on the row this call actually read.
  // Without it a stale request — one whose code has since been replaced by a
  // newer one — would delete or overwrite the new code.
  const readRecord = {
    identifier,
    value: record.value,
    expiresAt: record.expiresAt,
  };

  if (record.expiresAt < new Date()) {
    await prisma.verification.deleteMany({ where: readRecord });
    return false;
  }

  const [storedHash, attempts = "0"] = record.value.split(":");

  if (Number.parseInt(attempts, 10) >= ACCOUNT_DELETION_OTP_MAX_ATTEMPTS) {
    await prisma.verification.deleteMany({ where: readRecord });
    return false;
  }

  const provided = Buffer.from(hashCode(code));
  const expected = Buffer.from(storedHash);
  const matches =
    provided.length === expected.length && timingSafeEqual(provided, expected);

  if (!matches) {
    // Parallel guesses would otherwise all read the same count and overwrite
    // each other's increment, which is how a three attempt limit turns into
    // an unlimited one.
    await prisma.verification.updateMany({
      where: readRecord,
      data: { value: `${storedHash}:${Number.parseInt(attempts, 10) + 1}` },
    });
    return false;
  }

  // Consumed on success so exactly one of a set of concurrent requests can
  // claim a code.
  const { count } = await prisma.verification.deleteMany({
    where: readRecord,
  });

  return count === 1;
}
