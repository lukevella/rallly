import "server-only";

import { prisma } from "@rallly/database";

// deletedAt is not a Better-Auth field and is never part of the session
// snapshot, so a plain Prisma write is safe here — no internalAdapter needed.
export async function scheduleAccountDeletion({ userId }: { userId: string }) {
  const deletedAt = new Date();

  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt },
  });

  return deletedAt;
}

export async function cancelAccountDeletion({ userId }: { userId: string }) {
  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: null },
  });
}
