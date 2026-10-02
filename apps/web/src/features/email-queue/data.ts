import "server-only";

import { prisma } from "@rallly/database";

export function listQueuedEmails({ ids }: { ids: string[] }) {
  return prisma.queuedEmail.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      kind: true,
      subjectId: true,
      attempts: true,
      user: { select: { banned: true } },
    },
  });
}
