import "server-only";

import { prisma } from "@rallly/database";
import { toDeletionOTPIdentifier } from "./utils";

/**
 * Consume a deletion code. Better-Auth's checkVerificationOTP leaves the
 * record in place on success, so it is deleted here: a code minted for
 * deletion must not be replayable, nor reusable as an email verification.
 */
export async function consumeAccountDeletionOTP({ email }: { email: string }) {
  await prisma.verification.deleteMany({
    where: { identifier: toDeletionOTPIdentifier(email) },
  });
}
